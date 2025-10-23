import { TrendingUp, TrendingDown, ArrowLeftRight } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { getExplorerUrl } from '@/core/utils/wallet-utils';

/**
 * Props for TransferTypeIndicator component
 */
interface TransferTypeIndicatorProps {
  /** USD value of the transfer */
  valueUsd?: number;
  /** Transaction hash (makes icon clickable to explorer) */
  hash?: string;
  /** Blockchain chain ID for explorer link */
  chainId: string;
}

/**
 * Displays categorized whale transfer indicator with visual icon and tooltip
 * 
 * Categorizes transfers into three tiers based on USD value:
 * - **Mega Whale Move** (> $500K): Green trending up icon
 * - **Large Whale Move** ($200K - $500K): Orange trending down icon
 * - **Medium Whale Move** ($100K - $200K): Blue bidirectional arrow icon
 * 
 * Features:
 * - Color-coded icons for quick visual identification
 * - Tooltip with transfer category and value range
 * - Clickable link to block explorer if transaction hash provided
 * - Supports multiple chains (Ethereum, Base, Arbitrum, Optimism, Polygon)
 * 
 * @component
 * 
 * @example
 * // Mega whale move with explorer link
 * <TransferTypeIndicator
 *   valueUsd={750000}
 *   hash="0x123..."
 *   chainId="1"
 * />
 * 
 * @example
 * // Medium whale move without link
 * <TransferTypeIndicator
 *   valueUsd={150000}
 *   chainId="8453"
 * />
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

  const iconData = getTransferIcon();

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          {hash ? (
            <a
              href={getExplorerUrl(chainId, hash, 'tx')}
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
        <TooltipContent>
          <div className="text-xs">
            <p className="font-semibold">{iconData.label}</p>
            <p className="text-muted-foreground">{iconData.description}</p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}