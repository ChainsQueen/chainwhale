import { Badge } from '@/components/ui/badge';

/**
 * Props for ChainBadge component
 */
interface ChainBadgeProps {
  /** Human-readable blockchain name (e.g., 'Ethereum', 'Base') */
  chainName: string;
  /** Chain ID (optional, for future use) */
  chainId?: string;
  /** Badge size variant */
  size?: 'sm' | 'md';
  /** Badge visual variant */
  variant?: 'default' | 'secondary' | 'outline';
  /** Additional CSS classes */
  className?: string;
}

/**
 * Displays a blockchain network badge with consistent styling
 * 
 * Shows the blockchain name in a compact badge format.
 * Supports two sizes (sm/md) and multiple visual variants.
 * 
 * @component
 * 
 * @example
 * // Default medium size
 * <ChainBadge chainName="Ethereum" chainId="1" />
 * 
 * @example
 * // Small size with outline variant
 * <ChainBadge
 *   chainName="Base"
 *   size="sm"
 *   variant="outline"
 * />
 */
export function ChainBadge({ 
  chainName, 
  size = 'md', 
  variant = 'secondary',
  className 
}: ChainBadgeProps) {
  const sizeClasses = size === 'sm' ? 'text-[10px] px-1.5 py-0.5' : 'text-xs px-2 py-1';
  
  return (
    <Badge variant={variant} className={`${sizeClasses} ${className}`}>
      {chainName}
    </Badge>
  );
}