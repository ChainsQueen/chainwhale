import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock } from "lucide-react";
import { ChainBadge } from "@/components/ui/chain-badge";
import { DataSourceBadge } from "@/components/ui/data-source-badge";
import { ValueDisplay } from "@/components/ui/value-display";
import { ExplorerLink } from "@/components/ui/explorer-link";
import { ContractInfoDialog } from "@/components/features/contract/contract-info-dialog";
import { AddressPill } from "@/components/ui/address-pill";
import { CopyButton } from "@/components/ui/copy-button";
import { getChainName, getExplorerUrl } from "@/core/utils/wallet-utils";
import { motion, AnimatePresence } from "framer-motion";
import { AnimatedHover } from "@/components/ui/animated-hover";

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
    <div className="space-y-4">
      {/* Section Header */}
      <div className="flex items-center gap-2">
        <Clock className="h-5 w-5" />
        <h3 className="text-lg font-semibold">Recent Activity (24h)</h3>
        <span className="text-sm text-muted-foreground ml-2">
          {recentTransactions.length} transfers
        </span>
      </div>

      {/* Transaction Cards */}
      <AnimatePresence mode="wait">
        {recentTransactions.slice(0, 15).map((tx, index) => {
          const txData = tx as Record<string, unknown>;
          const isIncoming =
            (txData.to as string)?.toLowerCase() ===
            walletAddress.toLowerCase();

          const tokenData = txData.token as Record<string, unknown>;
          const fromAddr = txData.from as string;
          const toAddr = txData.to as string;
          const chainId = txData.chainId as string;
          const valueUsd = txData.valueUsd as number;
          const timestamp = txData.timestamp as number;
          const dataSource = txData.dataSource as "mcp" | "http" | undefined;
          const tokenAddress = (tokenData?.address as string) || "";
          const tokenSymbol = (tokenData?.symbol as string) || "Unknown";
          const tokenName = tokenData?.name as string;
          const tokenValue = txData.value as string;
          const tokenDecimals = tokenData?.decimals as string;
          const exchangeRate = tokenData?.exchangeRate as string | undefined;

          return (
            <motion.div
              key={`${txData.hash}-${index}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.4, delay: index * 0.05 }}
            >
              <AnimatedHover type="card">
                <Card
                  key={`${txData.hash}-${index}`}
                  className="hover:shadow-lg transition-shadow border border-blue-500/20 hover:border-blue-500/40"
                >
                  <CardContent className="p-3">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4">
                      <div className="flex-1 space-y-3">
                        {/* Badges Row */}
                        <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                          <Badge
                            variant="outline"
                            className={`text-[10px] sm:text-xs px-1.5 py-0.5 ${
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
                          <ChainBadge
                            chainName={getChainName(chainId)}
                            size="sm"
                          />
                          <DataSourceBadge dataSource={dataSource} size="sm" />
                          <Badge
                            variant="outline"
                            className="text-[10px] sm:text-xs px-1.5 py-0.5"
                          >
                            {tokenSymbol}
                          </Badge>

                          {/* Contract Info Dialog */}
                          {tokenAddress && tokenAddress !== "native" && (
                            <ContractInfoDialog
                              tokenAddress={tokenAddress}
                              tokenName={tokenName}
                              tokenSymbol={tokenSymbol}
                              tokenDecimals={tokenData?.decimals as number}
                              chainId={chainId}
                              chainName={getChainName(chainId)}
                            />
                          )}
                        </div>

                        {/* Direction relative to analyzed wallet */}
                        <div className="flex items-center gap-1.5 sm:gap-2 text-[10px] sm:text-xs text-muted-foreground">
                          <span className="lowercase">
                            {isIncoming ? "from" : "to"}
                          </span>
                          <AddressPill
                            address={isIncoming ? fromAddr : toAddr}
                          />
                          <CopyButton
                            text={isIncoming ? fromAddr : toAddr}
                            variant="ghost"
                            size="icon"
                            className="h-5 w-5"
                            title="Copy address"
                          />
                        </div>

                        {/* Token Name */}
                        {tokenName && (
                          <p className="text-[10px] sm:text-xs text-muted-foreground">
                            {tokenName}
                          </p>
                        )}
                      </div>

                      {/* Right: Value and Explorer Link */}
                      <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-1 sm:gap-2 sm:text-right">
                        <ExplorerLink
                          href={
                            txData.hash
                              ? getExplorerUrl(
                                  chainId,
                                  txData.hash as string,
                                  "tx"
                                )
                              : undefined
                          }
                          disabled={!txData.hash || txData.hash === ""}
                        />
                        <ValueDisplay
                          value={valueUsd}
                          tokenAmount={tokenValue}
                          tokenSymbol={tokenSymbol}
                          tokenDecimals={tokenDecimals}
                          exchangeRate={exchangeRate}
                          size="md"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </AnimatedHover>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
