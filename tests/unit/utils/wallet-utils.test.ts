import { describe, it, expect } from 'vitest';
import {
  validateAddress,
  getExplorerUrl,
  getChainName,
  formatEthBalance,
  formatUsdValue,
  getRiskColor,
  getRiskLabel,
} from '@/core/utils/wallet-utils';

describe('wallet-utils', () => {
  describe('validateAddress', () => {
    it('should validate correct Ethereum address', () => {
      expect(validateAddress('0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0')).toBe(true);
    });

    it('should validate ENS name', () => {
      expect(validateAddress('vitalik.eth')).toBe(true);
    });

    it('should reject invalid address', () => {
      expect(validateAddress('invalid')).toBe(false);
      expect(validateAddress('0x123')).toBe(false);
    });

    it('should reject empty string', () => {
      expect(validateAddress('')).toBe(false);
    });
  });

  describe('getExplorerUrl', () => {
    it('should return Etherscan URL for Ethereum', () => {
      const url = getExplorerUrl('1', '0x123');
      expect(url).toContain('etherscan.io');
      expect(url).toContain('0x123');
    });

    it('should return Basescan URL for Base', () => {
      const url = getExplorerUrl('8453', '0x123');
      expect(url).toContain('basescan.org');
    });

    it('should return Arbiscan URL for Arbitrum', () => {
      const url = getExplorerUrl('42161', '0x123');
      expect(url).toContain('arbiscan.io');
    });
  });

  describe('getChainName', () => {
    it('should return correct chain names', () => {
      expect(getChainName('1')).toBe('Ethereum');
      expect(getChainName('8453')).toBe('Base');
      expect(getChainName('42161')).toBe('Arbitrum');
      expect(getChainName('10')).toBe('Optimism');
      expect(getChainName('137')).toBe('Polygon');
    });

    it('should return fallback for unknown chain', () => {
      expect(getChainName('999')).toContain('Chain');
    });
  });

  describe('formatEthBalance', () => {
    it('should format ETH balance correctly', () => {
      expect(formatEthBalance('1000000000000000000')).toBe('1.00');
      expect(formatEthBalance('1500000000000000000')).toBe('1.50');
    });

    it('should handle zero balance', () => {
      expect(formatEthBalance('0')).toBe('0.00');
    });

    it('should handle small balances', () => {
      expect(formatEthBalance('100000000000000')).toBe('0.00');
    });
  });

  describe('formatUsdValue', () => {
    it('should format USD values with commas', () => {
      expect(formatUsdValue(1234.56)).toBe('$1,234.56');
      expect(formatUsdValue(1000000)).toBe('$1,000,000.00');
    });

    it('should handle zero', () => {
      expect(formatUsdValue(0)).toBe('$0.00');
    });

    it('should format compact notation for large numbers', () => {
      const result = formatUsdValue(1500000, { compact: true });
      expect(result).toMatch(/\$1\.5M/);
    });
  });

  describe('getRiskColor', () => {
    it('should return green for low risk', () => {
      expect(getRiskColor(2)).toContain('green');
    });

    it('should return yellow for medium risk', () => {
      expect(getRiskColor(5)).toContain('yellow');
    });

    it('should return red for high risk', () => {
      expect(getRiskColor(8)).toContain('red');
    });
  });

  describe('getRiskLabel', () => {
    it('should return correct risk labels', () => {
      expect(getRiskLabel(2)).toBe('Low');
      expect(getRiskLabel(5)).toBe('Medium');
      expect(getRiskLabel(8)).toBe('High');
    });
  });
});