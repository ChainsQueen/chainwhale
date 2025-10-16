import { NextRequest, NextResponse } from 'next/server';
import { AIEngine } from '@/lib/ai';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * API endpoint for generating AI insights on Whale Tracker data
 * Analyzes whale transfer patterns from Blockscout (MCP or HTTP)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as Record<string, unknown>;
    const transfers = body.transfers;
    const stats = body.stats;
    const topWhales = body.topWhales;
    const userApiKey = body.apiKey as string | undefined;

    // Extract filters
    const filters = {
      timeRange: body.timeRange,
      selectedChains: body.selectedChains,
      minValue: body.minValue,
      tokenFilter: body.tokenFilter,
      dataSourceStats: body.dataSourceStats,
    };

    if (!transfers) {
      return NextResponse.json(
        { error: 'No whale transfers data provided' },
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

    // Initialize AI Engine
    const ai = new AIEngine({ apiKey });

    // Generate whale tracker activity analysis
    const insights = await ai.analyzeWhaleTrackerActivity(
      transfers as Array<Record<string, unknown>>,
      stats as Record<string, unknown>,
      topWhales as Array<Record<string, unknown>>,
      filters
    );

    return NextResponse.json({
      insights,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error in whale-tracker analyze-ai API:', error);
    return NextResponse.json(
      { error: 'Failed to generate AI insights for whale tracker' },
      { status: 500 }
    );
  }
}