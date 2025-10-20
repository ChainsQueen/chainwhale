'use client';

import { useState } from 'react';
import { Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * Props for CopyButton component
 */
interface CopyButtonProps {
  /** Text to copy to clipboard */
  text: string;
  /** Button visual variant */
  variant?: 'default' | 'outline' | 'ghost';
  /** Button size variant */
  size?: 'default' | 'sm' | 'lg' | 'icon';
  /** Additional CSS classes */
  className?: string;
  /** Tooltip text on hover */
  title?: string;
}

/**
 * Copy-to-clipboard button with automatic visual feedback
 * 
 * Features:
 * - Copies text to clipboard on click
 * - Icon changes from Copy to Check (green) on success
 * - Automatically reverts to Copy icon after 2 seconds
 * - Supports all button variants and sizes
 * - Accessible with proper title attribute
 * 
 * Perfect for copying addresses, transaction hashes, and other blockchain data.
 * 
 * @component
 * 
 * @example
 * // Icon-only button with outline
 * <CopyButton
 *   text="0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb"
 *   variant="outline"
 *   size="icon"
 * />
 * 
 * @example
 * // Small button with custom title
 * <CopyButton
 *   text="Transaction hash: 0x123..."
 *   size="sm"
 *   title="Copy transaction hash"
 * />
 */
export function CopyButton({ 
  text, 
  variant = 'outline', 
  size = 'icon',
  className,
  title = 'Copy to clipboard'
}: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleCopy}
      title={title}
      className={className}
    >
      {copied ? (
        <Check className="h-4 w-4 text-green-500" />
      ) : (
        <Copy className="h-4 w-4" />
      )}
    </Button>
  );
}