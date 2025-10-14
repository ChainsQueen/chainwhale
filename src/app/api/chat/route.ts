import { NextRequest, NextResponse } from 'next/server';
import { AIEngine } from '@/lib/ai';
import { createBlockscoutClient } from '@/lib/blockscout/factory';
import type { IBlockscoutClient } from '@/lib/blockscout/factory';
import { WhaleService } from '@/core/services/whale-service';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const CHAIN_NAMES: Record<string, string> = {
  '1': 'Ethereum',
  '8453': 'Base',
  '42161': 'Arbitrum',
  '10': 'Optimism',
  '137': 'Polygon',
};

const EXPLORER_URLS: Record<string, string> = {
  '1': 'https://etherscan.io',
  '8453': 'https://basescan.org',
  '42161': 'https://arbiscan.io',
  '10': 'https://optimistic.etherscan.io',
  '137': 'https://polygonscan.com',
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
    const { query, chains = ['1', '8453', '42161'], apiKey: clientApiKey } = body;

    if (!query) {
      return NextResponse.json(
        { error: 'Query is required' },
        { status: 400 }
      );
    }

    // Check for API key from client (localStorage) or environment
    const apiKey = clientApiKey || process.env.OPENAI_API_KEY;
    
    console.log('[Chat API] API Key check:', {
      hasClientKey: !!clientApiKey,
      hasEnvKey: !!process.env.OPENAI_API_KEY,
      clientKeyLength: clientApiKey?.length || 0
    });
    
    if (!apiKey) {
      return NextResponse.json(
        { 
          answer: '⚠️ AI API key not configured. To enable AI chat:\n\n1. Go to Settings (Dashboard page)\n2. Add your AI API key (OpenAI, Anthropic, Google AI, etc.)\n3. Click Save\n\nYou can still use the Whale Feed and Wallet Analysis features without AI!' 
        },
        { status: 200 }
      );
    }

    // Initialize services - use factory to get correct client (HTTP on Vercel, MCP locally)
    blockscout = createBlockscoutClient();
    await blockscout.connect();

    const ai = new AIEngine({ apiKey });
    const whaleService = new WhaleService(100000, blockscout); // $100k minimum

    // Fetch whale activity data using WhaleService
    const blockchainData = [];
    const allTransfers = [];

    // Collect all transfers from all chains
    for (const chainId of chains.slice(0, 3)) {
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

    console.log(`[Chat API] Processing ${allTransfers.length} total transfers`);

    // Format transfers and convert raw values to human-readable token amounts
    const formattedTransfers = allTransfers.map(t => {
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
        timestamp: new Date(t.timestamp).toISOString(),
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
      .map(t => ({
        ...t,
        estimatedValue: parseFloat(t.tokenAmount) * (tokenPriority[t.tokenSymbol] || 0.01),
      }))
      .sort((a, b) => b.estimatedValue - a.estimatedValue)
      .slice(0, 20);

    console.log(`[Chat API] Returning ${sortedTransfers.length} transfers sorted by estimated value`);

    // Group by chain for response
    const chainGroups = chains.slice(0, 3).map((chainId: string) => {
      const chainName = CHAIN_NAMES[chainId] || `Chain ${chainId}`;
      const chainTransfers = sortedTransfers.filter(t => t.chainId === chainId);
      
      return {
        chain: chainName,
        chainId,
        transfers: chainTransfers.slice(0, 10),
        count: chainTransfers.length,
      };
    });

    blockchainData.push(...chainGroups.filter((g: { count: number }) => g.count > 0));
    
    console.log('[Chat API] Total blockchain data collected:', {
      chains: blockchainData.length,
      totalTransfers: blockchainData.reduce((sum, d) => sum + d.count, 0)
    });

    // Get AI answer
    const answer = await ai.answerQuery(query, blockchainData);

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
