import { ArrowRight } from 'lucide-react';

/**
 * Props for AddressFlow component
 */
interface AddressFlowProps {
  /** Source wallet address */
  from: string;
  /** Destination wallet address */
  to: string;
  /** Display size variant */
  size?: 'sm' | 'md';
  /** Additional CSS classes */
  className?: string;
}

/**
 * Displays transaction flow between two addresses with visual arrow
 * 
 * Shows "from → to" pattern with:
 * - Monospace font for addresses
 * - Muted background for readability
 * - Arrow icon separator
 * - Responsive sizing (sm/md)
 * - Word wrapping for long addresses
 * 
 * Perfect for displaying token transfers, transactions, and wallet interactions.
 * 
 * @component
 * 
 * @example
 * // Standard transfer display
 * <AddressFlow
 *   from="0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb"
 *   to="0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045"
 * />
 * 
 * @example
 * // Small size for compact layouts
 * <AddressFlow
 *   from="0x123..."
 *   to="0x456..."
 *   size="sm"
 * />
 */
export function AddressFlow({ from, to, size = 'md', className }: AddressFlowProps) {
  const textSize = size === 'sm' ? 'text-[10px]' : 'text-xs';
  const padding = size === 'sm' ? 'px-1.5 py-0.5' : 'px-2 py-1';
  
  return (
    <div className={`flex items-center gap-1.5 sm:gap-2 text-sm flex-wrap ${className}`}>
      <code className={`${padding} bg-muted rounded ${textSize} font-mono break-all`}>
        {from}
      </code>
      <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4 text-muted-foreground shrink-0" />
      <code className={`${padding} bg-muted rounded ${textSize} font-mono break-all`}>
        {to}
      </code>
    </div>
  );
}