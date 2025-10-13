import { NextRequest, NextResponse } from 'next/server';
import { AIEngine } from '@/lib/ai';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { address, holdings, recentTransactions, totalValue, chains, apiKey: userApiKey } = body;

    if (!address) {
      return NextResponse.json(
        { error: 'Address is required' },
        { status: 400 }
      );
    }

    // Use user-provided API key or fall back to server key
    const apiKey = userApiKey || process.env.OPENAI_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: 'AI service not configured. Please add your OpenAI API key in settings.' },
        { status: 503 }
      );
    }

    // Initialize AI
    const ai = new AIEngine({ apiKey });

    // Prepare wallet data
    const walletData = {
      address,
      totalValue,
      chains,
      transferCount: recentTransactions.length,
      uniqueTokens: new Set(recentTransactions.map((tx: any) => tx.token?.address).filter(Boolean)).size,
      totalVolume24h: recentTransactions.reduce((sum: number, tx: any) => sum + (tx.valueUsd || 0), 0),
    };

    // Generate AI analysis
    const analysis = await ai.analyzeWallet(walletData, holdings);

    return NextResponse.json({
      insights: analysis.summary,
      riskScore: analysis.riskScore,
      summary: analysis.summary,
      keyInsights: analysis.insights,
    });
  } catch (error) {
    console.error('Error in analyze-wallet-ai API:', error);
    return NextResponse.json(
      { error: 'Failed to generate AI insights' },
      { status: 500 }
    );
  }
}
