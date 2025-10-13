'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, TrendingUp, TrendingDown, ArrowLeftRight } from 'lucide-react';
import type { WhaleTransfer } from '@/core/services/whale-service';

interface WhaleTrackerCardProps {
  transfer: WhaleTransfer;
}

export function WhaleTrackerCard({ transfer }: WhaleTrackerCardProps) {
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
      return <TrendingUp className="w-4 h-4 text-green-500" />;
    }
    if (transfer.valueUsd && transfer.valueUsd > 200000) {
      return <TrendingDown className="w-4 h-4 text-orange-500" />;
    }
    return <ArrowLeftRight className="w-4 h-4 text-blue-500" />;
  };

  const getValueColor = () => {
    if (!transfer.valueUsd) return 'text-muted-foreground';
    if (transfer.valueUsd >= 1000000) return 'text-green-600 dark:text-green-400';
    if (transfer.valueUsd >= 500000) return 'text-orange-600 dark:text-orange-400';
    return 'text-blue-600 dark:text-blue-400';
  };

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          {/* Left: Transfer Info */}
          <div className="flex-1 space-y-2">
            {/* Header */}
            <div className="flex items-center gap-2">
              {getTransferIcon()}
              <Badge variant="secondary" className="text-xs">
                {transfer.chainName}
              </Badge>
              <Badge variant="outline" className="text-xs">
                {transfer.token.symbol}
              </Badge>
              <span className="text-xs text-muted-foreground">
                {formatTime(transfer.timestamp)}
              </span>
            </div>

            {/* Addresses */}
            <div className="flex items-center gap-2 text-sm">
              <code className="px-2 py-1 bg-muted rounded text-xs font-mono">
                {formatAddress(transfer.from)}
              </code>
              <ArrowRight className="w-4 h-4 text-muted-foreground" />
              <code className="px-2 py-1 bg-muted rounded text-xs font-mono">
                {formatAddress(transfer.to)}
              </code>
            </div>

            {/* Token Name */}
            {transfer.token.name && (
              <p className="text-xs text-muted-foreground">
                {transfer.token.name}
              </p>
            )}
          </div>

          {/* Right: Value */}
          <div className="text-right">
            <p className={`text-lg font-bold ${getValueColor()}`}>
              {transfer.valueUsd ? formatValue(transfer.valueUsd) : 'N/A'}
            </p>
            <a
              href={`https://etherscan.io/tx/${transfer.hash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-primary hover:underline"
            >
              View TX
            </a>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
