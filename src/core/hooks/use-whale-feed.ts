import { useState, useEffect } from 'react';
import type { WhaleTransfer, WhaleStats } from '@/core/services/whale-service';
import type { WhaleFilters } from './use-whale-filters';

export interface WhaleTopWhale {
  address: string;
  volume: number;
  count: number;
}

export interface DataSourceStats {
  mcp: number;
  http: number;
  total: number;
}

export interface UseWhaleFeedReturn {
  transfers: WhaleTransfer[];
  stats: WhaleStats | null;
  topWhales: WhaleTopWhale[];
  dataSourceStats: DataSourceStats | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

/**
 * Custom hook for fetching whale feed data
 * 
 * @param filters - Filter parameters for whale feed
 * @returns Whale feed data, loading state, and refetch function
 * 
 * @example
 * const { transfers, stats, loading, refetch } = useWhaleFeed(filters);
 */
export function useWhaleFeed(filters: WhaleFilters): UseWhaleFeedReturn {
  const [transfers, setTransfers] = useState<WhaleTransfer[]>([]);
  const [stats, setStats] = useState<WhaleStats | null>(null);
  const [topWhales, setTopWhales] = useState<WhaleTopWhale[]>([]);
  const [dataSourceStats, setDataSourceStats] = useState<DataSourceStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchWhaleFeed = async () => {
    console.log('[Whale Tracker] 🚀 fetchWhaleFeed called with filters:', filters);
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        chains: filters.selectedChains.join(','),
        timeRange: filters.timeRange,
        minValue: filters.minValue.toString(),
      });
      
      if (filters.tokenFilter) {
        params.append('token', filters.tokenFilter);
      }

      const response = await fetch(`/api/whale-tracker/feed?${params}`);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('[Whale Feed Hook] API Error Response:', errorText);
        console.error('[Whale Feed Hook] Status:', response.status);
        console.error('[Whale Feed Hook] Status Text:', response.statusText);
        
        // Try to parse as JSON for better error details
        try {
          const errorJson = JSON.parse(errorText);
          console.error('[Whale Feed Hook] Parsed Error:', errorJson);
          throw new Error(`Failed to fetch whale feed: ${errorJson.details || errorJson.error || errorText}`);
        } catch {
          throw new Error(`Failed to fetch whale feed (${response.status}): ${errorText.substring(0, 200)}`);
        }
      }

      const data = await response.json();
      console.log('[Whale Tracker] Full API Response:', data);
      console.log('[Whale Tracker] Transfer count:', data.transfers?.length || 0);
      console.log('[Whale Tracker] First transfer:', data.transfers?.[0]);
      console.log('[Whale Tracker] Metadata:', data.metadata);
      console.log('[Whale Tracker] DataSources from API:', data.metadata?.dataSources);
      
      setTransfers(data.transfers || []);
      setStats(data.stats || null);
      setTopWhales(data.topWhales || []);
      
      const dsStats = data.metadata?.dataSources || null;
      console.log('[Whale Tracker] Setting dataSourceStats to:', dsStats);
      setDataSourceStats(dsStats);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      console.error('Error fetching whale feed:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWhaleFeed();
    // Auto-refresh every 5 minutes
    const interval = setInterval(fetchWhaleFeed, 5 * 60 * 1000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.selectedChains, filters.timeRange, filters.minValue, filters.tokenFilter]);

  // Debug: Log when dataSourceStats changes
  useEffect(() => {
    console.log('[Whale Tracker] dataSourceStats updated:', dataSourceStats);
  }, [dataSourceStats]);

  return {
    transfers,
    stats,
    topWhales,
    dataSourceStats,
    loading,
    error,
    refetch: fetchWhaleFeed,
  };
}
