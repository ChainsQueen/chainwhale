import OpenAI from 'openai';
import { z } from 'zod';
import type { WalletAnalysis } from '../shared/types';
import { createBlockscoutClient, type IBlockscoutClient } from '@/lib/blockscout/factory';

/**
 * AI Engine using OpenAI GPT-4
 * Provides AI-powered analysis and insights for blockchain data
 */
export class AIEngine {
  private client: OpenAI;
  private model: string;

  constructor(config: { apiKey: string; model?: string }) {
    this.client = new OpenAI({
      apiKey: config.apiKey,
    });
    this.model = config.model || 'gpt-4o-mini';
  }

  /**
   * Analyze a blockchain transaction and provide plain English explanation
   */
  async analyzeTransaction(
    transactionData: Record<string, unknown>,
    context?: string
  ): Promise<string> {
    try {
      const prompt = `Analyze this blockchain transaction and explain it in simple terms:

Transaction Data:
${JSON.stringify(transactionData, null, 2)}

${context ? `Additional Context: ${context}` : ''}

Provide a concise, plain English explanation of what happened in this transaction. Focus on:
- What type of transaction it is (swap, transfer, etc.)
- The amounts involved
- Any notable patterns or risks`;

      const response = await this.client.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: 'system',
            content: 'You are a blockchain analyst expert. Explain transactions clearly and concisely for non-technical users.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        max_tokens: 1024,
        temperature: 0.7,
      });

      return response.choices[0]?.message?.content || 'Unable to analyze transaction';
    } catch (error) {
      console.error('Error analyzing transaction:', error);
      return 'Unable to analyze transaction at this time';
    }
  }

  /**
   * Answer user queries about whale activity using blockchain data
   */
  async answerQuery(query: string, blockchainData: Record<string, unknown>[]): Promise<string> {
    try {
      const prompt = `User Question: ${query}

Blockchain Data:
${JSON.stringify(blockchainData, null, 2)}

IMPORTANT CONTEXT:
- Token amounts are already converted to human-readable format (tokenAmount field)
- Transactions are pre-sorted by estimated value (largest first)
- Data covers the last 24 hours from 9 known whale addresses
- Transaction hashes are verifiable on block explorers

AVAILABLE DATA:
- Transaction hashes (verifiable via explorerUrl)
- Wallet addresses (from/to)
- Token symbols and contract addresses
- **tokenAmount**: Already converted human-readable amount (e.g., "1000.50" means 1000.5 tokens)
- **estimatedValue**: Rough USD estimate used for sorting (DO NOT show this to users)
- Timestamps
- Chain names

YOUR TASK:
1. **Report largest transactions:**
   - Transactions are already sorted by estimated value (largest first)
   - Show token amounts: "X tokens" (e.g., "1,000,000 PEPE", "500 USDT")
   - For USDT/USDC/DAI, note they are stablecoins (~$1 each)
   - For other tokens, just show the amount without USD value

2. **Provide a summary:**
   - List top transactions with token amounts
   - Include transaction hashes for verification
   - Note patterns (same addresses, timing, token types)
   - Mention if stablecoins dominate or meme coins are active

3. **Be factual:**
   - DO NOT show the estimatedValue field to users
   - DO NOT estimate USD values (except noting stablecoins ≈ $1)
   - DO NOT speculate about intentions or market impact
   - Focus on observable facts: addresses, tokens, amounts, timing`;

      const response = await this.client.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: 'system',
            content: 'You are a blockchain data analyst. Report transaction data factually without estimating USD values (token prices are too volatile). Focus on token amounts, addresses, transaction hashes, and observable patterns. Do not speculate about market sentiment or whale intentions. Provide clear, verifiable information only.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        max_tokens: 2048,
        temperature: 0.7,
      });

      return response.choices[0]?.message?.content || 'Unable to answer query';
    } catch (error) {
      console.error('Error answering query:', error);
      return 'Unable to process your question at this time';
    }
  }

  /**
   * Analyze a wallet's holdings and activity across chains
   */
  async analyzeWallet(
    walletData: Record<string, unknown>,
    holdings: Record<string, unknown>[]
  ): Promise<WalletAnalysis> {
    try {
      const prompt = `Analyze this wallet's holdings and activity:

Wallet Data:
${JSON.stringify(walletData, null, 2)}

Holdings:
${JSON.stringify(holdings, null, 2)}

Provide a structured analysis with:
1. A brief summary of the wallet's activity
2. A risk score from 0-100 (0 = very safe, 100 = very risky)
3. 3-5 key insights about the wallet's behavior

Return your response as a JSON object with this structure:
{
  "summary": "Brief summary of wallet activity",
  "riskScore": 0-100,
  "insights": ["insight 1", "insight 2", "insight 3"]
}`;

      const response = await this.client.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: 'system',
            content: 'You are a blockchain security analyst. Analyze wallets and provide risk assessments. Always respond with valid JSON.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        max_tokens: 1024,
        temperature: 0.7,
        response_format: { type: 'json_object' },
      });

      const content = response.choices[0]?.message?.content || '{}';
      const parsed = JSON.parse(content);

      // Validate response with Zod
      const WalletAnalysisSchema = z.object({
        summary: z.string(),
        riskScore: z.number().min(0).max(100),
        insights: z.array(z.string()),
      });

      const validated = WalletAnalysisSchema.parse(parsed);

      return {
        address: (walletData.address as string) || '',
        totalValue: (walletData.totalValue as number) || 0,
        chains: (walletData.chains as Record<string, number>) || {},
        tokens: holdings as Array<{ symbol: string; balance: string; value: number; chain: string }>,
        summary: validated.summary,
        riskScore: validated.riskScore,
        insights: validated.insights,
      };
    } catch (error) {
      console.error('Error analyzing wallet:', error);
      // Return default analysis on error
      return {
        address: (walletData.address as string) || '',
        totalValue: (walletData.totalValue as number) || 0,
        chains: (walletData.chains as Record<string, number>) || {},
        tokens: holdings as Array<{ symbol: string; balance: string; value: number; chain: string }>,
        summary: 'Unable to analyze wallet at this time',
        riskScore: 50,
        insights: ['Analysis unavailable'],
      };
    }
  }

  /**
   * Analyze whale tracker activity patterns from Blockscout data
   * Used by the Whale Tracker page to generate AI insights
   */
  async analyzeWhaleTrackerActivity(
    transfers: Array<Record<string, unknown>>,
    stats: Record<string, unknown>,
    topWhales: Array<Record<string, unknown>>,
    filters: Record<string, unknown>
  ): Promise<string> {
    try {
      const chainNames: Record<string, string> = {
        '1': 'Ethereum',
        '8453': 'Base',
        '42161': 'Arbitrum',
        '10': 'Optimism',
        '137': 'Polygon',
      };

      const selectedChains = (filters.selectedChains as string[]) || [];
      const selectedChainNames = selectedChains.map(id => chainNames[id] || id).join(', ');
      const timeRange = filters.timeRange as string || '1h';
      const minValue = filters.minValue as number || 100000;
      const tokenFilter = filters.tokenFilter as string || 'All';
      const dataSourceStats = filters.dataSourceStats as { mcp: number; http: number; total: number } | null;

      // Get token distribution
      const tokenCounts: Record<string, number> = {};
      transfers.forEach(t => {
        const token = (t.token as Record<string, unknown>);
        const symbol = token?.symbol as string;
        if (symbol) {
          tokenCounts[symbol] = (tokenCounts[symbol] || 0) + 1;
        }
      });
      const topTokens = Object.entries(tokenCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(([token, count]) => `${token} (${count} transfers)`);

      // Fetch contract security info for ALL unique tokens using hybrid MCP-first approach
      const allTokens = Object.entries(tokenCounts)
        .sort(([, a], [, b]) => b - a); // Sort by frequency, most active first
      
      console.log('\n🔍 [AI Analysis] Fetching contract security data for ALL unique tokens...');
      console.log(`   Total unique tokens: ${allTokens.length}`);
      console.log(`   Tokens to analyze: ${allTokens.map(([symbol]) => symbol).join(', ')}`);
      
      const contractSecurityInfo: string[] = [];
      
      // Use hybrid Blockscout client (MCP-first)
      let securityClient: IBlockscoutClient | null = null;
      
      try {
        securityClient = createBlockscoutClient();
        await securityClient.connect();
        
        // Fetch all contract info in parallel for ALL tokens
        const securityPromises = allTokens.map(async ([tokenSymbol]) => {
          try {
            // Find a transfer with this token to get the contract address and chain
            const transfer = transfers.find(t => {
              const token = (t.token as Record<string, unknown>);
              return token?.symbol === tokenSymbol;
            });
            
            if (!transfer) return null;
            
            const token = (transfer.token as Record<string, unknown>);
            const address = token?.address as string;
            const chainId = (transfer.chainId as string);
            
            if (!address || !chainId || !securityClient) return null;
            
            // Use hybrid client (tries MCP first, falls back to HTTP)
            const addressInfo = await securityClient.getAddressInfo(chainId, address);
            
            if (!addressInfo) return null;
            
            // Extract all available contract data
            const isVerified = addressInfo.is_verified || false;
            const isProxy = addressInfo.implementations && addressInfo.implementations.length > 0;
            const isScam = addressInfo.is_scam || false;
            const reputation = addressInfo.reputation;
            const tokenPrice = addressInfo.token?.exchange_rate;
            const marketCap = addressInfo.token?.circulating_market_cap;
            const volume24h = addressInfo.token?.volume_24h;
            const totalSupply = addressInfo.token?.total_supply;
            const holders = addressInfo.token?.holders;
            const tokenType = addressInfo.token?.type;
            const decimals = addressInfo.token?.decimals;
            const creatorAddress = addressInfo.creator_address_hash;
            const creationTxHash = addressInfo.creation_transaction_hash;
            const implementations = addressInfo.implementations;
            
            let securityStatus = `${tokenSymbol} (${address.slice(0, 6)}...${address.slice(-4)}): `;
            
            // Critical: Scam warning first
            if (isScam) {
              securityStatus += '🚨 SCAM WARNING - DO NOT INTERACT';
              return securityStatus;
            }
            
            // Reputation check
            if (reputation && reputation !== 'ok') {
              securityStatus += `⚠️ Reputation: ${reputation.toUpperCase()}, `;
            }
            
            // Verification status
            if (isVerified) {
              securityStatus += '✓ Verified';
            } else {
              securityStatus += '✗ NOT Verified';
            }
            
            // Token type
            if (tokenType) {
              securityStatus += `, Type: ${tokenType}`;
            }
            
            // Proxy warning with implementation details
            if (isProxy && implementations && implementations.length > 0) {
              securityStatus += `, ⚠️ Proxy (upgradeable, ${implementations.length} impl)`;
              implementations.forEach((impl, idx) => {
                securityStatus += `\n    Implementation ${idx + 1}: ${impl.address.slice(0, 6)}...${impl.address.slice(-4)}`;
                if (impl.name) securityStatus += ` (${impl.name})`;
              });
            }
            
            // Market data
            if (tokenPrice) {
              const price = parseFloat(tokenPrice);
              securityStatus += `, Price: $${price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 })}`;
            }
            
            if (marketCap) {
              const cap = parseFloat(marketCap);
              if (cap > 1e9) {
                securityStatus += `, MCap: $${(cap / 1e9).toFixed(2)}B`;
              } else if (cap > 1e6) {
                securityStatus += `, MCap: $${(cap / 1e6).toFixed(2)}M`;
              } else {
                securityStatus += `, MCap: $${(cap / 1e3).toFixed(2)}K`;
              }
            }
            
            if (volume24h) {
              const vol = parseFloat(volume24h);
              if (vol > 1e6) {
                securityStatus += `, 24h Vol: $${(vol / 1e6).toFixed(2)}M`;
              } else if (vol > 1e3) {
                securityStatus += `, 24h Vol: $${(vol / 1e3).toFixed(2)}K`;
              }
            }
            
            // Supply and holder metrics
            if (totalSupply && decimals) {
              const supply = parseFloat(totalSupply) / Math.pow(10, parseInt(decimals));
              if (supply > 1e9) {
                securityStatus += `, Supply: ${(supply / 1e9).toFixed(2)}B`;
              } else if (supply > 1e6) {
                securityStatus += `, Supply: ${(supply / 1e6).toFixed(2)}M`;
              }
            }
            
            if (holders) {
              const holderCount = parseInt(holders);
              if (holderCount > 1e6) {
                securityStatus += `, Holders: ${(holderCount / 1e6).toFixed(2)}M`;
              } else if (holderCount > 1e3) {
                securityStatus += `, Holders: ${(holderCount / 1e3).toFixed(1)}K`;
              } else {
                securityStatus += `, Holders: ${holderCount}`;
              }
            }
            
            // Creator info
            if (creatorAddress) {
              securityStatus += `\n    Creator: ${creatorAddress.slice(0, 6)}...${creatorAddress.slice(-4)}`;
            }
            
            if (creationTxHash) {
              securityStatus += `, Created in: ${creationTxHash.slice(0, 10)}...`;
            }
            
            return securityStatus;
          } catch (error) {
            console.error(`Failed to fetch contract info for ${tokenSymbol}:`, error);
            return null;
          }
        });
        
        // Wait for all promises
        const results = await Promise.all(securityPromises);
        const successfulResults = results.filter((r): r is string => r !== null);
        contractSecurityInfo.push(...successfulResults);
        
        console.log(`   ✅ Successfully fetched ${successfulResults.length}/${allTokens.length} contract security records`);
        if (successfulResults.length < allTokens.length) {
          console.log(`   ⚠️ Failed to fetch ${allTokens.length - successfulResults.length} contract(s)`);
        }
      } catch (error) {
        console.error('Error fetching contract security info:', error);
      } finally {
        if (securityClient) {
          await securityClient.disconnect();
        }
      }

      // Log contract security data that will be sent to AI
      console.log('\n🛡️ [AI Analysis] Contract Security Data Being Sent to AI:');
      if (contractSecurityInfo.length > 0) {
        contractSecurityInfo.forEach(info => console.log(`   ${info}`));
      } else {
        console.log('   ⚠️ No contract security data available');
      }

      // Data source info
      let dataSourceInfo = '';
      if (dataSourceStats && dataSourceStats.total > 0) {
        if (dataSourceStats.mcp > 0 && dataSourceStats.http > 0) {
          dataSourceInfo = `Data retrieved from Blockscout using both MCP (${dataSourceStats.mcp} transfers) and HTTP API (${dataSourceStats.http} transfers).`;
        } else if (dataSourceStats.mcp > 0) {
          dataSourceInfo = `Data retrieved from Blockscout using MCP (Model Context Protocol) - ${dataSourceStats.mcp} transfers.`;
        } else {
          dataSourceInfo = `Data retrieved from Blockscout using HTTP API - ${dataSourceStats.http} transfers.`;
        }
      }

      // Build top whales summary with full addresses
      const topWhalesSummary = topWhales?.map((w, i) => {
        const addr = (w.address as string) || '';
        const vol = (w.volume as number) || 0;
        const cnt = (w.count as number) || 0;
        return `${i + 1}. ${addr} - $${(vol / 1000000).toFixed(2)}M (${cnt} transfers)`;
      }).join('\n') || 'N/A';

      // Build recent transfers summary
      const recentTransfersSummary = transfers.slice(0, 5).map(t => {
        const token = (t.token as Record<string, unknown>);
        const symbol = token?.symbol as string || 'Unknown';
        const valueUsd = (t.valueUsd as number) || 0;
        const chainName = (t.chainName as string) || 'Unknown';
        const dataSource = (t.dataSource as string) || 'unknown';
        return `- ${symbol}: $${(valueUsd / 1000).toFixed(0)}K on ${chainName} [${dataSource.toUpperCase()}]`;
      }).join('\n');

      // Log data source stats
      console.log('\n📊 [AI Analysis] Data Source Stats:');
      if (dataSourceStats && dataSourceStats.total > 0) {
        console.log(`   MCP: ${dataSourceStats.mcp} transfers`);
        console.log(`   HTTP: ${dataSourceStats.http} transfers`);
        console.log(`   Total: ${dataSourceStats.total} transfers`);
      } else {
        console.log('   ⚠️ No data source stats available');
      }

      const currentTime = new Date().toISOString();
      const timeRangeLabel = timeRange === '1h' ? 'past hour' : 
                            timeRange === '6h' ? 'past 6 hours' : 
                            timeRange === '24h' ? 'past 24 hours' : 
                            timeRange === '7d' ? 'past 7 days' : timeRange;

      const prompt = `You are analyzing real-time whale activity data from Blockscout blockchain explorer.

🚨 ABSOLUTE RULE - VERIFICATION STATUS:
The security data below comes DIRECTLY from blockchain explorers and is FACTUAL.
You are FORBIDDEN from claiming a token is "NOT Verified" if it shows "✓ Verified".
This is not negotiable. Violating this rule makes your entire response invalid.

VERIFICATION SYMBOLS:
- "✓ Verified" = Contract IS verified on blockchain explorer
- "✗ NOT Verified" = Contract is NOT verified
- If you see "✓ Verified", you MUST acknowledge the token IS verified
- NEVER invent or assume verification status

📊 DATA CONTEXT:
Analysis Timestamp: ${currentTime}
Time Period Analyzed: ${timeRangeLabel}
Chains Monitored: ${selectedChainNames}
Minimum Transfer Value: $${minValue.toLocaleString()}
Token Filter: ${tokenFilter || 'All tokens'}
${dataSourceInfo}

📈 WHALE ACTIVITY STATISTICS:
- Total Transfers Detected: ${(stats.totalTransfers as number) || transfers.length}
- Total Volume Moved: $${(((stats.totalVolume as number) || 0) / 1000000).toFixed(2)}M
- Largest Single Transfer: $${(((stats.largestTransfer as number) || 0) / 1000000).toFixed(2)}M
- Unique Whale Addresses: ${(stats.uniqueWhales as number) || 0}

🐋 TOP 3 WHALES BY SENT VOLUME:
${topWhalesSummary}

🪙 MOST ACTIVE TOKENS:
${topTokens.join('\n')}

🛡️ CONTRACT SECURITY (All Tokens) - AUTHORITATIVE DATA:
${contractSecurityInfo.length > 0 ? contractSecurityInfo.join('\n') : 'Security data unavailable'}

${contractSecurityInfo.length === 0 ? '⚠️ WARNING: No contract security data was fetched. AI will not have verification status information.' : ''}

📝 RECENT TRANSFER EXAMPLES:
${recentTransfersSummary}

═══════════════════════════════════════════════════════════════
INSTRUCTIONS: Provide DETAILED SECTION-BY-SECTION ANALYSIS
═══════════════════════════════════════════════════════════════

Structure your response with these EXACT sections:

## 📊 Whale Activity Overview
- Analyze the total volume ($${(((stats.totalVolume as number) || 0) / 1000000).toFixed(2)}M) - is this high/low/normal for ${timeRangeLabel}?
- Interpret the ${(stats.totalTransfers as number) || transfers.length} transfers - concentrated or distributed?
- Compare largest transfer ($${(((stats.largestTransfer as number) || 0) / 1000000).toFixed(2)}M) to average - any outliers?
- What does ${(stats.uniqueWhales as number) || 0} unique whales suggest about coordination?

## 🐋 Top 3 Whale Analysis
For EACH of the top 3 whales, provide:
- Address pattern recognition (exchange, institutional, unknown)
- Volume significance ($XM in Y transfers)
- Behavior type (accumulating/distributing/consolidating/arbitrage)
- Risk level (high/medium/low) based on activity pattern

Example format:
**Whale #1** (0x28C6...1d60): $0.20M in 1 transfer
- Pattern: [Exchange/Institution/Unknown]
- Behavior: [Distributing/Accumulating]
- Risk: [Assessment]

## 🪙 Token Deep-Dive
For EACH major token, analyze:
- **Security Status**: Verified? Proxy? Scam alerts? (USE EXACT DATA FROM SECURITY SECTION)
- **Market Metrics**: Price, MCap, Volume, Holders (from security data)
- **Whale Interest**: Why are whales moving this token now?
- **Risk Factors**: Low holders? Recent creation? Unverified? Proxy risks?

Example:
**USDT**: ✓ Verified, $1.00, MCap $140B, 5.8M holders
- High liquidity, established token, low risk
- Whales using for [reason]

## 📈 Transfer Pattern Analysis
- **Timing**: Are transfers clustered or spread out?
- **Direction**: More inflows or outflows from exchanges?
- **Size Distribution**: Many small or few large transfers?
- **Chain Activity**: Why ${selectedChainNames}? Gas costs? Liquidity?

## ⚠️ Risk Assessment
- **Critical Risks**: Any unverified tokens? Scam warnings? Low holder counts?
- **Proxy Risks**: Which tokens are upgradeable? Implementation details?
- **Market Risks**: Unusual volume? Coordinated dumps? Liquidity concerns?
- **Overall Risk Level**: HIGH/MEDIUM/LOW with justification

## 🎯 Actionable Recommendations
**Immediate Actions:**
- [Specific action based on data]
- [Specific action based on data]

**Tokens to Watch:**
- [Token]: [Why and what to monitor]
- [Token]: [Why and what to monitor]

**Strategy:**
- Position: [Defensive/Neutral/Aggressive]
- Rationale: [Based on whale behavior and security data]
- Key Metrics: [Specific numbers to track]

**Alerts to Set:**
- [Specific threshold or condition]
- [Specific threshold or condition]

═══════════════════════════════════════════════════════════════
STYLE REQUIREMENTS:
═══════════════════════════════════════════════════════════════
- Use markdown headers (##) for each section
- Be SPECIFIC with numbers, addresses, and token names
- Reference ACTUAL security data - never invent or assume
- If data is missing, say "Data unavailable" - don't guess
- Use bullet points and sub-bullets for clarity
- Bold important terms (**term**)
- Maximum 600 words total
- NEVER claim verified tokens are unverified
- Provide ACTIONABLE insights, not generic commentary`;

      const response = await this.client.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: 'system',
            content: 'You are a blockchain analyst specializing in whale activity and on-chain data analysis. You analyze data from Blockscout, a leading blockchain explorer. Provide clear, actionable insights about large cryptocurrency transfers and market movements. CRITICAL: You MUST trust and accurately report the contract verification status provided in the security data. Never contradict or misinterpret verification symbols: ✓ means verified, ✗ means not verified. Report security data exactly as provided.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        max_tokens: 1500,
        temperature: 0.7,
      });

      let aiResponse = response.choices[0]?.message?.content || 'Unable to generate insights at this time.';

      console.log('\n✅ [AI Analysis] Received response from OpenAI');
      console.log(`   Response Length: ${aiResponse.length} characters`);
      console.log(`   Tokens Used: ${response.usage?.total_tokens || 'unknown'}`);
      console.log(`   Prompt Tokens: ${response.usage?.prompt_tokens || 'unknown'}`);
      console.log(`   Completion Tokens: ${response.usage?.completion_tokens || 'unknown'}`);
      console.log(`   Model: ${response.model}`);
      console.log(`   Finish Reason: ${response.choices[0]?.finish_reason || 'unknown'}`);
      console.log('   First 200 chars:', aiResponse.substring(0, 200) + '...');
      console.log('');

      // Post-processing: Detect and fix hallucinations about verification status
      // Check if AI contradicts the actual security data
      for (const securityInfo of contractSecurityInfo) {
        // Extract token symbol from security info (format: "SYMBOL: ...")
        const tokenMatch = securityInfo.match(/^([A-Z0-9]+):\s/);
        if (!tokenMatch) continue;
        
        const tokenSymbol = tokenMatch[1];
        const isActuallyVerified = securityInfo.includes('✓ Verified');
        
        // If AI claims token is not verified when it actually IS verified
        if (isActuallyVerified) {
          // Replace common hallucination patterns
          const patterns = [
            new RegExp(`${tokenSymbol}[^.]*(?:not verified|unverified|\\u2717 NOT Verified)`, 'gi'),
            new RegExp(`(?:not verified|unverified)[^.]*${tokenSymbol}`, 'gi'),
            new RegExp(`both[^.]*(?:not verified|unverified)`, 'gi'),
          ];
          
          for (const pattern of patterns) {
            if (pattern.test(aiResponse)) {
              console.warn(`[AI Hallucination Detected] AI incorrectly claimed ${tokenSymbol} is not verified. Correcting...`);
              // Remove the false claim
              aiResponse = aiResponse.replace(pattern, `${tokenSymbol} (verified contract)`);
            }
          }
        }
      }

      return aiResponse;
    } catch (error) {
      console.error('Error analyzing whale activity:', error);
      return 'Unable to analyze whale activity at this time. Please try again later.';
    }
  }
}
