'use client';

import Image from "next/image";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Activity, TrendingUp, Wallet, Sparkles } from "lucide-react";
import { AppHeader } from "@/components/layouts/app-header";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-blue-500/5 to-background">
      {/* Header with Navigation */}
      <AppHeader />

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16 md:py-24">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="space-y-6"
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
              className="text-5xl md:text-6xl font-bold tracking-tight"
            >
              Track Whale Movements Across{" "}
              <span className="bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text text-transparent">Multiple EVM Chains</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-xl text-muted-foreground"
            >
              Monitor large transfers ($10K+) in real-time across Ethereum, Base, Arbitrum, Optimism, and Polygon. Get AI-powered insights with comprehensive contract security analysis.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="flex flex-col sm:flex-row gap-4"
            >
              <Button size="lg" className="text-lg" asChild>
                <a href="/dashboard">🚀 Dashboard</a>
              </Button>
              <Button size="lg" variant="outline" className="text-lg" asChild>
                <a href="/whales">🐋 Whale Tracker</a>
              </Button>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="flex items-center gap-6 pt-4"
            >
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                <span className="text-sm text-muted-foreground">Live Tracking</span>
              </div>
              <div className="text-sm text-muted-foreground">
                <span className="font-semibold text-blue-600">5</span> EVM Chains Supported
              </div>
            </motion.div>
          </motion.div>

          {/* Right Image */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="relative"
          >
            <motion.div
              animate={{
                y: [0, -20, 0],
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              className="relative z-10"
            >
              <Image
                src="/whales.png"
                alt="ChainWhale - Whale Tracking"
                width={600}
                height={600}
                priority
                className="w-full h-auto rounded-2xl"
              />
            </motion.div>

            {/* Floating Elements */}
            <motion.div
              animate={{
                y: [0, -15, 0],
                rotate: [0, 5, 0],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              className="absolute -top-4 -right-4 z-20"
            >
              <Card className="p-4 shadow-lg border-blue-500/30 bg-gradient-to-r from-blue-500/5 via-slate-500/5 to-blue-500/5">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-blue-500" />
                  <div>
                    <p className="text-xs text-muted-foreground">Whale Alert</p>
                    <p className="font-semibold">$5.2M Transfer</p>
                  </div>
                </div>
              </Card>
            </motion.div>

            <motion.div
              animate={{
                y: [0, 15, 0],
                rotate: [0, -5, 0],
              }}
              transition={{
                duration: 3.5,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 0.5,
              }}
              className="absolute -bottom-4 -left-4 z-20"
            >
              <Card className="p-4 shadow-lg border-blue-500/30 bg-gradient-to-r from-blue-500/5 via-slate-500/5 to-blue-500/5">
                <div className="flex items-center gap-2">
                  <Activity className="w-5 h-5 text-blue-500" />
                  <div>
                    <p className="text-xs text-muted-foreground">Live Activity</p>
                    <p className="font-semibold">5 EVM Chains</p>
                  </div>
                </div>
              </Card>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="container mx-auto px-4 py-16">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Powerful Features for Crypto Traders
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Everything you need to track whale movements and make informed trading decisions
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6">
          {features.map((feature, index) => (
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
                      <li key={point} className="flex items-start gap-2 text-sm">
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
      <section className="container mx-auto px-4 py-16">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          <Card className="bg-gradient-to-r from-blue-500/10 via-blue-500/5 to-background border-blue-500/30">
            <CardContent className="p-12 text-center">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Ready to Track Whale Movements?
              </h2>
              <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
                Join traders who never miss a big move. Get started with ChainWhale today.
              </p>
              <div className="flex justify-center">
                <Button size="lg" className="text-lg" asChild>
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

const features = [
  {
    icon: Activity,
    title: "Real-Time Whale Feed",
    description: "Monitor large transfers ($10K+) as they happen across 5 EVM chains",
    points: [
      "Track transfers from known whale addresses",
      "Ethereum, Base, Arbitrum, Optimism, Polygon",
      "AI-powered insights with contract security analysis",
    ],
  },
  {
    icon: Sparkles,
    title: "AI-Powered Insights",
    description: "Get comprehensive analysis with customizable AI providers",
    points: [
      "OpenAI, Anthropic, Google AI support",
      "600-word structured analysis with 6 sections",
      "Contract security, whale behavior, risk assessment",
    ],
  },
  {
    icon: Wallet,
    title: "Wallet Analysis",
    description: "Comprehensive portfolio breakdown with security insights",
    points: [
      "Token holdings with USD values",
      "Recent activity (24h transfers)",
      "Whale detection and risk scoring",
    ],
  },
];
