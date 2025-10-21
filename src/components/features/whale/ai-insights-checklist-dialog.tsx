'use client';

import { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { CheckCircle2, AlertCircle, Info, ExternalLink, Loader2, Shield, Sparkles } from 'lucide-react';
import { getExplorerUrl } from '@/core/utils/wallet-utils';
import type { DataSource } from '@/core/types/whale.types';

interface Transfer {
  hash: string;
  token: {
    symbol: string;
    name?: string;
    address: string;
  };
  valueUsd?: number;
  chainId: string;
  chainName: string;
  from: string;
  to: string;
  timestamp?: number;
  dataSource?: DataSource;
}

interface Stats {
  totalTransfers: number;
  totalVolume: number;
  largestTransfer: number;
  uniqueWhales: number;
}

interface TopWhale {
  address: string;
  volume: number;
  count: number;
}

interface ContractSecurityData {
  // Basic token info
  symbol: string;
  address: string;
  chainId: string;
  
  // Contract verification & security
  isVerified: boolean;
  isScam: boolean;
  reputation?: string;
  
  // Proxy contract info
  isProxy: boolean;
  implementations?: Array<{
    address: string;
    name?: string;
  }>;
  
  // Contract creator info
  creatorAddress?: string;
  creationTxHash?: string;
  creationStatus?: string;
  
  // Token metadata
  tokenType?: string;
  tokenName?: string;
  tokenSymbol?: string;
  decimals?: string;
  iconUrl?: string;
  
  // Supply & holders
  totalSupply?: string;
  holders?: string;
  
  // Market data
  price?: string;
  marketCap?: string;
  volume24h?: string;
  
  // Address balance (if querying a wallet)
  balance?: string;
  balanceUsd?: number;
  isContract?: boolean;
  ensName?: string;
}

interface AIInsightsChecklistDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transfers: Transfer[];
  stats: Stats | null;
  topWhales: TopWhale[];
  onConfirm: (config: AIInsightsConfig) => void;
  loading?: boolean;
}

export interface AIInsightsConfig {
  includeStats: boolean;
  includeTopWhales: boolean;
  includeTokenList: boolean;
  includeContractSecurity: boolean;
  includeRecentTransfers: boolean;
  includeDataSources: boolean;
  contractSecurityData?: ContractSecurityData[];
}

/**
 * Pre-flight checklist dialog for AI insights generation
 * 
 * Shows users exactly what data will be analyzed:
 * - Transfer summary with verification links
 * - Contract security checks for top tokens
 * - Data quality validation
 * 
 * Ensures transparency and allows users to verify data before AI analysis.
 */
export function AIInsightsChecklistDialog({
  open,
  onOpenChange,
  transfers,
  stats,
  topWhales,
  onConfirm,
  loading = false,
}: AIInsightsChecklistDialogProps) {
  // Safe defaults to prevent runtime errors (memoized to prevent useEffect dependency issues)
  const safeTransfers = useMemo(() => transfers || [], [transfers]);
  const safeStats = useMemo(() => stats || { totalTransfers: 0, totalVolume: 0, largestTransfer: 0, uniqueWhales: 0 }, [stats]);
  const safeTopWhales = useMemo(() => topWhales || [], [topWhales]);

  // Toggle states for data categories
  const [includeStats, setIncludeStats] = useState(true);
  const [includeTopWhales, setIncludeTopWhales] = useState(true);
  const [includeTokenList, setIncludeTokenList] = useState(true);
  const [includeContractSecurity, setIncludeContractSecurity] = useState(true);
  const [includeRecentTransfers, setIncludeRecentTransfers] = useState(true);
  const [includeDataSources, setIncludeDataSources] = useState(true);

  // Contract security fetching state
  const [contractSecurityData, setContractSecurityData] = useState<ContractSecurityData[]>([]);
  const [isFetchingContracts, setIsFetchingContracts] = useState(false);
  const [contractsFetched, setContractsFetched] = useState(false);
  const [contractFetchError, setContractFetchError] = useState<string | null>(null);

  // AI Configuration state
  const [aiProvider, setAiProvider] = useState<string>('openai');
  const [aiModel, setAiModel] = useState<string>('gpt-4o-mini');
  const [hasApiKey, setHasApiKey] = useState(false);

  // Get top 5 tokens by transfer count (memoized to prevent useEffect dependency issues)
  const tokenCounts = useMemo(() => {
    const counts: Record<string, { count: number; sample: Transfer }> = {};
    safeTransfers.forEach(t => {
      const symbol = t.token.symbol;
      if (!counts[symbol]) {
        counts[symbol] = { count: 0, sample: t };
      }
      counts[symbol].count++;
    });
    return counts;
  }, [safeTransfers]);

  // Load AI configuration from localStorage
  useEffect(() => {
    const provider = localStorage.getItem('ai_provider') || 'openai';
    const model = localStorage.getItem('ai_model') || 'gpt-4o-mini';
    const apiKey = localStorage.getItem('ai_api_key') || localStorage.getItem('openai_api_key');
    setAiProvider(provider);
    setAiModel(model);
    setHasApiKey(!!apiKey);
  }, [open]); // Re-check when dialog opens

  // Fetch contract security data when toggle is enabled
  useEffect(() => {
    if (!includeContractSecurity || contractsFetched || isFetchingContracts || !open) {
      return;
    }

    const fetchContractSecurity = async () => {
      setIsFetchingContracts(true);
      setContractFetchError(null);

      try {
        // Prepare tokens to fetch
        const allTokens = Object.entries(tokenCounts)
          .sort(([, a], [, b]) => b.count - a.count)
          .map(([symbol, data]) => ({
            symbol,
            address: data.sample.token.address,
            chainId: data.sample.chainId,
          }));

        // Call server-side API to fetch contract security data
        const response = await fetch('/api/whale-tracker/contract-security', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tokens: allTokens }),
        });

        if (!response.ok) {
          throw new Error('Failed to fetch contract security data');
        }

        const data = await response.json();
        setContractSecurityData(data.securityData || []);
        setContractsFetched(true);
      } catch (error) {
        console.error('Error fetching contract security:', error);
        setContractFetchError('Failed to fetch contract security data');
      } finally {
        setIsFetchingContracts(false);
      }
    };

    fetchContractSecurity();
  }, [includeContractSecurity, open, contractsFetched, isFetchingContracts, tokenCounts]);

  // Reset state when dialog closes
  useEffect(() => {
    if (!open) {
      setContractsFetched(false);
      setContractSecurityData([]);
      setContractFetchError(null);
    }
  }, [open]);

  const handleConfirm = () => {
    const config: AIInsightsConfig = {
      includeStats,
      includeTopWhales,
      includeTokenList,
      includeContractSecurity,
      includeRecentTransfers,
      includeDataSources,
      contractSecurityData: includeContractSecurity ? contractSecurityData : undefined,
    };
    onConfirm(config);
  };

  // Data quality checks
  const dataQualityChecks = [
    {
      label: 'Transfer Data',
      status: safeTransfers.length > 0 ? 'success' : 'failed',
      message: `${safeTransfers.length.toLocaleString()} transfers found`,
    },
    {
      label: 'USD Values',
      status: safeTransfers.some(t => t.valueUsd) ? 'success' : 'warning',
      message: `${safeTransfers.filter(t => t.valueUsd).length.toLocaleString()}/${safeTransfers.length.toLocaleString()} have USD values`,
    },
    {
      label: 'Data Sources',
      status: 'success',
      message: `MCP: ${safeTransfers.filter(t => t.dataSource === 'mcp').length.toLocaleString()}, HTTP: ${safeTransfers.filter(t => t.dataSource === 'http').length.toLocaleString()}`,
    },
    {
      label: 'Top Whales',
      status: safeTopWhales.length > 0 ? 'success' : 'warning',
      message: `${safeTopWhales.length.toLocaleString()} whale addresses identified`,
    },
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'warning':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      case 'failed':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Info className="h-4 w-4 text-muted-foreground" />;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>AI Insights Pre-Flight Check</DialogTitle>
          <DialogDescription>
            Review the data that will be analyzed. Click on links to verify transactions and contracts on blockchain explorers.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Data Summary */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold flex items-center gap-2">
                📊 Whale Activity Stats
              </h3>
              <Switch
                checked={includeStats}
                onCheckedChange={setIncludeStats}
                aria-label="Include stats"
              />
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="p-3 bg-muted/50 rounded-lg">
                <p className="text-muted-foreground">Total Transfers</p>
                <p className="text-xl font-bold">{safeStats.totalTransfers.toLocaleString()}</p>
              </div>
              <div className="p-3 bg-muted/50 rounded-lg">
                <p className="text-muted-foreground">Total Volume</p>
                <p className="text-xl font-bold">${(safeStats.totalVolume / 1e6).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}M</p>
              </div>
              <div className="p-3 bg-muted/50 rounded-lg">
                <p className="text-muted-foreground">Unique Whales</p>
                <p className="text-xl font-bold">{safeStats.uniqueWhales.toLocaleString()}</p>
              </div>
              <div className="p-3 bg-muted/50 rounded-lg">
                <p className="text-muted-foreground">Largest Transfer</p>
                <p className="text-xl font-bold">${(safeStats.largestTransfer / 1e6).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}M</p>
              </div>
            </div>
          </div>

          {/* Top Whales */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold flex items-center gap-2">
                🐋 Top Whales by Sent Volume
              </h3>
              <Switch
                checked={includeTopWhales}
                onCheckedChange={setIncludeTopWhales}
                aria-label="Include top whales"
              />
            </div>
            {includeTopWhales && (
              <div className="space-y-2">
                {safeTopWhales.slice(0, 3).map((whale, i) => (
                  <div key={i} className="flex items-center justify-between p-2 bg-muted/30 rounded text-xs">
                    <div>
                      <p className="font-medium font-mono">{whale.address.slice(0, 10)}...{whale.address.slice(-8)}</p>
                      <p className="text-muted-foreground">{whale.count} transfers</p>
                    </div>
                    <p className="font-semibold">${(whale.volume / 1e6).toFixed(2)}M</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Data Quality Checks */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold flex items-center gap-2 text-slate-100">
              ✅ Data Quality Checks
            </h3>
            <div className="space-y-2">
              {dataQualityChecks.map((check, i) => (
                <div key={i} className="flex items-center gap-3 p-2 bg-muted/30 rounded">
                  {getStatusIcon(check.status)}
                  <div className="flex-1">
                    <p className="text-sm font-medium">{check.label}</p>
                    <p className="text-xs text-muted-foreground">{check.message}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Contract Security Data */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Contract Security Data
              </h3>
              <Switch
                checked={includeContractSecurity}
                onCheckedChange={setIncludeContractSecurity}
                aria-label="Include contract security"
              />
            </div>
            {includeContractSecurity && (
              <div className="space-y-2">
                {isFetchingContracts && (
                  <div className="flex items-center gap-2 p-3 bg-blue-500/10 border border-blue-500/20 rounded">
                    <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                    <p className="text-sm">Fetching contract security data for {Object.keys(tokenCounts).length} tokens...</p>
                  </div>
                )}
                {contractsFetched && contractSecurityData.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 p-2 bg-green-500/10 border border-green-500/20 rounded">
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                      <p className="text-sm">Successfully fetched {contractSecurityData.length} contract security records</p>
                    </div>
                    {contractSecurityData.slice(0, 5).map((data, i) => (
                      <div key={i} className="flex items-center justify-between p-2 bg-muted/30 rounded text-xs">
                        <div className="flex items-center gap-2">
                          <Badge variant={data.isScam ? 'destructive' : data.isVerified ? 'default' : 'outline'}>
                            {data.isScam ? '🚨 SCAM' : data.isVerified ? '✓ Verified' : '✗ Not Verified'}
                          </Badge>
                          <span className="font-medium">{data.symbol}</span>
                          {data.isProxy && <span className="text-yellow-500">⚠️ Proxy</span>}
                        </div>
                        {data.price && (
                          <span className="text-muted-foreground">${parseFloat(data.price).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 })}</span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
                {contractFetchError && (
                  <div className="flex items-center gap-2 p-2 bg-red-500/10 border border-red-500/20 rounded">
                    <AlertCircle className="h-4 w-4 text-red-500" />
                    <p className="text-sm text-red-500">{contractFetchError}</p>
                  </div>
                )}
                <p className="text-xs text-muted-foreground">
                  ⚠️ Requires {Object.keys(tokenCounts).length} additional API calls to Blockscout
                </p>
              </div>
            )}
          </div>

          {/* Top Tokens with Verification Links */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold flex items-center gap-2">
                🪙 Token List
              </h3>
              <Switch
                checked={includeTokenList}
                onCheckedChange={setIncludeTokenList}
                aria-label="Include token list"
              />
            </div>
            {includeTokenList && (
              <p className="text-xs text-muted-foreground">
                {Object.keys(tokenCounts).length} unique tokens: {Object.keys(tokenCounts).slice(0, 5).join(', ')}{Object.keys(tokenCounts).length > 5 ? '...' : ''}
              </p>
            )}
          </div>

          {/* Recent Transfers with Links */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold flex items-center gap-2">
                🔗 Recent Transfers
              </h3>
              <Switch
                checked={includeRecentTransfers}
                onCheckedChange={setIncludeRecentTransfers}
                aria-label="Include recent transfers"
              />
            </div>
            {includeRecentTransfers && (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {safeTransfers.slice(0, 5).map((transfer, i) => (
                  <div key={i} className="flex items-center justify-between p-2 bg-muted/30 rounded text-xs">
                    <div className="flex-1">
                      <p className="font-medium">
                        {transfer.token.symbol}: ${((transfer.valueUsd || 0) / 1000).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}K
                      </p>
                      <p className="text-muted-foreground">
                        {transfer.chainName} • {transfer.timestamp ? new Date(transfer.timestamp).toLocaleString() : 'N/A'}
                      </p>
                    </div>
                    <a
                      href={getExplorerUrl(transfer.chainId, transfer.hash, 'tx')}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-primary hover:underline"
                    >
                      View Tx
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Data Sources */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold flex items-center gap-2">
                📡 Data Sources
              </h3>
              <Switch
                checked={includeDataSources}
                onCheckedChange={setIncludeDataSources}
                aria-label="Include data sources"
              />
            </div>
            {includeDataSources && (
              <p className="text-xs text-muted-foreground">
                MCP: {safeTransfers.filter(t => t.dataSource === 'mcp').length} transfers, 
                HTTP: {safeTransfers.filter(t => t.dataSource === 'http').length} transfers
              </p>
            )}
          </div>

          {/* Summary */}
          <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg space-y-2">
            <p className="text-sm font-semibold">📤 Data to be sent to AI:</p>
            <ul className="text-xs text-muted-foreground space-y-1 ml-4">
              {includeStats && <li>✓ Whale activity statistics</li>}
              {includeTopWhales && <li>✓ Top {safeTopWhales.length} whale addresses</li>}
              {includeTokenList && <li>✓ {Object.keys(tokenCounts).length} unique tokens</li>}
              {includeContractSecurity && contractsFetched && <li>✓ Contract security data ({contractSecurityData.length} tokens)</li>}
              {includeContractSecurity && !contractsFetched && <li>⏳ Contract security data (pending)</li>}
              {includeRecentTransfers && <li>✓ Recent {Math.min(5, safeTransfers.length)} transfers</li>}
              {includeDataSources && <li>✓ Data source breakdown</li>}
            </ul>
            <p className="text-xs text-muted-foreground mt-2">
              Estimated: ~{Math.round(1000 + (includeContractSecurity && contractsFetched ? contractSecurityData.length * 50 : 0))} tokens
            </p>
          </div>

          {/* AI Configuration Info */}
          <div className="p-3 bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-purple-500/20 rounded-lg space-y-3">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-purple-500" />
              <p className="text-sm font-semibold">AI Configuration</p>
            </div>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="space-y-1">
                <p className="text-muted-foreground">Provider</p>
                <p className="font-medium capitalize">
                  {aiProvider === 'openai' && '🤖 OpenAI'}
                  {aiProvider === 'anthropic' && '🧠 Anthropic'}
                  {aiProvider === 'google' && '🔍 Google AI'}
                  {aiProvider === 'custom' && '⚙️ Custom'}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-muted-foreground">Model</p>
                <p className="font-medium font-mono">{aiModel}</p>
              </div>
              <div className="space-y-1">
                <p className="text-muted-foreground">API Key</p>
                <div className="flex items-center gap-1">
                  {hasApiKey ? (
                    <>
                      <span className="h-2 w-2 rounded-full bg-green-500" />
                      <span className="font-medium text-green-600">Configured</span>
                    </>
                  ) : (
                    <>
                      <span className="h-2 w-2 rounded-full bg-red-500" />
                      <span className="font-medium text-red-600">Not Set</span>
                    </>
                  )}
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-muted-foreground">Est. Cost</p>
                <p className="font-medium">
                  ~${((Math.round(1000 + (includeContractSecurity && contractsFetched ? contractSecurityData.length * 50 : 0)) / 1000) * 0.00015).toFixed(4)}
                </p>
              </div>
            </div>
          </div>

          {/* Privacy Notice */}
          <div className="p-3 bg-muted/50 rounded-lg">
            <p className="text-xs text-muted-foreground">
              <strong>Privacy:</strong> Your API key is stored locally and never sent to our servers. 
              Data is sent directly to your chosen AI provider.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancel
          </Button>
          <Button 
            onClick={handleConfirm} 
            disabled={loading || (includeContractSecurity && isFetchingContracts)}
          >
            {loading ? 'Generating...' : isFetchingContracts ? 'Fetching Contracts...' : '✨ Generate AI Insights'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}