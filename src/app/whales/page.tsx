'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AppHeader } from '@/components/app-header';
import { WhaleTrackerCard } from '@/components/whale-tracker-card';
import { WhaleStatsComponent } from '@/components/whale-stats';
import { RefreshCw, Filter } from 'lucide-react';
import type { WhaleTransfer, WhaleStats } from '@/core/services/whale-service';

export default function WhalesPage() {
  const [transfers, setTransfers] = useState<WhaleTransfer[]>([]);
  const [stats, setStats] = useState<WhaleStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedChains, setSelectedChains] = useState(['1', '8453', '42161']);
  const [timeRange, setTimeRange] = useState('1h');
  const [minValue, setMinValue] = useState(100000);

  const availableChains = [
    { id: '1', name: 'Ethereum' },
    { id: '8453', name: 'Base' },
    { id: '42161', name: 'Arbitrum' },
    { id: '10', name: 'Optimism' },
    { id: '137', name: 'Polygon' },
  ];

  const timeRanges = [
    { value: '1h', label: '1 Hour' },
    { value: '6h', label: '6 Hours' },
    { value: '24h', label: '24 Hours' },
    { value: '7d', label: '7 Days' },
  ];

  const fetchWhaleFeed = async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        chains: selectedChains.join(','),
        timeRange,
        minValue: minValue.toString(),
      });

      const response = await fetch(`/api/whale-feed?${params}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch whale feed');
      }

      const data = await response.json();
      setTransfers(data.transfers || []);
      setStats(data.stats || null);
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
  }, [selectedChains, timeRange, minValue]);

  const toggleChain = (chainId: string) => {
    setSelectedChains(prev =>
      prev.includes(chainId)
        ? prev.filter(id => id !== chainId)
        : [...prev, chainId]
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      {/* Header with Navigation */}
      <AppHeader />

      {/* Page Title */}
      <div className="border-b bg-background/50">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold">Whale Tracker</h1>
              <p className="text-muted-foreground mt-1 text-sm sm:text-base">
                Real-time monitoring of large blockchain transfers across multiple chains
              </p>
            </div>
            <Button
              onClick={fetchWhaleFeed}
              disabled={loading}
              variant="outline"
              size="sm"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 space-y-6">
        {/* Filters */}
        <div className="space-y-4">
          {/* Chain Filter */}
          <div>
            <h3 className="text-sm font-medium mb-2 flex items-center gap-2">
              <Filter className="w-4 h-4" />
              Chains
            </h3>
            <div className="flex flex-wrap gap-2">
              {availableChains.map(chain => (
                <Badge
                  key={chain.id}
                  variant={selectedChains.includes(chain.id) ? 'default' : 'outline'}
                  className="cursor-pointer"
                  onClick={() => toggleChain(chain.id)}
                >
                  {chain.name}
                </Badge>
              ))}
            </div>
          </div>

          {/* Time Range Filter */}
          <div>
            <h3 className="text-sm font-medium mb-2">Time Range</h3>
            <div className="flex flex-wrap gap-2">
              {timeRanges.map(range => (
                <Badge
                  key={range.value}
                  variant={timeRange === range.value ? 'default' : 'outline'}
                  className="cursor-pointer"
                  onClick={() => setTimeRange(range.value)}
                >
                  {range.label}
                </Badge>
              ))}
            </div>
          </div>

          {/* Min Value Filter */}
          <div>
            <h3 className="text-sm font-medium mb-2">Minimum Value</h3>
            <div className="flex flex-wrap gap-2">
              {[10000, 50000, 100000, 500000, 1000000].map(value => (
                <Badge
                  key={value}
                  variant={minValue === value ? 'default' : 'outline'}
                  className="cursor-pointer"
                  onClick={() => setMinValue(value)}
                >
                  ${(value / 1000).toLocaleString()}K+
                </Badge>
              ))}
            </div>
          </div>
        </div>

        {/* Stats */}
        {stats && <WhaleStatsComponent stats={stats} />}

        {/* Error State */}
        {error && (
          <div className="bg-destructive/10 border border-destructive text-destructive px-4 py-3 rounded">
            <p className="font-medium">Error loading whale feed</p>
            <p className="text-sm">{error}</p>
          </div>
        )}

        {/* Loading State */}
        {loading && !transfers.length && (
          <div className="text-center py-12">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">Loading whale transfers...</p>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && transfers.length === 0 && (
          <div className="text-center py-12">
            <p className="text-lg font-medium">No whale transfers found</p>
            <p className="text-muted-foreground mt-2">
              Try adjusting your filters or check back later
            </p>
          </div>
        )}

        {/* Whale Feed */}
        {transfers.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">
              Recent Transfers ({transfers.length})
            </h2>
            <div className="space-y-3">
              {transfers.map((transfer, index) => (
                <WhaleTrackerCard key={`${transfer.hash}-${index}`} transfer={transfer} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
