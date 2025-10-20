import { ExternalLink } from 'lucide-react';

/**
 * Props for ExplorerLink component
 */
interface ExplorerLinkProps {
  /** URL to blockchain explorer */
  href?: string;
  /** Disable the link (shows grayed out icon) */
  disabled?: boolean;
  /** Icon size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Additional CSS classes */
  className?: string;
  /** Accessibility label for screen readers */
  ariaLabel?: string;
}

/**
 * External link icon for blockchain explorer with smart disabled state
 * 
 * Features:
 * - Opens in new tab with security attributes (noopener noreferrer)
 * - Automatically disables if href is missing or '#'
 * - Visual feedback: hover opacity change when enabled
 * - Accessible: proper ARIA labels and keyboard navigation
 * - Three size variants (sm/md/lg)
 * 
 * Disabled state:
 * - Grayed out with reduced opacity
 * - Cursor changes to not-allowed
 * - Click events prevented
 * 
 * @component
 * 
 * @example
 * // Active link to transaction
 * <ExplorerLink href="https://etherscan.io/tx/0x123..." />
 * 
 * @example
 * // Small size with custom label
 * <ExplorerLink
 *   href="https://basescan.org/address/0xabc..."
 *   size="sm"
 *   ariaLabel="View contract on BaseScan"
 * />
 * 
 * @example
 * // Disabled state
 * <ExplorerLink disabled={true} />
 */
export function ExplorerLink({ 
  href, 
  disabled, 
  size = 'md', 
  className,
  ariaLabel = 'View on explorer'
}: ExplorerLinkProps) {
  const sizeClasses = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5'
  };

  const isDisabled = disabled || !href || href === '#';

  return (
    <a
      href={isDisabled ? '#' : href}
      target={isDisabled ? '_self' : '_blank'}
      rel="noopener noreferrer"
      aria-label={ariaLabel}
      className={`${
        isDisabled
          ? 'text-muted-foreground cursor-not-allowed opacity-30'
          : 'text-primary hover:opacity-70 cursor-pointer'
      } transition-opacity ${className}`}
      onClick={(e) => {
        if (isDisabled) e.preventDefault();
      }}
    >
      <ExternalLink className={sizeClasses[size]} />
    </a>
  );
}