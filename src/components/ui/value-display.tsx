/**
 * Props for ValueDisplay component
 */
interface ValueDisplayProps {
  /** USD value to display */
  value?: number;
  /** Token amount (raw value as string) */
  tokenAmount?: string;
  /** Token symbol (e.g., 'LINK', 'USDT') */
  tokenSymbol?: string;
  /** Token decimals for formatting */
  tokenDecimals?: string;
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
 * - **Formatting**: Shows token amount + USD value (Etherscan style)
 * - **Example**: "9,499.57 LINK ($177,071.98)"
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
 * // With token amount (Etherscan style)
 * <ValueDisplay 
 *   value={177071.98} 
 *   tokenAmount="9499570000000000000000" 
 *   tokenSymbol="LINK"
 *   tokenDecimals="18"
 *   size="lg" 
 * />
 * 
 * @example
 * // USD only (legacy)
 * <ValueDisplay value={250000} size="md" />
 */
export function ValueDisplay({ 
  value, 
  tokenAmount, 
  tokenSymbol, 
  tokenDecimals,
  size = 'md', 
  showNA = true, 
  className 
}: ValueDisplayProps) {
  const formatTokenAmount = (amount: string, decimals: string) => {
    try {
      const decimalPlaces = parseInt(decimals);
      const numAmount = parseFloat(amount) / Math.pow(10, decimalPlaces);
      
      // Use compact notation for large amounts (like Etherscan)
      if (numAmount >= 1000000) {
        // Millions: "1.67 M"
        return `${(numAmount / 1000000).toLocaleString(undefined, { 
          minimumFractionDigits: 2, 
          maximumFractionDigits: 2 
        })} M`;
      } else if (numAmount >= 10000) {
        // Large thousands: "999,996.00" (no decimals for large amounts)
        return numAmount.toLocaleString(undefined, { 
          minimumFractionDigits: 0, 
          maximumFractionDigits: 0 
        });
      } else if (numAmount >= 1000) {
        // Thousands: "1,234.56" (2 decimals)
        return numAmount.toLocaleString(undefined, { 
          minimumFractionDigits: 2, 
          maximumFractionDigits: 2 
        });
      } else if (numAmount >= 1) {
        // Regular amounts: "123.45" (2 decimals)
        return numAmount.toLocaleString(undefined, { 
          minimumFractionDigits: 2, 
          maximumFractionDigits: 2 
        });
      } else {
        // Small amounts: "0.123456" (more decimals for precision)
        return numAmount.toLocaleString(undefined, { 
          minimumFractionDigits: 2, 
          maximumFractionDigits: 6 
        });
      }
    } catch {
      return amount;
    }
  };

  const formatUsdValue = (val: number) => {
    return `$${val.toLocaleString(undefined, { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 2 
    })}`;
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

  // If we have token amount and decimals, show Etherscan-style format
  if (tokenAmount && tokenDecimals && tokenSymbol && value) {
    const formattedAmount = formatTokenAmount(tokenAmount, tokenDecimals);
    const formattedUsd = formatUsdValue(value);
    
    return (
      <div className={`${sizeClasses[size]} font-bold ${getValueColor(value)} ${className}`}>
        <div className="text-right">
          <div>{formattedAmount} {tokenSymbol}</div>
          <div className="text-sm text-muted-foreground">({formattedUsd})</div>
        </div>
      </div>
    );
  }

  // Legacy: USD only display
  const formatValue = (val: number) => {
    if (val >= 1000000) return `$${(val / 1000000).toFixed(2)}M`;
    if (val >= 1000) return `$${val.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
    return `$${val.toFixed(2)}`;
  };

  return (
    <p className={`${sizeClasses[size]} font-bold ${getValueColor(value)} ${className}`}>
      {value ? formatValue(value) : (showNA ? 'N/A' : null)}
    </p>
  );
}