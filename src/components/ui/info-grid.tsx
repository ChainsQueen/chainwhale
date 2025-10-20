import { ReactNode } from 'react';

/**
 * Single item in the info grid
 */
interface InfoGridItem {
  /** Label text or React component (e.g., 'Name', 'Symbol', or a tooltip) */
  label: ReactNode;
  /** Value content (can be any React node) */
  value: ReactNode;
  /** Number of columns to span (1 or 2) */
  colSpan?: 1 | 2;
}

/**
 * Props for InfoGrid component
 */
interface InfoGridProps {
  /** Optional title displayed above the grid */
  title?: string;
  /** Array of label-value pairs to display */
  items: InfoGridItem[];
  /** Number of columns in the grid */
  columns?: 1 | 2;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Responsive grid layout for displaying key-value information pairs
 * 
 * Features:
 * - Flexible 1 or 2 column layout
 * - Optional title heading
 * - Items can span multiple columns
 * - Consistent label/value styling
 * - Supports any React node as value (text, badges, links, etc.)
 * 
 * Perfect for displaying structured data like token info, contract details,
 * wallet metadata, and transaction information.
 * 
 * @component
 * 
 * @example
 * // Two-column grid with title
 * <InfoGrid
 *   title="Token Information"
 *   items={[
 *     { label: 'Name', value: 'USD Coin' },
 *     { label: 'Symbol', value: 'USDC' },
 *     { label: 'Decimals', value: '6' },
 *     { label: 'Type', value: 'ERC-20' },
 *   ]}
 * />
 * 
 * @example
 * // Single column with full-width item
 * <InfoGrid
 *   columns={1}
 *   items={[
 *     { label: 'Address', value: '0x123...', colSpan: 2 },
 *     { label: 'Balance', value: '$1,234.56' },
 *   ]}
 * />
 */
export function InfoGrid({ title, items, columns = 2, className }: InfoGridProps) {
  return (
    <div className={className}>
      {title && <h4 className="text-sm font-semibold mb-2">{title}</h4>}
      <div className={`grid grid-cols-${columns} gap-2 text-sm`}>
        {items.map((item, index) => (
          <div key={index} className={item.colSpan === 2 ? 'col-span-2' : ''}>
            <span className="text-muted-foreground text-xs">{item.label}</span>
            <div className="font-medium text-foreground">{item.value}</div>
          </div>
        ))}
      </div>
    </div>
  );
}