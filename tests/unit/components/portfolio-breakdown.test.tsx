import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PortfolioBreakdown } from '@/components/dashboard/wallet-overview-section';
import type { TokenHolding } from '@/lib/shared/types';

describe('PortfolioBreakdown', () => {
  const mockEthHoldings: TokenHolding[] = [
    {
      symbol: 'ETH',
      balance: '10.5',
      value: 21000,
      chain: '1',
      address: 'native',
    },
  ];

  const mockTokenHoldings: TokenHolding[] = [
    {
      symbol: 'USDC',
      balance: '5000',
      value: 5000,
      chain: '1',
      address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
    },
    {
      symbol: 'USDT',
      balance: '3000',
      value: 3000,
      chain: '1',
      address: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
    },
  ];

  const mockMixedHoldings: TokenHolding[] = [
    ...mockEthHoldings,
    ...mockTokenHoldings,
  ];

  it('should return null when holdings array is empty', () => {
    const { container } = render(
      <PortfolioBreakdown holdings={[]} totalValue={0} chainCount={0} />
    );

    expect(container.firstChild).toBeNull();
  });

  it('should display ETH balance and value', () => {
    render(
      <PortfolioBreakdown
        holdings={mockEthHoldings}
        totalValue={21000}
        chainCount={1}
      />
    );

    expect(screen.getByText('ETH BALANCE')).toBeInTheDocument();
    expect(screen.getByText('ETH VALUE')).toBeInTheDocument();
    // Check for ETH balance - there are two instances (balance and value)
    const ethTexts = screen.getAllByText(/10\.50 ETH/);
    expect(ethTexts.length).toBe(2);
  });

  it('should display token holdings count and value', () => {
    render(
      <PortfolioBreakdown
        holdings={mockTokenHoldings}
        totalValue={8000}
        chainCount={1}
      />
    );

    expect(screen.getByText('TOKEN HOLDINGS')).toBeInTheDocument();
    expect(screen.getByText(/2 Tokens/)).toBeInTheDocument();
  });

  it('should display multichain info with correct chain count', () => {
    render(
      <PortfolioBreakdown
        holdings={mockMixedHoldings}
        totalValue={29000}
        chainCount={3}
      />
    );

    expect(screen.getByText('MULTICHAIN INFO')).toBeInTheDocument();
    expect(screen.getByText(/3 chains scanned/)).toBeInTheDocument();
  });

  it('should show singular "chain" for single chain', () => {
    render(
      <PortfolioBreakdown
        holdings={mockMixedHoldings}
        totalValue={29000}
        chainCount={1}
      />
    );

    expect(screen.getByText(/1 chain scanned/)).toBeInTheDocument();
  });

  it('should show singular "Token" for single token', () => {
    const singleToken: TokenHolding[] = [mockTokenHoldings[0]];

    render(
      <PortfolioBreakdown
        holdings={singleToken}
        totalValue={5000}
        chainCount={1}
      />
    );

    expect(screen.getByText(/1 Token/)).toBeInTheDocument();
  });

  it('should not display ETH sections when no ETH holdings', () => {
    render(
      <PortfolioBreakdown
        holdings={mockTokenHoldings}
        totalValue={8000}
        chainCount={1}
      />
    );

    expect(screen.queryByText('ETH BALANCE')).not.toBeInTheDocument();
    expect(screen.queryByText('ETH VALUE')).not.toBeInTheDocument();
  });

  it('should format USD values correctly', () => {
    render(
      <PortfolioBreakdown
        holdings={mockMixedHoldings}
        totalValue={29000}
        chainCount={1}
      />
    );

    expect(screen.getByText(/\$29,000/)).toBeInTheDocument();
  });
});
