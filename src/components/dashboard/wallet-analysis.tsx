'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Search, Wallet, AlertTriangle, CheckCircle, TrendingUp, Copy, Check, ExternalLink, Clock } from 'lucide-react';
import { motion } from 'framer-motion';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import type { WalletAnalysis as WalletAnalysisType } from '@/lib/shared/types';

export default function WalletAnalysis() {
  const [address, setAddress] = useState('');
  const [analysis, setAnalysis] = useState<WalletAnalysisType | null>(null);
  const [holdings, setHoldings] = useState<Array<{ symbol: string; balance: string; value: number; chain: string; address: string }>>([]);
  const [ensName, setEnsName] = useState<string | undefined>();
  const [recentTransactions, setRecentTransactions] = useState<Array<Record<string, unknown>>>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null);
  const [isValidAddress, setIsValidAddress] = useState(true);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [aiInsights, setAiInsights] = useState<string | null>(null);
  const [hasApiKey, setHasApiKey] = useState(false);

  // Check for API key on mount and when returning to this component
  useEffect(() => {
    const checkApiKey = () => {
      const key = localStorage.getItem('ai_api_key') || localStorage.getItem('openai_api_key');
      setHasApiKey(!!key);
    };
    
    checkApiKey();
    // Check again when storage changes (user added/removed key)
    window.addEventListener('storage', checkApiKey);
    window.addEventListener('focus', checkApiKey);
    
    return () => {
      window.removeEventListener('storage', checkApiKey);
      window.removeEventListener('focus', checkApiKey);
    };
  }, []);

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!address.trim() || isLoading) return;

    setIsLoading(true);
    setError('');
    setAnalysis(null);
    setAiInsights(null);

    try {
      const response = await fetch('/api/analyze-wallet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          address: address.trim(),
          chains: ['1', '8453', '42161', '10', '137'], // Ethereum, Base, Arbitrum, Optimism, Polygon
        }),
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

  const handleGenerateAI = async () => {
    if (!analysis || isGeneratingAI) return;

    setIsGeneratingAI(true);
    setError('');

    // Get user's API key from localStorage
    const userApiKey = localStorage.getItem('openai_api_key');

    try {
      const response = await fetch('/api/analyze-wallet-ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          address: analysis.address,
          holdings,
          recentTransactions,
          totalValue: analysis.totalValue,
          chains: analysis.chains,
          apiKey: userApiKey, // Pass user's API key
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate AI insights');
      }

      const data = await response.json();
      setAiInsights(data.insights);
      
      // Update analysis with AI data
      if (data.riskScore) {
        setAnalysis({ ...analysis, riskScore: data.riskScore, summary: data.summary || analysis.summary });
      }
    } catch (err) {
      setError('Failed to generate AI insights. Make sure OpenAI API key is configured.');
      console.error('AI generation error:', err);
    } finally {
      setIsGeneratingAI(false);
    }
  };

  const validateAddress = (addr: string): boolean => {
    // Check if it's a valid Ethereum address (0x followed by 40 hex characters)
    const ethAddressRegex = /^0x[a-fA-F0-9]{40}$/;
    // Also allow ENS names (alphanumeric with dots, ending in .eth)
    const ensNameRegex = /^[a-zA-Z0-9-]+\.eth$/;
    
    return ethAddressRegex.test(addr) || ensNameRegex.test(addr);
  };

  const handleAddressChange = (value: string) => {
    setAddress(value);
    
    // Only validate if there's input
    if (value.trim()) {
      setIsValidAddress(validateAddress(value.trim()));
    } else {
      setIsValidAddress(true); // Don't show error for empty input
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedAddress(text);
    setTimeout(() => setCopiedAddress(null), 2000);
  };

  const getExplorerUrl = (address: string, chainId?: string) => {
    const explorers: Record<string, string> = {
      '1': 'https://etherscan.io',
      '8453': 'https://basescan.org',
      '42161': 'https://arbiscan.io',
      '10': 'https://optimistic.etherscan.io',
      '137': 'https://polygonscan.com',
    };
    const baseUrl = chainId ? explorers[chainId] : explorers['1']; // Default to Ethereum
    return `${baseUrl}/address/${address}`;
  };

  const getChainName = (chainId: string): string => {
    const chains: Record<string, string> = {
      '1': 'Ethereum',
      '8453': 'Base',
      '42161': 'Arbitrum',
      '10': 'Optimism',
      '137': 'Polygon',
    };
    return chains[chainId] || `Chain ${chainId}`;
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

  // Format numbers like Etherscan
  const formatEthBalance = (balance: number): string => {
    return balance.toLocaleString('en-US', {
      minimumFractionDigits: 4,
      maximumFractionDigits: 4,
    });
  };

  const formatUsdValue = (value: number): string => {
    return value.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>Wallet Analysis</CardTitle>
        <CardDescription>
          Analyze any wallet across multiple chains with AI-powered insights
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Search Form */}
          <form onSubmit={handleAnalyze} className="space-y-2">
            <div className="flex gap-2">
              <div className="flex-1">
                <Input
                  value={address}
                  onChange={(e) => handleAddressChange(e.target.value)}
                  placeholder="Enter wallet address (0x...) or ENS name (.eth)"
                  disabled={isLoading}
                />
                {!isValidAddress && address.trim() && (
                  <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3" />
                    Invalid address format. Use 0x... format or .eth ENS name
                  </p>
                )}
              </div>
              <Button type="submit" disabled={isLoading || !address.trim() || !isValidAddress}>
                <Search className="h-4 w-4 mr-2" />
                Analyze
              </Button>
            </div>
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
                    {ensName && (
                      <p className="text-lg font-semibold mb-2 text-primary">{ensName}</p>
                    )}
                    <div className="flex flex-wrap items-center gap-2">
                      <TooltipProvider>
                        <div className="inline-flex items-center gap-2 bg-muted rounded px-3 py-2">
                          <code className="text-xs font-mono break-all">
                            {analysis.address}
                          </code>
                          <Tooltip open={copiedAddress === analysis.address}>
                            <TooltipTrigger asChild>
                              <button
                                onClick={() => copyToClipboard(analysis.address)}
                                className="flex-shrink-0 hover:scale-110 active:scale-95 transition-transform"
                              >
                                {copiedAddress === analysis.address ? (
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
                      </TooltipProvider>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => window.open(getExplorerUrl(analysis.address), '_blank')}
                              className="h-8 w-8 p-0"
                            >
                              <ExternalLink className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="text-xs">View on Etherscan</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  </div>

                  {/* Portfolio Breakdown - Only show if there's data */}
                  {holdings.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      {(() => {
                        const ethHoldings = holdings.filter(h => h.symbol === 'ETH' && h.address === 'native');
                        const ethBalance = ethHoldings.reduce((sum, h) => sum + parseFloat(h.balance), 0);
                        const ethValue = ethHoldings.reduce((sum, h) => sum + h.value, 0);
                        const tokenValue = holdings
                          .filter(h => h.address !== 'native')
                          .reduce((sum, h) => sum + h.value, 0);
                        const tokenCount = holdings.filter(h => h.address !== 'native').length;
                        
                        return (
                          <>
                            {ethBalance > 0 && (
                              <>
                                <div className="p-4 bg-muted/30 rounded-lg">
                                  <p className="text-xs text-muted-foreground mb-1">ETH BALANCE</p>
                                  <p className="text-lg font-bold">
                                    {formatEthBalance(ethBalance)} ETH
                                  </p>
                                </div>
                                <div className="p-4 bg-muted/30 rounded-lg">
                                  <p className="text-xs text-muted-foreground mb-1">ETH VALUE</p>
                                  <p className="text-lg font-bold text-primary">
                                    {formatEthBalance(ethBalance)} ETH
                                  </p>
                                  {ethValue > 0 && (
                                    <p className="text-xs text-muted-foreground mt-1">
                                      ≈ ${formatUsdValue(ethValue)}
                                    </p>
                                  )}
                                </div>
                              </>
                            )}
                            {tokenCount > 0 && (
                              <div className="p-4 bg-muted/30 rounded-lg">
                                <p className="text-xs text-muted-foreground mb-1">TOKEN HOLDINGS</p>
                                <p className="text-lg font-bold text-primary">
                                  ${formatUsdValue(tokenValue)}
                                </p>
                                <p className="text-xs text-muted-foreground mt-1">
                                  ({tokenCount} {tokenCount === 1 ? 'Token' : 'Tokens'})
                                </p>
                              </div>
                            )}
                            {analysis.totalValue > 0 && (
                              <div className="p-4 bg-primary/10 rounded-lg border border-primary/20">
                                <p className="text-xs text-muted-foreground mb-1">MULTICHAIN INFO</p>
                                <p className="text-lg font-bold text-primary">
                                  ${formatUsdValue(analysis.totalValue)}
                                </p>
                                <p className="text-xs text-muted-foreground mt-1">
                                  {Object.keys(analysis.chains).length} {Object.keys(analysis.chains).length === 1 ? 'chain' : 'chains'} scanned
                                </p>
                              </div>
                            )}
                          </>
                        );
                      })()}
                    </div>
                  )}

                  {/* Whale Detection */}
                  {analysis.insights && analysis.insights[0]?.includes('Whale Category') && (
                    <div className="p-6 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-lg border border-blue-500/20">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="p-3 bg-blue-500/10 rounded-full">
                            <Wallet className="h-6 w-6 text-blue-500" />
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">Whale Detection</p>
                            <p className="font-semibold text-xl">
                              {analysis.insights[0].split(':')[1]?.split('(')[0]?.trim() || 'Unknown'}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-muted-foreground mb-1">Score</p>
                          <p className="text-2xl font-bold text-blue-500">
                            {analysis.insights[0].match(/Score: (\d+)/)?.[1] || '0'}/100
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Risk Assessment - Full Width */}
                  <div className="p-6 bg-muted/30 rounded-lg border border-muted">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="p-3 bg-primary/10 rounded-full">
                          <AlertTriangle className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Risk Assessment</p>
                          <p className="font-semibold text-xl">{getRiskLabel(analysis.riskScore)}</p>
                        </div>
                      </div>
                      <Badge
                        variant="outline"
                        className={`${getRiskColor(analysis.riskScore)} text-lg px-4 py-2`}
                      >
                        {analysis.riskScore}/100
                      </Badge>
                    </div>
                    <div className="space-y-2">
                      <div className="h-3 bg-muted rounded-full overflow-hidden">
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
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Low Risk</span>
                        <span>Medium Risk</span>
                        <span>High Risk</span>
                      </div>
                    </div>
                  </div>

                  {/* Summary */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm text-muted-foreground">Summary</p>
                      {!aiInsights && (
                        <Button
                          onClick={() => {
                            if (!hasApiKey) {
                              // Redirect to Settings tab using URL
                              window.location.href = '/dashboard?tab=settings';
                              return;
                            }
                            handleGenerateAI();
                          }}
                          disabled={isGeneratingAI}
                          size="sm"
                          variant={hasApiKey ? "default" : "outline"}
                          className="gap-2"
                        >
                          {isGeneratingAI ? (
                            <>
                              <div className="h-3 w-3 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                              Generating...
                            </>
                          ) : hasApiKey ? (
                            <>
                              <TrendingUp className="h-3 w-3" />
                              Generate AI Insights
                              <span className="ml-1 h-2 w-2 rounded-full bg-green-500" title="API Key configured" />
                            </>
                          ) : (
                            <>
                              <AlertTriangle className="h-3 w-3" />
                              Setup AI in Settings
                            </>
                          )}
                        </Button>
                      )}
                    </div>
                    <p className="text-sm leading-relaxed whitespace-pre-line">{aiInsights || analysis.summary}</p>
                  </div>
                </CardContent>
              </Card>

              {/* Chain Distribution - Only show if there's value */}
              {Object.keys(analysis.chains).length > 0 && 
               Object.values(analysis.chains).some(v => (v as number) > 0) && (
                <Card>
                  <CardHeader>
                    <CardTitle>Chain Distribution</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {Object.entries(analysis.chains)
                        .filter(([, value]) => (value as number) > 0)
                        .map(([chainId, value]) => (
                          <div
                            key={chainId}
                            className="p-4 bg-muted/50 rounded-lg"
                          >
                            <p className="text-sm text-muted-foreground mb-1">
                              {getChainName(chainId)}
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
                    <CardTitle>Token Holdings ({holdings.length})</CardTitle>
                    <CardDescription>Top tokens by value</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {holdings.slice(0, 15).map((holding, index) => (
                        <div
                          key={`${holding.address}-${index}`}
                          className="flex items-center justify-between p-3 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                              <TrendingUp className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                              <p className="font-medium">{holding.symbol}</p>
                              <p className="text-xs text-muted-foreground">
                                {getChainName(holding.chain)}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-medium">${holding.value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                            <p className="text-xs text-muted-foreground">
                              {holding.balance} {holding.symbol}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Recent Transactions */}
              {recentTransactions.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Clock className="h-5 w-5" />
                      Recent Activity (24h)
                    </CardTitle>
                    <CardDescription>{recentTransactions.length} token transfers in the last 24 hours</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {recentTransactions.slice(0, 15).map((tx, index) => {
                        const txData = tx as Record<string, unknown>;
                        const isIncoming = (txData.to as string)?.toLowerCase() === analysis.address.toLowerCase();
                        const decimals = parseInt(((txData.token as Record<string, unknown>)?.decimals as string) || '18');
                        const tokenAmount = txData.value ? (parseFloat(txData.value as string) / Math.pow(10, decimals)).toFixed(4) : '0';
                        
                        const tokenData = txData.token as Record<string, unknown>;
                        const fromAddr = txData.from as string;
                        const toAddr = txData.to as string;
                        const chainId = txData.chainId as string;
                        const valueUsd = txData.valueUsd as number;
                        const timestamp = txData.timestamp as number;
                        
                        return (
                          <div
                            key={`${txData.hash}-${index}`}
                            className="flex items-center justify-between p-3 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors"
                          >
                            <div className="flex-1 space-y-1">
                              <div className="flex items-center gap-2">
                                <Badge 
                                  variant="outline" 
                                  className={`text-xs ${isIncoming ? 'bg-green-500/10 text-green-500 border-green-500/20' : 'bg-red-500/10 text-red-500 border-red-500/20'}`}
                                >
                                  {isIncoming ? '↓ IN' : '↑ OUT'}
                                </Badge>
                                <Badge variant="outline" className="text-xs">
                                  {getChainName(chainId)}
                                </Badge>
                                <span className="font-medium text-sm">
                                  {tokenAmount} {(tokenData?.symbol as string) || 'tokens'}
                                  {valueUsd && valueUsd > 0 && (
                                    <span className="text-primary ml-1">
                                      (${formatUsdValue(valueUsd)})
                                    </span>
                                  )}
                                </span>
                              </div>
                              
                              <div className="flex items-center gap-2 text-xs">
                                <span className="text-muted-foreground">{isIncoming ? 'From' : 'To'}:</span>
                                <TooltipProvider>
                                  <div className="inline-flex items-center gap-1 bg-muted rounded px-2 py-1">
                                    <code className="text-xs font-mono">
                                      {isIncoming ? fromAddr : toAddr}
                                    </code>
                                    <Tooltip open={copiedAddress === (isIncoming ? fromAddr : toAddr)}>
                                      <TooltipTrigger asChild>
                                        <button
                                          onClick={() => copyToClipboard(isIncoming ? fromAddr : toAddr)}
                                          className="flex-shrink-0 hover:scale-110 active:scale-95 transition-transform"
                                        >
                                          {copiedAddress === (isIncoming ? fromAddr : toAddr) ? (
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
                                </TooltipProvider>
                              </div>
                              
                              <p className="text-xs text-muted-foreground">
                                {timestamp ? new Date(timestamp).toLocaleString() : 'Unknown time'}
                              </p>
                            </div>
                            
                            <Button
                              variant="ghost"
                              size="sm"
                              asChild
                              className="h-8 w-8 p-0 flex-shrink-0"
                            >
                              <a
                                href={`https://etherscan.io/tx/${tx.hash}`}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                <ExternalLink className="h-3 w-3" />
                              </a>
                            </Button>
                          </div>
                        );
                      })}
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
