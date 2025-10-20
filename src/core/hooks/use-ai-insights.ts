import { useState } from 'react';

/**
 * Return type for useAiInsights hook
 */
interface UseAiInsightsReturn {
  /** Generated AI insights text */
  aiInsights: string | null;
  /** Whether insights are currently being generated */
  isGenerating: boolean;
  /** Error message if generation failed */
  error: string;
  /** Function to generate AI insights from wallet data */
  generateInsights: (params: {
    address: string;
    holdings: Array<{ symbol: string; balance: string; value: number; chain: string; address: string }>;
    recentTransactions: Array<Record<string, unknown>>;
    totalValue: number;
    chains: Record<string, number>;
  }) => Promise<{ riskScore?: number; summary?: string }>;
}

/**
 * Custom hook for generating AI-powered wallet insights
 * 
 * Manages the complete lifecycle of AI insight generation including:
 * - API request state (loading, error, success)
 * - OpenAI API key retrieval from localStorage
 * - Wallet data analysis via AI endpoint
 * - Risk score and summary extraction
 * 
 * Requires OpenAI API key to be stored in localStorage under 'openai_api_key'.
 * 
 * @returns Object containing AI insights state and generation function
 * @returns {string | null} aiInsights - Generated insights text (null if not generated)
 * @returns {boolean} isGenerating - Whether AI is currently generating insights
 * @returns {string} error - Error message if generation failed
 * @returns {function} generateInsights - Async function to generate insights from wallet data
 * 
 * @example
 * function WalletInsights({ walletData }) {
 *   const { aiInsights, isGenerating, error, generateInsights } = useAiInsights();
 *   
 *   const handleGenerate = async () => {
 *     try {
 *       const result = await generateInsights({
 *         address: '0x123...',
 *         holdings: walletData.holdings,
 *         recentTransactions: walletData.transactions,
 *         totalValue: 50000,
 *         chains: { '1': 30000, '8453': 20000 }
 *       });
 *       console.log('Risk score:', result.riskScore);
 *     } catch (err) {
 *       console.error('Failed to generate insights');
 *     }
 *   };
 *   
 *   return (
 *     <div>
 *       <button onClick={handleGenerate} disabled={isGenerating}>
 *         {isGenerating ? 'Generating...' : 'Generate Insights'}
 *       </button>
 *       {error && <p className="error">{error}</p>}
 *       {aiInsights && <p>{aiInsights}</p>}
 *     </div>
 *   );
 * }
 */
export function useAiInsights(): UseAiInsightsReturn {
  const [aiInsights, setAiInsights] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState('');

  const generateInsights = async (params: {
    address: string;
    holdings: Array<{ symbol: string; balance: string; value: number; chain: string; address: string }>;
    recentTransactions: Array<Record<string, unknown>>;
    totalValue: number;
    chains: Record<string, number>;
  }) => {
    setIsGenerating(true);
    setError('');

    const userApiKey = localStorage.getItem('openai_api_key');

    try {
      const response = await fetch('/api/analyze-wallet-ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...params, apiKey: userApiKey }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate AI insights');
      }

      const data = await response.json();
      setAiInsights(data.insights);
      
      return {
        riskScore: data.riskScore,
        summary: data.summary,
      };
    } catch (err) {
      setError('Failed to generate AI insights. Make sure OpenAI API key is configured.');
      console.error('AI generation error:', err);
      throw err;
    } finally {
      setIsGenerating(false);
    }
  };

  return {
    aiInsights,
    isGenerating,
    error,
    generateInsights,
  };
}