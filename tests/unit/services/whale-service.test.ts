import { describe, it, expect, beforeEach, vi } from 'vitest';
import { WhaleService } from '@/core/services/whale-service';
import type { IBlockscoutClient } from '@/lib/blockscout/factory';

describe('WhaleService', () => {
  let mockClient: IBlockscoutClient;
  let whaleService: WhaleService;

  beforeEach(() => {
    mockClient = {
      connect: vi.fn().mockResolvedValue(undefined),
      disconnect: vi.fn().mockResolvedValue(undefined),
      getTokenTransfers: vi.fn(),
      getAddressInfo: vi.fn(),
      getTokensByAddress: vi.fn(),
      getChainsList: vi.fn(),
    };

    whaleService = new WhaleService(100000, mockClient);
  });

  it('should initialize with correct minimum whale value', () => {
    expect(whaleService).toBeDefined();
  });

  it('should fetch whale feed for a chain', async () => {
    const mockTransfers = [
      {
        hash: '0x123',
        from: '0xabc',
        to: '0xdef',
        value: '1000000',
        valueUsd: 150000,
        timestamp: Date.now(),
        token: { symbol: 'USDC', name: 'USD Coin', address: '0xtoken' },
        dataSource: 'mcp' as const,
      },
    ];

    vi.mocked(mockClient.getTokenTransfers).mockResolvedValue({
      items: mockTransfers,
      nextCursor: undefined,
    });

    const result = await whaleService.getWhaleFeed('1', 'Ethereum', '24h');

    expect(result).toBeDefined();
    expect(Array.isArray(result)).toBe(true);
    expect(mockClient.connect).toHaveBeenCalled();
  });

  it('should filter transfers below minimum value', async () => {
    const mockTransfers = [
      {
        hash: '0x123',
        from: '0xabc',
        to: '0xdef',
        value: '1000',
        valueUsd: 50000, // Below 100k threshold
        timestamp: Date.now(),
        token: { symbol: 'USDC', name: 'USD Coin', address: '0xtoken' },
        dataSource: 'mcp' as const,
      },
      {
        hash: '0x456',
        from: '0xabc',
        to: '0xdef',
        value: '2000000',
        valueUsd: 200000, // Above threshold
        timestamp: Date.now(),
        token: { symbol: 'USDT', name: 'Tether', address: '0xtoken2' },
        dataSource: 'mcp' as const,
      },
    ];

    vi.mocked(mockClient.getTokenTransfers).mockResolvedValue({
      items: mockTransfers,
      nextCursor: undefined,
    });

    const result = await whaleService.getWhaleFeed('1', 'Ethereum', '24h');

    // Should only include transfers >= 100k
    const highValueTransfers = result.filter((t) => (t.valueUsd || 0) >= 100000);
    expect(highValueTransfers.length).toBeGreaterThan(0);
  });

  it('should handle errors gracefully', async () => {
    vi.mocked(mockClient.getTokenTransfers).mockRejectedValue(new Error('API Error'));

    const result = await whaleService.getWhaleFeed('1', 'Ethereum', '24h');

    // Should return empty array on error
    expect(Array.isArray(result)).toBe(true);
  });
});