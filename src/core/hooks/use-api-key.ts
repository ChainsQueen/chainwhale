import { useState, useEffect } from 'react';

/**
 * Custom hook for monitoring OpenAI API key presence in localStorage
 * 
 * Tracks whether an API key is stored and automatically updates when:
 * - Component mounts
 * - localStorage changes (cross-tab synchronization)
 * - Window regains focus (detects external changes)
 * 
 * Checks both 'ai_api_key' and 'openai_api_key' keys for backwards compatibility.
 * 
 * @returns Object containing API key status
 * @returns {boolean} hasApiKey - Whether a valid API key exists in localStorage
 * 
 * @example
 * function ApiKeyStatus() {
 *   const { hasApiKey } = useApiKey();
 *   
 *   return (
 *     <div>
 *       {hasApiKey ? '✓ API Key configured' : '⚠ No API Key'}
 *     </div>
 *   );
 * }
 */
export function useApiKey() {
  const [hasApiKey, setHasApiKey] = useState(false);

  useEffect(() => {
    const checkApiKey = () => {
      const key = localStorage.getItem('ai_api_key') || localStorage.getItem('openai_api_key');
      setHasApiKey(!!key);
    };
    
    checkApiKey();
    window.addEventListener('storage', checkApiKey);
    window.addEventListener('focus', checkApiKey);
    
    return () => {
      window.removeEventListener('storage', checkApiKey);
      window.removeEventListener('focus', checkApiKey);
    };
  }, []);

  return { hasApiKey };
}