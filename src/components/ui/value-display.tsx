/**
 * Props for ValueDisplay component
 */
interface ValueDisplayProps {
  /** USD value to display */
  value?: number;
  /** Text size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Whether to show 'N/A' when value is undefined */
  showNA?: boolean;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Displays formatted USD values with color-coded styling based on amount
 * 
 * Features:
 * - **Formatting**: Compact notation for large values (e.g., $1.5M)
 * - **Color coding**:
 *   - Green: >= $1M (mega whale)
 *   - Orange: >= $500K (large whale)
 *   - Blue: < $500K (medium whale)
 *   - Gray: No value
 * - **Responsive sizing**: Three size variants (sm/md/lg)
 * - **Fallback**: Shows 'N/A' for undefined values (configurable)
 * 
 * @component
 * 
 * @example
 * // Large whale transfer (green)
 * <ValueDisplay value={1500000} size="lg" />
 * 
 * @example
 * // Medium transfer (blue)
 * <ValueDisplay value={250000} size="md" />
 * 
 * @example
 * // No value with custom behavior
 * <ValueDisplay value={undefined} showNA={false} />
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