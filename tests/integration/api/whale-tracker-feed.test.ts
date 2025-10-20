import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { GET } from '@/app/api/whale-tracker/feed/route';

// Type for transfer data in API response
interface Transfer {
  hash: string;
  from: string;
  to: string;
  tokenAmount: number;
  tokenSymbol: string;
  tokenDecimals: number;
  timestamp: string;
  chainId: number;
  chainName: string;
  usdValue: number;
  tokenPriceUsd: number;
  isVerified: boolean;
  contractAddress: string;
  tokenName?: string;
}

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

  describe('Transfer Data Accuracy', () => {
    it('should return transfers with correct data structure', async () => {
      const request = new NextRequest('http://localhost:3000/api/whale-tracker/feed?chains=1');

      const response = await GET(request);
      const data = await response.json();

      if (data.transfers.length > 0) {
        const transfer = data.transfers[0];

        // Required fields
        expect(transfer).toHaveProperty('hash');
        expect(transfer).toHaveProperty('from');
        expect(transfer).toHaveProperty('to');
        expect(transfer).toHaveProperty('tokenAmount');
        expect(transfer).toHaveProperty('tokenSymbol');
        expect(transfer).toHaveProperty('tokenDecimals');
        expect(transfer).toHaveProperty('timestamp');
        expect(transfer).toHaveProperty('chainId');
        expect(transfer).toHaveProperty('chainName');

        // USD value fields
        expect(transfer).toHaveProperty('usdValue');
        expect(transfer).toHaveProperty('tokenPriceUsd');

        // Security fields
        expect(transfer).toHaveProperty('isVerified');
        expect(transfer).toHaveProperty('contractAddress');

        // Type checks
        expect(typeof transfer.hash).toBe('string');
        expect(typeof transfer.tokenAmount).toBe('number');
        expect(typeof transfer.tokenSymbol).toBe('string');
        expect(typeof transfer.tokenDecimals).toBe('number');
        expect(typeof transfer.usdValue).toBe('number');
        expect(typeof transfer.isVerified).toBe('boolean');
      }
    });

    it('should calculate USD values correctly using historical prices', async () => {
      const request = new NextRequest('http://localhost:3000/api/whale-tracker/feed?chains=1&token=USDT');

      const response = await GET(request);
      const data = await response.json();

      if (data.transfers.length > 0) {
        const transfer = data.transfers[0];

        // USD value should be calculated as: tokenAmount * tokenPriceUsd
        const expectedUsdValue = transfer.tokenAmount * transfer.tokenPriceUsd;
        const tolerance = 0.01; // Allow 1 cent difference for rounding

        expect(Math.abs(transfer.usdValue - expectedUsdValue)).toBeLessThan(tolerance);

        // USD value should be positive
        expect(transfer.usdValue).toBeGreaterThan(0);
        expect(transfer.tokenPriceUsd).toBeGreaterThan(0);
      }
    });

    it('should handle USDT decimals correctly (6 decimals)', async () => {
      const request = new NextRequest('http://localhost:3000/api/whale-tracker/feed?chains=1&token=USDT');

      const response = await GET(request);
      const data = await response.json();

      if (data.transfers.length > 0) {
        const usdtTransfer = data.transfers.find((t: Transfer) => t.tokenSymbol === 'USDT');

        if (usdtTransfer) {
          // USDT should have 6 decimals
          expect(usdtTransfer.tokenDecimals).toBe(6);

          // USDT price should be close to $1 (within 5% tolerance for stablecoin)
          expect(usdtTransfer.tokenPriceUsd).toBeGreaterThan(0.95);
          expect(usdtTransfer.tokenPriceUsd).toBeLessThan(1.05);

          // Token amount should be reasonable (not raw wei-like value)
          // If USD value is $100k, token amount should be ~100k USDT, not 100000000000
          const ratio = usdtTransfer.usdValue / usdtTransfer.tokenAmount;
          expect(ratio).toBeGreaterThan(0.95); // Should be close to 1:1 for USDT
          expect(ratio).toBeLessThan(1.05);
        }
      }
    });

    it('should handle different token decimals correctly', async () => {
      const request = new NextRequest('http://localhost:3000/api/whale-tracker/feed?chains=1');

      const response = await GET(request);
      const data = await response.json();

      if (data.transfers.length > 0) {
        // Check that decimals are within reasonable range (0-18)
        data.transfers.forEach((transfer: Transfer) => {
          expect(transfer.tokenDecimals).toBeGreaterThanOrEqual(0);
          expect(transfer.tokenDecimals).toBeLessThanOrEqual(18);

          // Token amount should be a reasonable number (not raw wei)
          // For a whale transfer, amount should be > 1 token
          expect(transfer.tokenAmount).toBeGreaterThan(0);
        });
      }
    });

    it('should include timestamp in ISO format', async () => {
      const request = new NextRequest('http://localhost:3000/api/whale-tracker/feed?chains=1');

      const response = await GET(request);
      const data = await response.json();

      if (data.transfers.length > 0) {
        const transfer = data.transfers[0];

        // Should be a valid ISO timestamp
        expect(typeof transfer.timestamp).toBe('string');
        const date = new Date(transfer.timestamp);
        expect(date.toString()).not.toBe('Invalid Date');

        // Should be a recent timestamp (within last 30 days for active chains)
        const now = new Date();
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        expect(date.getTime()).toBeGreaterThan(thirtyDaysAgo.getTime());
      }
    });
  });

  describe('Contract Data Accuracy', () => {
    it('should include contract verification status', async () => {
      const request = new NextRequest('http://localhost:3000/api/whale-tracker/feed?chains=1');

      const response = await GET(request);
      const data = await response.json();

      if (data.transfers.length > 0) {
        const transfer = data.transfers[0];

        expect(typeof transfer.isVerified).toBe('boolean');
        expect(typeof transfer.contractAddress).toBe('string');
        expect(transfer.contractAddress).toMatch(/^0x[a-fA-F0-9]{40}$/);
      }
    });

    it('should mark well-known tokens as verified', async () => {
      const request = new NextRequest('http://localhost:3000/api/whale-tracker/feed?chains=1&token=USDT');

      const response = await GET(request);
      const data = await response.json();

      if (data.transfers.length > 0) {
        const usdtTransfer = data.transfers.find((t: Transfer) => t.tokenSymbol === 'USDT');

        if (usdtTransfer) {
          // USDT on Ethereum should be verified
          expect(usdtTransfer.isVerified).toBe(true);
          // USDT contract address on Ethereum
          expect(usdtTransfer.contractAddress.toLowerCase()).toBe(
            '0xdac17f958d2ee523a2206206994597c13d831ec7'
          );
        }
      }
    });

    it('should include token metadata', async () => {
      const request = new NextRequest('http://localhost:3000/api/whale-tracker/feed?chains=1');

      const response = await GET(request);
      const data = await response.json();

      if (data.transfers.length > 0) {
        const transfer = data.transfers[0];

        // Token symbol should be uppercase and reasonable length
        expect(transfer.tokenSymbol).toMatch(/^[A-Z0-9]{1,10}$/);

        // Token name should exist if available
        if (transfer.tokenName) {
          expect(typeof transfer.tokenName).toBe('string');
          expect(transfer.tokenName.length).toBeGreaterThan(0);
        }
      }
    });
  });

  describe('Data Consistency', () => {
    it('should return consistent data across multiple requests', async () => {
      const request1 = new NextRequest('http://localhost:3000/api/whale-tracker/feed?chains=1&minValue=100000');
      const request2 = new NextRequest('http://localhost:3000/api/whale-tracker/feed?chains=1&minValue=100000');

      const response1 = await GET(request1);
      const response2 = await GET(request2);

      const data1 = await response1.json();
      const data2 = await response2.json();

      // Should return same number of transfers (assuming no new txs in between)
      // Allow small variance for real-time data
      const variance = Math.abs(data1.transfers.length - data2.transfers.length);
      expect(variance).toBeLessThan(5);

      // Stats should be consistent
      if (data1.transfers.length === data2.transfers.length) {
        expect(data1.stats.totalTransfers).toBe(data2.stats.totalTransfers);
        expect(data1.stats.totalVolume).toBe(data2.stats.totalVolume);
      }
    });

    it('should have stats that match transfer data', async () => {
      const request = new NextRequest('http://localhost:3000/api/whale-tracker/feed?chains=1');

      const response = await GET(request);
      const data = await response.json();

      // Total transfers should match array length
      expect(data.stats.totalTransfers).toBe(data.transfers.length);

      // Only validate stats if there are transfers
      if (data.transfers.length > 0) {
        // Total volume should be sum of all USD values
        const calculatedVolume = data.transfers.reduce(
          (sum: number, t: Transfer) => sum + t.usdValue,
          0
        );
        const tolerance = 0.01; // Allow small rounding difference
        expect(Math.abs(data.stats.totalVolume - calculatedVolume)).toBeLessThan(tolerance);

        // Largest transfer should match max USD value
        const maxUsdValue = Math.max(...data.transfers.map((t: Transfer) => t.usdValue));
        expect(data.stats.largestTransfer).toBe(maxUsdValue);
      } else {
        // If no transfers, stats should be zero
        expect(data.stats.totalVolume).toBe(0);
        expect(data.stats.largestTransfer).toBe(0);
      }
    });

    it('should filter transfers correctly by minimum value', async () => {
      const minValue = 500000;
      const request = new NextRequest(
        `http://localhost:3000/api/whale-tracker/feed?chains=1&minValue=${minValue}`
      );

      const response = await GET(request);
      const data = await response.json();

      // All transfers should be >= minValue
      data.transfers.forEach((transfer: Transfer) => {
        expect(transfer.usdValue).toBeGreaterThanOrEqual(minValue);
      });
    });
  });
});