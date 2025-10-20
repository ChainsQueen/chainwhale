import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { POST } from '@/app/api/analyze-wallet-ai/route';

describe('POST /api/analyze-wallet-ai', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return 400 if API key is missing', async () => {
    const request = new NextRequest('http://localhost:3000/api/analyze-wallet-ai', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        address: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
        holdings: [],
        recentTransactions: [],
        totalValue: 0,
        chains: {},
      }),
    });

    const response = await POST(request);

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toContain('API key');
  });

  it('should return 400 if required fields are missing', async () => {
    const request = new NextRequest('http://localhost:3000/api/analyze-wallet-ai', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        apiKey: 'sk-test123',
        // Missing required fields
      }),
    });

    const response = await POST(request);

    expect(response.status).toBe(400);
  });

  it('should handle invalid JSON', async () => {
    const request = new NextRequest('http://localhost:3000/api/analyze-wallet-ai', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: 'invalid json',
    });

    const response = await POST(request);

    expect(response.status).toBe(400);
  });
});