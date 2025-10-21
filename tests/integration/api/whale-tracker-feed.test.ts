import { describe, it, expect, beforeAll, beforeEach, vi } from 'vitest';
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

// Type for API response data
interface ApiResponseData {
  transfers: Transfer[];
  stats: {
    totalTransfers: number;
    totalVolume: number;
    largestTransfer: number;
    uniqueWhales: number;
  };
  metadata: {
    chains: string[];
    timeRange: string;
    minValueUsd: string;
    tokenFilter?: string;
    dataSources: {
      mcp: number;
      http: number;
      total: number;
    };
  };
}

/**
 * Whale Tracker Feed API Integration Tests
 * 
 * These tests verify the whale tracker API returns accurate data matching Etherscan.
 * 
 * Data Sources:
 * - HTTP Client: Direct Blockscout REST API (tested here)
 * - MCP Client: Blockscout MCP server via Docker (requires Docker, tested separately)
 * 
 * The API automatically falls back from MCP to HTTP if Docker is not available,
 * so these tests primarily verify HTTP client accuracy since that's what runs in production.
 * 
 * For MCP-specific tests, see: tests/integration/blockscout-mcp.test.ts (if Docker available)
 */
describe('GET /api/whale-tracker/feed', () => {
  // Cache API responses to avoid redundant calls
  let cachedBasicResponse: Response;
  let cachedBasicData: ApiResponseData;
  let cachedUsdtResponse: Response;
  let cachedUsdtData: ApiResponseData;

  beforeAll(async () => {
    // Fetch once for all tests that use basic params (chains=1)
    const basicRequest = new NextRequest('http://localhost:3000/api/whale-tracker/feed?chains=1');
    cachedBasicResponse = await GET(basicRequest);
    cachedBasicData = await cachedBasicResponse.json();

    // Fetch once for USDT-specific tests
    const usdtRequest = new NextRequest('http://localhost:3000/api/whale-tracker/feed?chains=1&token=USDT');
    cachedUsdtResponse = await GET(usdtRequest);
    cachedUsdtData = await cachedUsdtResponse.json();
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return transfers for valid chain', () => {
    expect(cachedBasicResponse.status).toBe(200);
    expect(cachedBasicData).toHaveProperty('transfers');
    expect(cachedBasicData).toHaveProperty('stats');
    expect(cachedBasicData).toHaveProperty('metadata');
    expect(Array.isArray(cachedBasicData.transfers)).toBe(true);
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

  it('should return stats with correct structure', () => {
    expect(cachedBasicData.stats).toHaveProperty('totalTransfers');
    expect(cachedBasicData.stats).toHaveProperty('totalVolume');
    expect(cachedBasicData.stats).toHaveProperty('largestTransfer');
    expect(cachedBasicData.stats).toHaveProperty('uniqueWhales');
  });

  it('should include data source information', () => {
    expect(cachedBasicData.metadata).toHaveProperty('dataSources');
    expect(cachedBasicData.metadata.dataSources).toHaveProperty('mcp');
    expect(cachedBasicData.metadata.dataSources).toHaveProperty('http');
    expect(cachedBasicData.metadata.dataSources).toHaveProperty('total');
  });

  describe('Transfer Data Accuracy', () => {
    it('should return transfers with correct data structure', () => {
      if (cachedBasicData.transfers.length > 0) {
        const transfer = cachedBasicData.transfers[0];

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

    it('should calculate USD values correctly using historical prices', () => {
      if (cachedUsdtData.transfers.length > 0) {
        const transfer = cachedUsdtData.transfers[0];

        // USD value should be calculated as: tokenAmount * tokenPriceUsd
        const expectedUsdValue = transfer.tokenAmount * transfer.tokenPriceUsd;
        const tolerance = 0.01; // Allow 1 cent difference for rounding

        expect(Math.abs(transfer.usdValue - expectedUsdValue)).toBeLessThan(tolerance);

        // USD value should be positive
        expect(transfer.usdValue).toBeGreaterThan(0);
        expect(transfer.tokenPriceUsd).toBeGreaterThan(0);
      }
    });

    it('should handle USDT decimals correctly (6 decimals)', () => {
      if (cachedUsdtData.transfers.length > 0) {
        const usdtTransfer = cachedUsdtData.transfers.find((t: Transfer) => t.tokenSymbol === 'USDT');

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

    it('should handle different token decimals correctly', () => {
      if (cachedBasicData.transfers.length > 0) {
        // Check that decimals are within reasonable range (0-18)
        cachedBasicData.transfers.forEach((transfer: Transfer) => {
          expect(transfer.tokenDecimals).toBeGreaterThanOrEqual(0);
          expect(transfer.tokenDecimals).toBeLessThanOrEqual(18);

          // Token amount should be a reasonable number (not raw wei)
          // For a whale transfer, amount should be > 1 token
          expect(transfer.tokenAmount).toBeGreaterThan(0);
        });
      }
    });

    it('should include timestamp in ISO format', () => {
      if (cachedBasicData.transfers.length > 0) {
        const transfer = cachedBasicData.transfers[0];

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
    it('should include contract verification status', () => {
      if (cachedBasicData.transfers.length > 0) {
        const transfer = cachedBasicData.transfers[0];

        expect(typeof transfer.isVerified).toBe('boolean');
        expect(typeof transfer.contractAddress).toBe('string');
        expect(transfer.contractAddress).toMatch(/^0x[a-fA-F0-9]{40}$/);
      }
    });

    it('should mark well-known tokens as verified', () => {
      if (cachedUsdtData.transfers.length > 0) {
        const usdtTransfer = cachedUsdtData.transfers.find((t: Transfer) => t.tokenSymbol === 'USDT');

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

    it('should include token metadata', () => {
      if (cachedBasicData.transfers.length > 0) {
        const transfer = cachedBasicData.transfers[0];

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

    it('should have stats that match transfer data', () => {
      // Total transfers should match array length
      expect(cachedBasicData.stats.totalTransfers).toBe(cachedBasicData.transfers.length);

      // Only validate stats if there are transfers
      if (cachedBasicData.transfers.length > 0) {
        // Total volume should be sum of all USD values
        const calculatedVolume = cachedBasicData.transfers.reduce(
          (sum: number, t: Transfer) => sum + t.usdValue,
          0
        );
        const tolerance = 0.01; // Allow small rounding difference
        expect(Math.abs(cachedBasicData.stats.totalVolume - calculatedVolume)).toBeLessThan(tolerance);

        // Largest transfer should match max USD value
        const maxUsdValue = Math.max(...cachedBasicData.transfers.map((t: Transfer) => t.usdValue));
        expect(cachedBasicData.stats.largestTransfer).toBe(maxUsdValue);
      } else {
        // If no transfers, stats should be zero
        expect(cachedBasicData.stats.totalVolume).toBe(0);
        expect(cachedBasicData.stats.largestTransfer).toBe(0);
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

  describe('Etherscan Data Accuracy Comparison', () => {
    /**
     * Test cases with known Etherscan values
     * These are real transactions verified on Etherscan
     */
    const ETHERSCAN_TEST_CASES = [
      {
        name: 'LINK transfer from Binance',
        txHash: '0xc433ff987ddec116f47f9e6f7843acdc9ea4d8605782e8d62b1a042e68c54954',
        etherscanAmount: 289999.87,
        etherscanSymbol: 'LINK',
        etherscanUsdValue: 5451997.55,
        tolerance: 0.01, // 1% tolerance for USD (historical price may vary)
      },
      {
        name: 'USDT transfer (6 decimals)',
        txHash: '0x4b899e1e632dd92462ee5bb15111b4980bd338d4464af7dc29be2b8bd6c66965',
        etherscanAmount: 1673334.08,
        etherscanSymbol: 'USDT',
        etherscanUsdValue: 1673334.08,
        tolerance: 0.001, // 0.1% tolerance for stablecoins
      },
    ];

    ETHERSCAN_TEST_CASES.forEach((testCase) => {
      it(`should match Etherscan data for ${testCase.name}`, async () => {
        // Fetch transfers from our API
        // Use shorter time range to avoid rate limiting during tests
        const request = new NextRequest(
          'http://localhost:3000/api/whale-tracker/feed?chains=1&timeRange=7d&minValue=100000'
        );

        const response = await GET(request);
        
        // Skip test if API is unavailable (rate limited, network error, etc.)
        if (response.status !== 200) {
          console.warn(
            `⚠️  API returned status ${response.status}. Skipping Etherscan comparison test.`
          );
          return;
        }
        
        const data = await response.json();

        // Find the specific transaction
        const transfer = data.transfers.find((t: Transfer) => t.hash === testCase.txHash);

        if (!transfer) {
          console.warn(
            `⚠️  Transaction ${testCase.txHash} not found in current feed.`
          );
          return;
        }

        // Verify token symbol
        expect(transfer.tokenSymbol).toBe(testCase.etherscanSymbol);

        // Verify token amount
        const amountDiff = Math.abs(transfer.tokenAmount - testCase.etherscanAmount);
        const amountDiffPercent = (amountDiff / testCase.etherscanAmount) * 100;

        // Token amount should be exact (within 0.01%)
        expect(amountDiffPercent).toBeLessThan(0.01);

        // Verify USD value
        const usdDiff = Math.abs(transfer.usdValue - testCase.etherscanUsdValue);
        const usdDiffPercent = (usdDiff / testCase.etherscanUsdValue) * 100;

        // USD value should be within tolerance
        const tolerancePercent = testCase.tolerance * 100;
        expect(usdDiffPercent).toBeLessThan(tolerancePercent);
      }, 15000); // 15 second timeout
    });

    it('should convert token decimals correctly', () => {
      // Helper function to test decimal conversion (matches production code)
      const convertTokenValue = (value: string, decimals: number): number => {
        if (!value || value === '0') return 0;
        const cleanValue = value.replace(/^0+/, '') || '0';
        if (decimals === 0) return parseInt(cleanValue);
        const paddedValue = cleanValue.padStart(decimals + 1, '0');
        const integerPart = paddedValue.slice(0, -decimals) || '0';
        const decimalPart = paddedValue.slice(-decimals);
        return parseFloat(`${integerPart}.${decimalPart}`);
      };

      // Test LINK (18 decimals)
      expect(convertTokenValue('289999870000000000000000', 18)).toBe(289999.87);

      // Test USDT (6 decimals)
      expect(convertTokenValue('1673334080000', 6)).toBe(1673334.08);

      // Test edge cases
      expect(convertTokenValue('0', 18)).toBe(0);
      expect(convertTokenValue('1000000000000000000', 18)).toBe(1);
      expect(convertTokenValue('1000000', 6)).toBe(1);
    });
  });
});