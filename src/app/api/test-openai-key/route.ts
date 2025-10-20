import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * POST /api/test-openai-key
 * 
 * Validates an OpenAI API key by attempting to list available models.
 * Used to verify user-provided API keys before storing them.
 * 
 * @route POST /api/test-openai-key
 * 
 * @param {Object} request.body - Request body
 * @param {string} request.body.apiKey - OpenAI API key to validate
 * 
 * @returns {Object} 200 - Validation successful
 * @returns {boolean} returns.valid - Whether the API key is valid
 * 
 * @returns {Object} 400 - Bad request (missing API key)
 * @returns {boolean} returns.valid - false
 * @returns {string} returns.error - Error message
 * 
 * @returns {Object} 500 - Server error
 * @returns {boolean} returns.valid - false
 * @returns {string} returns.error - Error message
 * 
 * @example
 * // Request
 * POST /api/test-openai-key
 * Content-Type: application/json
 * {
 *   "apiKey": "sk-..."
 * }
 * 
 * // Success Response
 * {
 *   "valid": true
 * }
 * 
 * // Error Response
 * {
 *   "valid": false,
 *   "error": "Invalid API key"
 * }
 */
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
    } catch (err: unknown) {
      console.error('OpenAI key validation error:', err);
      return NextResponse.json({ 
        valid: false, 
        error: err instanceof Error ? err.message : 'Invalid API key' 
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
