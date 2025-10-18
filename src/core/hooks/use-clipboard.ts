import { useState } from 'react';

/**
 * Hook to manage clipboard copy functionality
 */
export function useClipboard() {
  const [copiedText, setCopiedText] = useState<string | null>(null);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(text);
    setTimeout(() => setCopiedText(null), 2000);
  };

  return {
    copiedText,
    copyToClipboard,
  };
}