// File: /Users/destiny/Desktop/chainwhale/src/components/ui/value-display.tsx
interface ValueDisplayProps {
  value?: number;
  size?: 'sm' | 'md' | 'lg';
  showNA?: boolean;
  className?: string;
}

/**
 * Display formatted USD values with color coding based on amount
 * 
 * @example
 * <ValueDisplay value={1500000} size="lg" />
 */
export function ValueDisplay({ value, size = 'md', showNA = true, className }: ValueDisplayProps) {
  const formatValue = (val: number) => {
    if (val >= 1000000) return `$${(val / 1000000).toFixed(2)}M`;
    if (val >= 1000) return `$${val.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
    return `$${val.toFixed(2)}`;
  };

  const getValueColor = (val?: number) => {
    if (!val) return 'text-muted-foreground';
    if (val >= 1000000) return 'text-green-600 dark:text-green-400';
    if (val >= 500000) return 'text-orange-600 dark:text-orange-400';
    return 'text-blue-600 dark:text-blue-400';
  };

  const sizeClasses = {
    sm: 'text-sm',
    md: 'text-base sm:text-lg',
    lg: 'text-xl sm:text-2xl'
  };

  return (
    <p className={`${sizeClasses[size]} font-bold ${getValueColor(value)} ${className}`}>
      {value ? formatValue(value) : (showNA ? 'N/A' : null)}
    </p>
  );
}