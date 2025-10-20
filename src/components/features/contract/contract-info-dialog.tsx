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
  /** Token standard (ERC-20, ERC-721, etc.) */
  tokenType?: string;
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
        
        <div className="space-y-4">
          {/* Security Status Badges */}
          <div className="flex flex-wrap gap-2">
            <SecurityBadges
              loading={loading}
              isVerified={contractInfo?.isVerified}
              isProxy={contractInfo?.isProxy}
              tokenType={contractInfo?.tokenType}
              isScam={contractInfo?.isScam}
              reputation={contractInfo?.reputation}
            />
          </div>

          {/* Token Icon & Price */}
          {contractInfo && (contractInfo.tokenPrice || contractInfo.iconUrl) && (
            <div className="flex items-center gap-3 p-3 bg-muted/30 dark:bg-muted/50 rounded-lg border border-border">
              {contractInfo.iconUrl && (
                <Image 
                  src={contractInfo.iconUrl} 
                  alt={tokenSymbol}
                  width={40}
                  height={40}
                  className="w-10 h-10 rounded-full"
                  onError={(e: React.SyntheticEvent<HTMLImageElement>) => { e.currentTarget.style.display = 'none'; }}
                  unoptimized
                />
              )}
              <div className="flex-1">
                {contractInfo.tokenPrice && (
                  <div>
                    <span className="text-xs text-muted-foreground">Price</span>
                    <p className="text-lg font-bold text-foreground">${parseFloat(contractInfo.tokenPrice).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 })}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Market Stats */}
          {contractInfo && (contractInfo.marketCap || contractInfo.volume24h) && (
            <div className="space-y-2">
              <h4 className="text-sm font-semibold">Market Statistics</h4>
              <div className="grid grid-cols-2 gap-3 text-sm">
                {contractInfo.marketCap && (
                  <div className="space-y-1 p-3 rounded-lg bg-muted/30 dark:bg-muted/20 border border-border/50">
                    <span className="text-muted-foreground text-xs">Market Cap</span>
                    <p className="font-semibold text-foreground">${parseFloat(contractInfo.marketCap).toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
                  </div>
                )}
                {contractInfo.volume24h && (
                  <div className="space-y-1 p-3 rounded-lg bg-muted/30 dark:bg-muted/20 border border-border/50">
                    <span className="text-muted-foreground text-xs">24h Volume</span>
                    <p className="font-semibold text-foreground">${parseFloat(contractInfo.volume24h).toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Token Info */}
          <InfoGrid
            title="Token Information"
            items={[
              { label: 'Name', value: tokenName || 'Unknown' },
              { label: 'Symbol', value: tokenSymbol },
              ...(tokenDecimals ? [{ label: 'Decimals', value: String(tokenDecimals) }] : []),
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
                      <TooltipContent className="max-w-xs bg-popover text-popover-foreground border-border">
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

          {/* Contract Details */}
          {contractInfo?.creatorAddress && (
            <div className="space-y-2">
              <h4 className="text-sm font-semibold">Contract Details</h4>
              <div className="text-sm space-y-2 p-3 rounded-lg bg-muted/30 dark:bg-muted/20 border border-border/50">
                <div className="space-y-1">
                  <span className="text-muted-foreground text-xs">Creator</span>
                  <p className="font-mono text-xs break-all text-foreground">{contractInfo.creatorAddress}</p>
                </div>
                {contractInfo.creationTxHash && (
                  <div className="space-y-1">
                    <span className="text-muted-foreground text-xs">Deployment Tx</span>
                    <a 
                      href={getExplorerUrl(chainId, contractInfo.creationTxHash, 'tx')}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-mono text-xs text-primary hover:underline break-all block"
                    >
                      {contractInfo.creationTxHash.slice(0, 20)}...
                    </a>
                  </div>
                )}
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

          {/* Actions */}
          <div className="flex gap-2">
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
        </div>
      </DialogContent>
    </Dialog>
  );
}
