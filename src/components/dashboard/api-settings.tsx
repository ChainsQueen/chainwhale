'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Key, Check, X, Eye, EyeOff, Sparkles, Info } from 'lucide-react';

type AIProvider = 'openai' | 'anthropic' | 'google' | 'custom';

interface ProviderConfig {
  name: string;
  placeholder: string;
  description: string;
  docsUrl: string;
}

const AI_PROVIDERS: Record<AIProvider, ProviderConfig> = {
  openai: {
    name: 'OpenAI',
    placeholder: 'sk-...',
    description: 'GPT-4, GPT-3.5 Turbo',
    docsUrl: 'https://platform.openai.com/api-keys',
  },
  anthropic: {
    name: 'Anthropic',
    placeholder: 'sk-ant-...',
    description: 'Claude 3 Opus, Sonnet, Haiku',
    docsUrl: 'https://console.anthropic.com/settings/keys',
  },
  google: {
    name: 'Google AI',
    placeholder: 'AIza...',
    description: 'Gemini Pro, Gemini Ultra',
    docsUrl: 'https://makersuite.google.com/app/apikey',
  },
  custom: {
    name: 'Custom Provider',
    placeholder: 'Enter your API key',
    description: 'OpenAI-compatible API',
    docsUrl: '#',
  },
};

export default function ApiSettings() {
  const [provider, setProvider] = useState<AIProvider>('openai');
  const [apiKey, setApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [isTestingKey, setIsTestingKey] = useState(false);
  const [keyStatus, setKeyStatus] = useState<'valid' | 'invalid' | null>(null);

  // Load API key from localStorage on mount
  useEffect(() => {
    const savedProvider = localStorage.getItem('ai_provider') as AIProvider;
    const savedKey = localStorage.getItem('ai_api_key');
    if (savedProvider) setProvider(savedProvider);
    if (savedKey) {
      setApiKey(savedKey);
      setIsSaved(true);
    }
  }, []);

  const handleSaveKey = () => {
    if (apiKey.trim()) {
      localStorage.setItem('ai_provider', provider);
      localStorage.setItem('ai_api_key', apiKey.trim());
      // Keep backward compatibility
      localStorage.setItem('openai_api_key', apiKey.trim());
      setIsSaved(true);
      setKeyStatus(null);
      
      // Trigger storage event for other components to detect the change
      window.dispatchEvent(new Event('storage'));
      
      setTimeout(() => setIsSaved(false), 3000);
    }
  };

  const handleRemoveKey = () => {
    localStorage.removeItem('ai_provider');
    localStorage.removeItem('ai_api_key');
    localStorage.removeItem('openai_api_key');
    setApiKey('');
    setIsSaved(false);
    setKeyStatus(null);
  };

  const handleTestKey = async () => {
    if (!apiKey.trim()) return;

    setIsTestingKey(true);
    setKeyStatus(null);

    try {
      const response = await fetch('/api/test-openai-key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey: apiKey.trim() }),
      });

      const data = await response.json();
      setKeyStatus(data.valid ? 'valid' : 'invalid');
    } catch (error) {
      setKeyStatus('invalid');
    } finally {
      setIsTestingKey(false);
    }
  };

  const currentProvider = AI_PROVIDERS[provider];

  return (
    <Card className="border-2">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Sparkles className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-xl">AI Configuration</CardTitle>
              <CardDescription className="mt-1">
                Connect your AI provider to unlock intelligent wallet analysis
              </CardDescription>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Provider Selection */}
        <div className="space-y-2">
          <Label htmlFor="provider" className="text-sm font-medium">AI Provider</Label>
          <Select value={provider} onValueChange={(value) => setProvider(value as AIProvider)}>
            <SelectTrigger id="provider" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(AI_PROVIDERS).map(([key, config]) => (
                <SelectItem key={key} value={key}>
                  <div className="flex items-center justify-between w-full">
                    <span className="font-medium">{config.name}</span>
                    <span className="text-xs text-muted-foreground ml-2">{config.description}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* API Key Input */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="api-key" className="text-sm font-medium">API Key</Label>
            <a
              href={currentProvider.docsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-primary hover:underline flex items-center gap-1"
            >
              <Info className="h-3 w-3" />
              Get API Key
            </a>
          </div>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Input
                id="api-key"
                type={showKey ? 'text' : 'password'}
                value={apiKey}
                onChange={(e) => {
                  setApiKey(e.target.value);
                  setKeyStatus(null);
                }}
                placeholder={currentProvider.placeholder}
                className="pr-10 font-mono text-sm"
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <Button
              onClick={handleSaveKey}
              disabled={!apiKey.trim()}
              variant={isSaved ? 'outline' : 'default'}
              className="min-w-[100px]"
            >
              {isSaved ? (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  Saved
                </>
              ) : (
                <>
                  <Key className="h-4 w-4 mr-2" />
                  Save
                </>
              )}
            </Button>
          </div>
        </div>

        {apiKey && (
          <div className="flex gap-2">
            <Button
              onClick={handleTestKey}
              disabled={isTestingKey}
              variant="outline"
              size="sm"
            >
              {isTestingKey ? 'Testing...' : 'Test Key'}
            </Button>
            <Button
              onClick={handleRemoveKey}
              variant="outline"
              size="sm"
              className="text-red-500 hover:text-red-600"
            >
              <X className="h-4 w-4 mr-2" />
              Remove Key
            </Button>
          </div>
        )}

        {keyStatus === 'valid' && (
          <Alert className="bg-green-500/10 border-green-500/20">
            <Check className="h-4 w-4 text-green-500" />
            <AlertDescription className="text-green-500">
              API key is valid and working!
            </AlertDescription>
          </Alert>
        )}

        {keyStatus === 'invalid' && (
          <Alert className="bg-red-500/10 border-red-500/20">
            <X className="h-4 w-4 text-red-500" />
            <AlertDescription className="text-red-500">
              API key is invalid or has insufficient permissions
            </AlertDescription>
          </Alert>
        )}

        {/* Security Info */}
        <div className="p-4 bg-muted/30 rounded-lg border border-muted space-y-2">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Info className="h-4 w-4 text-primary" />
            <span>Privacy & Security</span>
          </div>
          <div className="text-xs text-muted-foreground space-y-1 pl-6">
            <p>✓ Your API key is stored locally in your browser only</p>
            <p>✓ Never sent to our servers - used for direct API calls only</p>
            <p>✓ You maintain full control and can remove it anytime</p>
            <p>✓ Works with any OpenAI-compatible API endpoint</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
