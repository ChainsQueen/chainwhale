'use client';

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MessageSquare, Activity, Wallet, Settings } from 'lucide-react';
import { AppHeader } from '@/components/app-header';
import ChatInterface from '@/components/dashboard/chat-interface';
import WhaleFeed from '@/components/dashboard/whale-feed';
import WalletAnalysis from '@/components/dashboard/wallet-analysis';
import ApiSettings from '@/components/dashboard/api-settings';

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState('chat');

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      {/* Header with Navigation */}
      <AppHeader />

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 lg:w-[800px]">
            <TabsTrigger value="chat" className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              <span className="hidden sm:inline">Chat</span>
            </TabsTrigger>
            <TabsTrigger value="whale-feed" className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              <span className="hidden sm:inline">Whale Feed</span>
            </TabsTrigger>
            <TabsTrigger value="wallet" className="flex items-center gap-2">
              <Wallet className="h-4 w-4" />
              <span className="hidden sm:inline">Wallet Analysis</span>
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              <span className="hidden sm:inline">Settings</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="chat" className="mt-6">
            <ChatInterface />
          </TabsContent>

          <TabsContent value="whale-feed" className="mt-6">
            <WhaleFeed />
          </TabsContent>

          <TabsContent value="wallet" className="mt-6">
            <WalletAnalysis />
          </TabsContent>

          <TabsContent value="settings" className="mt-6">
            <div className="max-w-4xl mx-auto">
              <ApiSettings />
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
