import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { WhaleTopLeaderboard } from '@/components/features/whale/whale-top-leaderboard';
import type { WhaleTopWhale } from '@/core/hooks/use-whale-feed';

// Mock clipboard API
Object.assign(navigator, {
  clipboard: {
    writeText: vi.fn(),
  },
});

describe('WhaleTopLeaderboard', () => {
  const mockTopWhales: WhaleTopWhale[] = [
    { address: '0x1234567890abcdef1234567890abcdef12345678', volume: 5000000, count: 10 },
    { address: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd', volume: 3000000, count: 7 },
    { address: '0x9876543210fedcba9876543210fedcba98765432', volume: 2000000, count: 5 },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders nothing when no whales provided', () => {
    const { container } = render(<WhaleTopLeaderboard topWhales={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders leaderboard title', () => {
    render(<WhaleTopLeaderboard topWhales={mockTopWhales} />);
    
    expect(screen.getByText(/Top 3 Whales by Volume/i)).toBeInTheDocument();
    expect(screen.getByText(/Most active addresses by total transfer volume/i)).toBeInTheDocument();
  });

  it('renders all three whales', () => {
    render(<WhaleTopLeaderboard topWhales={mockTopWhales} />);

    expect(screen.getByText('🥇 #1')).toBeInTheDocument();
    expect(screen.getByText('🥈 #2')).toBeInTheDocument();
    expect(screen.getByText('🥉 #3')).toBeInTheDocument();
  });

  it('displays whale addresses', () => {
    render(<WhaleTopLeaderboard topWhales={mockTopWhales} />);

    mockTopWhales.forEach(whale => {
      expect(screen.getAllByText(whale.address).length).toBeGreaterThan(0);
    });
  });

  it('displays whale volumes correctly', () => {
    render(<WhaleTopLeaderboard topWhales={mockTopWhales} />);

    expect(screen.getByText('$5.00M')).toBeInTheDocument();
    expect(screen.getByText('$3.00M')).toBeInTheDocument();
    expect(screen.getByText('$2.00M')).toBeInTheDocument();
  });

  it('displays transfer counts', () => {
    render(<WhaleTopLeaderboard topWhales={mockTopWhales} />);

    expect(screen.getByText('10 transfers')).toBeInTheDocument();
    expect(screen.getByText('7 transfers')).toBeInTheDocument();
    expect(screen.getByText('5 transfers')).toBeInTheDocument();
  });

  it('handles singular transfer count', () => {
    const singleTransferWhale: WhaleTopWhale[] = [
      { address: '0x123', volume: 1000000, count: 1 },
    ];

    render(<WhaleTopLeaderboard topWhales={singleTransferWhale} />);
    expect(screen.getByText('1 transfer')).toBeInTheDocument();
  });

  it('copies address to clipboard on button click', async () => {
    render(<WhaleTopLeaderboard topWhales={mockTopWhales} />);

    const copyButtons = screen.getAllByTitle('Copy address');
    fireEvent.click(copyButtons[0]);

    await waitFor(() => {
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(mockTopWhales[0].address);
    });
  });

  it('shows check icon after copying', async () => {
    render(<WhaleTopLeaderboard topWhales={mockTopWhales} />);

    const copyButtons = screen.getAllByTitle('Copy address');
    fireEvent.click(copyButtons[0]);

    // Wait for the check icon to appear (it has text-green-500 class)
    await waitFor(
      () => {
        const button = screen.getAllByTitle('Copy address')[0];
        const checkIcon = button.querySelector('.text-green-500');
        expect(checkIcon).toBeInTheDocument();
      },
      { timeout: 200 }
    );
  });

  it('limits display to 3 whales', () => {
    const manyWhales: WhaleTopWhale[] = [
      ...mockTopWhales,
      { address: '0x4th', volume: 1000000, count: 3 },
      { address: '0x5th', volume: 500000, count: 2 },
    ];

    render(<WhaleTopLeaderboard topWhales={manyWhales} />);

    expect(screen.getByText('🥇 #1')).toBeInTheDocument();
    expect(screen.getByText('🥈 #2')).toBeInTheDocument();
    expect(screen.getByText('🥉 #3')).toBeInTheDocument();
    expect(screen.queryByText('0x4th')).not.toBeInTheDocument();
  });

  it('applies correct rank colors', () => {
    render(<WhaleTopLeaderboard topWhales={mockTopWhales} />);

    const goldBadge = screen.getByText('🥇 #1').closest('.bg-gradient-to-r');
    const silverBadge = screen.getByText('🥈 #2').closest('.bg-gradient-to-r');
    const bronzeBadge = screen.getByText('🥉 #3').closest('.bg-gradient-to-r');

    expect(goldBadge).toHaveClass('from-yellow-500');
    expect(silverBadge).toHaveClass('from-gray-400');
    expect(bronzeBadge).toHaveClass('from-orange-600');
  });

  it('handles clipboard fallback for older browsers', async () => {
    // Remove clipboard API temporarily
    const originalClipboard = navigator.clipboard;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (navigator as any).clipboard = undefined;

    // Mock document.execCommand
    document.execCommand = vi.fn();

    render(<WhaleTopLeaderboard topWhales={mockTopWhales} />);

    const copyButtons = screen.getAllByTitle('Copy address');
    fireEvent.click(copyButtons[0]);

    await waitFor(() => {
      expect(document.execCommand).toHaveBeenCalledWith('copy');
    });

    // Restore clipboard
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (navigator as any).clipboard = originalClipboard;
  });
});