import { describe, it, expect, beforeEach, vi } from 'vitest';
import { WhaleDetector } from '@/core/services/whale-detector';
import { BlockscoutClient } from '@/lib/blockscout';
import { AIEngine } from '@/lib/ai';

vi.mock('@/lib/blockscout');
vi.mock('@/lib/ai');

describe('WhaleDetector', () => {
  let whaleDetector: WhaleDetector;
  let mockBlockscout: BlockscoutClient;
  let mockAI: AIEngine;

  beforeEach(() => {
    mockBlockscout = {
      getTokenTransfers: vi.fn(),
      transactionSummary: vi.fn(),
    } as Partial<BlockscoutClient> as BlockscoutClient;

    mockAI = {
      analyzeTransaction: vi.fn(),
    } as Partial<AIEngine> as AIEngine;

    whaleDetector = new WhaleDetector(mockBlockscout, mockAI, 100);
    vi.clearAllMocks();
  });

  describe('detectWhaleTransactions', () => {
    it('should detect whale transactions above threshold', async () => {
      const mockTransfers = [
        {
          hash: '0x123',
          from: '0xabc',
          to: '0xdef',
          value: '1000000',
          valueUsd: 50000,
          timestamp: Date.now() / 1000,
          token: { symbol: 'USDT', address: '0xdac17f958d2ee523a2206206994597c13d831ec7', name: 'Tether' },
        },
        {
          hash: '0x456',
          from: '0xghi',
          to: '0xjkl',
          value: '500000',
          valueUsd: 25000,
          timestamp: Date.now() / 1000,
          token: { symbol: 'USDC', address: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48', name: 'USD Coin' },
        },
      ];

      // Mock returns transfers only on first call, empty for subsequent calls
      vi.mocked(mockBlockscout.getTokenTransfers)
        .mockResolvedValueOnce({ items: mockTransfers })
        .mockResolvedValue({ items: [] });

      const result = await whaleDetector.detectWhaleTransactions('1', 10);

      expect(result).toHaveLength(2);
      expect(result[0].valueUsd).toBeGreaterThanOrEqual(100);
      expect(result[0]).toHaveProperty('chain');
      expect(result[0]).toHaveProperty('type');
    });

    it('should filter out transactions below threshold', async () => {
      const mockTransfers = [
        {
          hash: '0x123',
          from: '0xabc',
          to: '0xdef',
          value: '1000',
          valueUsd: 50,
          timestamp: Date.now() / 1000,
          token: { symbol: 'USDT', address: '0xdac17f958d2ee523a2206206994597c13d831ec7', name: 'Tether' },
        },
        {
          hash: '0x456',
          from: '0xghi',
          to: '0xjkl',
          value: '500000',
          valueUsd: 25000,
          timestamp: Date.now() / 1000,
          token: { symbol: 'USDC', address: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48', name: 'USD Coin' },
        },
      ];

      // Mock returns transfers only on first call, empty for subsequent calls
      vi.mocked(mockBlockscout.getTokenTransfers)
        .mockResolvedValueOnce({ items: mockTransfers })
        .mockResolvedValue({ items: [] });

      const result = await whaleDetector.detectWhaleTransactions('1', 10);

      expect(result).toHaveLength(1);
      expect(result[0].hash).toBe('0x456');
    });

    it('should handle empty results', async () => {
      vi.mocked(mockBlockscout.getTokenTransfers).mockResolvedValue({
        items: [],
      });

      const result = await whaleDetector.detectWhaleTransactions('1', 10);

      expect(result).toHaveLength(0);
    });

    it('should limit results to specified limit', async () => {
      const mockTransfers = Array.from({ length: 30 }, (_, i) => ({
        hash: `0x${i}`,
        from: '0xabc',
        to: '0xdef',
        value: '1000000',
        valueUsd: 50000,
        timestamp: Date.now() / 1000 - i,
        token: { symbol: 'USDT', address: '0xdac17f958d2ee523a2206206994597c13d831ec7', name: 'Tether' },
      }));

      // Mock returns transfers only on first call, empty for subsequent calls
      vi.mocked(mockBlockscout.getTokenTransfers)
        .mockResolvedValueOnce({ items: mockTransfers })
        .mockResolvedValue({ items: [] });

      const result = await whaleDetector.detectWhaleTransactions('1', 10);

      expect(result).toHaveLength(10);
    });

    it('should sort by timestamp descending', async () => {
      const now = Date.now() / 1000;
      const mockTransfers = [
        {
          hash: '0x1',
          from: '0xabc',
          to: '0xdef',
          value: '1000000',
          valueUsd: 50000,
          timestamp: now - 100,
          token: { symbol: 'USDT', address: '0xdac17f958d2ee523a2206206994597c13d831ec7', name: 'Tether' },
        },
        {
          hash: '0x2',
          from: '0xghi',
          to: '0xjkl',
          value: '500000',
          valueUsd: 25000,
          timestamp: now - 50,
          token: { symbol: 'USDC', address: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48', name: 'USD Coin' },
        },
      ];

      // Mock returns transfers only on first call, empty for subsequent calls
      vi.mocked(mockBlockscout.getTokenTransfers)
        .mockResolvedValueOnce({ items: mockTransfers })
        .mockResolvedValue({ items: [] });

      const result = await whaleDetector.detectWhaleTransactions('1', 10);

      expect(result[0].hash).toBe('0x2');
      expect(result[1].hash).toBe('0x1');
    });

    it('should handle API errors gracefully', async () => {
      vi.mocked(mockBlockscout.getTokenTransfers).mockRejectedValue(
        new Error('API Error')
      );

      const result = await whaleDetector.detectWhaleTransactions('1', 10);

      expect(result).toHaveLength(0);
    });
  });

  describe('analyzeWhaleTransaction', () => {
    it('should analyze transaction with AI', async () => {
      const mockTransaction = {
        hash: '0x123',
        chain: 'Ethereum',
        chainId: '1',
        from: '0xabc',
        to: '0xdef',
        value: '1000000',
        valueUsd: 50000,
        timestamp: Date.now() / 1000,
        type: 'transfer' as const,
        token: { symbol: 'USDT', address: '0xdac17f958d2ee523a2206206994597c13d831ec7', name: 'Tether' },
      };

      vi.mocked(mockBlockscout.transactionSummary).mockResolvedValue(
        'Large USDT transfer'
      );
      vi.mocked(mockAI.analyzeTransaction).mockResolvedValue(
        'This appears to be a whale accumulation pattern'
      );

      const result = await whaleDetector.analyzeWhaleTransaction(mockTransaction);

      expect(result.aiAnalysis).toBe('This appears to be a whale accumulation pattern');
      expect(mockBlockscout.transactionSummary).toHaveBeenCalledWith('1', '0x123');
      expect(mockAI.analyzeTransaction).toHaveBeenCalled();
    });

    it('should handle analysis errors gracefully', async () => {
      const mockTransaction = {
        hash: '0x123',
        chain: 'Ethereum',
        chainId: '1',
        from: '0xabc',
        to: '0xdef',
        value: '1000000',
        valueUsd: 50000,
        timestamp: Date.now() / 1000,
        type: 'transfer' as const,
        token: { symbol: 'USDT', address: '0xdac17f958d2ee523a2206206994597c13d831ec7', name: 'Tether' },
      };

      vi.mocked(mockBlockscout.transactionSummary).mockRejectedValue(
        new Error('API Error')
      );

      const result = await whaleDetector.analyzeWhaleTransaction(mockTransaction);

      expect(result).toEqual(mockTransaction);
      expect(result.aiAnalysis).toBeUndefined();
    });
  });

  describe('isWhaleTransaction', () => {
    it('should return true for values above threshold', () => {
      expect(whaleDetector.isWhaleTransaction(100)).toBe(true);
      expect(whaleDetector.isWhaleTransaction(1000)).toBe(true);
      expect(whaleDetector.isWhaleTransaction(100000)).toBe(true);
    });

    it('should return false for values below threshold', () => {
      expect(whaleDetector.isWhaleTransaction(99)).toBe(false);
      expect(whaleDetector.isWhaleTransaction(50)).toBe(false);
      expect(whaleDetector.isWhaleTransaction(0)).toBe(false);
    });

    it('should handle edge case at exact threshold', () => {
      expect(whaleDetector.isWhaleTransaction(100)).toBe(true);
    });
  });
});