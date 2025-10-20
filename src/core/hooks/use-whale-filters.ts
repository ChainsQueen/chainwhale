import { useState } from 'react';

export interface WhaleFilters {
  selectedChains: string[];
  timeRange: string;
  minValue: number;
  tokenFilter: string;
}

export interface UseWhaleFiltersReturn {
  filters: WhaleFilters;
  toggleChain: (chainId: string) => void;
  setTimeRange: (range: string) => void;
  setMinValue: (value: number) => void;
  setTokenFilter: (token: string) => void;
  resetFilters: () => void;
}

const DEFAULT_FILTERS: WhaleFilters = {
  selectedChains: ['1', '8453', '42161'],
  timeRange: '1h',
  minValue: 100000,
  tokenFilter: '',
};

/**
 * Custom hook for managing whale tracker filter state
 * 
 * @returns Filter state and update functions
 * 
 * @example
 * const { filters, toggleChain, setTimeRange } = useWhaleFilters();
 */
export function useWhaleFilters(): UseWhaleFiltersReturn {
  const [selectedChains, setSelectedChains] = useState<string[]>(DEFAULT_FILTERS.selectedChains);
  const [timeRange, setTimeRangeState] = useState<string>(DEFAULT_FILTERS.timeRange);
  const [minValue, setMinValueState] = useState<number>(DEFAULT_FILTERS.minValue);
  const [tokenFilter, setTokenFilterState] = useState<string>(DEFAULT_FILTERS.tokenFilter);

  const toggleChain = (chainId: string) => {
    setSelectedChains(prev =>
      prev.includes(chainId)
        ? prev.filter(id => id !== chainId)
        : [...prev, chainId]
    );
  };

  const resetFilters = () => {
    setSelectedChains(DEFAULT_FILTERS.selectedChains);
    setTimeRangeState(DEFAULT_FILTERS.timeRange);
    setMinValueState(DEFAULT_FILTERS.minValue);
    setTokenFilterState(DEFAULT_FILTERS.tokenFilter);
  };

  return {
    filters: {
      selectedChains,
      timeRange,
      minValue,
      tokenFilter,
    },
    toggleChain,
    setTimeRange: setTimeRangeState,
    setMinValue: setMinValueState,
    setTokenFilter: setTokenFilterState,
    resetFilters,
  };
}
