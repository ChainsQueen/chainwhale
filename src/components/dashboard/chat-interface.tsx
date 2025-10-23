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
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { DataSourceBadge } from "@/components/ui/data-source-badge";
import { Bot, User, RefreshCw, Database, TrendingUp, Sparkles, AlertTriangle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useWhaleChat } from "@/core/hooks/use-whale-chat";
import { useApiKey } from "@/core/hooks/use-api-key";

export default function ChatInterface() {
  const [input, setInput] = useState("");

  // Use custom hook for data fetching (same pattern as whale tracker)
  const { messages, chatData, isLoading, sendMessage, refetchData } =
    useWhaleChat();
  
  // Check if AI API key is configured
  const { hasApiKey } = useApiKey();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    await sendMessage(input);
    setInput("");
  };

  return (
    <Card className="w-full max-w-4xl mx-auto border border-blue-500/30 bg-gradient-to-r from-blue-500/5 via-slate-500/5 to-blue-500/5">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
               {/* Data Source Badges */}
              {chatData.dataSourceStats && (
                <>
                  {chatData.dataSourceStats.mcp > 0 && (
                    <DataSourceBadge dataSource="mcp" size="sm" />
                  )}

                  {chatData.dataSourceStats.http > 0 && (
                    <DataSourceBadge dataSource="http" size="sm" />
                  )}
                </>
              )}
              {/* Title */}
              <CardTitle>Ask About Whale Activity</CardTitle>
            </div>
            <CardDescription>
              AI has instant access to pre-loaded whale data from the{" "}
              <strong>last 24 hours</strong> across{" "}
              <strong>5 EVM chains</strong> (Ethereum, Base, Arbitrum, Optimism,
              Polygon) with transfers <strong>$100k+</strong>. Just ask your
              question!
            </CardDescription>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={refetchData}
            disabled={chatData.loading}
            className="border-blue-500/30"
          >
            <RefreshCw
              className={`h-4 w-4 ${chatData.loading ? "animate-spin" : ""}`}
            />
          </Button>
        </div>

        {/* Data Status Indicator */}
        <div className="flex flex-wrap gap-2 mt-4">
          <Badge variant="outline" className="border-blue-500/30 bg-blue-500/5">
            <Database className="h-3 w-3 mr-1" />
            {chatData.transfers.length} Transfers
          </Badge>
          <Badge
            variant="outline"
            className="border-green-500/30 bg-green-500/5"
          >
            <TrendingUp className="h-3 w-3 mr-1" />$
            {(chatData.stats.totalVolume / 1000000).toFixed(1)}M Volume
          </Badge>
          <Badge
            variant="outline"
            className="border-purple-500/30 bg-purple-500/5"
          >
            {chatData.contracts.length} Contracts
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Chat Messages */}
          <ScrollArea className="h-[500px] w-full rounded-md border border-blue-500/30 bg-gradient-to-r from-blue-500/5 via-slate-500/5 to-blue-500/5 p-4">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
                <Bot className="h-12 w-12 mb-4 opacity-50" />
                <p className="text-lg font-medium">
                  Ready with {chatData.transfers.length} whale transfers
                </p>
                <p className="text-sm mt-2 max-w-md">
                  Data is pre-loaded and ready! Ask about transactions, tokens,
                  whales, or patterns. Get instant answers without waiting for
                  blockchain queries.
                </p>
                <p className="text-xs mt-2 opacity-75">
                  Try: &quot;What are the largest transactions today?&quot;
                </p>
              </div>
            ) : (
              <AnimatePresence>
                {messages.map((message, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className={`mb-4 flex ${
                      message.role === "user" ? "justify-end" : "justify-start"
                    }`}
                  >
                    <div
                      className={`flex gap-3 max-w-[80%] ${
                        message.role === "user"
                          ? "flex-row-reverse"
                          : "flex-row"
                      }`}
                    >
                      <div
                        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                          message.role === "user"
                            ? "bg-primary text-primary-foreground"
                            : "border border-blue-500/30 bg-gradient-to-r from-blue-500/10 via-slate-500/10 to-blue-500/10"
                        }`}
                      >
                        {message.role === "user" ? (
                          <User className="h-4 w-4" />
                        ) : (
                          <Bot className="h-4 w-4" />
                        )}
                      </div>
                      <div
                        className={`rounded-lg px-4 py-2 ${
                          message.role === "user"
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted"
                        }`}
                      >
                        <p className="text-sm whitespace-pre-wrap">
                          {message.content}
                        </p>
                        <p className="text-xs opacity-50 mt-1">
                          {message.timestamp.toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                ))}

                {/* Loading indicator */}
                {isLoading && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-4 flex justify-start"
                  >
                    <div className="flex gap-3 max-w-[80%]">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-blue-500/30 bg-gradient-to-r from-blue-500/10 via-slate-500/10 to-blue-500/10 animate-pulse">
                        <Bot className="h-4 w-4" />
                      </div>
                      <div className="rounded-lg px-4 py-2 border border-blue-500/30 bg-gradient-to-r from-blue-500/10 via-slate-500/10 to-blue-500/10">
                        <p className="text-sm text-muted-foreground">
                          🔍 Analyzing whale activity across chains...
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            )}
          </ScrollArea>

          {/* Input Form */}
          <form
            onSubmit={handleSubmit}
            className="flex gap-2"
            suppressHydrationWarning
          >
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about whale activity..."
              disabled={isLoading}
              className="flex-1 border-blue-500/30 bg-gradient-to-r from-blue-500/5 via-slate-500/5 to-blue-500/5"
            />
            
            {/* AI Insights Button */}
            <Button
              type="button"
              onClick={() => {
                if (!hasApiKey) {
                  // Redirect to Settings tab
                  window.location.href = "/dashboard?tab=settings";
                  return;
                }
                // If API key exists and input is empty, focus input
                if (!input.trim()) {
                  document.querySelector<HTMLInputElement>('input[placeholder="Ask about whale activity..."]')?.focus();
                } else {
                  // If there's input, submit the form
                  const submitEvent = new Event('submit', { bubbles: true, cancelable: true }) as unknown as React.FormEvent;
                  handleSubmit(submitEvent);
                }
              }}
              disabled={isLoading}
              variant={hasApiKey ? "default" : "outline"}
              className="gap-2 whitespace-nowrap"
            >
              {isLoading ? (
                <>
                  <div className="h-4 w-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  Generating...
                </>
              ) : hasApiKey ? (
                <>
                  <Sparkles className="h-4 w-4" />
                  Generate AI Insights
                  <span
                    className="h-2 w-2 rounded-full bg-green-500"
                    title="API Key configured"
                  />
                </>
              ) : (
                <>
                  <AlertTriangle className="h-4 w-4" />
                  Setup AI in Settings
                </>
              )}
            </Button>
          </form>

          {/* Example Questions */}
          <div className="flex flex-wrap gap-2">
            <p className="text-sm text-muted-foreground w-full">
              Try asking (AI can analyze {chatData.transfers.length} transfers across {chatData.stats.uniqueTokens} tokens):
            </p>
            {[
              "What are the top 3 largest transfers?",
              "Show me top 5 USDT transfers",
              "Which 3 addresses are most active?",
              "Volume per chain - bar chart",
              "Any scam tokens detected?",
              "Show largest transfer details",
            ].map((question) => (
              <Button
                key={question}
                variant="outline"
                size="sm"
                onClick={() => setInput(question)}
                disabled={isLoading}
                className="text-xs border-blue-500/30 bg-gradient-to-r from-blue-500/5 via-slate-500/5 to-blue-500/5 hover:from-blue-500/10 hover:via-slate-500/10 hover:to-blue-500/10"
              >
                {question}
              </Button>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
