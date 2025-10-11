'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { RefreshCw, TrendingUp, TrendingDown, ArrowRightLeft, ExternalLink, Activity } from 'lucide-react';
import { motion } from 'framer-motion';
import type { WhaleTransaction } from '@/lib/shared/types';

export default function WhaleFeed() {
  const [transactions, setTransactions] = useState<WhaleTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const fetchTransactions = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/whale-feed?chains=1,8453,42161');
      const data = await response.json();
      setTransactions(data.transactions || []);
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
    <Card className="w-full max-w-6xl mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Whale Transaction Feed</CardTitle>
            <CardDescription>
              Real-time monitoring of ALL blockchain transfers via Blockscout MCP. Showing transactions above $1,000 USD.
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
                Analyzing ALL blockchain transfers in real-time, but no transactions over $1k were found in the last hour.
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
                  key={tx.hash}
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
                          <div className="space-y-1 text-sm">
                            <div className="flex items-center gap-2">
                              <span className="text-muted-foreground">From:</span>
                              <code className="text-xs bg-muted px-2 py-1 rounded">
                                {tx.from.substring(0, 10)}...{tx.from.substring(tx.from.length - 8)}
                              </code>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-muted-foreground">To:</span>
                              <code className="text-xs bg-muted px-2 py-1 rounded">
                                {tx.to.substring(0, 10)}...{tx.to.substring(tx.to.length - 8)}
                              </code>
                            </div>
                          </div>

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
