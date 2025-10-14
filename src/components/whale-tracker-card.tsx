'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, TrendingUp, TrendingDown, ArrowLeftRight, ExternalLink } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import type { WhaleTransfer } from '@/core/services/whale-service';

interface WhaleTrackerCardProps {
  transfer: WhaleTransfer;
}

export function WhaleTrackerCard({ transfer }: WhaleTrackerCardProps) {
  // Debug: Log transfer details
  console.log('[WhaleTrackerCard] Transfer:', {
    hash: transfer.hash,
    chainId: transfer.chainId,
    chainName: transfer.chainName,
    explorerUrl: transfer.hash ? `Chain ${transfer.chainId} explorer` : 'No hash'
  });
  
  if (!transfer.hash || transfer.hash === '') {
    console.warn('[WhaleTrackerCard] Missing transaction hash:', {
      from: transfer.from.substring(0, 10),
      to: transfer.to.substring(0, 10),
      chainId: transfer.chainId,
      value: transfer.valueUsd
    });
  }

  const formatAddress = (address: string) => {
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  const formatValue = (value: number) => {
    if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(2)}M`;
    }
    return `$${value.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
  };

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    return date.toLocaleDateString();
  };

  const getTransferIcon = () => {
    // Simple classification based on value
    if (transfer.valueUsd && transfer.valueUsd > 500000) {
      return {
        icon: <TrendingUp className="w-4 h-4 text-green-500" />,
        label: 'Mega Whale Move',
        description: 'Transfer > $500K'
      };
    }
    if (transfer.valueUsd && transfer.valueUsd > 200000) {
      return {
        icon: <TrendingDown className="w-4 h-4 text-orange-500" />,
        label: 'Large Whale Move',
        description: '$200K - $500K'
      };
    }
    return {
      icon: <ArrowLeftRight className="w-4 h-4 text-blue-500" />,
      label: 'Medium Whale Move',
      description: '$100K - $200K'
    };
  };

  const getValueColor = () => {
    if (!transfer.valueUsd) return 'text-muted-foreground';
    if (transfer.valueUsd >= 1000000) return 'text-green-600 dark:text-green-400';
    if (transfer.valueUsd >= 500000) return 'text-orange-600 dark:text-orange-400';
    return 'text-blue-600 dark:text-blue-400';
  };

  const getExplorerUrl = (chainId: string, txHash: string) => {
    const explorers: Record<string, string> = {
      '1': 'https://etherscan.io',
      '8453': 'https://basescan.org',
      '42161': 'https://arbiscan.io',
      '10': 'https://optimistic.etherscan.io',
      '137': 'https://polygonscan.com',
    };
    const baseUrl = explorers[chainId] || explorers['1'];
    const url = `${baseUrl}/tx/${txHash}`;
    console.log(`[Explorer URL] Chain ${chainId} (${transfer.chainName}): ${url}`);
    return url;
  };

  const transferIconData = getTransferIcon();

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardContent className="p-3 sm:p-4">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4">
          {/* Left: Transfer Info */}
          <div className="flex-1 space-y-2">
            {/* Header */}
            <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    {transfer.hash && transfer.hash !== '' ? (
                      <a
                        href={getExplorerUrl(transfer.chainId, transfer.hash)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="cursor-pointer hover:opacity-70 transition-opacity"
                      >
                        {transferIconData.icon}
                      </a>
                    ) : (
                      <div className="cursor-help">
                        {transferIconData.icon}
                      </div>
                    )}
                  </TooltipTrigger>
                  <TooltipContent>
                    <div className="text-xs">
                      <p className="font-semibold">{transferIconData.label}</p>
                      <p className="text-muted-foreground">{transferIconData.description}</p>
                      {transfer.hash && transfer.hash !== '' && (
                        <p className="text-primary mt-1">Click to view on explorer</p>
                      )}
                    </div>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <Badge variant="secondary" className="text-[10px] sm:text-xs px-1.5 py-0.5">
                {transfer.chainName}
              </Badge>
              <Badge variant="outline" className="text-[10px] sm:text-xs px-1.5 py-0.5">
                {transfer.token.symbol}
              </Badge>
              <span className="text-[10px] sm:text-xs text-muted-foreground">
                {formatTime(transfer.timestamp)}
              </span>
            </div>

            {/* Addresses */}
            <div className="flex items-center gap-1.5 sm:gap-2 text-sm flex-wrap">
              <code className="px-1.5 py-0.5 sm:px-2 sm:py-1 bg-muted rounded text-[10px] sm:text-xs font-mono break-all">
                {transfer.from}
              </code>
              <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4 text-muted-foreground shrink-0" />
              <code className="px-1.5 py-0.5 sm:px-2 sm:py-1 bg-muted rounded text-[10px] sm:text-xs font-mono break-all">
                {transfer.to}
              </code>
            </div>

            {/* Token Name */}
            {transfer.token.name && (
              <p className="text-[10px] sm:text-xs text-muted-foreground">
                {transfer.token.name}
              </p>
            )}
          </div>

          {/* Right: Value */}
          <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-1 sm:gap-2 sm:text-right">
            <a
              href={transfer.hash && transfer.hash !== '' ? getExplorerUrl(transfer.chainId, transfer.hash) : '#'}
              target={transfer.hash && transfer.hash !== '' ? '_blank' : '_self'}
              rel="noopener noreferrer"
              className={`${transfer.hash && transfer.hash !== '' ? 'text-primary hover:opacity-70 cursor-pointer' : 'text-muted-foreground cursor-not-allowed opacity-30'} transition-opacity`}
              onClick={(e) => {
                if (!transfer.hash || transfer.hash === '') {
                  e.preventDefault();
                }
              }}
            >
              <ExternalLink className="h-4 w-4" />
            </a>
            <p className={`text-base sm:text-lg font-bold ${getValueColor()}`}>
              {transfer.valueUsd ? formatValue(transfer.valueUsd) : 'N/A'}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
