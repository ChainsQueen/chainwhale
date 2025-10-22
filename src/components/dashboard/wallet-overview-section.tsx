import type { TokenHolding } from "@/lib/shared/types";
import { formatUsdValue } from "@/core/utils/wallet-utils";

interface PortfolioBreakdownProps {
  holdings: TokenHolding[];
  totalValue: number;
  chainCount: number;
}

export function PortfolioBreakdown({
  holdings,
  totalValue,
  chainCount,
}: PortfolioBreakdownProps) {
  if (holdings.length === 0) return null;

  const ethHoldings = holdings.filter(
    (h) => h.symbol === "ETH" && h.address === "native"
  );
  const ethBalance = ethHoldings.reduce(
    (sum, h) => sum + parseFloat(h.balance),
    0
  );
  const ethValue = ethHoldings.reduce((sum, h) => sum + h.value, 0);
  const tokenValue = holdings
    .filter((h) => h.address !== "native")
    .reduce((sum, h) => sum + h.value, 0);
  const tokenCount = holdings.filter((h) => h.address !== "native").length;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {ethBalance > 0 && (
        <>
          <div className="p-4 rounded-lg border border-blue-500/30 bg-gradient-to-r from-blue-500/5 via-slate-500/5 to-blue-500/5">
            <p className="text-xs text-muted-foreground mb-1">ETH BALANCE</p>
            <p className="text-lg font-bold">{ethBalance.toFixed(2)} ETH</p>
          </div>
          <div className="p-4 rounded-lg border border-blue-500/30 bg-gradient-to-r from-blue-500/5 via-slate-500/5 to-blue-500/5">
            <p className="text-xs text-muted-foreground mb-1">ETH VALUE</p>
            <p className="text-lg font-bold text-primary">
              {ethBalance.toFixed(2)} ETH
            </p>
            {ethValue > 0 && (
              <p className="text-xs text-muted-foreground mt-1">
                ≈ {formatUsdValue(ethValue)}
              </p>
            )}
          </div>
        </>
      )}
      {tokenCount > 0 && (
        <div className="p-4 bg-muted/30 rounded-lg">
          <p className="text-xs text-muted-foreground mb-1">TOKEN HOLDINGS</p>
          <p className="text-lg font-bold text-primary">
            {formatUsdValue(tokenValue)}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            ({tokenCount} {tokenCount === 1 ? "Token" : "Tokens"})
          </p>
        </div>
      )}
      {totalValue > 0 && (
        <div className="p-4 rounded-lg border border-blue-500/30 bg-gradient-to-r from-blue-500/5 via-slate-500/5 to-blue-500/5">
          <p className="text-xs text-muted-foreground mb-1">MULTICHAIN INFO</p>
          <p className="text-lg font-bold text-primary">
            {formatUsdValue(totalValue)}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {chainCount} {chainCount === 1 ? "chain" : "chains"} scanned
          </p>
        </div>
      )}
    </div>
  );
}
