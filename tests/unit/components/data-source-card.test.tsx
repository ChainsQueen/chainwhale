// /Users/destiny/Desktop/chainwhale/tests/unit/components/data-source-card.test.tsx

import { describe, it, expect, vi, beforeAll } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DataSourceCard } from '@/components/features/data-source/data-source-card';

// Mock ResizeObserver (required by Radix UI Tooltip)
beforeAll(() => {
  global.ResizeObserver = vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
  }));
});

// Mock framer-motion to avoid animation issues in tests
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => <div {...props}>{children}</div>,
  },
}));

describe('DataSourceCard', () => {
  // Helper function to render component
  const renderCard = (mcpCount: number, httpCount: number, totalCount: number, className?: string) => {
    return render(
      <DataSourceCard
        mcpCount={mcpCount}
        httpCount={httpCount}
        totalCount={totalCount}
        className={className}
      />
    );
  };

  describe('MCP Card (when mcpCount > 0)', () => {
    it('renders MCP card with all expected content', () => {
      renderCard(150, 50, 200);

      expect(screen.getByText('Powered by Blockscout MCP')).toBeInTheDocument();
      expect(screen.getByText('Live')).toBeInTheDocument();
      expect(screen.getByText('Model Context Protocol • Multi-chain • AI-optimized')).toBeInTheDocument();
      expect(screen.getByText('MCP Data')).toBeInTheDocument();
    });

    it.each([
      { mcpCount: 170, httpCount: 30, totalCount: 200, expected: '85%' },
      { mcpCount: 150, httpCount: 50, totalCount: 200, expected: '75%' },
      { mcpCount: 200, httpCount: 0, totalCount: 200, expected: '100%' },
      { mcpCount: 75, httpCount: 25, totalCount: 100, expected: '75%' },
      { mcpCount: 167, httpCount: 33, totalCount: 200, expected: '84%' }, // Tests rounding
    ])('displays correct percentage: $mcpCount/$totalCount = $expected', ({ mcpCount, httpCount, totalCount, expected }) => {
      renderCard(mcpCount, httpCount, totalCount);
      expect(screen.getByText(expected)).toBeInTheDocument();
    });

    it.each([
      { mcpCount: 1500, expected: '1,500' },
      { mcpCount: 150, expected: '150' },
      { mcpCount: 1234567, expected: '1,234,567' },
    ])('displays formatted MCP count: $expected', ({ mcpCount, expected }) => {
      renderCard(mcpCount, 50, mcpCount + 50);
      expect(screen.getByText(expected)).toBeInTheDocument();
    });

    it('renders link to MCP documentation', () => {
      renderCard(100, 50, 150);

      const link = screen.getByRole('link');
      expect(link).toHaveAttribute('href', 'https://docs.blockscout.com/devs/mcp-server');
      expect(link).toHaveAttribute('target', '_blank');
      expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    });

    it('shows tooltip with MCP and HTTP fallback info on hover', async () => {
      const user = userEvent.setup();
      renderCard(150, 50, 200);

      const badge = screen.getByText('150');
      await user.hover(badge);

      const tooltip = await screen.findByRole('tooltip');
      expect(tooltip).toHaveTextContent(/requests via MCP/i);
      expect(tooltip).toHaveTextContent(/via HTTP fallback/i);
    });
  });

  describe('HTTP Card (when mcpCount === 0)', () => {
    it('renders HTTP card with all expected content', () => {
      renderCard(0, 200, 200);

      expect(screen.getByText('Blockscout REST API')).toBeInTheDocument();
      expect(screen.getByText('Active')).toBeInTheDocument();
      expect(screen.getByText('Direct API access • Multi-chain • Production-ready')).toBeInTheDocument();
      expect(screen.getByText('HTTP Data')).toBeInTheDocument();
      expect(screen.getByText('100%')).toBeInTheDocument();
    });

    it.each([
      { httpCount: 200, expected: '200' },
      { httpCount: 1500, expected: '1,500' },
    ])('displays formatted HTTP count: $expected', ({ httpCount, expected }) => {
      renderCard(0, httpCount, httpCount);
      expect(screen.getByText(expected)).toBeInTheDocument();
    });

    it('renders link to Blockscout API documentation', () => {
      renderCard(0, 200, 200);

      const link = screen.getByRole('link');
      expect(link).toHaveAttribute('href', 'https://docs.blockscout.com/');
      expect(link).toHaveAttribute('target', '_blank');
      expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    });

    it('shows tooltip with HTTP request details on hover', async () => {
      const user = userEvent.setup();
      renderCard(0, 200, 200);

      const badge = screen.getByText('200');
      await user.hover(badge);

      const tooltip = await screen.findByRole('tooltip');
      expect(tooltip).toHaveTextContent(/requests via HTTP API/i);
      expect(tooltip).toHaveTextContent(/MCP server not available/i);
    });

    it('does not show MCP-related content', () => {
      renderCard(0, 200, 200);

      expect(screen.queryByText('Powered by Blockscout MCP')).not.toBeInTheDocument();
      expect(screen.queryByText('Model Context Protocol')).not.toBeInTheDocument();
      expect(screen.queryByText('Live')).not.toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it.each([
      { mcpCount: 0, httpCount: 0, totalCount: 0, description: 'zero total count' },
      { mcpCount: 1, httpCount: 0, totalCount: 1, description: 'single request' },
    ])('handles $description gracefully', ({ mcpCount, httpCount, totalCount }) => {
      renderCard(mcpCount, httpCount, totalCount);
      // Should render without errors
      expect(screen.getByText(mcpCount > 0 ? 'Powered by Blockscout MCP' : 'Blockscout REST API')).toBeInTheDocument();
    });

    it('applies custom className when provided', () => {
      const { container } = renderCard(100, 50, 150, 'custom-class');
      const wrapper = container.firstChild;
      expect(wrapper).toHaveClass('custom-class');
    });
  });

  describe('Conditional Rendering', () => {
    it('switches from HTTP to MCP card when MCP becomes available', () => {
      const { rerender } = renderCard(0, 100, 100);

      expect(screen.getByText('Blockscout REST API')).toBeInTheDocument();

      rerender(
        <DataSourceCard
          mcpCount={50}
          httpCount={50}
          totalCount={100}
        />
      );

      expect(screen.getByText('Powered by Blockscout MCP')).toBeInTheDocument();
      expect(screen.queryByText('Blockscout REST API')).not.toBeInTheDocument();
    });

    it('shows MCP card even with minimal MCP count', () => {
      renderCard(1, 999, 1000);

      // Should show MCP card because mcpCount > 0
      expect(screen.getByText('Powered by Blockscout MCP')).toBeInTheDocument();
      expect(screen.getByText('0%')).toBeInTheDocument(); // 1/1000 rounds to 0%
    });
  });

  describe('Accessibility', () => {
    it('has accessible link with proper attributes', () => {
      renderCard(100, 50, 150);

      const link = screen.getByRole('link');
      expect(link).toBeInTheDocument();
      expect(link).toHaveAttribute('target', '_blank');
      expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    });

    it('has proper semantic structure with heading', () => {
      renderCard(100, 50, 150);

      const heading = screen.getByRole('heading', { level: 3 });
      expect(heading).toHaveTextContent('Powered by Blockscout MCP');
    });

    it('provides tooltip information for screen readers', async () => {
      const user = userEvent.setup();
      renderCard(150, 50, 200);

      const badge = screen.getByText('150');
      await user.hover(badge);

      const tooltip = await screen.findByRole('tooltip');
      expect(tooltip).toHaveTextContent(/requests via MCP/i);
    });
  });

  describe('Visual States', () => {
    it.each([
      { mcpCount: 100, httpCount: 50, badge: 'Live', cardType: 'MCP' },
      { mcpCount: 0, httpCount: 200, badge: 'Active', cardType: 'HTTP' },
    ])('shows $badge badge for $cardType card', ({ mcpCount, httpCount, badge }) => {
      const { container } = renderCard(mcpCount, httpCount, mcpCount + httpCount);

      // Check for blue gradient styling
      expect(container.innerHTML).toContain('from-blue-500/5');
      expect(container.innerHTML).toContain('via-slate-500/5');

      // Check for correct badge
      expect(screen.getByText(badge)).toBeInTheDocument();
    });
  });
});
