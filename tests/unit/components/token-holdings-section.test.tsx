import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TokenHoldingsSection } from '@/components/dashboard/wallet/token-holdings-section';
import type { TokenHolding } from '@/lib/shared/types';

describe('TokenHoldingsSection', () => {
  const mockHoldings: TokenHolding[] = [
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
      chain: '8453',
      address: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
    },
  ];

  it('should return null when holdings array is empty', () => {
    const { container } = render(<TokenHoldingsSection holdings={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it('should display token holdings count in title', () => {
    render(<TokenHoldingsSection holdings={mockHoldings} />);
    expect(screen.getByText('Token Holdings (2)')).toBeInTheDocument();
  });

  it('should render token symbols', () => {
    render(<TokenHoldingsSection holdings={mockHoldings} />);
    expect(screen.getByText('USDC')).toBeInTheDocument();
    expect(screen.getByText('USDT')).toBeInTheDocument();
  });

  it('should display token values', () => {
    render(<TokenHoldingsSection holdings={mockHoldings} />);
    expect(screen.getByText('$5,000.00')).toBeInTheDocument();
    expect(screen.getByText('$3,000.00')).toBeInTheDocument();
  });

  it('should display chain names', () => {
    render(<TokenHoldingsSection holdings={mockHoldings} />);
    expect(screen.getByText('Ethereum')).toBeInTheDocument();
    expect(screen.getByText('Base')).toBeInTheDocument();
  });
});
