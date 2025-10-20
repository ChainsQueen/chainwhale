import { useState, useRef } from 'react';

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
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const copyToClipboard = (text: string) => {
    // Clear previous timeout if it exists
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    navigator.clipboard.writeText(text);
    setCopiedText(text);
    timeoutRef.current = setTimeout(() => setCopiedText(null), 2000);
  };

  return {
    copiedText,
    copyToClipboard,
  };
}