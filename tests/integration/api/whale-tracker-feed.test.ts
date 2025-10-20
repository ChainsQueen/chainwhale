import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { GET } from '@/app/api/whale-tracker/feed/route';

describe('GET /api/whale-tracker/feed', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return transfers for valid chain', async () => {
    const request = new NextRequest('http://localhost:3000/api/whale-tracker/feed?chains=1');

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toHaveProperty('transfers');
    expect(data).toHaveProperty('stats');
    expect(data).toHaveProperty('metadata');
    expect(Array.isArray(data.transfers)).toBe(true);
  });

  it('should handle multiple chains', async () => {
    const request = new NextRequest('http://localhost:3000/api/whale-tracker/feed?chains=1,8453');

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.metadata.chains).toContain('Ethereum');
    expect(data.metadata.chains).toContain('Base');
  });

  it('should filter by minimum value', async () => {
    const request = new NextRequest('http://localhost:3000/api/whale-tracker/feed?chains=1&minValue=500000');

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.metadata.minValueUsd).toBe('$500,000');
  });

  it('should filter by token symbol', async () => {
    const request = new NextRequest('http://localhost:3000/api/whale-tracker/feed?chains=1&token=USDC');

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.metadata.tokenFilter).toBe('USDC');
  });

  it('should return stats with correct structure', async () => {
    const request = new NextRequest('http://localhost:3000/api/whale-tracker/feed?chains=1');

    const response = await GET(request);
    const data = await response.json();

    expect(data.stats).toHaveProperty('totalTransfers');
    expect(data.stats).toHaveProperty('totalVolume');
    expect(data.stats).toHaveProperty('largestTransfer');
    expect(data.stats).toHaveProperty('uniqueWhales');
  });

  it('should include data source information', async () => {
    const request = new NextRequest('http://localhost:3000/api/whale-tracker/feed?chains=1');

    const response = await GET(request);
    const data = await response.json();

    expect(data.metadata).toHaveProperty('dataSources');
    expect(data.metadata.dataSources).toHaveProperty('mcp');
    expect(data.metadata.dataSources).toHaveProperty('http');
    expect(data.metadata.dataSources).toHaveProperty('total');
  });
});