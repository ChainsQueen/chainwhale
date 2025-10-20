import { useState } from 'react';

/**
 * Custom hook for clipboard copy operations with temporary feedback
 * 
 * Provides clipboard copy functionality with automatic state management.
 * Tracks the last copied text and automatically clears it after 2 seconds,
 * perfect for showing temporary "Copied!" feedback to users.
 * 
 * @returns Object containing clipboard state and copy function
 * @returns {string | null} copiedText - The text that was just copied (null if nothing or expired)
 * @returns {function} copyToClipboard - Function to copy text to clipboard
 * 
 * @example
 * function CopyButton({ text }: { text: string }) {
 *   const { copiedText, copyToClipboard } = useClipboard();
 *   
 *   return (
 *     <button onClick={() => copyToClipboard(text)}>
 *       {copiedText === text ? 'Copied!' : 'Copy'}
 *     </button>
 *   );
 * }
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