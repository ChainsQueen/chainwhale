'use client';

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
import { FileCode, ExternalLink } from 'lucide-react';
import { getExplorerUrl } from '@/core/utils/wallet-utils';
import { AlertBox } from '@/components/ui/alert-box';
import { CopyButton } from '@/components/ui/copy-button';
import { InfoGrid } from '@/components/ui/info-grid';
import { SecurityBadges } from '@/components/features/contract/security-badges';

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
            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
              {contractInfo.iconUrl && (
                <Image 
                  src={contractInfo.iconUrl} 
                  alt={tokenSymbol}
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
          <InfoGrid
            title="Token Information"
            items={[
              { label: 'Name', value: tokenName || 'Unknown' },
              { label: 'Symbol', value: tokenSymbol },
              ...(tokenDecimals ? [{ label: 'Decimals', value: tokenDecimals }] : []),
              { label: 'Chain', value: chainName },
              { 
                label: 'Holders', 
                value: contractInfo?.holderCount 
                  ? contractInfo.holderCount.toLocaleString() 
                  : 'Data unavailable' 
              },
              ...(contractInfo?.totalSupply ? [{ 
                label: 'Total Supply', 
                value: contractInfo.totalSupply,
                colSpan: 2 as const
              }] : []),
            ]}
          />

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
                      href={getExplorerUrl(contractInfo.creationTxHash, chainId, 'tx')}
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
              <code className="flex-1 px-3 py-2 bg-muted rounded text-xs font-mono break-all">
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
              onClick={() => window.open(getExplorerUrl(tokenAddress, chainId, 'token'), '_blank')}
            >
              <ExternalLink className="h-4 w-4" />
              View on Explorer
            </Button>
            <Button
              variant="outline"
              className="flex-1 gap-2"
              onClick={() => window.open(getExplorerUrl(tokenAddress, chainId, 'address'), '_blank')}
            >
              <FileCode className="h-4 w-4" />
              View Contract
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
