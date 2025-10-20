'use client';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, AlertCircle, Info, ExternalLink } from 'lucide-react';
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

interface AIInsightsChecklistDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transfers: Transfer[];
  stats: Stats | null;
  topWhales: TopWhale[];
  onConfirm: () => void;
  loading?: boolean;
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
  // Safety checks - prevent errors if data not loaded
  const safeTransfers = transfers || [];
  const safeStats = stats || { totalTransfers: 0, totalVolume: 0, largestTransfer: 0, uniqueWhales: 0 };
  const safeTopWhales = topWhales || [];

  // Get top 5 tokens by transfer count
  const tokenCounts: Record<string, { count: number; sample: Transfer }> = {};
  safeTransfers.forEach(t => {
    const symbol = t.token.symbol;
    if (!tokenCounts[symbol]) {
      tokenCounts[symbol] = { count: 0, sample: t };
    }
    tokenCounts[symbol].count++;
  });

  const topTokens = Object.entries(tokenCounts)
    .sort(([, a], [, b]) => b.count - a.count)
    .slice(0, 5)
    .map(([symbol, data]) => ({
      symbol,
      count: data.count,
      address: data.sample.token.address,
      chainId: data.sample.chainId,
      chainName: data.sample.chainName,
    }));

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
            <h3 className="text-sm font-semibold flex items-center gap-2">
              📊 Data Summary
            </h3>
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

          {/* Data Quality Checks */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold flex items-center gap-2">
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

          {/* Top Tokens with Verification Links */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              🪙 Top Tokens (Contract Verification)
            </h3>
            <p className="text-xs text-muted-foreground">
              AI will automatically fetch security data for the top 3 tokens
            </p>
            <div className="space-y-2">
              {topTokens.map((token, i) => (
                <div key={i} className="flex items-center justify-between p-2 bg-muted/30 rounded">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{i + 1}</Badge>
                    <div>
                      <p className="text-sm font-medium">{token.symbol}</p>
                      <p className="text-xs text-muted-foreground">
                        {token.count.toLocaleString()} transfers on {token.chainName}
                      </p>
                    </div>
                  </div>
                  <a
                    href={getExplorerUrl(token.chainId, token.address, 'address')}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-xs text-primary hover:underline"
                  >
                    Verify Contract
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Transfers with Links */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              🔗 Recent Transfers (Verify on Explorer)
            </h3>
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
          </div>

          {/* What AI Will Analyze */}
          <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg space-y-2">
            <p className="text-sm font-semibold">🤖 AI Will Analyze:</p>
            <ul className="text-xs text-muted-foreground space-y-1 ml-4">
              <li>• Transfer patterns and trends across all {safeTransfers.length.toLocaleString()} transfers</li>
              <li>• Token distribution and most active tokens</li>
              <li>• Top {safeTopWhales.length.toLocaleString()} whale addresses and their behavior</li>
              <li>• Contract security data (verification, scam detection, proxy status) for top 3 tokens</li>
              <li>• Market data (prices, market caps) from Blockscout</li>
              <li>• Data source information (MCP vs HTTP)</li>
            </ul>
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
          <Button onClick={onConfirm} disabled={loading}>
            {loading ? 'Generating...' : 'Generate AI Insights'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}