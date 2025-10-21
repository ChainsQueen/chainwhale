'use client';

/**
 * Token Contract Details Dialog - Data Sources & Testing Guide
 * 
 * ## Data Flow Architecture
 * 
 * ### 1. Props (Passed from Parent Component)
 * These come from the whale tracker feed or wallet analysis:
 * - `tokenAddress` - Contract address from blockchain event
 * - `tokenName` - Token name from transfer event (may be undefined)
 * - `tokenSymbol` - Token symbol from transfer event
 * - `tokenDecimals` - Token decimals from transfer event
 * - `chainId` - Blockchain chain ID (e.g., '1' for Ethereum)
 * - `chainName` - Human-readable chain name (e.g., 'Ethereum')
 * 
 * ### 2. API Data (Fetched from Blockscout via `/api/whale-tracker/contract-info`)
 * When dialog opens, fetches from Blockscout API `/addresses/{address}` endpoint:
 * 
 * **Security & Verification:**
 * - `isVerified` - Contract source code verification status (boolean | undefined)
 * - `isProxy` - Whether contract uses proxy pattern (boolean)
 * - `implementationAddress` - Implementation contract for proxies (string | undefined)
 * - `isScam` - Scam detection flag (boolean | undefined)
 * - `reputation` - Security reputation score (string | undefined)
 * 
 * **Token Metadata:**
 * - `tokenType` - Token standard (ERC-20, ERC-721, etc.)
 * - `iconUrl` - Token logo URL from Blockscout
 * 
 * **Market Data (from Blockscout price feeds):**
 * - `tokenPrice` - Current USD price per token (exchange_rate)
 * - `marketCap` - Circulating market capitalization
 * - `volume24h` - 24-hour trading volume
 * 
 * **Token Statistics:**
 * - `holderCount` - Number of unique token holders
 * - `totalSupply` - Total token supply (raw value, not adjusted by decimals)
 * 
 * **Contract Creation:**
 * - `creatorAddress` - Address that deployed the contract
 * - `creationTxHash` - Transaction hash of contract deployment
 * 
 * ### 3. Computed/Derived Data
 * - Explorer URLs - Generated from `chainId` + `address` using `getExplorerUrl()`
 * - Formatted numbers - Market cap, volume, price formatting
 * - Badge states - Derived from verification, proxy, scam flags
 * 
 * ## Testing Checklist
 * 
 * ### Unit Tests (Component Behavior)
 * - [ ] Dialog opens/closes correctly
 * - [ ] Loading state displays while fetching
 * - [ ] Props are displayed correctly (name, symbol, chain)
 * - [ ] Copy button works for contract address
 * - [ ] Custom trigger element renders
 * 
 * ### Integration Tests (API & Data Flow)
 * - [ ] API endpoint returns correct data structure
 * - [ ] Verified contracts show green badge
 * - [ ] Unverified contracts show warning
 * - [ ] Proxy contracts display implementation address
 * - [ ] Scam contracts show red warning alert
 * - [ ] Market data displays when available
 * - [ ] Missing data (undefined) handled gracefully
 * 
 * ### E2E Tests (User Interactions)
 * - [ ] "View on Explorer" opens correct Blockscout token page
 * - [ ] "View Contract" opens correct Blockscout address page
 * - [ ] Deployment tx link opens correct transaction page
 * - [ ] Links use correct chain explorer (Etherscan, Basescan, etc.)
 * - [ ] Copy address button copies to clipboard
 * 
 * ### Data Validation Tests
 * - [ ] Test with verified contract (e.g., USDT on Ethereum)
 * - [ ] Test with unverified contract
 * - [ ] Test with proxy contract (e.g., USDC)
 * - [ ] Test with token missing market data
 * - [ ] Test with different chains (Ethereum, Base, Arbitrum)
 * - [ ] Test error handling when API fails
 * 
 * ### Example Test Addresses
 * - **Verified ERC-20**: `0xdAC17F958D2ee523a2206206994597C13D831ec7` (USDT on Ethereum)
 * - **Proxy Contract**: `0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48` (USDC on Ethereum)
 * - **Base Chain**: `0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913` (USDC on Base)
 */

import { useState } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { FileCode, ExternalLink, Info } from 'lucide-react';
import { getExplorerUrl } from '@/core/utils/wallet-utils';
import { AlertBox } from '@/components/ui/alert-box';
import { CopyButton } from '@/components/ui/copy-button';
import { InfoGrid } from '@/components/ui/info-grid';
import { SecurityBadges } from '@/components/features/contract/security-badges';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

/**
 * Contract information data structure
 */
interface ContractInfo {
  /** Whether contract source code is verified */
  isVerified?: boolean;
  /** Whether contract is a proxy pattern */
  isProxy?: boolean;
  /** Implementation contract address (for proxies) */
  implementationAddress?: string;
  /** Implementation contract name (for proxies) */
  implementationName?: string;
  /** Token standard (ERC-20, ERC-721, etc.) */
  tokenType?: string;
  /** Token decimals */
  tokenDecimals?: string;
  /** Number of token holders */
  holderCount?: number;
  /** Total token supply */
  totalSupply?: string;
  /** Current token price in USD */
  tokenPrice?: string;
  /** Market capitalization */
  marketCap?: string;
  /** 24-hour trading volume */
  volume24h?: string;
  /** Token icon URL */
  iconUrl?: string;
  /** Whether flagged as scam */
  isScam?: boolean;
  /** Security reputation status */
  reputation?: string;
  /** Contract creator address */
  creatorAddress?: string;
  /** Contract creation transaction hash */
  creationTxHash?: string;
  /** Contract creation status */
  creationStatus?: string;
  /** Token name from API */
  tokenName?: string;
  /** Token symbol from API */
  tokenSymbol?: string;
}

/**
 * Props for ContractInfoDialog component
 */
interface ContractInfoDialogProps {
  /** Smart contract address */
  tokenAddress: string;
  /** Token name (optional) */
  tokenName?: string;
  /** Token symbol */
  tokenSymbol: string;
  /** Token decimals (optional) */
  tokenDecimals?: number;
  /** Blockchain chain ID */
  chainId: string;
  /** Human-readable chain name */
  chainName: string;
  /** Custom trigger element (defaults to info button) */
  trigger?: React.ReactNode;
  /** Optional: Transfer transaction hash */
  transferHash?: string;
  /** Optional: Transfer sender address */
  transferFrom?: string;
  /** Optional: Transfer recipient address */
  transferTo?: string;
  /** Optional: Transfer timestamp */
  transferTimestamp?: number;
  /** Optional: Transfer value in USD */
  transferValueUsd?: number;
}

/**
 * Modal dialog displaying comprehensive smart contract information
 * 
 * Features:
 * - **Security badges**: Verification status, proxy detection, scam warnings
 * - **Token metadata**: Name, symbol, decimals, type, icon
 * - **Market data**: Price, market cap, 24h volume, holder count
 * - **Contract details**: Creator address, creation tx, implementation address
 * - **Explorer links**: Direct links to block explorer for addresses and transactions
 * - **Lazy loading**: Fetches data only when dialog is opened
 * - **Copy functionality**: One-click copy for addresses
 * 
 * Used across the application for consistent contract information display
 * in whale tracker, wallet analysis, and token lists.
 * 
 * @component
 * 
 * @example
 * // Basic usage with default trigger
 * <ContractInfoDialog
 *   tokenAddress="0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48"
 *   tokenName="USD Coin"
 *   tokenSymbol="USDC"
 *   tokenDecimals={6}
 *   chainId="1"
 *   chainName="Ethereum"
 * />
 * 
 * @example
 * // Custom trigger element
 * <ContractInfoDialog
 *   tokenAddress="0x..."
 *   tokenSymbol="TOKEN"
 *   chainId="8453"
 *   chainName="Base"
 *   trigger={<Button>View Contract</Button>}
 * />
 */
export function ContractInfoDialog({
  tokenAddress,
  tokenName,
  tokenSymbol,
  tokenDecimals,
  chainId,
  chainName,
  trigger,
  transferHash,
  transferFrom,
  transferTo,
  transferTimestamp,
  transferValueUsd,
}: ContractInfoDialogProps) {
  const [contractInfo, setContractInfo] = useState<ContractInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  const fetchContractInfo = async () => {
    if (contractInfo || loading) return;
    
    setLoading(true);
    try {
      const apiUrl = `/api/whale-tracker/contract-info?address=${tokenAddress}&chainId=${chainId}`;
      const response = await fetch(apiUrl);
      
      if (response.ok) {
        const data = await response.json();
        setContractInfo(data);
      }
    } catch (error) {
      console.error('Failed to fetch contract info:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDialogOpen = (open: boolean) => {
    setDialogOpen(open);
    if (open) {
      fetchContractInfo();
    }
  };


  return (
    <Dialog open={dialogOpen} onOpenChange={handleDialogOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button
            variant="ghost"
            size="icon"
            className="h-5 w-5 p-0 hover:bg-muted"
            title="View contract details"
          >
            <FileCode className="h-3 w-3 text-muted-foreground" />
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileCode className="h-5 w-5" />
            Token Contract Details
          </DialogTitle>
          <DialogDescription>
            {tokenName || tokenSymbol} on {chainName}
          </DialogDescription>
        </DialogHeader>
        
        {/* Security Status Badges - Always visible */}
        <div className="flex flex-wrap gap-2 px-6">
          <SecurityBadges
            loading={loading}
            isVerified={contractInfo?.isVerified}
            isProxy={contractInfo?.isProxy}
            tokenType={contractInfo?.tokenType}
            isScam={contractInfo?.isScam}
            reputation={contractInfo?.reputation}
          />
        </div>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="w-full grid grid-cols-4 mx-6" style={{ width: 'calc(100% - 3rem)' }}>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="market">Market</TabsTrigger>
            <TabsTrigger value="transfer">Transfer</TabsTrigger>
            <TabsTrigger value="contract">Contract</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4 px-6 min-h-[400px]">

          {/* Token Icon & Price */}
          {contractInfo && (
            <div className="flex items-center gap-3 p-3 bg-muted/30 dark:bg-muted/50 rounded-lg border border-border">
              {contractInfo.iconUrl ? (
                <Image 
                  src={contractInfo.iconUrl} 
                  alt={tokenSymbol}
                  width={40}
                  height={40}
                  className="w-10 h-10 rounded-full"
                  onError={(e: React.SyntheticEvent<HTMLImageElement>) => { e.currentTarget.style.display = 'none'; }}
                  unoptimized
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground text-xs font-semibold">
                  {tokenSymbol.slice(0, 2)}
                </div>
              )}
              <div className="flex-1">
                <div>
                  <span className="text-xs text-muted-foreground">Price</span>
                  <p className="text-lg font-bold text-foreground">
                    {contractInfo.tokenPrice 
                      ? `$${parseFloat(contractInfo.tokenPrice).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 })}`
                      : <span className="text-sm text-muted-foreground">Not Available</span>
                    }
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Market Stats */}
          {contractInfo && (
            <div className="space-y-2">
              <h4 className="text-sm font-semibold">Market Statistics</h4>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="space-y-1 p-3 rounded-lg bg-muted/30 dark:bg-muted/20 border border-border/50">
                  <span className="text-muted-foreground text-xs">Market Cap</span>
                  <p className="font-semibold text-foreground">
                    {contractInfo.marketCap 
                      ? `$${parseFloat(contractInfo.marketCap).toLocaleString(undefined, { maximumFractionDigits: 0 })}`
                      : <span className="text-xs text-muted-foreground">Not Available</span>
                    }
                  </p>
                </div>
                <div className="space-y-1 p-3 rounded-lg bg-muted/30 dark:bg-muted/20 border border-border/50">
                  <span className="text-muted-foreground text-xs">24h Volume</span>
                  <p className="font-semibold text-foreground">
                    {contractInfo.volume24h 
                      ? `$${parseFloat(contractInfo.volume24h).toLocaleString(undefined, { maximumFractionDigits: 0 })}`
                      : <span className="text-xs text-muted-foreground">Not Available</span>
                    }
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Token Info */}
          <InfoGrid
            title="Token Information"
            items={[
              { label: 'Name', value: contractInfo?.tokenName || tokenName || 'Unknown' },
              { label: 'Symbol', value: contractInfo?.tokenSymbol || tokenSymbol },
              ...(contractInfo?.tokenType ? [{ label: 'Type', value: contractInfo.tokenType }] : []),
              ...(contractInfo?.tokenPrice ? [{ 
                label: 'Price', 
                value: `$${parseFloat(contractInfo.tokenPrice).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 })}` 
              }] : []),
              ...((tokenDecimals || contractInfo?.tokenDecimals) ? [{ 
                label: 'Decimals', 
                value: String(tokenDecimals || contractInfo?.tokenDecimals) 
              }] : []),
              { label: 'Chain', value: chainName },
              { 
                label: (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="flex items-center gap-1 cursor-help">
                          HOLDERS
                          <Info className="h-3 w-3 text-muted-foreground" />
                        </span>
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs">
                        <p className="text-xs text-foreground">
                          Holder count may differ from other sources (e.g., Etherscan) due to:
                        </p>
                        <ul className="text-xs list-disc list-inside mt-1 space-y-0.5 text-foreground">
                          <li>Different counting methods</li>
                          <li>Update timing differences</li>
                          <li>Zero-balance address filtering</li>
                        </ul>
                        <p className="text-xs mt-1 text-muted-foreground">
                          Data from Blockscout
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                ),
                value: contractInfo?.holderCount 
                  ? contractInfo.holderCount.toLocaleString(undefined, { maximumFractionDigits: 0 }) 
                  : 'Data unavailable' 
              },
              ...(contractInfo?.totalSupply ? [{ 
                label: 'Total Supply', 
                value: parseFloat(contractInfo.totalSupply).toLocaleString(undefined, { maximumFractionDigits: 0 }),
                colSpan: 2 as const
              }] : []),
            ]}
          />
          </TabsContent>

          {/* Market Tab */}
          <TabsContent value="market" className="space-y-4 px-6 min-h-[400px]">

          {/* Market Stats */}
          {contractInfo && (
            <div className="space-y-2">
              <h4 className="text-sm font-semibold">Market Statistics</h4>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="space-y-1 p-3 rounded-lg bg-muted/30 dark:bg-muted/20 border border-border/50">
                  <span className="text-muted-foreground text-xs">Market Cap</span>
                  <p className="font-semibold text-foreground">
                    {contractInfo.marketCap 
                      ? `$${parseFloat(contractInfo.marketCap).toLocaleString(undefined, { maximumFractionDigits: 0 })}`
                      : <span className="text-xs text-muted-foreground">Not Available</span>
                    }
                  </p>
                </div>
                <div className="space-y-1 p-3 rounded-lg bg-muted/30 dark:bg-muted/20 border border-border/50">
                  <span className="text-muted-foreground text-xs">24h Volume</span>
                  <p className="font-semibold text-foreground">
                    {contractInfo.volume24h 
                      ? `$${parseFloat(contractInfo.volume24h).toLocaleString(undefined, { maximumFractionDigits: 0 })}`
                      : <span className="text-xs text-muted-foreground">Not Available</span>
                    }
                  </p>
                </div>
              </div>
            </div>
          )}
          </TabsContent>

          {/* Transfer Tab */}
          <TabsContent value="transfer" className="space-y-4 px-6 min-h-[400px]">

          {/* Transfer Details */}
          {(transferHash || transferFrom || transferTo) && (
            <div className="space-y-2">
              <h4 className="text-sm font-semibold">Transfer Details</h4>
              <div className="text-sm space-y-2 p-3 rounded-lg bg-muted/30 dark:bg-muted/20 border border-border/50">
                {transferHash && (
                  <div className="space-y-1">
                    <span className="text-muted-foreground text-xs">Transaction Hash</span>
                    <a 
                      href={getExplorerUrl(chainId, transferHash, 'tx')}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-mono text-xs text-primary hover:underline break-all block"
                    >
                      {transferHash}
                    </a>
                  </div>
                )}
                {transferFrom && (
                  <div className="space-y-1">
                    <span className="text-muted-foreground text-xs">From</span>
                    <a 
                      href={getExplorerUrl(chainId, transferFrom, 'address')}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-mono text-xs text-primary hover:underline break-all block"
                    >
                      {transferFrom}
                    </a>
                  </div>
                )}
                {transferTo && (
                  <div className="space-y-1">
                    <span className="text-muted-foreground text-xs">To</span>
                    <a 
                      href={getExplorerUrl(chainId, transferTo, 'address')}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-mono text-xs text-primary hover:underline break-all block"
                    >
                      {transferTo}
                    </a>
                  </div>
                )}
                {transferTimestamp && (
                  <div className="space-y-1">
                    <span className="text-muted-foreground text-xs">Time</span>
                    <p className="text-xs text-foreground">
                      {new Date(transferTimestamp).toLocaleString(undefined, {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                      })}
                    </p>
                  </div>
                )}
                {transferValueUsd !== undefined && (
                  <div className="space-y-1">
                    <span className="text-muted-foreground text-xs">Value</span>
                    <p className="font-semibold text-foreground">
                      ${transferValueUsd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
          </TabsContent>

          {/* Contract Tab */}
          <TabsContent value="contract" className="space-y-4 px-6 min-h-[400px]">

          {/* Contract Details */}
          {contractInfo && (
            <div className="space-y-2">
              <h4 className="text-sm font-semibold">Contract Details</h4>
              <div className="text-sm space-y-2 p-3 rounded-lg bg-muted/30 dark:bg-muted/20 border border-border/50">
                <div className="space-y-1">
                  <span className="text-muted-foreground text-xs">Creator</span>
                  {contractInfo.creatorAddress ? (
                    <a 
                      href={getExplorerUrl(chainId, contractInfo.creatorAddress, 'address')}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-mono text-xs text-primary hover:underline break-all block"
                    >
                      {contractInfo.creatorAddress}
                    </a>
                  ) : (
                    <p className="text-xs text-muted-foreground">Not Available</p>
                  )}
                </div>
                <div className="space-y-1">
                  <span className="text-muted-foreground text-xs">Deployment Tx</span>
                  {contractInfo.creationTxHash ? (
                    <a 
                      href={getExplorerUrl(chainId, contractInfo.creationTxHash, 'tx')}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-mono text-xs text-primary hover:underline break-all block"
                    >
                      {contractInfo.creationTxHash}
                    </a>
                  ) : (
                    <p className="text-xs text-muted-foreground">Not Available</p>
                  )}
                </div>
                <div className="space-y-1">
                  <span className="text-muted-foreground text-xs">Creation Status</span>
                  <p className="text-xs text-foreground capitalize">
                    {contractInfo.creationStatus || <span className="text-muted-foreground normal-case">Not Available</span>}
                  </p>
                </div>
                <div className="space-y-1">
                  <span className="text-muted-foreground text-xs">Implementation Contract</span>
                  {contractInfo.implementationAddress ? (
                    <>
                      <a 
                        href={getExplorerUrl(chainId, contractInfo.implementationAddress, 'address')}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-mono text-xs text-primary hover:underline break-all block"
                      >
                        {contractInfo.implementationAddress}
                      </a>
                      {contractInfo.implementationName && (
                        <p className="text-xs text-muted-foreground mt-0.5">{contractInfo.implementationName}</p>
                      )}
                    </>
                  ) : (
                    <p className="text-xs text-muted-foreground">Not a Proxy Contract</p>
                  )}
                </div>
                <div className="space-y-1">
                  <span className="text-muted-foreground text-xs">Reputation</span>
                  <p className="text-xs text-foreground capitalize">
                    {contractInfo.reputation || <span className="text-muted-foreground normal-case">Not Available</span>}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Warnings */}
          {contractInfo?.isProxy && (
            <AlertBox
              variant="info"
              title="Proxy Contract Detected"
              description={`This contract can be upgraded by its owner. Implementation: ${contractInfo.implementationAddress?.slice(0, 10)}...`}
            />
          )}

          {contractInfo?.isScam && (
            <AlertBox
              variant="error"
              title="⚠️ SCAM WARNING"
              description="This contract has been flagged as a potential scam. DO NOT interact with it!"
            />
          )}

          {contractInfo && contractInfo.isVerified === false && !contractInfo.isScam && (
            <AlertBox
              variant="error"
              title="Contract Not Verified"
              description="Source code is not available. Exercise caution when interacting with this contract."
            />
          )}

          {contractInfo && contractInfo.isVerified === undefined && (
            <AlertBox
              variant="warning"
              title="Verification Status Unknown"
              description="Unable to retrieve contract verification status from Blockscout."
            />
          )}

          {/* Contract Address */}
          <div className="space-y-2">
            <h4 className="text-sm font-semibold">Contract Address</h4>
            <div className="flex items-center gap-2">
              <code className="flex-1 px-3 py-2 bg-muted/50 dark:bg-muted rounded text-xs font-mono break-all border border-border">
                {tokenAddress}
              </code>
              <CopyButton text={tokenAddress} title="Copy address" />
            </div>
          </div>

          </TabsContent>
        </Tabs>

        {/* Actions - Always visible at bottom */}
        <div className="flex gap-2 px-6 pb-2">
          <Button
            variant="outline"
            className="flex-1 gap-2"
            asChild
          >
            <a
              href={getExplorerUrl(chainId, tokenAddress, 'token')}
              target="_blank"
              rel="noopener noreferrer"
            >
              <ExternalLink className="h-4 w-4" />
              View on Explorer
            </a>
          </Button>
          <Button
            variant="outline"
            className="flex-1 gap-2"
            asChild
          >
            <a
              href={getExplorerUrl(chainId, tokenAddress, 'address')}
              target="_blank"
              rel="noopener noreferrer"
            >
              <FileCode className="h-4 w-4" />
              View Contract
            </a>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
