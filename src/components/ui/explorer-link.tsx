// File: /Users/destiny/Desktop/chainwhale/src/components/ui/explorer-link.tsx
import { ExternalLink } from 'lucide-react';

interface ExplorerLinkProps {
  href?: string;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  ariaLabel?: string;
}

/**
 * External link to blockchain explorer with conditional styling
 * 
 * @example
 * <ExplorerLink href="https://etherscan.io/tx/0x123..." />
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