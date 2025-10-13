import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { apiKey } = body;

    if (!apiKey) {
      return NextResponse.json(
        { valid: false, error: 'API key is required' },
        { status: 400 }
      );
    }

    // Test the API key with a minimal request
    const openai = new OpenAI({ apiKey });

    try {
      // Make a simple API call to verify the key works
      await openai.models.list();
      
      return NextResponse.json({ valid: true });
    } catch (error: any) {
      console.error('OpenAI key validation error:', error);
      return NextResponse.json({ 
        valid: false, 
        error: error.message || 'Invalid API key' 
      });
    }
  } catch (error) {
    console.error('Error testing OpenAI key:', error);
    return NextResponse.json(
      { valid: false, error: 'Failed to test API key' },
      { status: 500 }
    );
  }
}
