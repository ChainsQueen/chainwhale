'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { RefreshCw, TrendingUp, TrendingDown, ArrowRightLeft, ExternalLink, Activity, Copy, Check } from 'lucide-react';
import { motion } from 'framer-motion';
import type { WhaleTransaction } from '@/lib/shared/types';

export default function WhaleFeed() {
  const [transactions, setTransactions] = useState<WhaleTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null);

  const fetchTransactions = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/whale-tracker/feed?chains=1,8453,42161&minValue=100000&timeRange=1h');
      const data = await response.json();
      
      // Convert new format to old format for compatibility
      const transfers = data.transfers || [];
      const transactions = transfers.map((t: Record<string, unknown>) => ({
        hash: t.hash,
        chain: t.chainName,
        chainId: t.chainId,
        from: t.from,
        to: t.to,
        value: t.value,
        valueUsd: t.valueUsd,
        timestamp: t.timestamp,
        type: 'transfer' as const,
        token: t.token
      }));
      
      setTransactions(transactions);
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Error fetching whale transactions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  const copyToClipboard = async (address: string) => {
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(address);
      } else {
        // Fallback for environments where clipboard API is not available
        const textArea = document.createElement('textarea');
        textArea.value = address;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
      setCopiedAddress(address);
      setTimeout(() => setCopiedAddress(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'buy':
        return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'sell':
        return <TrendingDown className="h-4 w-4 text-red-500" />;
      default:
        return <ArrowRightLeft className="h-4 w-4 text-blue-500" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'buy':
        return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'sell':
        return 'bg-red-500/10 text-red-500 border-red-500/20';
      default:
        return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
    }
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Whale Transaction Feed</CardTitle>
            <CardDescription>
              Monitoring 9 known whale addresses (Binance, Coinbase, Vitalik, Polygon Bridge, and large holders) across Ethereum, Base, and Arbitrum. Showing transfers above $100,000 USD.
            </CardDescription>
          </div>
          <Button
            onClick={fetchTransactions}
            disabled={isLoading}
            variant="outline"
            size="sm"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
        {lastUpdate && (
          <p className="text-xs text-muted-foreground mt-2">
            Last updated: {lastUpdate.toLocaleTimeString()}
          </p>
        )}
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[600px] w-full">
          {isLoading && transactions.length === 0 ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <Card key={i}>
                  <CardContent className="p-4">
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-[250px]" />
                      <Skeleton className="h-4 w-[200px]" />
                      <Skeleton className="h-4 w-[150px]" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : transactions.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-[400px] text-center text-muted-foreground max-w-2xl mx-auto">
              <Activity className="h-12 w-12 mb-4 opacity-50" />
              <p className="text-lg font-medium">No Recent Whale Activity</p>
              <p className="text-sm mt-2">
                Monitoring 9 whale addresses (Binance, Coinbase, Vitalik, Polygon Bridge, and large holders) across Ethereum, Base, and Arbitrum, but no transfers over $100,000 were found in the last 24 hours.
              </p>
              <div className="mt-6 p-4 bg-muted/50 rounded-lg text-left">
                <p className="text-sm font-medium mb-2">💡 Try the Wallet Analysis feature instead:</p>
                <ul className="text-xs space-y-1 list-disc list-inside">
                  <li>Analyze any wallet address across multiple chains</li>
                  <li>View token holdings and balances</li>
                  <li>Get AI-powered risk assessment (with API key)</li>
                  <li>Real-time data from Blockscout MCP</li>
                </ul>
              </div>
              <Button onClick={fetchTransactions} className="mt-4" variant="outline">
                Try Again
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {transactions.map((tx, index) => (
                <motion.div
                  key={`${tx.hash}-${index}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 space-y-2">
                          {/* Header */}
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge variant="outline" className={getTypeColor(tx.type)}>
                              <span className="flex items-center gap-1">
                                {getTypeIcon(tx.type)}
                                {tx.type.toUpperCase()}
                              </span>
                            </Badge>
                            <Badge variant="secondary">{tx.chain}</Badge>
                            {tx.token && (
                              <Badge variant="outline">{tx.token.symbol}</Badge>
                            )}
                          </div>

                          {/* Amount */}
                          <div>
                            <p className="text-2xl font-bold text-primary">
                              ${tx.valueUsd.toLocaleString()}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {tx.value} {tx.token?.symbol || 'tokens'}
                            </p>
                          </div>

                          {/* Addresses */}
                          <TooltipProvider>
                            <div className="space-y-2 text-sm">
                              <div className="flex items-center gap-2">
                                <span className="text-muted-foreground min-w-[40px]">From:</span>
                                <div className="inline-flex items-center gap-2 bg-muted rounded px-2 py-1 group">
                                  <code className="text-xs font-mono">
                                    {tx.from}
                                  </code>
                                  <Tooltip open={copiedAddress === tx.from}>
                                    <TooltipTrigger asChild>
                                      <button
                                        onClick={() => copyToClipboard(tx.from)}
                                        className="flex-shrink-0 hover:scale-110 active:scale-95 transition-transform"
                                      >
                                        {copiedAddress === tx.from ? (
                                          <Check className="h-3 w-3 text-green-500" />
                                        ) : (
                                          <Copy className="h-3 w-3 opacity-50 hover:opacity-100 transition-opacity" />
                                        )}
                                      </button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p className="text-xs font-medium">Copied!</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-muted-foreground min-w-[40px]">To:</span>
                                <div className="inline-flex items-center gap-2 bg-muted rounded px-2 py-1 group">
                                  <code className="text-xs font-mono">
                                    {tx.to}
                                  </code>
                                  <Tooltip open={copiedAddress === tx.to}>
                                    <TooltipTrigger asChild>
                                      <button
                                        onClick={() => copyToClipboard(tx.to)}
                                        className="flex-shrink-0 hover:scale-110 active:scale-95 transition-transform"
                                      >
                                        {copiedAddress === tx.to ? (
                                          <Check className="h-3 w-3 text-green-500" />
                                        ) : (
                                          <Copy className="h-3 w-3 opacity-50 hover:opacity-100 transition-opacity" />
                                        )}
                                      </button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p className="text-xs font-medium">Copied!</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </div>
                              </div>
                            </div>
                          </TooltipProvider>

                          {/* Timestamp */}
                          <p className="text-xs text-muted-foreground">
                            {new Date(tx.timestamp).toLocaleString()}
                          </p>

                          {/* AI Analysis */}
                          {tx.aiAnalysis && (
                            <div className="mt-3 p-3 bg-muted/50 rounded-md">
                              <p className="text-sm">{tx.aiAnalysis}</p>
                            </div>
                          )}
                        </div>

                        {/* View on Explorer */}
                        <Button
                          variant="ghost"
                          size="sm"
                          asChild
                        >
                          <a
                            href={`https://etherscan.io/tx/${tx.hash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
