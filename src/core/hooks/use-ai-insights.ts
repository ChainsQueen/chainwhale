import { useState } from 'react';

interface UseAiInsightsReturn {
  aiInsights: string | null;
  isGenerating: boolean;
  error: string;
  generateInsights: (params: {
    address: string;
    holdings: Array<{ symbol: string; balance: string; value: number; chain: string; address: string }>;
    recentTransactions: Array<Record<string, unknown>>;
    totalValue: number;
    chains: Record<string, number>;
  }) => Promise<{ riskScore?: number; summary?: string }>;
}

/**
 * Hook to handle AI insights generation
 * Manages API calls to AI analysis endpoint
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