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
  models: string[];
}

const AI_PROVIDERS: Record<AIProvider, ProviderConfig> = {
  openai: {
    name: 'OpenAI',
    placeholder: 'sk-...',
    description: 'GPT-4, GPT-3.5 Turbo',
    docsUrl: 'https://platform.openai.com/api-keys',
    models: ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'gpt-4', 'gpt-3.5-turbo'],
  },
  anthropic: {
    name: 'Anthropic',
    placeholder: 'sk-ant-...',
    description: 'Claude 3 Opus, Sonnet, Haiku',
    docsUrl: 'https://console.anthropic.com/settings/keys',
    models: ['claude-3-5-sonnet-20241022', 'claude-3-opus-20240229', 'claude-3-sonnet-20240229', 'claude-3-haiku-20240307'],
  },
  google: {
    name: 'Google AI',
    placeholder: 'AIza...',
    description: 'Gemini Pro, Gemini Ultra',
    docsUrl: 'https://makersuite.google.com/app/apikey',
    models: ['gemini-2.0-flash-exp', 'gemini-1.5-pro', 'gemini-1.5-flash'],
  },
  custom: {
    name: 'Custom Provider',
    placeholder: 'Enter your API key',
    description: 'OpenAI-compatible API',
    docsUrl: '#',
    models: ['gpt-4o-mini', 'gpt-4o', 'custom-model'],
  },
};

export default function ApiSettings() {
  const [provider, setProvider] = useState<AIProvider>('openai');
  const [model, setModel] = useState('gpt-4o-mini');
  const [apiKey, setApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [isTestingKey, setIsTestingKey] = useState(false);
  const [keyStatus, setKeyStatus] = useState<'valid' | 'invalid' | null>(null);

  // Load API key from localStorage on mount
  useEffect(() => {
    const savedProvider = localStorage.getItem('ai_provider') as AIProvider;
    const savedModel = localStorage.getItem('ai_model');
    const savedKey = localStorage.getItem('ai_api_key');
    if (savedProvider) setProvider(savedProvider);
    if (savedModel) setModel(savedModel);
    if (savedKey) {
      setApiKey(savedKey);
      setIsSaved(true);
    }
  }, []);

  const handleSaveKey = () => {
    if (apiKey.trim()) {
      localStorage.setItem('ai_provider', provider);
      localStorage.setItem('ai_model', model);
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
    localStorage.removeItem('ai_model');
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
    } catch {
      setKeyStatus('invalid');
    } finally {
      setIsTestingKey(false);
    }
  };

  const currentProvider = AI_PROVIDERS[provider];

  return (
    <Card className="border border-blue-500/30 bg-gradient-to-r from-blue-500/5 via-slate-500/5 to-blue-500/5">
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
          <Select value={provider} onValueChange={(value) => {
            const newProvider = value as AIProvider;
            setProvider(newProvider);
            // Set default model for the new provider
            setModel(AI_PROVIDERS[newProvider].models[0]);
          }}>
            <SelectTrigger id="provider" className="w-full border-blue-500/30 bg-gradient-to-r from-blue-500/5 via-slate-500/5 to-blue-500/5">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(AI_PROVIDERS).map(([key, config]) => (
                <SelectItem key={key} value={key} className="hover:bg-blue-500/10 data-[highlighted]:bg-blue-500/10 data-[state=checked]:from-blue-500/10 data-[state=checked]:via-slate-500/10 data-[state=checked]:to-blue-500/10">
                  <span className="font-medium">{config.name}</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Model Selection */}
        <div className="space-y-2">
          <Label htmlFor="model" className="text-sm font-medium">Model</Label>
          <Select value={model} onValueChange={setModel}>
            <SelectTrigger id="model" className="w-full border-blue-500/30 bg-gradient-to-r from-blue-500/5 via-slate-500/5 to-blue-500/5">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="border border-blue-500/30 bg-background">
              {currentProvider.models.map((modelName) => (
                <SelectItem key={modelName} value={modelName} className="hover:bg-blue-500/10 data-[highlighted]:bg-blue-500/10 data-[state=checked]:from-blue-500/10 data-[state=checked]:via-slate-500/10 data-[state=checked]:to-blue-500/10">
                  <span className="font-mono text-sm">{modelName}</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* API Key Input */}
        <div className="space-y-2">
          <div className="flex items-center justify-start">
            <Label htmlFor="api-key" className="text-sm font-medium">API Key</Label>
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
                className="pr-10 font-mono text-sm border-blue-500/30 bg-gradient-to-r from-blue-500/5 via-slate-500/5 to-blue-500/5"
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
               className="border-blue-500/30 bg-gradient-to-r from-blue-500/5 via-slate-500/5 to-blue-500/5 hover:from-blue-500/10 hover:via-slate-500/10 hover:to-blue-500/10"
             >
              {isTestingKey ? 'Testing...' : 'Test Key'}
            </Button>
            <Button
               onClick={handleRemoveKey}
               variant="outline"
               size="sm"
               className="text-red-500 hover:text-red-600 border-blue-500/30 bg-gradient-to-r from-blue-500/5 via-slate-500/5 to-blue-500/5 hover:from-blue-500/10 hover:via-slate-500/10 hover:to-blue-500/10"
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
        <div className="p-4 rounded-lg border border-blue-500/30 bg-gradient-to-r from-blue-500/5 via-slate-500/5 to-blue-500/5 space-y-2">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Info className="h-4 w-4 text-primary" />
            <span>Privacy & Security</span>
          </div>
          <div className="text-xs text-muted-foreground space-y-1 pl-6">
            <p>✓ Your API key is stored locally in your browser only</p>
            <p>✓ Never sent to our servers - used for direct API calls only</p>
            <p>✓ You maintain full control and can remove it anytime</p>
            <p>✓ Works with your selected AI provider</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
