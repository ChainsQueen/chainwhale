import { NextRequest, NextResponse } from 'next/server';
import { BlockscoutClient } from '@/lib/blockscout';
import { AIEngine } from '@/lib/ai';

export async function POST(request: NextRequest) {
  let blockscout: BlockscoutClient | null = null;

  try {
    const body = await request.json();
    const { address, chains = ['1', '8453', '42161'] } = body;

    if (!address) {
      return NextResponse.json(
        { error: 'Address is required' },
        { status: 400 }
      );
    }

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

    // Fetch data for each chain
    const holdings = [];
    const chainBalances: Record<string, number> = {};
    let totalValue = 0;

    for (const chainId of chains) {
      try {
        // Get address info
        const addressInfo = await blockscout.getAddressInfo(chainId, address);
        
        // Get tokens
        const tokens = await blockscout.getTokensByAddress(chainId, address);

        // Calculate chain value
        const chainValue = addressInfo.balanceUsd || 0;
        chainBalances[chainId] = chainValue;
        totalValue += chainValue;

        // Add holdings
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        for (const token of tokens as any[]) {
          holdings.push({
            symbol: token.token?.symbol || 'UNKNOWN',
            balance: token.value || '0',
            value: parseFloat(token.exchange_rate || '0'),
            chain: chainId,
          });
        }
      } catch (error) {
        console.error(`Error analyzing wallet on chain ${chainId}:`, error);
      }
    }

    // Get AI analysis
    const walletData = {
      address,
      totalValue,
      chains: chainBalances,
    };

    const analysis = await ai.analyzeWallet(walletData, holdings);

    return NextResponse.json({
      holdings,
      analysis,
    });
  } catch (error) {
    console.error('Error in analyze-wallet API:', error);
    return NextResponse.json(
      { error: 'Failed to analyze wallet' },
      { status: 500 }
    );
  } finally {
    // Clean up connection
    if (blockscout) {
      await blockscout.disconnect();
    }
  }
}
