'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Search, Wallet, AlertTriangle, CheckCircle, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';
import type { WalletAnalysis as WalletAnalysisType } from '@/lib/shared/types';

export default function WalletAnalysis() {
  const [address, setAddress] = useState('');
  const [analysis, setAnalysis] = useState<WalletAnalysisType | null>(null);
  const [holdings, setHoldings] = useState<Array<{ symbol: string; balance: string; value: number; chain: string }>>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!address.trim() || isLoading) return;

    setIsLoading(true);
    setError('');
    setAnalysis(null);

    try {
      const response = await fetch('/api/analyze-wallet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          address: address.trim(),
          chains: ['1', '8453', '42161'], // Ethereum, Base, Arbitrum
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to analyze wallet');
      }

      const data = await response.json();
      setAnalysis(data.analysis);
      setHoldings(data.holdings || []);
    } catch (err) {
      setError('Failed to analyze wallet. Please check the address and try again.');
      console.error('Wallet analysis error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const getRiskColor = (score: number) => {
    if (score < 30) return 'text-green-500';
    if (score < 70) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getRiskLabel = (score: number) => {
    if (score < 30) return 'Low Risk';
    if (score < 70) return 'Medium Risk';
    return 'High Risk';
  };

  return (
    <Card className="w-full max-w-6xl mx-auto">
      <CardHeader>
        <CardTitle>Wallet Analysis</CardTitle>
        <CardDescription>
          Analyze any wallet across multiple chains with AI-powered insights
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Search Form */}
          <form onSubmit={handleAnalyze} className="flex gap-2">
            <Input
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Enter wallet address (0x...)"
              disabled={isLoading}
              className="flex-1"
            />
            <Button type="submit" disabled={isLoading || !address.trim()}>
              <Search className="h-4 w-4 mr-2" />
              Analyze
            </Button>
          </form>

          {error && (
            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-md text-red-500 text-sm">
              {error}
            </div>
          )}

          {/* Loading State */}
          {isLoading && (
            <div className="space-y-4">
              <Card>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <Skeleton className="h-8 w-[200px]" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-[300px]" />
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Analysis Results */}
          {analysis && !isLoading && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              {/* Overview Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Wallet className="h-5 w-5" />
                    Wallet Overview
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Address */}
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Address</p>
                    <code className="text-xs bg-muted px-3 py-2 rounded block break-all">
                      {analysis.address}
                    </code>
                  </div>

                  {/* Total Value */}
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Total Value</p>
                    <p className="text-3xl font-bold text-primary">
                      ${analysis.totalValue.toLocaleString()}
                    </p>
                  </div>

                  {/* Risk Score */}
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Risk Assessment</p>
                    <div className="flex items-center gap-4">
                      <div className="flex-1">
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className={`h-full transition-all ${
                              analysis.riskScore < 30
                                ? 'bg-green-500'
                                : analysis.riskScore < 70
                                ? 'bg-yellow-500'
                                : 'bg-red-500'
                            }`}
                            style={{ width: `${analysis.riskScore}%` }}
                          />
                        </div>
                      </div>
                      <Badge
                        variant="outline"
                        className={getRiskColor(analysis.riskScore)}
                      >
                        {getRiskLabel(analysis.riskScore)} ({analysis.riskScore}/100)
                      </Badge>
                    </div>
                  </div>

                  {/* Summary */}
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">AI Summary</p>
                    <p className="text-sm leading-relaxed">{analysis.summary}</p>
                  </div>
                </CardContent>
              </Card>

              {/* Chain Distribution */}
              {Object.keys(analysis.chains).length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Chain Distribution</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {Object.entries(analysis.chains).map(([chainId, value]) => (
                        <div
                          key={chainId}
                          className="p-4 bg-muted/50 rounded-lg"
                        >
                          <p className="text-sm text-muted-foreground mb-1">
                            Chain {chainId}
                          </p>
                          <p className="text-xl font-bold">
                            ${(value as number).toLocaleString()}
                          </p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Holdings */}
              {holdings.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Token Holdings</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {holdings.slice(0, 10).map((holding, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-3 bg-muted/30 rounded-lg"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                              <TrendingUp className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                              <p className="font-medium">{holding.symbol}</p>
                              <p className="text-xs text-muted-foreground">
                                Chain {holding.chain}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-medium">${holding.value.toLocaleString()}</p>
                            <p className="text-xs text-muted-foreground">
                              {holding.balance}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Insights */}
              {analysis.insights.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Key Insights</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {analysis.insights.map((insight, index) => (
                        <div
                          key={index}
                          className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg"
                        >
                          {analysis.riskScore < 50 ? (
                            <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                          ) : (
                            <AlertTriangle className="h-5 w-5 text-yellow-500 mt-0.5" />
                          )}
                          <p className="text-sm flex-1">{insight}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </motion.div>
          )}

          {/* Empty State */}
          {!analysis && !isLoading && !error && (
            <div className="flex flex-col items-center justify-center h-[400px] text-center text-muted-foreground">
              <Wallet className="h-12 w-12 mb-4 opacity-50" />
              <p className="text-lg font-medium">Enter a wallet address to analyze</p>
              <p className="text-sm mt-2">
                Get AI-powered insights across multiple blockchains
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
