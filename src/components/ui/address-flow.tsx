// File: /Users/destiny/Desktop/chainwhale/src/components/ui/address-flow.tsx
import { ArrowRight } from 'lucide-react';

interface AddressFlowProps {
  from: string;
  to: string;
  size?: 'sm' | 'md';
  className?: string;
}

/**
 * Display address flow with "from → to" pattern
 * 
 * @example
 * <AddressFlow from="0x123..." to="0x456..." size="sm" />
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