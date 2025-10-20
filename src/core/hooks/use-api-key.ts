import { useState, useEffect } from 'react';

/**
 * Custom hook for managing OpenAI API key in localStorage
 * 
 * Tracks whether an API key is stored and provides methods to manage it.
 * Automatically updates when:
 * - Component mounts
 * - localStorage changes (cross-tab synchronization)
 * - Window regains focus (detects external changes)
 * 
 * Uses 'openai_api_key' as the primary storage key.
 * 
 * @returns Object containing API key state and methods
 * @returns {string} apiKey - The current API key value (empty string if not set)
 * @returns {boolean} hasApiKey - Whether a valid API key exists
 * @returns {function} setApiKey - Function to save an API key
 * @returns {function} removeApiKey - Function to remove the API key
 * 
 * @example
 * function ApiKeyManager() {
 *   const { apiKey, hasApiKey, setApiKey, removeApiKey } = useApiKey();
 *   
 *   return (
 *     <div>
 *       {hasApiKey ? (
 *         <button onClick={removeApiKey}>Remove Key</button>
 *       ) : (
 *         <input onChange={(e) => setApiKey(e.target.value)} />
 *       )}
 *     </div>
 *   );
 * }
 */
export function useApiKey() {
  const [apiKey, setApiKeyState] = useState('');
  const [hasApiKey, setHasApiKey] = useState(false);

  useEffect(() => {
    const checkApiKey = () => {
      const key = localStorage.getItem('openai_api_key') || '';
      setApiKeyState(key);
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

  const setApiKey = (key: string) => {
    localStorage.setItem('openai_api_key', key);
    setApiKeyState(key);
    setHasApiKey(!!key);
  };

  const removeApiKey = () => {
    localStorage.removeItem('openai_api_key');
    setApiKeyState('');
    setHasApiKey(false);
  };

  return { apiKey, hasApiKey, setApiKey, removeApiKey };
}