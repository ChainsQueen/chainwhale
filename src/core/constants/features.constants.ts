/**
 * Feature highlights for the home page
 * Centralized feature data for maintainability
 */

import { Activity, Sparkles, Wallet, LucideIcon } from "lucide-react";

export interface Feature {
  icon: LucideIcon;
  title: string;
  description: string;
  points: string[];
}

/**
 * List of key features displayed on the home page
 */
export const FEATURES: Feature[] = [
  {
    icon: Activity,
    title: "Real-Time Whale Feed",
    description:
      "Monitor large transfers ($10K+) as they happen across 5 EVM chains",
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
