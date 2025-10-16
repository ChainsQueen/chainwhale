'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowRight, TrendingUp, TrendingDown, ArrowLeftRight, ExternalLink, Sparkles, FileCode, Copy, Check, ShieldCheck, ShieldAlert, AlertTriangle, XCircle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import type { WhaleTransfer } from '@/core/services/whale-service';

interface WhaleTrackerCardProps {
  transfer: WhaleTransfer;
}

interface ContractInfo {
  isVerified: boolean;
  isProxy: boolean;
  implementationAddress?: string;
  tokenType?: string;
  holderCount?: number;
  totalSupply?: string;
  tokenName?: string;
  tokenSymbol?: string;
  tokenPrice?: string;
  marketCap?: string;
  volume24h?: string;
  iconUrl?: string;
  isScam?: boolean;
  reputation?: string;
  creatorAddress?: string;
  creationTxHash?: string;
}

export function WhaleTrackerCard({ transfer }: WhaleTrackerCardProps) {
  const [copiedAddress, setCopiedAddress] = useState(false);
  const [contractInfo, setContractInfo] = useState<ContractInfo | null>(null);
  const [loadingContractInfo, setLoadingContractInfo] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedAddress(true);
    setTimeout(() => setCopiedAddress(false), 2000);
  };

  const fetchContractInfo = async () => {
    if (contractInfo || loadingContractInfo) return; // Don't fetch if already loaded
    
    setLoadingContractInfo(true);
    try {
      // Fetch from our API endpoint (uses hybrid MCP-first approach)
      const apiUrl = `/api/whale-tracker/contract-info?address=${transfer.token.address}&chainId=${transfer.chainId}`;
      console.log('[WhaleTrackerCard] Fetching contract info from:', apiUrl);
      
      const response = await fetch(apiUrl);
      
      console.log('[WhaleTrackerCard] API response status:', response.status, response.statusText);
      
      if (response.ok) {
        const data = await response.json();
        console.log('[WhaleTrackerCard] ✅ Contract data received:', data);
        console.log('[WhaleTrackerCard] isVerified:', data.isVerified, 'Type:', typeof data.isVerified);
        console.log('[WhaleTrackerCard] holderCount:', data.holderCount, 'Type:', typeof data.holderCount);
        
        const contractData = {
          isVerified: data.isVerified, // Keep undefined to show "unknown" state
          isProxy: data.isProxy || false,
          implementationAddress: data.implementationAddress,
          tokenType: data.tokenType || 'ERC-20',
          holderCount: data.holderCount ? parseInt(data.holderCount) : undefined,
          totalSupply: data.totalSupply,
          // High priority additions
          tokenPrice: data.tokenPrice,
          marketCap: data.marketCap,
          volume24h: data.volume24h,
          iconUrl: data.iconUrl,
          isScam: data.isScam,
          reputation: data.reputation,
          creatorAddress: data.creatorAddress,
          creationTxHash: data.creationTxHash,
        };
        
        // If holder count is missing, try the token-specific endpoint
        if (!contractData.holderCount) {
          try {
            const tokenResponse = await fetch(
              `https://${getBlockscoutDomain()}/api/v2/tokens/${transfer.token.address}`
            );
            if (tokenResponse.ok) {
              const tokenData = await tokenResponse.json();
              console.log('Token-specific data:', tokenData);
              contractData.holderCount = tokenData.holders ? parseInt(tokenData.holders) : undefined;
              if (tokenData.total_supply) {
                contractData.totalSupply = tokenData.total_supply;
              }
            }
          } catch (err) {
            console.log('Could not fetch token-specific data:', err);
          }
        }
        
        console.log('[WhaleTrackerCard] Setting contract info:', contractData);
        setContractInfo(contractData);
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error('[WhaleTrackerCard] ❌ API error:', response.status, errorData);
      }
    } catch (error) {
      console.error('[WhaleTrackerCard] ❌ Failed to fetch contract info:', error);
    } finally {
      setLoadingContractInfo(false);
    }
  };

  const getBlockscoutDomain = () => {
    const domains: Record<string, string> = {
      '1': 'eth.blockscout.com',
      '8453': 'base.blockscout.com',
      '42161': 'arbitrum.blockscout.com',
      '10': 'optimism.blockscout.com',
      '137': 'polygon.blockscout.com',
    };
    return domains[transfer.chainId] || 'eth.blockscout.com';
  };

  const handleDialogOpen = (open: boolean) => {
    setDialogOpen(open);
    if (open) {
      fetchContractInfo();
    }
  };

  const formatValue = (value: number) => {
    if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(2)}M`;
    }
    return `$${value.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
  };

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    return date.toLocaleDateString();
  };

  const getTransferIcon = () => {
    if (transfer.valueUsd && transfer.valueUsd > 500000) {
      return {
        icon: <TrendingUp className="w-4 h-4 text-green-500" />,
        label: 'Mega Whale Move',
        description: 'Transfer > $500K'
      };
    }
    if (transfer.valueUsd && transfer.valueUsd > 200000) {
      return {
        icon: <TrendingDown className="w-4 h-4 text-orange-500" />,
        label: 'Large Whale Move',
        description: '$200K - $500K'
      };
    }
    return {
      icon: <ArrowLeftRight className="w-4 h-4 text-blue-500" />,
      label: 'Medium Whale Move',
      description: '$100K - $200K'
    };
  };

  const getValueColor = () => {
    if (!transfer.valueUsd) return 'text-muted-foreground';
    if (transfer.valueUsd >= 1000000) return 'text-green-600 dark:text-green-400';
    if (transfer.valueUsd >= 500000) return 'text-orange-600 dark:text-orange-400';
    return 'text-blue-600 dark:text-blue-400';
  };

  const getExplorerUrl = (identifier: string, type: 'tx' | 'address' | 'token' = 'tx') => {
    const explorers: Record<string, string> = {
      '1': 'https://etherscan.io',
      '8453': 'https://basescan.org',
      '42161': 'https://arbiscan.io',
      '10': 'https://optimistic.etherscan.io',
      '137': 'https://polygonscan.com',
    };
    const baseUrl = explorers[transfer.chainId] || explorers['1'];
    return `${baseUrl}/${type}/${identifier}`;
  };

  const transferIconData = getTransferIcon();

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardContent className="p-3 sm:p-4">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4">
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    {transfer.hash && transfer.hash !== '' ? (
                      <a
                        href={getExplorerUrl(transfer.hash, 'tx')}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="cursor-pointer hover:opacity-70 transition-opacity"
                      >
                        {transferIconData.icon}
                      </a>
                    ) : (
                      <div className="cursor-help">
                        {transferIconData.icon}
                      </div>
                    )}
                  </TooltipTrigger>
                  <TooltipContent className="bg-popover text-popover-foreground border-border">
                    <div className="text-xs">
                      <p className="font-semibold">{transferIconData.label}</p>
                      <p className="text-muted-foreground">{transferIconData.description}</p>
                    </div>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <Badge variant="secondary" className="text-[10px] sm:text-xs px-1.5 py-0.5">
                {transfer.chainName}
              </Badge>
              {transfer.dataSource === 'mcp' ? (
                <Badge variant="default" className="text-[10px] sm:text-xs px-1.5 py-0.5 bg-gradient-to-r from-purple-500 to-blue-500">
                  <Sparkles className="w-2.5 h-2.5 sm:w-3 sm:h-3 mr-0.5" />
                  MCP
                </Badge>
              ) : transfer.dataSource === 'http' ? (
                <Badge variant="secondary" className="text-[10px] sm:text-xs px-1.5 py-0.5 bg-slate-600">
                  HTTP
                </Badge>
              ) : null}
              <Badge variant="outline" className="text-[10px] sm:text-xs px-1.5 py-0.5">
                {transfer.token.symbol}
              </Badge>
              
              {/* Contract Info Dialog */}
              <Dialog open={dialogOpen} onOpenChange={handleDialogOpen}>
                <DialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-5 w-5 sm:h-6 sm:w-6 p-0 hover:bg-muted"
                    title="View contract details"
                  >
                    <FileCode className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-muted-foreground" />
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[500px]">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                      <FileCode className="h-5 w-5" />
                      Token Contract Details
                    </DialogTitle>
                    <DialogDescription>
                      {transfer.token.name || transfer.token.symbol} on {transfer.chainName}
                    </DialogDescription>
                  </DialogHeader>
                  
                  <div className="space-y-4">
                    {/* Security Status Badges */}
                    <div className="flex flex-wrap gap-2">
                      {loadingContractInfo ? (
                        <Badge variant="outline" className="gap-1">
                          <div className="h-3 w-3 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                          Loading...
                        </Badge>
                      ) : contractInfo ? (
                        <>
                          {/* Verification Badge */}
                          {contractInfo.isVerified === true ? (
                            <Badge className="gap-1 bg-green-500 hover:bg-green-600">
                              <ShieldCheck className="h-3 w-3" />
                              Verified
                            </Badge>
                          ) : contractInfo.isVerified === false ? (
                            <Badge variant="destructive" className="gap-1">
                              <ShieldAlert className="h-3 w-3" />
                              Not Verified
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="gap-1 text-muted-foreground">
                              <ShieldAlert className="h-3 w-3" />
                              Verification Unknown
                            </Badge>
                          )}

                          {/* Proxy Badge */}
                          {contractInfo.isProxy && (
                            <Badge variant="outline" className="gap-1 border-orange-500 text-orange-500">
                              <AlertTriangle className="h-3 w-3" />
                              Proxy Contract
                            </Badge>
                          )}

                          {/* Token Type Badge */}
                          {contractInfo.tokenType && (
                            <Badge variant="secondary" className="gap-1">
                              <FileCode className="h-3 w-3" />
                              {contractInfo.tokenType}
                            </Badge>
                          )}

                          {/* Scam Warning Badge */}
                          {contractInfo.isScam && (
                            <Badge variant="destructive" className="gap-1 bg-red-600 hover:bg-red-700">
                              <AlertTriangle className="h-3 w-3" />
                              SCAM WARNING
                            </Badge>
                          )}

                          {/* Reputation Badge */}
                          {contractInfo.reputation && contractInfo.reputation !== 'ok' && (
                            <Badge variant="outline" className="gap-1 border-yellow-500 text-yellow-500">
                              <AlertTriangle className="h-3 w-3" />
                              {contractInfo.reputation.toUpperCase()}
                            </Badge>
                          )}
                        </>
                      ) : null}
                    </div>

                    {/* Token Icon & Price */}
                    {contractInfo && (contractInfo.tokenPrice || contractInfo.iconUrl) && (
                      <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                        {contractInfo.iconUrl && (
                          <Image 
                            src={contractInfo.iconUrl} 
                            alt={transfer.token.symbol}
                            width={40}
                            height={40}
                            className="w-10 h-10 rounded-full"
                            onError={(e) => { e.currentTarget.style.display = 'none'; }}
                            unoptimized
                          />
                        )}
                        <div className="flex-1">
                          {contractInfo.tokenPrice && (
                            <div>
                              <span className="text-xs text-muted-foreground">Price</span>
                              <p className="text-lg font-bold">${parseFloat(contractInfo.tokenPrice).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 })}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Market Stats */}
                    {contractInfo && (contractInfo.marketCap || contractInfo.volume24h) && (
                      <div className="space-y-2">
                        <h4 className="text-sm font-semibold">Market Statistics</h4>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          {contractInfo.marketCap && (
                            <div>
                              <span className="text-muted-foreground">Market Cap:</span>
                              <p className="font-medium">${parseFloat(contractInfo.marketCap).toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
                            </div>
                          )}
                          {contractInfo.volume24h && (
                            <div>
                              <span className="text-muted-foreground">24h Volume:</span>
                              <p className="font-medium">${parseFloat(contractInfo.volume24h).toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Token Info */}
                    <div className="space-y-2">
                      <h4 className="text-sm font-semibold">Token Information</h4>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <span className="text-muted-foreground">Name:</span>
                          <p className="font-medium">{transfer.token.name || 'Unknown'}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Symbol:</span>
                          <p className="font-medium">{transfer.token.symbol}</p>
                        </div>
                        {transfer.token.decimals && (
                          <div>
                            <span className="text-muted-foreground">Decimals:</span>
                            <p className="font-medium">{transfer.token.decimals}</p>
                          </div>
                        )}
                        <div>
                          <span className="text-muted-foreground">Chain:</span>
                          <p className="font-medium">{transfer.chainName}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Holders:</span>
                          <p className="font-medium">
                            {contractInfo?.holderCount 
                              ? contractInfo.holderCount.toLocaleString() 
                              : 'Data unavailable'}
                          </p>
                        </div>
                        {contractInfo?.totalSupply && (
                          <div className="col-span-2">
                            <span className="text-muted-foreground">Total Supply:</span>
                            <p className="font-medium">{contractInfo.totalSupply}</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Contract Details */}
                    {contractInfo?.creatorAddress && (
                      <div className="space-y-2">
                        <h4 className="text-sm font-semibold">Contract Details</h4>
                        <div className="text-sm space-y-1">
                          <div>
                            <span className="text-muted-foreground">Creator:</span>
                            <p className="font-mono text-xs break-all">{contractInfo.creatorAddress}</p>
                          </div>
                          {contractInfo.creationTxHash && (
                            <div>
                              <span className="text-muted-foreground">Deployment Tx:</span>
                              <a 
                                href={getExplorerUrl(contractInfo.creationTxHash, 'tx')}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="font-mono text-xs text-primary hover:underline break-all"
                              >
                                {contractInfo.creationTxHash.slice(0, 20)}...
                              </a>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Proxy Warning */}
                    {contractInfo?.isProxy && (
                      <div className="p-3 bg-orange-500/10 border border-orange-500/20 rounded-lg">
                        <div className="flex gap-2">
                          <AlertTriangle className="h-4 w-4 text-orange-500 shrink-0 mt-0.5" />
                          <div className="space-y-1">
                            <p className="text-sm font-medium text-orange-500">Proxy Contract Detected</p>
                            <p className="text-xs text-muted-foreground">
                              This contract can be upgraded by its owner. Implementation: {contractInfo.implementationAddress?.slice(0, 10)}...
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Scam Warning */}
                    {contractInfo?.isScam && (
                      <div className="p-3 bg-red-600/20 border border-red-600/40 rounded-lg">
                        <div className="flex gap-2">
                          <AlertTriangle className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />
                          <div className="space-y-1">
                            <p className="text-sm font-medium text-red-600">⚠️ SCAM WARNING</p>
                            <p className="text-xs text-muted-foreground">
                              This contract has been flagged as a potential scam. DO NOT interact with it!
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Verification Warning */}
                    {contractInfo && contractInfo.isVerified === false && !contractInfo.isScam && (
                      <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                        <div className="flex gap-2">
                          <XCircle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
                          <div className="space-y-1">
                            <p className="text-sm font-medium text-red-500">Contract Not Verified</p>
                            <p className="text-xs text-muted-foreground">
                              Source code is not available. Exercise caution when interacting with this contract.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Unknown Verification Status */}
                    {contractInfo && contractInfo.isVerified === undefined && (
                      <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                        <div className="flex gap-2">
                          <AlertTriangle className="h-4 w-4 text-yellow-500 shrink-0 mt-0.5" />
                          <div className="space-y-1">
                            <p className="text-sm font-medium text-yellow-500">Verification Status Unknown</p>
                            <p className="text-xs text-muted-foreground">
                              Unable to retrieve contract verification status from Blockscout.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Contract Address */}
                    <div className="space-y-2">
                      <h4 className="text-sm font-semibold">Contract Address</h4>
                      <div className="flex items-center gap-2">
                        <code className="flex-1 px-3 py-2 bg-muted rounded text-xs font-mono break-all">
                          {transfer.token.address}
                        </code>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => copyToClipboard(transfer.token.address)}
                          title="Copy address"
                        >
                          {copiedAddress ? (
                            <Check className="h-4 w-4 text-green-500" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        className="flex-1 gap-2"
                        onClick={() => window.open(getExplorerUrl(transfer.token.address, 'token'), '_blank')}
                      >
                        <ExternalLink className="h-4 w-4" />
                        View on Explorer
                      </Button>
                      <Button
                        variant="outline"
                        className="flex-1 gap-2"
                        onClick={() => window.open(getExplorerUrl(transfer.token.address, 'address'), '_blank')}
                      >
                        <FileCode className="h-4 w-4" />
                        View Contract
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
              <span className="text-[10px] sm:text-xs text-muted-foreground">
                {formatTime(transfer.timestamp)}
              </span>
            </div>

            {/* Addresses */}
            <div className="flex items-center gap-1.5 sm:gap-2 text-sm flex-wrap">
              <code className="px-1.5 py-0.5 sm:px-2 sm:py-1 bg-muted rounded text-[10px] sm:text-xs font-mono break-all">
                {transfer.from}
              </code>
              <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4 text-muted-foreground shrink-0" />
              <code className="px-1.5 py-0.5 sm:px-2 sm:py-1 bg-muted rounded text-[10px] sm:text-xs font-mono break-all">
                {transfer.to}
              </code>
            </div>

            {/* Token Name */}
            {transfer.token.name && (
              <p className="text-[10px] sm:text-xs text-muted-foreground">
                {transfer.token.name}
              </p>
            )}
          </div>

          {/* Right: Value */}
          <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-1 sm:gap-2 sm:text-right">
            <a
              href={transfer.hash && transfer.hash !== '' ? getExplorerUrl(transfer.hash, 'tx') : '#'}
              target={transfer.hash && transfer.hash !== '' ? '_blank' : '_self'}
              rel="noopener noreferrer"
              className={`${transfer.hash && transfer.hash !== '' ? 'text-primary hover:opacity-70 cursor-pointer' : 'text-muted-foreground cursor-not-allowed opacity-30'} transition-opacity`}
              onClick={(e) => {
                if (!transfer.hash || transfer.hash === '') {
                  e.preventDefault();
                }
              }}
            >
              <ExternalLink className="h-4 w-4" />
            </a>
            <p className={`text-base sm:text-lg font-bold ${getValueColor()}`}>
              {transfer.valueUsd ? formatValue(transfer.valueUsd) : 'N/A'}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
