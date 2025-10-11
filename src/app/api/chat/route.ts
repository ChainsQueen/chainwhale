import { NextRequest, NextResponse } from 'next/server';
import { BlockscoutClient } from '@/lib/blockscout';
import { AIEngine } from '@/lib/ai';

export async function POST(request: NextRequest) {
  let blockscout: BlockscoutClient | null = null;

  try {
    const body = await request.json();
    const { query, chains = ['1', '8453', '42161'] } = body;

    if (!query) {
      return NextResponse.json(
        { error: 'Query is required' },
        { status: 400 }
      );
    }

    // Check for API key
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { 
          answer: '⚠️ OpenAI API key not configured. To enable AI chat:\n\n1. Get an API key from https://platform.openai.com/api-keys\n2. Create a .env.local file in the project root\n3. Add: OPENAI_API_KEY=your_key_here\n4. Restart the dev server\n\nYou can still use the Whale Feed and Wallet Analysis features without AI!' 
        },
        { status: 200 }
      );
    }

    // Initialize services
    blockscout = new BlockscoutClient();
    await blockscout.connect();

    const ai = new AIEngine({ apiKey });

    // Fetch relevant blockchain data based on query
    const blockchainData = [];

    for (const chainId of chains.slice(0, 3)) {
      try {
        const { items: transfers } = await blockscout.getTokenTransfers(
          chainId,
          null,
          '24h',
          'now'
        );

        // Get top transfers by value
        const topTransfers = transfers
          .filter((t) => t.valueUsd && t.valueUsd > 10000)
          .slice(0, 10);

        blockchainData.push({
          chain: chainId,
          transfers: topTransfers,
        });
      } catch (error) {
        console.error(`Error fetching data for chain ${chainId}:`, error);
      }
    }

    // Get AI answer
    const answer = await ai.answerQuery(query, blockchainData);

    return NextResponse.json({ answer });
  } catch (error) {
    console.error('Error in chat API:', error);
    return NextResponse.json(
      { error: 'Failed to process query' },
      { status: 500 }
    );
  } finally {
    // Clean up connection
    if (blockscout) {
      await blockscout.disconnect();
    }
  }
}
