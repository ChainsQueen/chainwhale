import { useState } from 'react';
import type { WalletAnalysis } from '@/lib/shared/types';

interface UseWalletAnalysisReturn {
  analysis: WalletAnalysis | null;
  holdings: Array<{ symbol: string; balance: string; value: number; chain: string; address: string }>;
  ensName: string | undefined;
  recentTransactions: Array<Record<string, unknown>>;
  isLoading: boolean;
  error: string;
  analyzeWallet: (address: string, chains: string[]) => Promise<void>;
}

/**
 * Hook to handle wallet analysis API calls and state management
 * Separates business logic from UI components
 */
export function useWalletAnalysis(): UseWalletAnalysisReturn {
  const [analysis, setAnalysis] = useState<WalletAnalysis | null>(null);
  const [holdings, setHoldings] = useState<Array<{ symbol: string; balance: string; value: number; chain: string; address: string }>>([]);
  const [ensName, setEnsName] = useState<string | undefined>();
  const [recentTransactions, setRecentTransactions] = useState<Array<Record<string, unknown>>>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const analyzeWallet = async (address: string, chains: string[]) => {
    setIsLoading(true);
    setError('');
    setAnalysis(null);

    try {
      const response = await fetch('/api/analyze-wallet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address: address.trim(), chains }),
      });

      if (!response.ok) {
        throw new Error('Failed to analyze wallet');
      }

      const data = await response.json();
      setAnalysis(data.analysis);
      setHoldings(data.holdings || []);
      setEnsName(data.ensName);
      setRecentTransactions(data.recentTransactions || []);
    } catch (err) {
      setError('Failed to analyze wallet. Please check the address and try again.');
      console.error('Wallet analysis error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    analysis,
    holdings,
    ensName,
    recentTransactions,
    isLoading,
    error,
    analyzeWallet,
  };
}