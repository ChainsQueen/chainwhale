"use client";

import { useEffect, useState, useRef } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DataSourceBadge } from "@/components/ui/data-source-badge";
import { Activity, TrendingUp, Sparkles } from "lucide-react";
import { getExplorerUrl, formatVolume } from "@/core/utils/wallet-utils";
import { AppHeader } from "@/components/layouts/app-header";
import { SwimmingWhale } from "@/components/features/whale/swimming-whale";
import { FloatingInfoCard } from "@/components/features/whale/floating-info-card";
import { WalletAddressTooltip } from "@/components/ui/wallet-address-tooltip";
import { CelebrationAnimation } from "@/components/features/whale/celebration-animation";

import { useWhaleFeed } from "@/core/hooks/use-whale-feed";
import { FEATURES } from "@/core/constants/features.constants";

export default function Home() {
  // Use same data fetching logic as whale tracker
  // Fetch only Ethereum for fast loading (2-5 seconds)
  const { transfers, loading } = useWhaleFeed({
    selectedChains: ["1"], // Only Ethereum for speed
    timeRange: "1h",
    minValue: 10000,
    tokenFilter: "",
  });

  // Track previous largest transfer value for celebration animation
  const [showCelebration, setShowCelebration] = useState(false);
  const prevLargestValueRef = useRef<number | null>(null);

  // Get top 6 largest transfers sorted by amount
  const top6Transfers = [...(transfers || [])]
    .sort((a, b) => (b.valueUsd || 0) - (a.valueUsd || 0))
    .slice(0, 6);

  const largestTransfer = top6Transfers[0];

  // Map top 6 transfers to whale activity with tier colors
  // All transfers with max value = green, all with min value = blue
  const transferValues = top6Transfers
    .map((t) => t.valueUsd || 0)
    .filter((v) => v > 0);
  const maxValue = Math.max(...transferValues, 0);
  const minValue = Math.min(...transferValues.filter((v) => v > 0), Infinity);

  const whaleActivityWithTiers = top6Transfers.slice(0, 6).map((transfer) => {
    const value = transfer.valueUsd || 0;
    let tier: "largest" | "smallest" | "middle" = "middle";

    if (value > 0) {
      if (value === maxValue) {
        tier = "largest"; // All whales with max value = green
      } else if (value === minValue && transferValues.length > 1) {
        tier = "smallest"; // All whales with min value = blue
      }
    }

    return {
      volume: value,
      count: 1,
      tier,
      hash: transfer.hash,
      chainId: transfer.chainId,
    };
  });

  // Pad with empty whales if less than 6 transfers
  while (whaleActivityWithTiers.length < 6) {
    whaleActivityWithTiers.push({
      volume: 0,
      count: 0,
      tier: "middle",
      hash: "",
      chainId: "",
    });
  }

  // Log data fetching status
  useEffect(() => {
    console.log("[Home] Data status:", {
      loading,
      transfersCount: transfers?.length || 0,
      top6Count: top6Transfers.length,
      hasLargestTransfer: !!largestTransfer,
    });

    if (top6Transfers.length > 0) {
      console.log(
        "[Home] Top 6 largest transfers from Ethereum:",
        top6Transfers.map(
          (t) =>
            `$${(t.valueUsd || 0).toLocaleString()} (${
              t.token?.symbol || "Unknown"
            })`
        )
      );
    } else {
      console.warn("[Home] ⚠️ No transfers found!");
    }
  }, [loading, transfers, top6Transfers, largestTransfer]);

  // Force loading to false if we have data
  useEffect(() => {
    if (largestTransfer && loading) {
      console.warn(
        "[Home] ⚠️ Data exists but loading is still true! This is a bug in useWhaleFeed."
      );
    }
  }, [largestTransfer, loading]);

  // Debug: Log loading state and largestTransfer
  useEffect(() => {
    console.log("[Home] Render state:", {
      loading,
      transfersCount: transfers?.length || 0,
      top6Count: top6Transfers.length,
      hasLargestTransfer: !!largestTransfer,
      largestValue: largestTransfer?.valueUsd,
      largestToken: largestTransfer?.token?.symbol,
      largestHash: largestTransfer?.hash,
      largestFrom: largestTransfer?.from,
    });
  }, [loading, largestTransfer, transfers, top6Transfers]);

  // Trigger celebration animation on first load and when largest transfer amount changes
  useEffect(() => {
    const currentValue = largestTransfer?.valueUsd;
    
    if (currentValue) {
      // First load - trigger celebration when data first arrives
      if (prevLargestValueRef.current === null) {
        console.log('[Home] 🎉 Initial whale data loaded!', {
          value: currentValue,
        });
        setShowCelebration(true);
        setTimeout(() => setShowCelebration(false), 2000);
      }
      // Subsequent updates - only trigger if value increased
      else if (currentValue > prevLargestValueRef.current) {
        console.log('[Home] 🎉 New largest transfer detected!', {
          previous: prevLargestValueRef.current,
          current: currentValue,
        });
        setShowCelebration(true);
        setTimeout(() => setShowCelebration(false), 2000);
      }
    }
    
    // Update the ref with current value
    if (currentValue !== undefined) {
      prevLargestValueRef.current = currentValue;
    }
  }, [largestTransfer?.valueUsd]);
  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-blue-500/5 to-background">
      {/* Header with Navigation */}
      <AppHeader />

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-8 md:py-16 lg:py-24">
        <div className="grid lg:grid-cols-12 gap-8 md:gap-12 items-center">
          {/* Left Content */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="space-y-4 md:space-y-6 lg:col-span-5"
          >
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Badge className="mb-4 bg-blue-500/10 text-blue-600 border-blue-500/30 hover:bg-blue-500/20">
                <Sparkles className="w-3 h-3 mr-1" />
                AI-Powered Blockchain Analytics
              </Badge>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight"
            >
              Track Whale Movements Across{" "}
              <span className="bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text text-transparent">
                Multiple EVM Chains
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-base md:text-lg lg:text-xl text-muted-foreground"
            >
              Monitor large transfers ($10K+) in real-time across Ethereum,
              Base, Arbitrum, Optimism, and Polygon. Get AI-powered insights
              with comprehensive contract security analysis.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="flex flex-col sm:flex-row gap-3 md:gap-4"
            >
              <Button size="lg" className="text-base md:text-lg w-full sm:w-auto" asChild>
                <a href="/dashboard">🚀 Dashboard</a>
              </Button>
              <Button size="lg" variant="outline" className="text-base md:text-lg w-full sm:w-auto" asChild>
                <a href="/whales" className="flex items-center gap-2">
                  <Image
                    src="/whalelogo.png"
                    alt="Whale"
                    width={24}
                    height={24}
                    className="w-6 h-6"
                  />
                  Whale Tracker
                </a>
              </Button>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="flex flex-wrap items-center gap-4 md:gap-6 pt-2 md:pt-4 mb-8 md:mb-0"
            >
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                <span className="text-sm text-muted-foreground">
                  Live Tracking
                </span>
              </div>
              <div className="text-sm text-muted-foreground">
                <span className="font-semibold text-blue-600">5</span> EVM
                Chains Supported
              </div>
            </motion.div>
          </motion.div>

          {/* Right Image - Animated Swimming Whale */}
          <div className="relative min-h-[300px] md:min-h-[500px] lg:col-span-7 pt-4 md:pt-16 overflow-visible">
            {/* Celebration Animation - positioned above largest whale (first whale at 8% top) */}
            <div className="absolute top-[8%] left-[35%] -translate-x-1/2 -translate-y-full z-[60] pointer-events-none">
              <CelebrationAnimation show={showCelebration} />
            </div>
            
            {/* Whales in isolated background layer */}
            <div className="absolute inset-0 z-0 overflow-visible">
              <SwimmingWhale whaleActivity={whaleActivityWithTiers} />
            </div>

            {/* Floating Info Cards */}
            <div className="absolute inset-0 pointer-events-none">
              <FloatingInfoCard
                  icon={TrendingUp}
                  title="Whale Alert (1h)"
                  position="top-right"
                  duration={3}
                  badge={
                    largestTransfer?.dataSource ? (
                      <DataSourceBadge
                        dataSource={largestTransfer.dataSource}
                        size="xs"
                      />
                    ) : undefined
                  }
                >
                {loading && !largestTransfer ? (
                  <div className="flex flex-col gap-1">
                    <p className="text-xs text-muted-foreground">Loading...</p>
                  </div>
                ) : largestTransfer ? (
                  <div className="flex items-center gap-2 overflow-visible">
                    {/* Amount - clickable to view transaction */}
                    {largestTransfer.hash ? (
                      <a
                        href={getExplorerUrl(
                          largestTransfer.chainId || "1",
                          largestTransfer.hash,
                          "tx"
                        )}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-semibold text-green-600 hover:text-green-700 hover:underline cursor-pointer"
                      >
                        {formatVolume(largestTransfer.valueUsd ?? 0)}
                      </a>
                    ) : (
                      <p className="font-semibold text-green-600">
                        {formatVolume(largestTransfer.valueUsd ?? 0)}
                      </p>
                    )}

                    {/* Wallet icon with tooltip - uses portal to avoid rotation */}
                    {largestTransfer.from && (
                      <WalletAddressTooltip address={largestTransfer.from} />
                    )}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">No data</p>
                )}
              </FloatingInfoCard>
              
              {/* Desktop floating cards - Live Activity */}
              <FloatingInfoCard
                icon={Activity}
                title="Live Activity"
                position="bottom-left"
                duration={3.5}
                animationDelay={0.5}
              >
                <p className="font-semibold">5 EVM Chains</p>
              </FloatingInfoCard>
            </div>
            
            {/* Mobile-only info cards - below whale container - HIDDEN, using floating cards instead */}
            <div className="hidden mt-4 space-y-3">
              {largestTransfer && (
                <div className="bg-gradient-to-r from-blue-500/5 via-slate-500/5 to-blue-500/5 border border-blue-500/30 rounded-lg p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-blue-500" />
                      <div>
                        <p className="text-xs text-muted-foreground">Whale Alert (1h)</p>
                        <div className="flex items-center gap-2">
                          {largestTransfer.hash ? (
                            <a
                              href={getExplorerUrl(
                                largestTransfer.chainId || "1",
                                largestTransfer.hash,
                                "tx"
                              )}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="font-semibold text-green-600 hover:text-green-700 hover:underline cursor-pointer text-sm"
                            >
                              {formatVolume(largestTransfer.valueUsd ?? 0)}
                            </a>
                          ) : (
                            <p className="font-semibold text-green-600 text-sm">
                              {formatVolume(largestTransfer.valueUsd ?? 0)}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                    {largestTransfer.dataSource && (
                      <DataSourceBadge
                        dataSource={largestTransfer.dataSource}
                        size="xs"
                      />
                    )}
                  </div>
                </div>
              )}
              <div className="bg-gradient-to-r from-blue-500/5 via-slate-500/5 to-blue-500/5 border border-blue-500/30 rounded-lg p-3">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-blue-500" />
                  <div>
                    <p className="text-xs text-muted-foreground">Live Activity</p>
                    <p className="font-semibold text-sm">5 EVM Chains</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="container mx-auto px-4 py-12 md:py-16">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4">
            Real-Time Blockchain Intelligence
          </h2>
          <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto">
            Monitor whale movements, analyze wallet portfolios, and track large
            transfers across multiple chains with AI-powered insights.
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
          {FEATURES.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              viewport={{ once: true }}
              whileHover={{ scale: 1.05 }}
            >
              <Card className="h-full hover:shadow-lg transition-shadow border-blue-500/20 hover:border-blue-500/40">
                <CardHeader>
                  <div className="w-12 h-12 rounded-lg bg-blue-500/10 flex items-center justify-center mb-4">
                    <feature.icon className="w-6 h-6 text-blue-600" />
                  </div>
                  <CardTitle>{feature.title}</CardTitle>
                  <CardDescription>{feature.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {feature.points.map((point) => (
                      <li
                        key={point}
                        className="flex items-start gap-2 text-sm"
                      >
                        <span className="text-blue-600 mt-1">•</span>
                        <span>{point}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-12 md:py-16">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          <Card className="bg-gradient-to-r from-blue-500/10 via-blue-500/5 to-background border-blue-500/30">
            <CardContent className="p-6 md:p-12 text-center">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4">
                Ready to Track Whale Movements?
              </h2>
              <p className="text-base md:text-lg text-muted-foreground mb-6 md:mb-8 max-w-2xl mx-auto">
                Join analysts who never miss a big move. Get started with
                ChainWhale today.
              </p>
              <div className="flex justify-center">
                <Button size="lg" className="text-base md:text-lg w-full sm:w-auto" asChild>
                  <a href="/whales">Start Tracking</a>
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </section>
    </div>
  );
}
