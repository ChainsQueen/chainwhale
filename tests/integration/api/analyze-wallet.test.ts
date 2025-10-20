import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { POST } from '@/app/api/analyze-wallet/route';

describe('POST /api/analyze-wallet', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should analyze wallet with valid address', async () => {
    const request = new NextRequest('http://localhost:3000/api/analyze-wallet', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        address: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
        chains: ['1'],
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toHaveProperty('analysis');
    expect(data).toHaveProperty('holdings');
  });

  it('should handle ENS names', async () => {
    const request = new NextRequest('http://localhost:3000/api/analyze-wallet', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        address: 'vitalik.eth',
        chains: ['1'],
      }),
    });

    const response = await POST(request);

    expect(response.status).toBeLessThan(500);
  });

  it('should return 400 for invalid address', async () => {
    const request = new NextRequest('http://localhost:3000/api/analyze-wallet', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        address: 'invalid-address',
        chains: ['1'],
      }),
    });

    const response = await POST(request);

    expect(response.status).toBe(400);
  });

  it('should support multiple chains', async () => {
    const request = new NextRequest('http://localhost:3000/api/analyze-wallet', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        address: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
        chains: ['1', '8453', '42161'],
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.holdings).toBeDefined();
  });
});