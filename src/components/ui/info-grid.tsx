import { ReactNode } from 'react';

interface InfoGridItem {
  label: string;
  value: ReactNode;
  colSpan?: 1 | 2;
}

interface InfoGridProps {
  title?: string;
  items: InfoGridItem[];
  columns?: 1 | 2;
  className?: string;
}

/**
 * Reusable grid component for displaying key-value information
 * 
 * @example
 * <InfoGrid
 *   title="Token Information"
 *   items={[
 *     { label: 'Name', value: 'USD Coin' },
 *     { label: 'Symbol', value: 'USDC' },
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
            <span className="text-muted-foreground">{item.label}:</span>
            <div className="font-medium">{item.value}</div>
          </div>
        ))}
      </div>
    </div>
  );
}