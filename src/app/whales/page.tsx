'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { AppHeader } from '@/components/app-header';
import { WhaleTrackerCard } from '@/components/whale-tracker-card';
import { WhaleStatsComponent } from '@/components/whale-stats';
import { RefreshCw, Filter, Trophy, Sparkles } from 'lucide-react';
import type { WhaleTransfer, WhaleStats } from '@/core/services/whale-service';

export default function WhalesPage() {
  const [transfers, setTransfers] = useState<WhaleTransfer[]>([]);
  const [stats, setStats] = useState<WhaleStats | null>(null);
  const [topWhales, setTopWhales] = useState<Array<{ address: string; volume: number; count: number }>>([]);
  const [dataSourceStats, setDataSourceStats] = useState<{ mcp: number; http: number; total: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedChains, setSelectedChains] = useState(['1', '8453', '42161']);
  const [timeRange, setTimeRange] = useState('1h');
  const [minValue, setMinValue] = useState(100000);
  const [tokenFilter, setTokenFilter] = useState<string>('');

  // Debug: Log when dataSourceStats changes
  useEffect(() => {
    console.log('[Whale Tracker] dataSourceStats updated:', dataSourceStats);
  }, [dataSourceStats]);

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
      
      if (tokenFilter) {
        params.append('token', tokenFilter);
      }

      const response = await fetch(`/api/whale-feed?${params}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch whale feed');
      }

      const data = await response.json();
      console.log('[Whale Tracker] Full API Response:', data);
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
  }, [selectedChains, timeRange, minValue, tokenFilter]);

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

      <div className="container mx-auto px-4 py-4 sm:py-8 max-w-4xl">
        <div className="space-y-4 sm:space-y-6">
        {/* Page Title */}
        <div className="flex flex-col gap-3">
          <div className="flex items-start justify-between gap-2">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold">Whale Tracker</h1>
            <Button
              onClick={fetchWhaleFeed}
              disabled={loading}
              variant="outline"
              size="sm"
              className="shrink-0"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''} sm:mr-2`} />
              <span className="hidden sm:inline">Refresh</span>
            </Button>
          </div>
          <p className="text-muted-foreground text-xs sm:text-sm">
            Real-time monitoring of large blockchain transfers across multiple chains
          </p>
        </div>

        {/* Filters */}
        <div className="space-y-3 sm:space-y-4">
          {/* Chain Filter */}
          <div>
            <h3 className="text-xs sm:text-sm font-medium mb-2 flex items-center gap-2">
              <Filter className="w-3 h-3 sm:w-4 sm:h-4" />
              Chains
            </h3>
            <div className="flex flex-wrap gap-1.5 sm:gap-2">
              {availableChains.map(chain => (
                <Badge
                  key={chain.id}
                  variant={selectedChains.includes(chain.id) ? 'default' : 'outline'}
                  className="cursor-pointer text-xs sm:text-sm px-2 py-1 sm:px-2.5"
                  onClick={() => toggleChain(chain.id)}
                >
                  {chain.name}
                </Badge>
              ))}
            </div>
          </div>

          {/* Time Range Filter */}
          <div>
            <h3 className="text-xs sm:text-sm font-medium mb-2">Time Range</h3>
            <div className="flex flex-wrap gap-1.5 sm:gap-2">
              {timeRanges.map(range => (
                <Badge
                  key={range.value}
                  variant={timeRange === range.value ? 'default' : 'outline'}
                  className="cursor-pointer text-xs sm:text-sm px-2 py-1 sm:px-2.5"
                  onClick={() => setTimeRange(range.value)}
                >
                  {range.label}
                </Badge>
              ))}
            </div>
          </div>

          {/* Min Value Filter */}
          <div>
            <h3 className="text-xs sm:text-sm font-medium mb-2">Minimum Value</h3>
            <div className="flex flex-wrap gap-1.5 sm:gap-2">
              {[10000, 50000, 100000, 500000, 1000000].map(value => (
                <Badge
                  key={value}
                  variant={minValue === value ? 'default' : 'outline'}
                  className="cursor-pointer text-xs sm:text-sm px-2 py-1 sm:px-2.5"
                  onClick={() => setMinValue(value)}
                >
                  ${(value / 1000).toLocaleString()}K+
                </Badge>
              ))}
            </div>
          </div>

          {/* Token Filter */}
          <div>
            <h3 className="text-xs sm:text-sm font-medium mb-2">Token Filter</h3>
            <div className="flex flex-wrap gap-1.5 sm:gap-2">
              <Badge
                variant={tokenFilter === '' ? 'default' : 'outline'}
                className="cursor-pointer text-xs sm:text-sm px-2 py-1 sm:px-2.5"
                onClick={() => setTokenFilter('')}
              >
                All Tokens
              </Badge>
              {['USDC', 'USDT', 'WETH', 'DAI', 'WBTC'].map(token => (
                <Badge
                  key={token}
                  variant={tokenFilter === token ? 'default' : 'outline'}
                  className="cursor-pointer text-xs sm:text-sm px-2 py-1 sm:px-2.5"
                  onClick={() => setTokenFilter(token)}
                >
                  {token}
                </Badge>
              ))}
            </div>
          </div>
        </div>

        {/* Stats */}
        <AnimatePresence mode="wait">
          {stats && (
            <motion.div
              key="stats"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <WhaleStatsComponent stats={stats} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Data Source Badges */}
        {dataSourceStats && dataSourceStats.total > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center gap-3 text-sm bg-muted/30 px-4 py-3 rounded-lg"
            >
              <span className="font-medium text-muted-foreground">Data Source:</span>
              
              {/* Determine which source to show */}
              {dataSourceStats.mcp > 0 && dataSourceStats.http > 0 ? (
                // Both sources
                <div className="flex items-center gap-2">
                  <Badge variant="default" className="bg-gradient-to-r from-purple-500 to-blue-500 text-white">
                    <Sparkles className="w-3.5 h-3.5 mr-1.5" />
                    MCP
                  </Badge>
                  <span className="text-muted-foreground">+</span>
                  <Badge variant="secondary" className="bg-slate-600 text-white">
                    HTTP
                  </Badge>
                </div>
              ) : dataSourceStats.mcp > 0 ? (
                // Only MCP
                <Badge variant="default" className="bg-gradient-to-r from-purple-500 to-blue-500 text-white text-base px-3 py-1">
                  <Sparkles className="w-4 h-4 mr-2" />
                  Blockscout MCP
                </Badge>
              ) : (
                // Only HTTP
                <Badge variant="secondary" className="bg-slate-600 text-white text-base px-3 py-1">
                  REST API v2
                </Badge>
              )}
            </motion.div>
        )}

        {/* Top Whales Leaderboard */}
        <AnimatePresence mode="wait">
          {topWhales.length > 0 && (
            <motion.div
              key="top-whales"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3, delay: 0.1 }}
              className="space-y-3"
            >
            <div className="space-y-1">
              <h2 className="text-lg sm:text-xl font-semibold flex items-center gap-2">
                <Trophy className="w-5 h-5 text-yellow-500" />
                Top Whales by Volume
              </h2>
              <p className="text-xs text-muted-foreground">
                Addresses ranked by total transfer volume (includes both senders and receivers)
              </p>
            </div>
            <div className="grid gap-2">
              {topWhales.slice(0, 5).map((whale, index) => (
                <Card key={whale.address} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-3 sm:p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                        <Badge variant="secondary" className="text-xs sm:text-sm shrink-0">
                          #{index + 1}
                        </Badge>
                        <code className="text-[10px] sm:text-xs font-mono bg-muted px-2 py-1 rounded truncate">
                          {whale.address}
                        </code>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm sm:text-base font-bold text-primary">
                          ${(whale.volume / 1000000).toFixed(2)}M
                        </p>
                        <p className="text-[10px] sm:text-xs text-muted-foreground">
                          {whale.count} transfer{whale.count !== 1 ? 's' : ''}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Error State */}
        {error && (
          <div className="bg-destructive/10 border border-destructive text-destructive px-4 py-3 rounded">
            <p className="font-medium">Error loading whale feed</p>
            <p className="text-sm">{error}</p>
          </div>
        )}

        {/* Loading State */}
        {loading && !transfers.length && (
          <div className="flex flex-col items-center justify-center py-16 sm:py-24">
            <div className="relative">
              <div className="w-16 h-16 sm:w-20 sm:h-20 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-2xl sm:text-3xl">🐋</span>
              </div>
            </div>
            <p className="text-base sm:text-lg font-medium mt-6">Loading whale transfers...</p>
            <p className="text-xs sm:text-sm text-muted-foreground mt-2">
              Scanning {selectedChains.length} {selectedChains.length === 1 ? 'chain' : 'chains'} for large transfers
            </p>
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
        <AnimatePresence mode="wait">
          {transfers.length > 0 && (
            <motion.div
              key="transfers"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="space-y-4"
            >
              <h2 className="text-xl font-semibold">
                Recent Transfers ({transfers.length})
              </h2>
              <div className="space-y-3">
                {transfers.map((transfer, index) => (
                  <motion.div
                    key={`${transfer.hash}-${index}`}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: Math.min(index * 0.05, 1) }}
                  >
                    <WhaleTrackerCard transfer={transfer} />
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
