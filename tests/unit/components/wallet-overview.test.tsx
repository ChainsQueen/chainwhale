import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { WalletOverview } from '@/components/dashboard/wallet/wallet-overview';

// Mock window.open
const mockOpen = vi.fn();
Object.defineProperty(window, 'open', {
  value: mockOpen,
  writable: true,
});

describe('WalletOverview', () => {
  const mockAddress = '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb';
  const mockEnsName = 'vitalik.eth';

  it('should render address without ENS name', () => {
    render(<WalletOverview address={mockAddress} />);

    expect(screen.getByText('Address')).toBeInTheDocument();
    expect(screen.getByText(mockAddress)).toBeInTheDocument();
    expect(screen.queryByText(mockEnsName)).not.toBeInTheDocument();
  });

  it('should render address with ENS name', () => {
    render(<WalletOverview address={mockAddress} ensName={mockEnsName} />);

    expect(screen.getByText('Address')).toBeInTheDocument();
    expect(screen.getByText(mockEnsName)).toBeInTheDocument();
    expect(screen.getByText(mockAddress)).toBeInTheDocument();
  });

  it('should display copy button', () => {
    render(<WalletOverview address={mockAddress} />);

    const copyButtons = screen.getAllByRole('button');
    expect(copyButtons.length).toBeGreaterThan(0);
  });

  it('should render explorer link button', () => {
    render(<WalletOverview address={mockAddress} />);

    // Verify we have at least 2 buttons (copy + explorer)
    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBeGreaterThanOrEqual(2);
    
    // Verify buttons have icons (SVG elements)
    const buttonsWithIcons = buttons.filter(btn => btn.querySelector('svg'));
    expect(buttonsWithIcons.length).toBeGreaterThanOrEqual(2);
  });

  it('should render address in code format', () => {
    render(<WalletOverview address={mockAddress} />);

    const codeElement = screen.getByText(mockAddress);
    expect(codeElement.tagName).toBe('CODE');
  });

  it('should show ENS name with primary styling', () => {
    render(<WalletOverview address={mockAddress} ensName={mockEnsName} />);

    const ensElement = screen.getByText(mockEnsName);
    expect(ensElement).toHaveClass('text-primary');
  });
});
