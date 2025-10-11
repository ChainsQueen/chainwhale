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

    // Initialize services
    blockscout = new BlockscoutClient();
    await blockscout.connect();

    // AI is optional
    const apiKey = process.env.OPENAI_API_KEY;
    const ai = apiKey ? new AIEngine({ apiKey }) : null;

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

    // Get AI analysis (or provide basic analysis if no API key)
    const walletData = {
      address,
      totalValue,
      chains: chainBalances,
    };

    const analysis = ai 
      ? await ai.analyzeWallet(walletData, holdings)
      : {
          address,
          totalValue,
          chains: chainBalances,
          tokens: holdings,
          summary: 'AI analysis unavailable. Add OPENAI_API_KEY to .env.local to enable AI-powered insights.',
          riskScore: 50,
          insights: ['Basic wallet data retrieved successfully', 'Enable AI for detailed risk assessment'],
        };

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
