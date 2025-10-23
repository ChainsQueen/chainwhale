import { NextRequest, NextResponse } from 'next/server';
import { AIEngine } from '@/lib/ai';
import { createBlockscoutClient } from '@/lib/blockscout/factory';
import type { IBlockscoutClient } from '@/lib/blockscout/factory';
import { WhaleService } from '@/core/services/whale-service';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Type definitions
interface Transfer {
  hash: string;
  from: string;
  to: string;
  value: string;
  valueUsd?: number;
  timestamp?: number;
  chainId: string;
  chainName: string;
  token: {
    address: string;
    symbol: string;
    name?: string;
    decimals?: string;
  };
}

interface ContractDetail {
  symbol: string;
  address: string;
  chainId: string;
  isVerified: boolean;
  isScam: boolean;
  reputation?: string | undefined;
  isProxy: boolean;
  implementations: Array<{ address: string; name: string | undefined }>;
  tokenType?: string;
  tokenName?: string;
  tokenSymbol?: string;
  decimals?: string;
  totalSupply?: string;
  holders?: number;
  price?: number;
  marketCap?: string;
}

interface ChainGroup {
  chain: string;
  chainId: string;
  transfers: Transfer[];
  count: number;
  contractDetails?: ContractDetail[];
}

const CHAIN_NAMES: Record<string, string> = {
  '1': 'Ethereum',
  '8453': 'Base',
  '42161': 'Arbitrum',
  '10': 'Optimism',
  '137': 'Polygon',
};

const EXPLORER_URLS: Record<string, string> = {
  '1': 'https://eth.blockscout.com',
  '8453': 'https://base.blockscout.com',
  '42161': 'https://arbitrum.blockscout.com',
  '10': 'https://optimism.blockscout.com',
  '137': 'https://polygon.blockscout.com',
};

function getExplorerBaseUrl(chainId: string): string {
  return EXPLORER_URLS[chainId] || EXPLORER_URLS['1'];
}

// Fetch token prices from Blockscout API
// async function getTokenPricesFromBlockscout(
//   blockscout: IBlockscoutClient,
//   chainId: string,
//   tokenAddresses: string[]
// ): Promise<Record<string, { price: number; decimals: number }>> {
//   const prices: Record<string, { price: number; decimals: number }> = {};
//   
//   // Fetch token info in parallel (limit to 10 at a time to avoid rate limits)
//   const chunks = [];
//   for (let i = 0; i < tokenAddresses.length; i += 10) {
//     chunks.push(tokenAddresses.slice(i, i + 10));
//   }
//   
//   for (const chunk of chunks) {
//     const promises = chunk.map(async (address) => {
//       try {
//         // Use HTTP client's getTokenInfo method
//         if ('getTokenInfo' in blockscout) {
//           const info = await (blockscout as { getTokenInfo: (chainId: string, address: string) => Promise<{ exchange_rate?: number; decimals?: number }> }).getTokenInfo(chainId, address);
//           if (info?.exchange_rate) {
//             prices[address] = {
//               price: info.exchange_rate,
//               decimals: info.decimals || 18,
//             };
//           }
//         }
//       } catch {
//         // Silently fail for individual tokens
//       }
//     });
//     
//     await Promise.all(promises);
//   }
//   
//   return prices;
// }

export async function POST(request: NextRequest) {
  let blockscout: IBlockscoutClient | null = null;

  try {
    const body = await request.json();
    const { 
      query, 
      chains = ['1', '8453', '42161', '10', '137'], 
      apiKey: clientApiKey,
      provider = 'openai',
      model,
      context // Pre-fetched context from hook
    } = body;

    if (!query) {
      return NextResponse.json(
        { error: 'Query is required' },
        { status: 400 }
      );
    }

    // Check for API key from client (localStorage) or environment
    const apiKey = clientApiKey || process.env.OPENAI_API_KEY;
    
    console.log('[Chat API] Request received:', {
      hasClientKey: !!clientApiKey,
      hasEnvKey: !!process.env.OPENAI_API_KEY,
      provider,
      model,
      hasContext: !!context,
      contextTransfers: context?.transfers?.length || 0,
      contextContracts: context?.contracts?.length || 0,
    });
    
    if (!apiKey) {
      return NextResponse.json(
        { 
          answer: '⚠️ AI API key not configured. To enable AI chat:\n\n1. Go to Settings (Dashboard page)\n2. Add your AI API key (OpenAI, Anthropic, Google AI, etc.)\n3. Click Save\n\nYou can still use the Whale Feed and Wallet Analysis features without AI!' 
        },
        { status: 200 }
      );
    }

    // Initialize AI engine with model
    const ai = new AIEngine({ 
      apiKey,
      model 
    });

    let allTransfers: Transfer[] = [];
    let contractDetails: ContractDetail[] = [];
    
    // Use pre-fetched context if available (from hook), otherwise fetch fresh data
    if (context?.transfers && context.transfers.length > 0) {
      console.log('[Chat API] ✅ Using pre-fetched context from hook');
      allTransfers = context.transfers;
      contractDetails = context.contracts || [];
    } else {
      console.log('[Chat API] ⚠️ No context provided, fetching fresh data...');
      
      // Fallback: Fetch data if no context provided
      blockscout = createBlockscoutClient();
      await blockscout.connect();
      const whaleService = new WhaleService(100000, blockscout); // $100k minimum

      for (const chainId of chains.slice(0, 5)) {
        try {
          const chainName = CHAIN_NAMES[chainId] || `Chain ${chainId}`;
          console.log(`[Chat API] Fetching whale data for ${chainName}...`);
          
          const transfers = await whaleService.getWhaleFeed(chainId, chainName, '24h');
          console.log(`[Chat API] Found ${transfers.length} whale transfers on ${chainName}`);
          
          allTransfers.push(...transfers.map(t => ({ ...t, chainId, chainName })));
        } catch (error) {
          console.error(`Error fetching data for chain ${chainId}:`, error);
        }
      }

      // Fetch contract security details for all unique tokens
      console.log('[Chat API] 📋 Fetching contract security details...');
      const uniqueTokens = new Set<string>();
      const tokenMap = new Map<string, { symbol: string; chainId: string }>();
      
      allTransfers.forEach((t: Transfer) => {
        if (t.token?.address && t.chainId) {
          const key = `${t.chainId}-${t.token.address}`;
          if (!uniqueTokens.has(key)) {
            uniqueTokens.add(key);
            tokenMap.set(key, {
              symbol: t.token.symbol || 'Unknown',
              chainId: t.chainId
            });
          }
        }
      });

      console.log(`[Chat API] Found ${uniqueTokens.size} unique tokens, fetching details...`);

      // Fetch contract details in parallel (limit to 20 to avoid overwhelming the API)
      const contractPromises = Array.from(tokenMap.entries()).slice(0, 20).map(async ([key, data]) => {
        try {
          const address = key.split('-')[1];
          if (!blockscout) return null;
          const addressInfo = await blockscout.getAddressInfo(data.chainId, address);

          if (addressInfo) {
            return {
              symbol: data.symbol,
              address,
              chainId: data.chainId,
              
              // Contract verification & security
              isVerified: addressInfo.is_verified || false,
              isScam: addressInfo.is_scam || false,
              reputation: addressInfo.reputation,
              
              // Proxy contract info
              isProxy: (addressInfo.implementations?.length || 0) > 0,
              implementations: addressInfo.implementations?.map(impl => ({
                address: impl.address,
                name: impl.name,
              })) || [],
              
              // Token metadata
              tokenType: addressInfo.token?.type,
              tokenName: addressInfo.token?.name,
              tokenSymbol: addressInfo.token?.symbol,
              decimals: addressInfo.token?.decimals,
              
              // Supply & holders
              totalSupply: addressInfo.token?.total_supply,
              holders: addressInfo.token?.holders,
              
              // Market data
              price: addressInfo.token?.exchange_rate,
              marketCap: addressInfo.token?.circulating_market_cap,
            };
          }
          return null;
        } catch (err) {
          console.warn(`[Chat API] Failed to fetch contract ${key}:`, err);
          return null;
        }
      });

      contractDetails = (await Promise.all(contractPromises)).filter(detail => detail !== null) as ContractDetail[];
      console.log(`[Chat API] ✅ Fetched ${contractDetails.length} contract details`);
    }

    console.log(`[Chat API] Processing ${allTransfers.length} total transfers`);

    // Format transfers and convert raw values to human-readable token amounts
    const formattedTransfers = allTransfers.map((t: Transfer) => {
      // Convert raw value to token amount (assume 18 decimals for most tokens, 6 for stablecoins)
      const decimals = ['USDT', 'USDC'].includes(t.token.symbol) ? 6 : 18;
      const tokenAmount = parseFloat(t.value) / Math.pow(10, decimals);
      
      return {
        hash: t.hash,
        from: t.from,
        to: t.to,
        tokenSymbol: t.token.symbol,
        tokenAddress: t.token.address,
        tokenAmount: tokenAmount.toFixed(2), // Human-readable amount
        rawValue: t.value, // Keep raw for reference
        timestamp: new Date(t.timestamp || Date.now()).toISOString(),
        chainName: t.chainName,
        chainId: t.chainId,
        explorerUrl: `${getExplorerBaseUrl(t.chainId)}/tx/${t.hash}`,
      };
    });

    // Prioritize stablecoins and high-value tokens, then sort by amount
    const tokenPriority: Record<string, number> = {
      'USDT': 1,
      'USDC': 1,
      'DAI': 1,
      'WETH': 3500,
      'ETH': 3500,
      'WBTC': 100000,
      'SHIB': 0.000008,
      'PEPE': 0.000001,
    };

    const sortedTransfers = formattedTransfers
      .map((t) => ({
        ...t,
        estimatedValue: parseFloat(t.tokenAmount) * (tokenPriority[t.tokenSymbol] || 0.01),
      }))
      .sort((a, b) => b.estimatedValue - a.estimatedValue)
      .slice(0, 20);

    console.log(`[Chat API] Returning ${sortedTransfers.length} transfers sorted by estimated value`);

    // Group by chain for response
    const chainGroups: ChainGroup[] = chains.slice(0, 5).map((chainId: string) => {
      const chainName = CHAIN_NAMES[chainId] || `Chain ${chainId}`;
      const chainTransfers = sortedTransfers.filter((t) => t.chainId === chainId);
      
      return {
        chain: chainName,
        chainId,
        transfers: chainTransfers.slice(0, 10),
        count: chainTransfers.length,
      };
    });

    const blockchainData = chainGroups.filter((g) => g.count > 0);
    
    console.log('[Chat API] Total blockchain data collected:', {
      chains: blockchainData.length,
      totalTransfers: blockchainData.reduce((sum, d) => sum + d.count, 0),
      contracts: contractDetails.length
    });

    // Enrich blockchain data with contract security details
    const enrichedBlockchainData = blockchainData.map((chainData) => ({
      ...chainData,
      // Add contract details for tokens in this chain
      contractDetails: contractDetails.filter((c) => c.chainId === chainData.chainId),
    }));

    // Add summary as first element for AI context
    const contextWithSummary = [
      {
        type: 'summary',
        totalTransfers: blockchainData.reduce((sum, d) => sum + d.count, 0),
        totalChains: blockchainData.length,
        totalContracts: contractDetails.length,
        verifiedContracts: contractDetails.filter((c) => c.isVerified).length,
        scamContracts: contractDetails.filter((c) => c.isScam).length,
        proxyContracts: contractDetails.filter((c) => c.isProxy).length,
        allContracts: contractDetails, // Include all contract details for reference
      },
      ...enrichedBlockchainData
    ];

    // Get AI answer with enriched context
    const answer = await ai.answerQuery(query, contextWithSummary);

    return NextResponse.json({ answer });
  } catch (error) {
    console.error('Error in chat API:', error);
    
    // Provide more specific error messages
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    // Check if it's an API key error
    if (errorMessage.includes('API key') || errorMessage.includes('401') || errorMessage.includes('authentication')) {
      return NextResponse.json(
        { 
          answer: '⚠️ Invalid API key. Please check your API key in Settings and make sure it\'s correct and has sufficient credits.' 
        },
        { status: 200 }
      );
    }
    
    return NextResponse.json(
      { 
        answer: `⚠️ Error processing request: ${errorMessage}\n\nPlease try again or check your API key in Settings.` 
      },
      { status: 200 }
    );
  } finally {
    // Clean up connection
    if (blockscout) {
      await blockscout.disconnect();
    }
  }
}
