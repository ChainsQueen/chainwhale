import { Button } from "@/components/ui/button";
import { CopyButton } from "@/components/ui/copy-button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ExternalLink } from "lucide-react";
import { getExplorerUrl } from "@/core/utils/wallet-utils";
import { DEFAULT_CHAIN_ID } from "@/core/constants/chains.constants";

interface WalletOverviewProps {
  address: string;
  ensName?: string;
}

export function WalletOverview({ address, ensName }: WalletOverviewProps) {
  return (
    <div>
      <p className="text-sm text-muted-foreground mb-1">Address</p>
      {ensName && (
        <p className="text-lg font-semibold mb-2 text-primary">{ensName}</p>
      )}
      <div className="flex flex-wrap items-center gap-2">
        <TooltipProvider>
          <div className="inline-flex items-center gap-2 bg-muted rounded px-3 py-2">
            <code className="text-xs font-mono break-all">{address}</code>
            <CopyButton
              text={address}
              variant="ghost"
              size="icon"
              className="h-6 w-6 flex-shrink-0"
            />
          </div>
        </TooltipProvider>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={() =>
                  window.open(getExplorerUrl(DEFAULT_CHAIN_ID, address), "_blank")
                }
                className="h-8 w-8 p-0"
              >
                <ExternalLink className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p className="text-xs">View on Etherscan</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </div>
  );
}
