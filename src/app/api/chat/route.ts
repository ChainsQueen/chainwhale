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

    for (const chainId of chains.slice(0, 3)) {
      try {
        const chainName = CHAIN_NAMES[chainId] || `Chain ${chainId}`;
        console.log(`[Chat API] Fetching whale data for ${chainName}...`);
        
        // Use WhaleService to get actual whale transactions
        const transfers = await whaleService.getWhaleFeed(chainId, chainName, '24h');
        
        console.log(`[Chat API] Found ${transfers.length} whale transfers on ${chainName}`);

        // Get top 10 transfers
        const topTransfers = transfers.slice(0, 10);

        blockchainData.push({
          chain: chainName,
          chainId,
          transfers: topTransfers,
          count: transfers.length,
        });
      } catch (error) {
        console.error(`Error fetching data for chain ${chainId}:`, error);
      }
    }
    
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
