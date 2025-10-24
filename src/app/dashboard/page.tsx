'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MessageSquare, Wallet, Settings } from 'lucide-react';
import { AppHeader } from '@/components/layouts/app-header';
import ChatInterface from '@/components/dashboard/chat-interface';
import WalletAnalysis from '@/components/dashboard/wallet-analysis';
import ApiSettings from '@/components/dashboard/api-settings';

function DashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState(tabParam || 'chat');

  // Update tab when URL parameter changes
  useEffect(() => {
    if (tabParam && ['chat', 'wallet', 'settings'].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [tabParam]);

  // Handle tab change and update URL
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    router.push(`/dashboard?tab=${value}`, { scroll: false });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      {/* Header with Navigation */}
      <AppHeader />

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
          <TabsList className="grid w-full grid-cols-3 lg:w-[600px] bg-card">
            <TabsTrigger value="chat" className="flex items-center gap-2 bg-card">
              <MessageSquare className="h-4 w-4" />
              <span className="hidden sm:inline">Chat</span>
            </TabsTrigger>
            <TabsTrigger value="wallet" className="flex items-center gap-2 bg-card">
              <Wallet className="h-4 w-4" />
              <span className="hidden sm:inline">Wallet Analysis</span>
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2 bg-card">
              <Settings className="h-4 w-4" />
              <span className="hidden sm:inline">Settings</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="chat" className="mt-6">
            <ChatInterface />
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

export default function DashboardPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
        <AppHeader />
        <main className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        </main>
      </div>
    }>
      <DashboardContent />
    </Suspense>
  );
}
