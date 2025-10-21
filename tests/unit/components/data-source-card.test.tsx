// /Users/destiny/Desktop/chainwhale/tests/unit/components/data-source-card.test.tsx

import { describe, it, expect, vi, beforeAll } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
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
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
}));

describe('DataSourceCard', () => {
  describe('MCP Card (when mcpCount > 0)', () => {
    it('renders MCP card when MCP data is present', () => {
      render(
        <DataSourceCard
          mcpCount={150}
          httpCount={50}
          totalCount={200}
        />
      );

      expect(screen.getByText('Powered by Blockscout MCP')).toBeInTheDocument();
      expect(screen.getByText('Live')).toBeInTheDocument();
      expect(screen.getByText('Model Context Protocol • Multi-chain • AI-optimized')).toBeInTheDocument();
    });

    it('displays correct MCP percentage', () => {
      render(
        <DataSourceCard
          mcpCount={170}
          httpCount={30}
          totalCount={200}
        />
      );

      // 170/200 = 85%
      expect(screen.getByText('85%')).toBeInTheDocument();
    });

    it('displays MCP request count', () => {
      render(
        <DataSourceCard
          mcpCount={1500}
          httpCount={500}
          totalCount={2000}
        />
      );

      expect(screen.getByText('1,500')).toBeInTheDocument();
    });

    it('shows MCP data label', () => {
      render(
        <DataSourceCard
          mcpCount={100}
          httpCount={0}
          totalCount={100}
        />
      );

      expect(screen.getByText('MCP Data')).toBeInTheDocument();
    });

    it('renders link to MCP documentation', () => {
      render(
        <DataSourceCard
          mcpCount={100}
          httpCount={50}
          totalCount={150}
        />
      );

      const link = screen.getByRole('link');
      expect(link).toHaveAttribute('href', 'https://docs.blockscout.com/devs/mcp-server');
      expect(link).toHaveAttribute('target', '_blank');
      expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    });

    it('shows tooltip with MCP request details on hover', async () => {
      const user = userEvent.setup();
      render(
        <DataSourceCard
          mcpCount={150}
          httpCount={50}
          totalCount={200}
        />
      );

      const badge = screen.getByText('150');
      await user.hover(badge);

      const tooltip = await screen.findByRole('tooltip');
      expect(tooltip).toHaveTextContent(/requests via MCP/i);
    });

    it('shows HTTP fallback info in tooltip when both sources present', async () => {
      const user = userEvent.setup();
      render(
        <DataSourceCard
          mcpCount={150}
          httpCount={50}
          totalCount={200}
        />
      );

      const badge = screen.getByText('150');
      await user.hover(badge);

      const tooltip = await screen.findByRole('tooltip');
      expect(tooltip).toHaveTextContent(/via HTTP fallback/i);
    });

    it('handles 100% MCP usage', () => {
      render(
        <DataSourceCard
          mcpCount={200}
          httpCount={0}
          totalCount={200}
        />
      );

      expect(screen.getByText('100%')).toBeInTheDocument();
      expect(screen.getByText('Powered by Blockscout MCP')).toBeInTheDocument();
    });

    it('handles mixed MCP and HTTP usage', () => {
      render(
        <DataSourceCard
          mcpCount={75}
          httpCount={25}
          totalCount={100}
        />
      );

      // 75/100 = 75%
      expect(screen.getByText('75%')).toBeInTheDocument();
    });
  });

  describe('HTTP Card (when mcpCount === 0)', () => {
    it('renders HTTP card when only HTTP data is present', () => {
      render(
        <DataSourceCard
          mcpCount={0}
          httpCount={200}
          totalCount={200}
        />
      );

      expect(screen.getByText('Blockscout REST API')).toBeInTheDocument();
      expect(screen.getByText('Active')).toBeInTheDocument();
      expect(screen.getByText('Direct API access • Multi-chain • Production-ready')).toBeInTheDocument();
    });

    it('displays correct HTTP percentage', () => {
      render(
        <DataSourceCard
          mcpCount={0}
          httpCount={200}
          totalCount={200}
        />
      );

      expect(screen.getByText('100%')).toBeInTheDocument();
    });

    it('displays HTTP request count', () => {
      render(
        <DataSourceCard
          mcpCount={0}
          httpCount={1500}
          totalCount={1500}
        />
      );

      expect(screen.getByText('1,500')).toBeInTheDocument();
    });

    it('shows HTTP data label', () => {
      render(
        <DataSourceCard
          mcpCount={0}
          httpCount={200}
          totalCount={200}
        />
      );

      expect(screen.getByText('HTTP Data')).toBeInTheDocument();
    });

    it('renders link to Blockscout API documentation', () => {
      render(
        <DataSourceCard
          mcpCount={0}
          httpCount={200}
          totalCount={200}
        />
      );

      const link = screen.getByRole('link');
      expect(link).toHaveAttribute('href', 'https://docs.blockscout.com/');
      expect(link).toHaveAttribute('target', '_blank');
      expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    });

    it('shows tooltip with HTTP request details on hover', async () => {
      const user = userEvent.setup();
      render(
        <DataSourceCard
          mcpCount={0}
          httpCount={200}
          totalCount={200}
        />
      );

      const badge = screen.getByText('200');
      await user.hover(badge);

      const tooltip = await screen.findByRole('tooltip');
      expect(tooltip).toHaveTextContent(/requests via HTTP API/i);
      expect(tooltip).toHaveTextContent(/MCP server not available/i);
    });

    it('does not show MCP-related content', () => {
      render(
        <DataSourceCard
          mcpCount={0}
          httpCount={200}
          totalCount={200}
        />
      );

      expect(screen.queryByText('Powered by Blockscout MCP')).not.toBeInTheDocument();
      expect(screen.queryByText('Model Context Protocol')).not.toBeInTheDocument();
      expect(screen.queryByText('Live')).not.toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('handles zero total count gracefully', () => {
      render(
        <DataSourceCard
          mcpCount={0}
          httpCount={0}
          totalCount={0}
        />
      );

      // Should render HTTP card (default when no MCP)
      expect(screen.getByText('Blockscout REST API')).toBeInTheDocument();
    });

    it('handles very large numbers with proper formatting', () => {
      render(
        <DataSourceCard
          mcpCount={1234567}
          httpCount={890123}
          totalCount={2124690}
        />
      );

      expect(screen.getByText('1,234,567')).toBeInTheDocument();
    });

    it('calculates percentage correctly with rounding', () => {
      render(
        <DataSourceCard
          mcpCount={167}
          httpCount={33}
          totalCount={200}
        />
      );

      // 167/200 = 83.5%, should round to 84%
      expect(screen.getByText('84%')).toBeInTheDocument();
    });

    it('handles single request', () => {
      render(
        <DataSourceCard
          mcpCount={1}
          httpCount={0}
          totalCount={1}
        />
      );

      expect(screen.getByText('100%')).toBeInTheDocument();
      expect(screen.getByText('1')).toBeInTheDocument();
    });

    it('applies custom className when provided', () => {
      const { container } = render(
        <DataSourceCard
          mcpCount={100}
          httpCount={50}
          totalCount={150}
          className="custom-class"
        />
      );

      const wrapper = container.firstChild;
      expect(wrapper).toHaveClass('custom-class');
    });
  });

  describe('Conditional Rendering', () => {
    it('switches from HTTP to MCP card when MCP becomes available', () => {
      const { rerender } = render(
        <DataSourceCard
          mcpCount={0}
          httpCount={100}
          totalCount={100}
        />
      );

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
      render(
        <DataSourceCard
          mcpCount={1}
          httpCount={999}
          totalCount={1000}
        />
      );

      // Should show MCP card because mcpCount > 0
      expect(screen.getByText('Powered by Blockscout MCP')).toBeInTheDocument();
      expect(screen.getByText('0%')).toBeInTheDocument(); // 1/1000 rounds to 0%
    });
  });

  describe('Accessibility', () => {
    it('has accessible link with proper attributes', () => {
      render(
        <DataSourceCard
          mcpCount={100}
          httpCount={50}
          totalCount={150}
        />
      );

      const link = screen.getByRole('link');
      expect(link).toBeInTheDocument();
      expect(link).toHaveAttribute('target', '_blank');
      expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    });

    it('has proper semantic structure', () => {
      render(
        <DataSourceCard
          mcpCount={100}
          httpCount={50}
          totalCount={150}
        />
      );

      const heading = screen.getByRole('heading', { level: 3 });
      expect(heading).toHaveTextContent('Powered by Blockscout MCP');
    });

    it('provides tooltip information for screen readers', async () => {
      const user = userEvent.setup();
      render(
        <DataSourceCard
          mcpCount={150}
          httpCount={50}
          totalCount={200}
        />
      );

      const badge = screen.getByText('150');
      await user.hover(badge);

      const tooltip = await screen.findByRole('tooltip');
      expect(tooltip).toHaveTextContent(/requests via MCP/i);
    });
  });

  describe('Visual States', () => {
    it('renders with correct styling for MCP card', () => {
      const { container } = render(
        <DataSourceCard
          mcpCount={100}
          httpCount={50}
          totalCount={150}
        />
      );

      // Check for gradient classes (MCP now uses blue gradient like HTTP)
      expect(container.innerHTML).toContain('from-blue-500/5');
      expect(container.innerHTML).toContain('via-slate-500/5');
    });

    it('renders with correct styling for HTTP card', () => {
      const { container } = render(
        <DataSourceCard
          mcpCount={0}
          httpCount={200}
          totalCount={200}
        />
      );

      // Check for blue gradient classes (HTTP uses blue gradient)
      expect(container.innerHTML).toContain('from-blue-500/5');
      expect(container.innerHTML).toContain('via-slate-500/5');
    });

    it('shows Live badge for MCP', () => {
      render(
        <DataSourceCard
          mcpCount={100}
          httpCount={50}
          totalCount={150}
        />
      );

      const liveBadge = screen.getByText('Live');
      expect(liveBadge).toBeInTheDocument();
    });

    it('shows Active badge for HTTP', () => {
      render(
        <DataSourceCard
          mcpCount={0}
          httpCount={200}
          totalCount={200}
        />
      );

      const activeBadge = screen.getByText('Active');
      expect(activeBadge).toBeInTheDocument();
    });
  });
});
