import { useState, useEffect } from 'react';
import type { WhaleTransfer, WhaleStats } from '@/core/services/whale-service';
import type { WhaleTopWhale, DataSourceStats } from './use-whale-feed';

export interface UseWhaleAIReturn {
  aiInsights: string | null;
  isGenerating: boolean;
  hasApiKey: boolean;
  generateInsights: (params: GenerateInsightsParams) => Promise<void>;
  clearInsights: () => void;
}

export interface GenerateInsightsParams {
  transfers: WhaleTransfer[];
  stats: WhaleStats | null;
  topWhales: WhaleTopWhale[];
  timeRange: string;
  selectedChains: string[];
  minValue: number;
  tokenFilter: string;
  dataSourceStats: DataSourceStats | null;
}

/**
 * Custom hook for managing AI insights generation
 * 
 * @returns AI insights state and generation function
 * 
 * @example
 * const { aiInsights, isGenerating, generateInsights } = useWhaleAI();
 * await generateInsights({ transfers, stats, topWhales, ... });
 */
export function useWhaleAI(): UseWhaleAIReturn {
  const [aiInsights, setAiInsights] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [hasApiKey, setHasApiKey] = useState(false);

  // Check for API key on mount and when storage changes
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

  const generateInsights = async (params: GenerateInsightsParams) => {
    const {
      transfers,
      stats,
      topWhales,
      timeRange,
      selectedChains,
      minValue,
      tokenFilter,
      dataSourceStats,
    } = params;

    if (!transfers.length || isGenerating) return;

    // Check if API key exists
    const userApiKey = localStorage.getItem('ai_api_key') || localStorage.getItem('openai_api_key');
    
    if (!userApiKey) {
      // Redirect to settings page if no API key
      window.location.href = '/dashboard?tab=settings';
      return;
    }

    setIsGenerating(true);

    try {
      const response = await fetch('/api/whale-tracker/analyze-ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transfers: transfers.slice(0, 20), // Send top 20 transfers
          stats,
          topWhales: topWhales.slice(0, 3),
          timeRange,
          selectedChains,
          minValue,
          tokenFilter,
          dataSourceStats,
          apiKey: userApiKey,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate AI insights');
      }

      const data = await response.json();
      setAiInsights(data.insights);
    } catch (err) {
      console.error('AI generation error:', err);
      throw new Error('Failed to generate AI insights. Make sure your API key is configured.');
    } finally {
      setIsGenerating(false);
    }
  };

  const clearInsights = () => {
    setAiInsights(null);
  };

  return {
    aiInsights,
    isGenerating,
    hasApiKey,
    generateInsights,
    clearInsights,
  };
}
