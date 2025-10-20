"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Search,
  Wallet,
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  Clock,
  ExternalLink,
} from "lucide-react";
import { motion } from "framer-motion";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ContractInfoDialog } from "@/components/features/contract/contract-info-dialog";
import { DataSourceBadge } from "@/components/ui/data-source-badge";
import { ChainBadge } from "@/components/ui/chain-badge";
import { CopyButton } from "@/components/ui/copy-button";
import type { WalletAnalysis as WalletAnalysisType } from "@/lib/shared/types";
import { useWalletAnalysis } from "@/core/hooks/use-wallet-analysis";
import { useApiKey } from "@/core/hooks/use-api-key";
import { useAiInsights } from "@/core/hooks/use-ai-insights";
import { useAddressInput } from "@/core/hooks/use-address-input";
import {
  validateAddress,
  getExplorerUrl,
  getChainName,
  formatEthBalance,
  formatUsdValue,
  getRiskColor,
  getRiskLabel,
} from "@/core/utils/wallet-utils";
import { DEFAULT_CHAIN_ID } from "@/core/constants/chains.constants";

export default function WalletAnalysis() {
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
    return "just now";
  };

  // Custom hooks for separation of concerns
  const {
    analysis,
    holdings,
    ensName,
    recentTransactions,
    isLoading,
    error,
    analyzeWallet,
  } = useWalletAnalysis();
  const { hasApiKey } = useApiKey();
  const {
    aiInsights,
    isGenerating: isGeneratingAI,
    generateInsights,
  } = useAiInsights();
  const { address, isValidAddress, handleAddressChange } = useAddressInput();

  const [updatedAnalysis, setUpdatedAnalysis] =
    useState<WalletAnalysisType | null>(null);

  // Use updated analysis if AI has been generated, otherwise use original
  const displayAnalysis = updatedAnalysis || analysis;

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!address.trim() || isLoading) return;

    await analyzeWallet(address, ["1", "8453", "42161", "10", "137"]);
    setUpdatedAnalysis(null);
  };

  const handleGenerateAI = async () => {
    if (!displayAnalysis || isGeneratingAI) return;

    try {
      const result = await generateInsights({
        address: displayAnalysis.address,
        holdings,
        recentTransactions,
        totalValue: displayAnalysis.totalValue,
        chains: displayAnalysis.chains,
      });

      if (result.riskScore) {
        setUpdatedAnalysis({
          ...displayAnalysis,
          riskScore: result.riskScore,
          summary: result.summary || displayAnalysis.summary,
        });
      }
    } catch {
      // Error handled in hook
    }
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
              <Button
                type="submit"
                disabled={isLoading || !address.trim() || !isValidAddress}
              >
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
          {displayAnalysis && !isLoading && (
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
                    <p className="text-sm text-muted-foreground mb-1">
                      Address
                    </p>
                    {ensName && (
                      <p className="text-lg font-semibold mb-2 text-primary">
                        {ensName}
                      </p>
                    )}
                    <div className="flex flex-wrap items-center gap-2">
                      <TooltipProvider>
                        <div className="inline-flex items-center gap-2 bg-muted rounded px-3 py-2">
                          <code className="text-xs font-mono break-all">
                            {displayAnalysis.address}
                          </code>
                          <CopyButton
                            text={displayAnalysis.address}
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 flex-shrink-0"
                          />
                        </div>
                      </TooltipProvider>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                window.open(
                                  getExplorerUrl(DEFAULT_CHAIN_ID, displayAnalysis.address),
                                  "_blank"
                                )
                              }
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
                        const ethHoldings = holdings.filter(
                          (h) => h.symbol === "ETH" && h.address === "native"
                        );
                        const ethBalance = ethHoldings.reduce(
                          (sum, h) => sum + parseFloat(h.balance),
                          0
                        );
                        const ethValue = ethHoldings.reduce(
                          (sum, h) => sum + h.value,
                          0
                        );
                        const tokenValue = holdings
                          .filter((h) => h.address !== "native")
                          .reduce((sum, h) => sum + h.value, 0);
                        const tokenCount = holdings.filter(
                          (h) => h.address !== "native"
                        ).length;

                        return (
                          <>
                            {ethBalance > 0 && (
                              <>
                                <div className="p-4 bg-muted/30 rounded-lg">
                                  <p className="text-xs text-muted-foreground mb-1">
                                    ETH BALANCE
                                  </p>
                                  <p className="text-lg font-bold">
                                    {formatEthBalance(ethBalance)} ETH
                                  </p>
                                </div>
                                <div className="p-4 bg-muted/30 rounded-lg">
                                  <p className="text-xs text-muted-foreground mb-1">
                                    ETH VALUE
                                  </p>
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
                                <p className="text-xs text-muted-foreground mb-1">
                                  TOKEN HOLDINGS
                                </p>
                                <p className="text-lg font-bold text-primary">
                                  ${formatUsdValue(tokenValue)}
                                </p>
                                <p className="text-xs text-muted-foreground mt-1">
                                  ({tokenCount}{" "}
                                  {tokenCount === 1 ? "Token" : "Tokens"})
                                </p>
                              </div>
                            )}
                            {displayAnalysis.totalValue > 0 && (
                              <div className="p-4 bg-primary/10 rounded-lg border border-primary/20">
                                <p className="text-xs text-muted-foreground mb-1">
                                  MULTICHAIN INFO
                                </p>
                                <p className="text-lg font-bold text-primary">
                                  ${formatUsdValue(displayAnalysis.totalValue)}
                                </p>
                                <p className="text-xs text-muted-foreground mt-1">
                                  {Object.keys(displayAnalysis.chains).length}{" "}
                                  {Object.keys(displayAnalysis.chains)
                                    .length === 1
                                    ? "chain"
                                    : "chains"}{" "}
                                  scanned
                                </p>
                              </div>
                            )}
                          </>
                        );
                      })()}
                    </div>
                  )}

                  {/* Whale Detection */}
                  {displayAnalysis.insights &&
                    displayAnalysis.insights[0]?.includes("Whale Category") && (
                      <div className="p-6 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-lg border border-blue-500/20">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="p-3 bg-blue-500/10 rounded-full">
                              <Wallet className="h-6 w-6 text-blue-500" />
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground mb-1">
                                Whale Detection
                              </p>
                              <p className="font-semibold text-xl">
                                {displayAnalysis.insights[0]
                                  .split(":")[1]
                                  ?.split("(")[0]
                                  ?.trim() || "Unknown"}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-muted-foreground mb-1">
                              Score
                            </p>
                            <p className="text-2xl font-bold text-blue-500">
                              {displayAnalysis.insights[0].match(
                                /Score: (\d+)/
                              )?.[1] || "0"}
                              /100
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
                          <p className="text-xs text-muted-foreground mb-1">
                            Risk Assessment
                          </p>
                          <p className="font-semibold text-xl">
                            {getRiskLabel(displayAnalysis.riskScore)}
                          </p>
                        </div>
                      </div>
                      <Badge
                        variant="outline"
                        className={`${getRiskColor(
                          displayAnalysis.riskScore
                        )} text-lg px-4 py-2`}
                      >
                        {displayAnalysis.riskScore}/100
                      </Badge>
                    </div>
                    <div className="space-y-2">
                      <div className="h-3 bg-muted rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all ${
                            displayAnalysis.riskScore < 30
                              ? "bg-green-500"
                              : displayAnalysis.riskScore < 70
                              ? "bg-yellow-500"
                              : "bg-red-500"
                          }`}
                          style={{ width: `${displayAnalysis.riskScore}%` }}
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
                              window.location.href = "/dashboard?tab=settings";
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
                              <span
                                className="ml-1 h-2 w-2 rounded-full bg-green-500"
                                title="API Key configured"
                              />
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
                    <p className="text-sm leading-relaxed whitespace-pre-line">
                      {aiInsights || displayAnalysis.summary}
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Chain Distribution - Only show if there's value */}
              {Object.keys(displayAnalysis.chains).length > 0 &&
                Object.values(displayAnalysis.chains).some(
                  (v) => (v as number) > 0
                ) && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Chain Distribution</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {Object.entries(displayAnalysis.chains)
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
                            <p className="font-medium">
                              $
                              {holding.value.toLocaleString(undefined, {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}
                            </p>
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
                    <CardDescription>
                      {recentTransactions.length} token transfers in the last 24
                      hours
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {recentTransactions.slice(0, 15).map((tx, index) => {
                        const txData = tx as Record<string, unknown>;
                        const isIncoming =
                          (txData.to as string)?.toLowerCase() ===
                          displayAnalysis.address.toLowerCase();
                        const decimals = parseInt(
                          ((txData.token as Record<string, unknown>)
                            ?.decimals as string) || "18"
                        );
                        const tokenAmount = txData.value
                          ? (
                              parseFloat(txData.value as string) /
                              Math.pow(10, decimals)
                            ).toFixed(4)
                          : "0";

                        const tokenData = txData.token as Record<
                          string,
                          unknown
                        >;
                        const fromAddr = txData.from as string;
                        const toAddr = txData.to as string;
                        const chainId = txData.chainId as string;
                        const valueUsd = txData.valueUsd as number;
                        const timestamp = txData.timestamp as number;
                        const dataSource = txData.dataSource as
                          | "mcp"
                          | "http"
                          | undefined;
                        const tokenAddress =
                          (tokenData?.address as string) || "";

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
                                <ChainBadge
                                  chainName={getChainName(chainId)}
                                  size="sm"
                                />
                                <DataSourceBadge
                                  dataSource={dataSource}
                                  size="sm"
                                />
                                {tokenAddress && tokenAddress !== "native" && (
                                  <ContractInfoDialog
                                    tokenAddress={tokenAddress}
                                    tokenName={tokenData?.name as string}
                                    tokenSymbol={
                                      (tokenData?.symbol as string) || "Unknown"
                                    }
                                    tokenDecimals={
                                      tokenData?.decimals as number
                                    }
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
              )}

              {/* Insights */}
              {displayAnalysis.insights.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Key Insights</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {displayAnalysis.insights.map((insight, index) => (
                        <div
                          key={index}
                          className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg"
                        >
                          {displayAnalysis.riskScore < 50 ? (
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
          {!displayAnalysis && !isLoading && !error && (
            <div className="flex flex-col items-center justify-center h-[400px] text-center text-muted-foreground">
              <Wallet className="h-12 w-12 mb-4 opacity-50" />
              <p className="text-lg font-medium">
                Enter a wallet address to analyze
              </p>
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
