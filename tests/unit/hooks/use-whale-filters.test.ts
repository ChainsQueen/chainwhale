import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useWhaleFilters } from '@/core/hooks/use-whale-filters';

describe('useWhaleFilters', () => {
  it('initializes with default filter values', () => {
    const { result } = renderHook(() => useWhaleFilters());

    expect(result.current.filters).toEqual({
      selectedChains: ['1', '8453', '42161'],
      timeRange: '1h',
      minValue: 100000,
      tokenFilter: '',
    });
  });

  describe('toggleChain', () => {
    it('adds a chain when not selected', () => {
      const { result } = renderHook(() => useWhaleFilters());

      act(() => {
        result.current.toggleChain('10');
      });

      expect(result.current.filters.selectedChains).toContain('10');
      expect(result.current.filters.selectedChains).toHaveLength(4);
    });

    it('removes a chain when already selected', () => {
      const { result } = renderHook(() => useWhaleFilters());

      act(() => {
        result.current.toggleChain('1');
      });

      expect(result.current.filters.selectedChains).not.toContain('1');
      expect(result.current.filters.selectedChains).toHaveLength(2);
    });

    it('handles multiple toggle operations', () => {
      const { result } = renderHook(() => useWhaleFilters());

      act(() => {
        result.current.toggleChain('10');
        result.current.toggleChain('137');
        result.current.toggleChain('1');
      });

      expect(result.current.filters.selectedChains).toEqual(['8453', '42161', '10', '137']);
    });
  });

  describe('setTimeRange', () => {
    it('updates time range', () => {
      const { result } = renderHook(() => useWhaleFilters());

      act(() => {
        result.current.setTimeRange('24h');
      });

      expect(result.current.filters.timeRange).toBe('24h');
    });

    it('handles multiple time range updates', () => {
      const { result } = renderHook(() => useWhaleFilters());

      act(() => {
        result.current.setTimeRange('6h');
      });
      expect(result.current.filters.timeRange).toBe('6h');

      act(() => {
        result.current.setTimeRange('7d');
      });
      expect(result.current.filters.timeRange).toBe('7d');
    });
  });

  describe('setMinValue', () => {
    it('updates minimum value', () => {
      const { result } = renderHook(() => useWhaleFilters());

      act(() => {
        result.current.setMinValue(500000);
      });

      expect(result.current.filters.minValue).toBe(500000);
    });

    it('handles different min value updates', () => {
      const { result } = renderHook(() => useWhaleFilters());

      act(() => {
        result.current.setMinValue(10000);
      });
      expect(result.current.filters.minValue).toBe(10000);

      act(() => {
        result.current.setMinValue(1000000);
      });
      expect(result.current.filters.minValue).toBe(1000000);
    });
  });

  describe('setTokenFilter', () => {
    it('updates token filter', () => {
      const { result } = renderHook(() => useWhaleFilters());

      act(() => {
        result.current.setTokenFilter('USDC');
      });

      expect(result.current.filters.tokenFilter).toBe('USDC');
    });

    it('clears token filter when set to empty string', () => {
      const { result } = renderHook(() => useWhaleFilters());

      act(() => {
        result.current.setTokenFilter('USDT');
      });
      expect(result.current.filters.tokenFilter).toBe('USDT');

      act(() => {
        result.current.setTokenFilter('');
      });
      expect(result.current.filters.tokenFilter).toBe('');
    });
  });

  describe('resetFilters', () => {
    it('resets all filters to default values', () => {
      const { result } = renderHook(() => useWhaleFilters());

      // Change all filters
      act(() => {
        result.current.toggleChain('10');
        result.current.setTimeRange('24h');
        result.current.setMinValue(500000);
        result.current.setTokenFilter('USDC');
      });

      // Verify changes
      expect(result.current.filters.selectedChains).toContain('10');
      expect(result.current.filters.timeRange).toBe('24h');
      expect(result.current.filters.minValue).toBe(500000);
      expect(result.current.filters.tokenFilter).toBe('USDC');

      // Reset
      act(() => {
        result.current.resetFilters();
      });

      // Verify reset to defaults
      expect(result.current.filters).toEqual({
        selectedChains: ['1', '8453', '42161'],
        timeRange: '1h',
        minValue: 100000,
        tokenFilter: '',
      });
    });
  });

  describe('combined operations', () => {
    it('handles multiple filter changes correctly', () => {
      const { result } = renderHook(() => useWhaleFilters());

      act(() => {
        result.current.toggleChain('137');
        result.current.setTimeRange('6h');
        result.current.setMinValue(1000000);
        result.current.setTokenFilter('WETH');
      });

      expect(result.current.filters).toEqual({
        selectedChains: ['1', '8453', '42161', '137'],
        timeRange: '6h',
        minValue: 1000000,
        tokenFilter: 'WETH',
      });
    });
  });
});