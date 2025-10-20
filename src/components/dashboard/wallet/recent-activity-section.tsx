import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, ExternalLink } from "lucide-react";
import { ChainBadge } from "@/components/ui/chain-badge";
import { DataSourceBadge } from "@/components/ui/data-source-badge";
import { CopyButton } from "@/components/ui/copy-button";
import { ContractInfoDialog } from "@/components/features/contract/contract-info-dialog";
import { getChainName, formatUsdValue } from "@/core/utils/wallet-utils";

interface RecentActivitySectionProps {
  recentTransactions: unknown[];
  walletAddress: string;
}

function getRelativeTime(timestamp: number) {
  const now = Date.now();
  const diff = now - timestamp;
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (minutes > 0) return `${minutes}m ago`;
  return "just now";
}

export function RecentActivitySection({
  recentTransactions,
  walletAddress,
}: RecentActivitySectionProps) {
  if (recentTransactions.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Recent Activity (24h)
        </CardTitle>
        <CardDescription>
          {recentTransactions.length} token transfers in the last 24 hours
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {recentTransactions.slice(0, 15).map((tx, index) => {
            const txData = tx as Record<string, unknown>;
            const isIncoming =
              (txData.to as string)?.toLowerCase() ===
              walletAddress.toLowerCase();
            const decimals = parseInt(
              ((txData.token as Record<string, unknown>)?.decimals as string) ||
                "18"
            );
            const tokenAmount = txData.value
              ? (
                  parseFloat(txData.value as string) / Math.pow(10, decimals)
                ).toFixed(4)
              : "0";

            const tokenData = txData.token as Record<string, unknown>;
            const fromAddr = txData.from as string;
            const toAddr = txData.to as string;
            const chainId = txData.chainId as string;
            const valueUsd = txData.valueUsd as number;
            const timestamp = txData.timestamp as number;
            const dataSource = txData.dataSource as "mcp" | "http" | undefined;
            const tokenAddress = (tokenData?.address as string) || "";

            return (
              <div
                key={`${txData.hash}-${index}`}
                className="flex items-center justify-between p-3 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge
                      variant="outline"
                      className={`text-xs ${
                        isIncoming
                          ? "bg-green-500/10 text-green-500 border-green-500/20"
                          : "bg-red-500/10 text-red-500 border-red-500/20"
                      }`}
                    >
                      {isIncoming ? "↓ IN" : "↑ OUT"}
                    </Badge>
                    {timestamp && (
                      <Badge
                        variant="secondary"
                        className="text-[10px] sm:text-xs px-1.5 py-0.5 bg-muted"
                        suppressHydrationWarning
                      >
                        {getRelativeTime(timestamp)}
                      </Badge>
                    )}
                    <ChainBadge chainName={getChainName(chainId)} size="sm" />
                    <DataSourceBadge dataSource={dataSource} size="sm" />
                    {tokenAddress && tokenAddress !== "native" && (
                      <ContractInfoDialog
                        tokenAddress={tokenAddress}
                        tokenName={tokenData?.name as string}
                        tokenSymbol={(tokenData?.symbol as string) || "Unknown"}
                        tokenDecimals={tokenData?.decimals as number}
                        chainId={chainId}
                        chainName={getChainName(chainId)}
                      />
                    )}
                  </div>

                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-muted-foreground text-xs">
                      {isIncoming ? "From" : "To"}:
                    </span>
                    <code className="text-xs font-mono bg-muted rounded px-2 py-1">
                      {isIncoming ? fromAddr : toAddr}
                    </code>
                    <CopyButton
                      text={isIncoming ? fromAddr : toAddr}
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 flex-shrink-0"
                    />
                    <span className="font-medium ml-auto">
                      {tokenAmount} {(tokenData?.symbol as string) || "tokens"}
                      {valueUsd && valueUsd > 0 && (
                        <span className="text-primary ml-2">
                          (${formatUsdValue(valueUsd)})
                        </span>
                      )}
                    </span>
                  </div>
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
  );
}
