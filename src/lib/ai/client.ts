import OpenAI from 'openai';
import { z } from 'zod';
import type { WalletAnalysis } from '../shared/types';

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

      const currentTime = new Date().toISOString();
      const timeRangeLabel = timeRange === '1h' ? 'past hour' : 
                            timeRange === '6h' ? 'past 6 hours' : 
                            timeRange === '24h' ? 'past 24 hours' : 
                            timeRange === '7d' ? 'past 7 days' : timeRange;

      const prompt = `You are analyzing real-time whale activity data from Blockscout blockchain explorer.

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

🐋 TOP WHALES BY VOLUME:
${topWhalesSummary}

🪙 MOST ACTIVE TOKENS:
${topTokens.join('\n')}

📝 RECENT TRANSFER EXAMPLES:
${recentTransfersSummary}

INSTRUCTIONS:
Provide a professional analysis (3-4 well-structured paragraphs) that covers:

1. **Market Sentiment & Whale Behavior Patterns**
   - What does this activity level suggest about whale confidence?
   - Are whales accumulating, distributing, or consolidating?
   - How does this compare to typical activity?

2. **Token Movement & Chain Activity Trends**
   - Which tokens are whales favoring and why might that be significant?
   - Are there notable patterns in chain selection?
   - What does the token diversity (or lack thereof) indicate?

3. **Risk Assessment & Market Indicators**
   - What risks or opportunities does this activity suggest?
   - Are there signs of market stress or confidence?
   - What external factors might be influencing this behavior?

4. **Actionable Takeaways for Traders & Investors**
   - Specific strategies to consider based on this data
   - What to monitor going forward
   - How to position portfolios in response

IMPORTANT:
- Start with a brief context statement mentioning the time period
- Be specific with numbers and token names
- Acknowledge data limitations when activity is low
- Provide balanced analysis (not overly bullish or bearish)
- End with concrete, actionable recommendations
- Use professional but accessible language`;

      const response = await this.client.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: 'system',
            content: 'You are a blockchain analyst specializing in whale activity and on-chain data analysis. You analyze data from Blockscout, a leading blockchain explorer. Provide clear, actionable insights about large cryptocurrency transfers and market movements.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        max_tokens: 800,
        temperature: 0.7,
      });

      return response.choices[0]?.message?.content || 'Unable to generate insights at this time.';
    } catch (error) {
      console.error('Error analyzing whale activity:', error);
      return 'Unable to analyze whale activity at this time. Please try again later.';
    }
  }
}
