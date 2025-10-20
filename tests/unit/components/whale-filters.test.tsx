import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { WhaleFiltersComponent } from '@/components/features/whale/whale-filters';
import type { WhaleFilters } from '@/core/hooks/use-whale-filters';

describe('WhaleFiltersComponent', () => {
  const mockFilters: WhaleFilters = {
    selectedChains: ['1', '8453'],
    timeRange: '1h',
    minValue: 100000,
    tokenFilter: '',
  };

  const mockHandlers = {
    onToggleChain: vi.fn(),
    onSetTimeRange: vi.fn(),
    onSetMinValue: vi.fn(),
    onSetTokenFilter: vi.fn(),
    onFilterChange: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders all filter sections', () => {
    render(<WhaleFiltersComponent filters={mockFilters} {...mockHandlers} />);

    expect(screen.getByText('Chains')).toBeInTheDocument();
    expect(screen.getByText('Time Range')).toBeInTheDocument();
    expect(screen.getByText('Minimum Value')).toBeInTheDocument();
    expect(screen.getByText('Token Filter')).toBeInTheDocument();
  });

  it('displays selected chains correctly', () => {
    render(<WhaleFiltersComponent filters={mockFilters} {...mockHandlers} />);

    const ethereumBadge = screen.getByText('Ethereum');
    const baseBadge = screen.getByText('Base');
    
    expect(ethereumBadge).toBeInTheDocument();
    expect(baseBadge).toBeInTheDocument();
  });

  it('calls onToggleChain when chain is clicked', () => {
    render(<WhaleFiltersComponent filters={mockFilters} {...mockHandlers} />);

    const arbitrumBadge = screen.getByText('Arbitrum');
    fireEvent.click(arbitrumBadge);

    expect(mockHandlers.onToggleChain).toHaveBeenCalledWith('42161');
    expect(mockHandlers.onFilterChange).toHaveBeenCalled();
  });

  it('displays selected time range', () => {
    render(<WhaleFiltersComponent filters={mockFilters} {...mockHandlers} />);

    expect(screen.getByText('1 Hour')).toBeInTheDocument();
  });

  it('calls onSetTimeRange when time range is clicked', () => {
    render(<WhaleFiltersComponent filters={mockFilters} {...mockHandlers} />);

    const sixHourBadge = screen.getByText('6 Hours');
    fireEvent.click(sixHourBadge);

    expect(mockHandlers.onSetTimeRange).toHaveBeenCalledWith('6h');
    expect(mockHandlers.onFilterChange).toHaveBeenCalled();
  });

  it('displays all min value options', () => {
    render(<WhaleFiltersComponent filters={mockFilters} {...mockHandlers} />);

    expect(screen.getByText('$10K+')).toBeInTheDocument();
    expect(screen.getByText('$50K+')).toBeInTheDocument();
    expect(screen.getByText('$100K+')).toBeInTheDocument();
    expect(screen.getByText('$500K+')).toBeInTheDocument();
    expect(screen.getByText('$1,000K+')).toBeInTheDocument();
  });

  it('calls onSetMinValue when min value is clicked', () => {
    render(<WhaleFiltersComponent filters={mockFilters} {...mockHandlers} />);

    const minValueBadge = screen.getByText('$500K+');
    fireEvent.click(minValueBadge);

    expect(mockHandlers.onSetMinValue).toHaveBeenCalledWith(500000);
    expect(mockHandlers.onFilterChange).toHaveBeenCalled();
  });

  it('displays token filter options', () => {
    render(<WhaleFiltersComponent filters={mockFilters} {...mockHandlers} />);

    expect(screen.getByText('All Tokens')).toBeInTheDocument();
    expect(screen.getByText('USDC')).toBeInTheDocument();
    expect(screen.getByText('USDT')).toBeInTheDocument();
    expect(screen.getByText('WETH')).toBeInTheDocument();
    expect(screen.getByText('DAI')).toBeInTheDocument();
    expect(screen.getByText('WBTC')).toBeInTheDocument();
  });

  it('calls onSetTokenFilter when token is clicked', () => {
    render(<WhaleFiltersComponent filters={mockFilters} {...mockHandlers} />);

    const usdcBadge = screen.getByText('USDC');
    fireEvent.click(usdcBadge);

    expect(mockHandlers.onSetTokenFilter).toHaveBeenCalledWith('USDC');
    expect(mockHandlers.onFilterChange).toHaveBeenCalled();
  });

  it('highlights selected token filter', () => {
    const filtersWithToken: WhaleFilters = {
      ...mockFilters,
      tokenFilter: 'USDC',
    };

    render(<WhaleFiltersComponent filters={filtersWithToken} {...mockHandlers} />);

    const usdcBadge = screen.getByText('USDC');
    expect(usdcBadge.closest('.cursor-pointer')).toBeInTheDocument();
  });

  it('works without onFilterChange callback', () => {
    const handlersWithoutCallback = {
      ...mockHandlers,
      onFilterChange: undefined,
    };

    render(<WhaleFiltersComponent filters={mockFilters} {...handlersWithoutCallback} />);

    const ethereumBadge = screen.getByText('Ethereum');
    fireEvent.click(ethereumBadge);

    expect(mockHandlers.onToggleChain).toHaveBeenCalled();
  });
});