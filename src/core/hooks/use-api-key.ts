import { useState, useEffect } from 'react';

/**
 * Hook to manage API key state from localStorage
 * Listens for storage changes across tabs/components
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