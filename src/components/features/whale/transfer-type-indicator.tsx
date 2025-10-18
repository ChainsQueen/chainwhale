// File: /Users/destiny/Desktop/chainwhale/src/components/features/whale/transfer-type-indicator.tsx
import { TrendingUp, TrendingDown, ArrowLeftRight } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface TransferTypeIndicatorProps {
  valueUsd?: number;
  hash?: string;
  chainId: string;
}

/**
 * Display transfer type indicator with icon and tooltip
 * Shows Mega/Large/Medium whale move based on value
 * 
 * @example
 * <TransferTypeIndicator valueUsd={750000} hash="0x123..." chainId="1" />
 */
export function TransferTypeIndicator({ 
  valueUsd, 
  hash, 
  chainId
}: TransferTypeIndicatorProps) {
  const getTransferIcon = () => {
    if (valueUsd && valueUsd > 500000) {
      return {
        icon: <TrendingUp className="w-4 h-4 text-green-500" />,
        label: 'Mega Whale Move',
        description: 'Transfer > $500K'
      };
    }
    if (valueUsd && valueUsd > 200000) {
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

  const getExplorerUrl = (identifier: string, type: 'tx' | 'address' | 'token' = 'tx') => {
    const explorers: Record<string, string> = {
      '1': 'https://etherscan.io',
      '8453': 'https://basescan.org',
      '42161': 'https://arbiscan.io',
      '10': 'https://optimistic.etherscan.io',
      '137': 'https://polygonscan.com',
    };
    const baseUrl = explorers[chainId] || explorers['1'];
    return `${baseUrl}/${type}/${identifier}`;
  };

  const iconData = getTransferIcon();

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          {hash ? (
            <a
              href={getExplorerUrl(hash, 'tx')}
              target="_blank"
              rel="noopener noreferrer"
              className="cursor-pointer hover:opacity-70 transition-opacity"
            >
              {iconData.icon}
            </a>
          ) : (
            <div className="cursor-help">{iconData.icon}</div>
          )}
        </TooltipTrigger>
        <TooltipContent className="bg-popover text-popover-foreground border-border">
          <div className="text-xs">
            <p className="font-semibold">{iconData.label}</p>
            <p className="text-muted-foreground">{iconData.description}</p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}