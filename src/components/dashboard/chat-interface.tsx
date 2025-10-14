'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Send, Bot, User } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export default function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      role: 'user',
      content: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // Get API key from localStorage
      const apiKey = localStorage.getItem('ai_api_key') || localStorage.getItem('openai_api_key');
      
      console.log('[Chat Interface] Sending request with API key:', {
        hasApiKey: !!apiKey,
        apiKeyLength: apiKey?.length || 0,
        apiKeyPrefix: apiKey?.substring(0, 7) || 'none'
      });
      
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: input,
          chains: ['1', '8453', '42161'], // Ethereum, Base, Arbitrum
          apiKey, // Send API key from localStorage
        }),
      });

      const data = await response.json();

      // Check if response contains an error or API key message
      const content = data.answer || data.error || 'Sorry, I could not process your request.';

      const assistantMessage: Message = {
        role: 'assistant',
        content,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error('[Chat Interface] Error:', error);
      
      // Get API key to provide helpful error message
      const apiKey = localStorage.getItem('ai_api_key') || localStorage.getItem('openai_api_key');
      
      const errorMessage: Message = {
        role: 'assistant',
        content: !apiKey 
          ? '⚠️ AI API key not configured.\n\nTo enable AI chat:\n1. Click on "Settings" tab above\n2. Select your AI provider (OpenAI, Anthropic, Google AI, etc.)\n3. Enter your API key\n4. Click "Save"\n\nYou can still use the Whale Feed and Wallet Analysis features without AI!'
          : 'Sorry, there was an error processing your request. Please check your API key in Settings or try again.',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>Ask About Whale Activity</CardTitle>
        <CardDescription>
          Ask questions about whale transactions, market trends, and blockchain activity
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Chat Messages */}
          <ScrollArea className="h-[500px] w-full rounded-md border p-4">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
                <Bot className="h-12 w-12 mb-4 opacity-50" />
                <p className="text-lg font-medium">Start a conversation</p>
                <p className="text-sm mt-2">
                  Try asking: &quot;What are the largest transactions today?&quot;
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
                      message.role === 'user' ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    <div
                      className={`flex gap-3 max-w-[80%] ${
                        message.role === 'user' ? 'flex-row-reverse' : 'flex-row'
                      }`}
                    >
                      <div
                        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                          message.role === 'user'
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted'
                        }`}
                      >
                        {message.role === 'user' ? (
                          <User className="h-4 w-4" />
                        ) : (
                          <Bot className="h-4 w-4" />
                        )}
                      </div>
                      <div
                        className={`rounded-lg px-4 py-2 ${
                          message.role === 'user'
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted'
                        }`}
                      >
                        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
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
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted animate-pulse">
                        <Bot className="h-4 w-4" />
                      </div>
                      <div className="rounded-lg px-4 py-2 bg-muted">
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
          <form onSubmit={handleSubmit} className="flex gap-2" suppressHydrationWarning>
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about whale activity..."
              disabled={isLoading}
              className="flex-1"
            />
            <Button type="submit" disabled={isLoading || !input.trim()}>
              <Send className="h-4 w-4" />
            </Button>
          </form>

          {/* Example Questions */}
          <div className="flex flex-wrap gap-2">
            <p className="text-sm text-muted-foreground w-full">Try asking:</p>
            {[
              'What are the largest transactions today?',
              'Show me recent whale activity on Base',
              'Are there any notable patterns in recent transfers?',
            ].map((question) => (
              <Button
                key={question}
                variant="outline"
                size="sm"
                onClick={() => setInput(question)}
                disabled={isLoading}
                className="text-xs"
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
