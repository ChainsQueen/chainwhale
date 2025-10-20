import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { RecentActivitySection } from '@/components/dashboard/wallet/recent-activity-section';

describe('RecentActivitySection', () => {
  const walletAddress = '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb';

  const mockTransactions = [
    {
      hash: '0x123',
      from: '0xSender123',
      to: walletAddress,
      value: '1000000000000000000',
      timestamp: Date.now() - 3600000,
      chainId: '1',
      valueUsd: 2000,
      dataSource: 'mcp' as const,
      token: {
        symbol: 'USDC',
        name: 'USD Coin',
        decimals: '6',
        address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
      },
    },
  ];

  it('should return null when transactions array is empty', () => {
    const { container } = render(
      <RecentActivitySection
        recentTransactions={[]}
        walletAddress={walletAddress}
      />
    );

    expect(container.firstChild).toBeNull();
  });

  it('should display transaction count in description', () => {
    render(
      <RecentActivitySection
        recentTransactions={mockTransactions}
        walletAddress={walletAddress}
      />
    );

    expect(
      screen.getByText('1 token transfers in the last 24 hours')
    ).toBeInTheDocument();
  });

  it('should show incoming badge for incoming transactions', () => {
    render(
      <RecentActivitySection
        recentTransactions={mockTransactions}
        walletAddress={walletAddress}
      />
    );

    expect(screen.getByText('↓ IN')).toBeInTheDocument();
  });

  it('should show outgoing badge for outgoing transactions', () => {
    const outgoingTx = [
      {
        ...mockTransactions[0],
        from: walletAddress,
        to: '0xReceiver456',
      },
    ];

    render(
      <RecentActivitySection
        recentTransactions={outgoingTx}
        walletAddress={walletAddress}
      />
    );

    expect(screen.getByText('↑ OUT')).toBeInTheDocument();
  });

  it('should limit display to 15 transactions', () => {
    const manyTxs = Array.from({ length: 20 }, (_, i) => ({
      ...mockTransactions[0],
      hash: `0x${i}`,
    }));

    const { container } = render(
      <RecentActivitySection
        recentTransactions={manyTxs}
        walletAddress={walletAddress}
      />
    );

    const txElements = container.querySelectorAll('[class*="bg-muted/30"]');
    expect(txElements.length).toBeLessThanOrEqual(15);
  });
});
