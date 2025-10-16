'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { AppHeader } from '@/components/app-header';
import { WhaleTrackerCard } from '@/components/whale-tracker-card';
import { WhaleStatsComponent } from '@/components/whale-stats';
import { AnimatedHover } from '@/components/animated-hover';
import { RefreshCw, Filter, Trophy, Sparkles, Copy } from 'lucide-react';
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
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0 }}
          className="flex flex-col gap-3"
        >
          <div className="flex items-start justify-between gap-2">
            <AnimatedHover type="text">
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold">Whale Tracker</h1>
            </AnimatedHover>
            <AnimatedHover type="button" disabled={loading}>
              <Button
                onClick={fetchWhaleFeed}
                disabled={loading}
                size="sm"
                className="gap-2"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </AnimatedHover>
          </div>
          <AnimatedHover type="text">
            <p className="text-muted-foreground text-xs sm:text-sm">
              Real-time monitoring of large blockchain transfers across multiple chains
            </p>
          </AnimatedHover>
        </motion.div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="space-y-3 sm:space-y-4"
        >
          {/* Chain Filter */}
          <div>
            <AnimatedHover type="label">
              <h3 className="text-xs sm:text-sm font-medium mb-2 flex items-center gap-2">
                <Filter className="w-3 h-3 sm:w-4 sm:h-4" />
                Chains
              </h3>
            </AnimatedHover>
            <div className="flex flex-wrap gap-1.5 sm:gap-2">
              {availableChains.map(chain => (
                <AnimatedHover key={chain.id} type="filter">
                  <Badge
                    variant={selectedChains.includes(chain.id) ? 'default' : 'outline'}
                    className="cursor-pointer text-xs sm:text-sm px-2 py-1 sm:px-2.5"
                    onClick={() => toggleChain(chain.id)}
                  >
                    {chain.name}
                  </Badge>
                </AnimatedHover>
              ))}
            </div>
          </div>

          {/* Time Range Filter */}
          <div>
            <AnimatedHover type="label">
              <h3 className="text-xs sm:text-sm font-medium mb-2">Time Range</h3>
            </AnimatedHover>
            <div className="flex flex-wrap gap-1.5 sm:gap-2">
              {timeRanges.map(range => (
                <AnimatedHover key={range.value} type="filter">
                  <Badge
                    variant={timeRange === range.value ? 'default' : 'outline'}
                    className="cursor-pointer text-xs sm:text-sm px-2 py-1 sm:px-2.5"
                    onClick={() => setTimeRange(range.value)}
                  >
                    {range.label}
                  </Badge>
                </AnimatedHover>
              ))}
            </div>
          </div>

          {/* Min Value Filter */}
          <div>
            <AnimatedHover type="label">
              <h3 className="text-xs sm:text-sm font-medium mb-2">Minimum Value</h3>
            </AnimatedHover>
            <div className="flex flex-wrap gap-1.5 sm:gap-2">
              {[10000, 50000, 100000, 500000, 1000000].map(value => (
                <AnimatedHover key={value} type="filter">
                  <Badge
                    variant={minValue === value ? 'default' : 'outline'}
                    className="cursor-pointer text-xs sm:text-sm px-2 py-1 sm:px-2.5"
                    onClick={() => setMinValue(value)}
                  >
                    ${(value / 1000).toLocaleString()}K+
                  </Badge>
                </AnimatedHover>
              ))}
            </div>
          </div>

          {/* Token Filter */}
          <div>
            <AnimatedHover type="label">
              <h3 className="text-xs sm:text-sm font-medium mb-2">Token Filter</h3>
            </AnimatedHover>
            <div className="flex flex-wrap gap-1.5 sm:gap-2">
              <AnimatedHover key="all-tokens" type="filter">
                <Badge
                  variant={tokenFilter === '' ? 'default' : 'outline'}
                  className="cursor-pointer text-xs sm:text-sm px-2 py-1 sm:px-2.5"
                  onClick={() => setTokenFilter('')}
                >
                  All Tokens
                </Badge>
              </AnimatedHover>
              {['USDC', 'USDT', 'WETH', 'DAI', 'WBTC'].map(token => (
                <AnimatedHover key={token} type="filter">
                  <Badge
                    variant={tokenFilter === token ? 'default' : 'outline'}
                    className="cursor-pointer text-xs sm:text-sm px-2 py-1 sm:px-2.5"
                    onClick={() => setTokenFilter(token)}
                  >
                    {token}
                  </Badge>
                </AnimatedHover>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Stats */}
        <AnimatePresence mode="wait">
          {stats && (
            <motion.div
              key="stats"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              {dataSourceStats && dataSourceStats.total > 0 && (
                <motion.div
                  key="data-source"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex justify-center mb-6"
                >
                  <AnimatedHover type="scale">
                    <div className="inline-flex flex-col items-center gap-2 text-sm bg-muted/30 px-6 py-3 rounded-lg">
                      <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Data Source</span>
                  
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
                  </div>
                </AnimatedHover>
              </motion.div>
              )}
              <AnimatedHover type="lift">
                <WhaleStatsComponent stats={stats} />
              </AnimatedHover>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Top Whales Leaderboard */}
        <AnimatePresence mode="wait">
          {topWhales.length > 0 && (
            <motion.div
              key="top-whales"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="space-y-3"
            >
            <div className="space-y-1">
              <AnimatedHover type="label">
                <h2 className="text-lg sm:text-xl font-semibold flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-yellow-500" />
                  Top {Math.min(topWhales.length, 3)} Whales by Volume
                </h2>
              </AnimatedHover>
              <AnimatedHover type="label">
                <p className="text-xs text-muted-foreground">
                  Most active addresses by total transfer volume
                </p>
              </AnimatedHover>
            </div>
            
            {/* Top Whales as Stat Cards - Dynamic grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {topWhales.slice(0, 3).map((whale, index) => {
                const medals = ['🥇', '🥈', '🥉'];
                const rankColors = [
                  'from-yellow-500 to-yellow-600', // Gold
                  'from-gray-400 to-gray-500',     // Silver
                  'from-orange-600 to-orange-700', // Bronze
                ];
                
                const copyAddress = async () => {
                  try {
                    if (navigator.clipboard && navigator.clipboard.writeText) {
                      await navigator.clipboard.writeText(whale.address);
                      // Could add toast notification here
                    } else {
                      // Fallback for older browsers
                      const textArea = document.createElement('textarea');
                      textArea.value = whale.address;
                      textArea.style.position = 'fixed';
                      textArea.style.left = '-999999px';
                      document.body.appendChild(textArea);
                      textArea.select();
                      document.execCommand('copy');
                      document.body.removeChild(textArea);
                    }
                  } catch (error) {
                    console.error('Failed to copy address:', error);
                  }
                };
                
                return (
                  <motion.div
                    key={whale.address}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.4, delay: 0.4 + index * 0.1 }}
                  >
                    <AnimatedHover type="card">
                      <Card className="h-full">
                      <CardContent className="p-4 space-y-3">
                      {/* Rank Badge with Medal */}
                      <div className="flex items-center justify-between">
                        <Badge 
                          variant="default" 
                          className={`bg-gradient-to-r ${rankColors[index]} text-white font-bold px-3 py-1 text-base`}
                        >
                          {medals[index]} #{index + 1}
                        </Badge>
                      </div>
                      
                      {/* Address with Copy Button */}
                      <div className="space-y-1">
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wide">
                          Address
                        </p>
                        <div className="relative flex items-center gap-2">
                          <code className="peer text-xs font-mono bg-muted px-2 py-1 rounded flex-1 truncate hover:overflow-visible hover:whitespace-normal hover:break-all hover:z-10 hover:relative transition-all cursor-help">
                            {whale.address}
                          </code>
                          <button
                            onClick={copyAddress}
                            className="absolute right-0 top-1/2 -translate-y-1/2 opacity-0 peer-hover:opacity-100 shrink-0 p-2 bg-background hover:bg-muted rounded transition-all z-20"
                            title="Copy address"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                      
                      {/* Volume */}
                      <div className="space-y-1">
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wide">
                          Total Volume
                        </p>
                        <p className="text-xl font-bold text-primary">
                          ${(whale.volume / 1000000).toFixed(2)}M
                        </p>
                      </div>
                      
                      {/* Transfer Count */}
                      <div className="space-y-1">
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wide">
                          Transfers
                        </p>
                        <p className="text-sm font-semibold">
                          {whale.count} transfer{whale.count !== 1 ? 's' : ''}
                        </p>
                      </div>
                      </CardContent>
                      </Card>
                    </AnimatedHover>
                  </motion.div>
                );
              })}
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
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5, delay: 0.5 }}
              className="space-y-4"
            >
              <AnimatedHover type="label">
                <h2 className="text-xl font-semibold">
                  Recent Transfers ({transfers.length})
                </h2>
              </AnimatedHover>
              <div className="space-y-3">
                {transfers.map((transfer, index) => (
                  <motion.div
                    key={`${transfer.hash}-${index}`}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.4, delay: 0.6 + index * 0.05 }}
                  >
                    <AnimatedHover type="card">
                      <WhaleTrackerCard
                        transfer={transfer}
                      />
                    </AnimatedHover>
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
