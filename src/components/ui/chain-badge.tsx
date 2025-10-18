// File: /Users/destiny/Desktop/chainwhale/src/components/ui/chain-badge.tsx
import { Badge } from '@/components/ui/badge';

interface ChainBadgeProps {
  chainName: string;
  chainId?: string;
  size?: 'sm' | 'md';
  variant?: 'default' | 'secondary' | 'outline';
  className?: string;
}

/**
 * Display blockchain network badge
 * 
 * @example
 * <ChainBadge chainName="Ethereum" chainId="1" />
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