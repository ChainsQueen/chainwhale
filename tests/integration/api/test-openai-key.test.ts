import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { POST } from '@/app/api/test-openai-key/route';

describe('POST /api/test-openai-key', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return 400 if API key is missing', async () => {
    const request = new NextRequest('http://localhost:3000/api/test-openai-key', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });

    const response = await POST(request);

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toContain('API key');
  });

  it('should handle invalid JSON', async () => {
    const request = new NextRequest('http://localhost:3000/api/test-openai-key', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: 'invalid json',
    });

    const response = await POST(request);

    expect(response.status).toBe(400);
  });
});