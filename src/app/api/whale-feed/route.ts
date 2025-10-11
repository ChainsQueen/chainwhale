import { NextRequest, NextResponse } from 'next/server';
import { BlockscoutClient } from '@/lib/blockscout';
import { AIEngine } from '@/lib/ai';
import { WhaleDetector } from '@/core/services/whale-detector';

export async function GET(request: NextRequest) {
  let blockscout: BlockscoutClient | null = null;

  try {
    const { searchParams } = new URL(request.url);
    const chainsParam = searchParams.get('chains');
    const chains = chainsParam ? chainsParam.split(',') : ['1', '8453', '42161'];

    // Initialize services
    blockscout = new BlockscoutClient();
    await blockscout.connect();

    // AI is optional - will work without it
    const apiKey = process.env.OPENAI_API_KEY;
    const ai = apiKey ? new AIEngine({ apiKey }) : null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const detector = new WhaleDetector(blockscout, ai as any);

    // Fetch whale transactions from each chain
    const allTransactions = [];

    for (const chainId of chains) {
      try {
        console.log(`Fetching whale transactions for chain ${chainId}...`);
        const transactions = await detector.detectWhaleTransactions(chainId, 20);
        console.log(`Found ${transactions.length} whale transactions on chain ${chainId}`);
        allTransactions.push(...transactions);
      } catch (error) {
        console.error(`Error detecting whales on chain ${chainId}:`, error);
      }
    }

    console.log(`Total transactions found: ${allTransactions.length}`);

    // Sort by timestamp (newest first)
    const sorted = allTransactions.sort((a, b) => b.timestamp - a.timestamp);

    // Return top 50 transactions
    return NextResponse.json({ 
      transactions: sorted.slice(0, 50),
      debug: {
        totalFound: allTransactions.length,
        chainsChecked: chains.length
      }
    });
  } catch (error) {
    console.error('Error in whale-feed API:', error);
    return NextResponse.json(
      { error: 'Failed to fetch whale transactions' },
      { status: 500 }
    );
  } finally {
    // Clean up connection
    if (blockscout) {
      await blockscout.disconnect();
    }
  }
}
