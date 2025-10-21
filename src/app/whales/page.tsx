'use client';

import { useState } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { AppHeader } from '@/components/layouts/app-header';
import { WhaleTrackerCard } from '@/components/features/whale/whale-tracker-card';
import { WhaleStatsComponent } from '@/components/features/whale/whale-stats';
import { WhaleFiltersComponent } from '@/components/features/whale/whale-filters';
import { WhaleTopLeaderboard } from '@/components/features/whale/whale-top-leaderboard';
import { AnimatedHover } from '@/components/ui/animated-hover';
import { AIInsightsChecklistDialog, type AIInsightsConfig } from '@/components/features/whale/ai-insights-checklist-dialog';
import { MCPInfoCard } from '@/components/features/data-source/data-source-card';
import { RefreshCw, Sparkles, TrendingUp, AlertTriangle } from 'lucide-react';
import { useWhaleFilters } from '@/core/hooks/use-whale-filters';
import { useWhaleFeed } from '@/core/hooks/use-whale-feed';
import { useWhaleAI } from '@/core/hooks/use-whale-ai';

export default function WhalesPage() {
  // Custom hooks for state management
  const { filters, toggleChain, setTimeRange, setMinValue, setTokenFilter } = useWhaleFilters();
  const { transfers, stats, topWhales, dataSourceStats, loading, error, refetch } = useWhaleFeed(filters);
  const { aiInsights, isGenerating, hasApiKey, generateInsights, clearInsights } = useWhaleAI();
  
  // Checklist dialog state
  const [showChecklist, setShowChecklist] = useState(false);

  const handleFilterChange = () => {
    clearInsights();
  };

  // Show checklist before generating AI insights
  const handleGenerateAI = () => {
    setShowChecklist(true);
  };
  
  // Actually generate insights after user confirms checklist
  const handleConfirmGenerate = async (config: AIInsightsConfig) => {
    setShowChecklist(false);
    try {
      await generateInsights({
        transfers,
        stats,
        topWhales,
        timeRange: filters.timeRange,
        selectedChains: filters.selectedChains,
        minValue: filters.minValue,
        tokenFilter: filters.tokenFilter,
        dataSourceStats,
        config, // Pass the user's configuration
      });
    } catch {
      // Error is already logged in the hook
    }
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
            <div className="flex gap-2">
              <AnimatedHover type="button" disabled={loading || isGenerating}>
                <Button
                  onClick={handleGenerateAI}
                  disabled={loading || isGenerating || !transfers.length}
                  size="sm"
                  variant={hasApiKey ? "default" : "outline"}
                  className="gap-2"
                  title={!hasApiKey ? "Click to configure your OpenAI API key in Settings" : "Generate AI-powered whale activity insights"}
                >
                  {isGenerating ? (
                    <>
                      <div className="h-3 w-3 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                      Generating...
                    </>
                  ) : hasApiKey ? (
                    <>
                      <TrendingUp className="h-4 w-4" />
                      Generate AI Insights
                      <span className="ml-1 h-2 w-2 rounded-full bg-green-500" title="API Key configured" />
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="h-4 w-4" />
                      Setup AI in Settings
                    </>
                  )}
                </Button>
              </AnimatedHover>
              <AnimatedHover type="button" disabled={loading}>
                <Button
                  onClick={refetch}
                  disabled={loading}
                  size="sm"
                  className="gap-2"
                >
                  <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
              </AnimatedHover>
            </div>
          </div>
          <AnimatedHover type="text">
            <p className="text-muted-foreground text-xs sm:text-sm">
              Real-time monitoring of large blockchain transfers across multiple chains
            </p>
          </AnimatedHover>
        </motion.div>

        {/* Data Source Card - Shows MCP or HTTP based on data source */}
        {dataSourceStats && dataSourceStats.total > 0 && (
          <MCPInfoCard
            mcpCount={dataSourceStats.mcp}
            httpCount={dataSourceStats.http}
            totalCount={dataSourceStats.total}
          />
        )}

        {/* Filters */}
        <WhaleFiltersComponent
          filters={filters}
          onToggleChain={toggleChain}
          onSetTimeRange={setTimeRange}
          onSetMinValue={setMinValue}
          onSetTokenFilter={setTokenFilter}
          onFilterChange={handleFilterChange}
        />

        {/* AI Insights */}
        <AnimatePresence mode="wait">
          {aiInsights && (
            <motion.div
              key="ai-insights"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5, delay: 0.15 }}
            >
              <Card className="border border-blue-500/30 bg-gradient-to-r from-blue-500/5 via-slate-500/5 to-blue-500/5">
                <CardContent className="p-4 sm:p-6">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-blue-500/10 rounded-lg shrink-0">
                      <Sparkles className="h-5 w-5 text-blue-400" />
                    </div>
                    <div className="flex-1 space-y-3">
                      <h3 className="text-base sm:text-lg font-semibold flex items-center gap-2 flex-wrap">
                        AI Insights
                        <Badge variant="secondary" className="text-xs">Powered by AI</Badge>
                        {dataSourceStats && dataSourceStats.total > 0 && (
                          <>
                            {dataSourceStats.mcp > 0 && dataSourceStats.http > 0 ? (
                              <Badge className="text-xs bg-gradient-to-r from-purple-600 to-blue-600 text-white border-0">
                                MCP + HTTP Data
                              </Badge>
                            ) : dataSourceStats.mcp > 0 ? (
                              <Badge className="text-xs bg-purple-600 text-white border-0">
                                MCP Data
                              </Badge>
                            ) : (
                              <Badge className="text-xs bg-blue-600 text-white border-0">
                                HTTP Data
                              </Badge>
                            )}
                          </>
                        )}
                      </h3>
                      <p className="text-sm leading-relaxed whitespace-pre-line text-muted-foreground">
                        {aiInsights}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

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
              <AnimatedHover type="lift">
                <WhaleStatsComponent stats={stats} />
              </AnimatedHover>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Top Whales Leaderboard */}
        <AnimatePresence mode="wait">
          {topWhales.length > 0 && <WhaleTopLeaderboard topWhales={topWhales} />}
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
                <Image
                  src="/whalelogo.png"
                  alt="Whale Logo"
                  width={40}
                  height={40}
                  className="w-8 h-8 sm:w-10 sm:h-10"
                />
              </div>
            </div>
            <p className="text-base sm:text-lg font-medium mt-6">Loading whale transfers...</p>
            <p className="text-xs sm:text-sm text-muted-foreground mt-2">
              Scanning {filters.selectedChains.length} {filters.selectedChains.length === 1 ? 'chain' : 'chains'} for large transfers
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
                      <WhaleTrackerCard transfer={transfer} />
                    </AnimatedHover>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        </div>
      </div>
      
      {/* AI Insights Pre-Flight Checklist Dialog */}
      <AIInsightsChecklistDialog
        open={showChecklist}
        onOpenChange={setShowChecklist}
        transfers={transfers}
        stats={stats}
        topWhales={topWhales}
        onConfirm={handleConfirmGenerate}
        loading={isGenerating}
      />
    </div>
  );
}
