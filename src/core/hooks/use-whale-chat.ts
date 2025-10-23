import { useState, useEffect } from 'react';
import type { WhaleTransfer } from '@/core/services/whale-service';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface ContractDetails {
  address: string;
  name: string;
  symbol: string;
  verified: boolean;
  isScam: boolean;
  isProxy: boolean;
  price?: number;
  marketCap?: number;
  holders?: number;
}

export interface DataSourceStats {
  mcp: number;
  http: number;
  total: number;
}

export interface ChatData {
  transfers: WhaleTransfer[];
  contracts: ContractDetails[];
  stats: {
    totalTransfers: number;
    totalVolume: number;
    uniqueTokens: number;
    uniqueWhales: number;
  };
  dataSourceStats: DataSourceStats | null;
  loading: boolean;
  lastUpdated: Date | null;
}

export interface UseChatReturn {
  messages: ChatMessage[];
  chatData: ChatData;
  isLoading: boolean;
  error: string | null;
  sendMessage: (query: string) => Promise<void>;
  refetchData: () => void;
}

/**
 * Custom hook for whale chat with automatic data fetching
 * Follows the same pattern as useWhaleFeed for consistency
 * 
 * @returns Chat state and methods
 * 
 * @example
 * const { messages, chatData, sendMessage } = useWhaleChat();
 */
export function useWhaleChat(): UseChatReturn {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [chatData, setChatData] = useState<ChatData>({
    transfers: [],
    contracts: [],
    stats: {
      totalTransfers: 0,
      totalVolume: 0,
      uniqueTokens: 0,
      uniqueWhales: 0,
    },
    dataSourceStats: null,
    loading: true,
    lastUpdated: null,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch whale data (transactions + contracts) - runs on mount and every 5 minutes
  const fetchChatData = async () => {
    console.log('[Chat Hook] 🚀 Fetching whale data for chat context...');
    
    try {
      setChatData(prev => ({ ...prev, loading: true }));

      // Fetch from whale-tracker/feed API (same as whale tracker)
      const params = new URLSearchParams({
        chains: '1,8453,42161,10,137', // All 5 chains
        timeRange: '24h',
        minValue: '100000', // $100k minimum
      });

      const response = await fetch(`/api/whale-tracker/feed?${params}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch whale data: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('[Chat Hook] ✅ Fetched whale data:', {
        transfers: data.transfers?.length || 0,
        chains: data.metadata?.chains || [],
      });

      // Extract unique token addresses for contract fetching
      const uniqueTokens = new Set<string>();
      data.transfers?.forEach((t: WhaleTransfer) => {
        if (t.token?.address) {
          uniqueTokens.add(t.token.address);
        }
      });

      console.log('[Chat Hook] 📋 Fetching contract details for', uniqueTokens.size, 'unique tokens...');

      // Fetch contract details for all unique tokens
      const contractPromises = Array.from(uniqueTokens).slice(0, 20).map(async (address) => {
        try {
          // Find the chain for this token
          const transfer = data.transfers?.find((t: WhaleTransfer) => 
            t.token?.address?.toLowerCase() === address.toLowerCase()
          );
          const chainId = transfer?.chainId || '1';

          const contractResponse = await fetch(
            `/api/whale-tracker/contract-security?chainId=${chainId}&address=${address}`
          );
          
          if (contractResponse.ok) {
            const contractData = await contractResponse.json();
            return {
              address,
              name: contractData.name || 'Unknown',
              symbol: contractData.symbol || 'Unknown',
              verified: contractData.is_verified || false,
              isScam: contractData.is_scam || false,
              isProxy: contractData.has_proxy || false,
              price: contractData.exchange_rate,
              marketCap: contractData.market_cap,
              holders: contractData.holders_count,
            };
          }
          return null;
        } catch (err) {
          console.warn(`[Chat Hook] Failed to fetch contract ${address}:`, err);
          return null;
        }
      });

      const contracts = (await Promise.all(contractPromises)).filter(Boolean) as ContractDetails[];
      console.log('[Chat Hook] ✅ Fetched', contracts.length, 'contract details');

      // Calculate stats
      const stats = {
        totalTransfers: data.transfers?.length || 0,
        totalVolume: data.stats?.totalVolume || 0,
        uniqueTokens: uniqueTokens.size,
        uniqueWhales: data.stats?.uniqueWhales || 0,
      };

      // Extract data source stats from API response
      const dataSourceStats = data.metadata?.dataSources || null;

      setChatData({
        transfers: data.transfers || [],
        contracts,
        stats,
        dataSourceStats,
        loading: false,
        lastUpdated: new Date(),
      });

      console.log('[Chat Hook] ✅ Chat data ready:', {
        transfers: data.transfers?.length || 0,
        contracts: contracts.length,
        stats,
      });
    } catch (err) {
      console.error('[Chat Hook] ❌ Error fetching chat data:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      setChatData(prev => ({ ...prev, loading: false }));
    }
  };

  // Auto-fetch on mount and every 5 minutes (same as whale tracker)
  useEffect(() => {
    fetchChatData();
    const interval = setInterval(fetchChatData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  // Send message to AI with pre-fetched context
  const sendMessage = async (query: string) => {
    if (!query.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      role: 'user',
      content: query,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);
    setError(null);

    try {
      // Get API key from localStorage
      const apiKey = localStorage.getItem('ai_api_key') || localStorage.getItem('openai_api_key');
      const aiProvider = localStorage.getItem('ai_provider') || 'openai';
      const aiModel = localStorage.getItem('ai_model') || 'gpt-4o-mini';

      console.log('[Chat Hook] 💬 Sending message with context:', {
        query,
        transfersCount: chatData.transfers.length,
        contractsCount: chatData.contracts.length,
        hasApiKey: !!apiKey,
        provider: aiProvider,
        model: aiModel,
      });

      if (!apiKey) {
        throw new Error('AI API key not configured');
      }

      // Send query with pre-fetched data as context
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query,
          chains: ['1', '8453', '42161', '10', '137'],
          apiKey,
          provider: aiProvider,
          model: aiModel,
          // Include pre-fetched context
          context: {
            transfers: chatData.transfers.slice(0, 50), // Top 50 transfers
            contracts: chatData.contracts,
            stats: chatData.stats,
            lastUpdated: chatData.lastUpdated,
          },
        }),
      });

      const data = await response.json();
      const content = data.answer || data.error || 'Sorry, I could not process your request.';

      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err) {
      console.error('[Chat Hook] ❌ Error sending message:', err);
      
      const errorContent = err instanceof Error && err.message.includes('API key')
        ? '⚠️ AI API key not configured.\n\nTo enable AI chat:\n1. Click on "Settings" tab above\n2. Select your AI provider (OpenAI, Anthropic, Google AI, etc.)\n3. Enter your API key\n4. Click "Save"\n\nYou can still use the Whale Feed and Wallet Analysis features without AI!'
        : 'Sorry, there was an error processing your request. Please check your API key in Settings or try again.';

      const errorMessage: ChatMessage = {
        role: 'assistant',
        content: errorContent,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, errorMessage]);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  };

  return {
    messages,
    chatData,
    isLoading,
    error,
    sendMessage,
    refetchData: fetchChatData,
  };
}
