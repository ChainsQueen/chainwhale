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

    // Check for API key
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 500 }
      );
    }

    // Initialize services
    blockscout = new BlockscoutClient();
    await blockscout.connect();

    const ai = new AIEngine({ apiKey });
    const detector = new WhaleDetector(blockscout, ai);

    // Fetch whale transactions from each chain
    const allTransactions = [];

    for (const chainId of chains) {
      try {
        const transactions = await detector.detectWhaleTransactions(chainId, 20);
        allTransactions.push(...transactions);
      } catch (error) {
        console.error(`Error detecting whales on chain ${chainId}:`, error);
      }
    }

    // Sort by timestamp (newest first)
    const sorted = allTransactions.sort((a, b) => b.timestamp - a.timestamp);

    // Return top 50 transactions
    return NextResponse.json({ transactions: sorted.slice(0, 50) });
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
