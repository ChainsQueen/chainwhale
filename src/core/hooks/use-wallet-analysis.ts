import { useState } from 'react';
import type { WalletAnalysis } from '@/lib/shared/types';

/**
 * Return type for useWalletAnalysis hook
 */
interface UseWalletAnalysisReturn {
  /** Complete wallet analysis data */
  analysis: WalletAnalysis | null;
  /** Formatted token holdings with USD values */
  holdings: Array<{ symbol: string; balance: string; value: number; chain: string; address: string }>;
  /** Resolved ENS name if available */
  ensName: string | undefined;
  /** Recent wallet transactions */
  recentTransactions: Array<Record<string, unknown>>;
  /** Whether analysis is in progress */
  isLoading: boolean;
  /** Error message if analysis failed */
  error: string;
  /** Function to trigger wallet analysis */
  analyzeWallet: (address: string, chains: string[]) => Promise<void>;
}

/**
 * Custom hook for comprehensive multi-chain wallet analysis
 * 
 * Manages the complete wallet analysis workflow including:
 * - Multi-chain balance fetching
 * - Token holdings aggregation
 * - ENS name resolution
 * - Recent transaction history
 * - Loading and error states
 * 
 * Separates business logic from UI components following best practices.
 * 
 * @returns Object containing wallet analysis state and analysis function
 * @returns {WalletAnalysis | null} analysis - Complete wallet analysis data
 * @returns {Array} holdings - Token holdings with symbol, balance, value, chain, address
 * @returns {string | undefined} ensName - Resolved ENS name (e.g., 'vitalik.eth')
 * @returns {Array} recentTransactions - Recent wallet transactions
 * @returns {boolean} isLoading - Whether analysis is currently in progress
 * @returns {string} error - Error message if analysis failed
 * @returns {function} analyzeWallet - Async function to analyze a wallet address
 * 
 * @example
 * function WalletDashboard() {
 *   const {
 *     analysis,
 *     holdings,
 *     ensName,
 *     isLoading,
 *     error,
 *     analyzeWallet
 *   } = useWalletAnalysis();
 *   
 *   const handleAnalyze = async () => {
 *     await analyzeWallet('vitalik.eth', ['1', '8453', '42161']);
 *   };
 *   
 *   return (
 *     <div>
 *       <button onClick={handleAnalyze} disabled={isLoading}>
 *         {isLoading ? 'Analyzing...' : 'Analyze Wallet'}
 *       </button>
 *       {error && <p className="error">{error}</p>}
 *       {ensName && <p>ENS: {ensName}</p>}
 *       {holdings.length > 0 && (
 *         <ul>
 *           {holdings.map(h => (
 *             <li key={h.address}>
 *               {h.symbol}: {h.balance} (${h.value})
 *             </li>
 *           ))}
 *         </ul>
 *       )}
 *     </div>
 *   );
 * }
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