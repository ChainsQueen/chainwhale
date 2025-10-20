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
import { Skeleton } from "@/components/ui/skeleton";
import {
  Search,
  Wallet,
  AlertTriangle,
  CheckCircle,
  TrendingUp,
} from "lucide-react";
import { motion } from "framer-motion";
import { WalletOverview } from "@/components/dashboard/wallet/wallet-overview";
import { PortfolioBreakdown } from "@/components/dashboard/wallet-overview-section";
import { WhaleDetectionSection } from "@/components/dashboard/wallet/whale-detection-section";
import { RiskAssessmentSection } from "@/components/dashboard/wallet/risk-assessment-section";
import { TokenHoldingsSection } from "@/components/dashboard/wallet/token-holdings-section";
import { RecentActivitySection } from "@/components/dashboard/wallet/recent-activity-section";
import type { WalletAnalysis as WalletAnalysisType } from "@/lib/shared/types";
import { useWalletAnalysis } from "@/core/hooks/use-wallet-analysis";
import { useApiKey } from "@/core/hooks/use-api-key";
import { useAiInsights } from "@/core/hooks/use-ai-insights";
import { useAddressInput } from "@/core/hooks/use-address-input";
import { getChainName } from "@/core/utils/wallet-utils";

export default function WalletAnalysis() {

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
                  <WalletOverview
                    address={displayAnalysis.address}
                    ensName={ensName}
                  />

                  {/* Portfolio Breakdown */}
                  <PortfolioBreakdown
                    holdings={holdings}
                    totalValue={displayAnalysis.totalValue}
                    chainCount={Object.keys(displayAnalysis.chains).length}
                  />

                  {/* Whale Detection */}
                  <WhaleDetectionSection insights={displayAnalysis.insights} />

                  {/* Risk Assessment */}
                  <RiskAssessmentSection
                    riskScore={displayAnalysis.riskScore}
                  />

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
              <TokenHoldingsSection holdings={holdings} />

              {/* Recent Transactions */}
              <RecentActivitySection
                recentTransactions={recentTransactions}
                walletAddress={displayAnalysis.address}
              />

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
