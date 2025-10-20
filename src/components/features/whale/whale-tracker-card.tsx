'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ContractInfoDialog } from '@/components/features/contract/contract-info-dialog';
import { DataSourceBadge } from '@/components/ui/data-source-badge';
import { ChainBadge } from '@/components/ui/chain-badge';
import { AddressFlow } from '@/components/ui/address-flow';
import { ValueDisplay } from '@/components/ui/value-display';
import { ExplorerLink } from '@/components/ui/explorer-link';
import { TransferTypeIndicator } from '@/components/features/whale/transfer-type-indicator';
import type { WhaleTransfer } from '@/core/services/whale-service';

interface WhaleTrackerCardProps {
  transfer: WhaleTransfer;
}

export function WhaleTrackerCard({ transfer }: WhaleTrackerCardProps) {
  const getRelativeTime = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'just now';
  };

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardContent className="p-3 sm:p-4">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4">
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
              <TransferTypeIndicator
                valueUsd={transfer.valueUsd}
                hash={transfer.hash}
                chainId={transfer.chainId}
              />
              {transfer.timestamp && (
                <Badge variant="secondary" className="text-[10px] sm:text-xs px-1.5 py-0.5 bg-muted">
                  {getRelativeTime(transfer.timestamp)}
                </Badge>
              )}
              <ChainBadge chainName={transfer.chainName} size="sm" />
              <DataSourceBadge dataSource={transfer.dataSource} size="sm" />
              <Badge variant="outline" className="text-[10px] sm:text-xs px-1.5 py-0.5">
                {transfer.token.symbol}
              </Badge>
              
              {/* Contract Info Dialog */}
              <ContractInfoDialog
                tokenAddress={transfer.token.address}
                tokenName={transfer.token.name}
                tokenSymbol={transfer.token.symbol}
                tokenDecimals={transfer.token.decimals ? parseInt(transfer.token.decimals) : undefined}
                chainId={transfer.chainId}
                chainName={transfer.chainName}
              />
            </div>

            {/* Addresses */}
            <AddressFlow from={transfer.from} to={transfer.to} size="sm" />

            {/* Token Name */}
            {transfer.token.name && (
              <p className="text-[10px] sm:text-xs text-muted-foreground">
                {transfer.token.name}
              </p>
            )}

          </div>

          {/* Right: Value */}
          <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-1 sm:gap-2 sm:text-right">
            <ExplorerLink
              href={transfer.hash ? `https://etherscan.io/tx/${transfer.hash}` : undefined}
              disabled={!transfer.hash || transfer.hash === ''}
            />
            <ValueDisplay 
              value={transfer.valueUsd} 
              tokenAmount={transfer.value}
              tokenSymbol={transfer.token.symbol}
              tokenDecimals={transfer.token.decimals}
              size="md" 
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
