import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { WhaleDetectionSection } from '@/components/dashboard/wallet/whale-detection-section';

describe('WhaleDetectionSection', () => {
  it('should return null when insights array is empty', () => {
    const { container } = render(<WhaleDetectionSection insights={[]} />);

    expect(container.firstChild).toBeNull();
  });

  it('should return null when first insight does not contain "Whale Category"', () => {
    const insights = ['Some other insight', 'Another insight'];
    const { container } = render(<WhaleDetectionSection insights={insights} />);

    expect(container.firstChild).toBeNull();
  });

  it('should display whale category and score', () => {
    const insights = [
      'Whale Category: Mega Whale (Score: 95)',
      'Other insight',
    ];

    render(<WhaleDetectionSection insights={insights} />);

    expect(screen.getByText('Whale Detection')).toBeInTheDocument();
    expect(screen.getByText('Mega Whale')).toBeInTheDocument();
    expect(screen.getByText('95/100')).toBeInTheDocument();
  });

  it('should handle whale category with parentheses', () => {
    const insights = [
      'Whale Category: Large Holder (Institutional) (Score: 80)',
    ];

    render(<WhaleDetectionSection insights={insights} />);

    expect(screen.getByText('Large Holder')).toBeInTheDocument();
    expect(screen.getByText('80/100')).toBeInTheDocument();
  });

  it('should display "Unknown" when category cannot be parsed', () => {
    const insights = ['Whale Category: (Score: 50)'];

    render(<WhaleDetectionSection insights={insights} />);

    expect(screen.getByText('Unknown')).toBeInTheDocument();
  });

  it('should display "0" when score cannot be parsed', () => {
    const insights = ['Whale Category: Small Whale'];

    render(<WhaleDetectionSection insights={insights} />);

    expect(screen.getByText('0/100')).toBeInTheDocument();
  });

  it('should display whale icon', () => {
    const insights = ['Whale Category: Mega Whale (Score: 95)'];

    const { container } = render(<WhaleDetectionSection insights={insights} />);

    // Check for the Wallet icon (lucide-react renders as svg)
    const icon = container.querySelector('svg');
    expect(icon).toBeInTheDocument();
  });

  it('should have gradient background styling', () => {
    const insights = ['Whale Category: Mega Whale (Score: 95)'];

    const { container } = render(<WhaleDetectionSection insights={insights} />);

    const mainDiv = container.firstChild as HTMLElement;
    expect(mainDiv).toHaveClass('bg-gradient-to-br');
    expect(mainDiv).toHaveClass('from-blue-500/10');
    expect(mainDiv).toHaveClass('to-purple-500/10');
  });

  it('should handle various score formats', () => {
    const testCases = [
      { insight: 'Whale Category: Test (Score: 100)', expected: '100/100' },
      { insight: 'Whale Category: Test (Score: 0)', expected: '0/100' },
      { insight: 'Whale Category: Test (Score: 42)', expected: '42/100' },
    ];

    testCases.forEach(({ insight, expected }) => {
      const { unmount } = render(
        <WhaleDetectionSection insights={[insight]} />
      );
      expect(screen.getByText(expected)).toBeInTheDocument();
      unmount();
    });
  });
});
