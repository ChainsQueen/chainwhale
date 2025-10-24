import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { TrendingUp } from "lucide-react";
import type { TokenHolding } from "@/lib/shared/types";
import { getChainName } from "@/core/utils/wallet-utils";
import { motion, AnimatePresence } from "framer-motion";
import { AnimatedHover } from "@/components/ui/animated-hover";

interface TokenHoldingsSectionProps {
  holdings: TokenHolding[];
}

export function TokenHoldingsSection({ holdings }: TokenHoldingsSectionProps) {
  if (holdings.length === 0) return null;

  return (
    <Card className="transition-shadow border border-blue-500/20 hover:border-blue-500/40">
      <CardHeader>
        <CardTitle>Token Holdings ({holdings.length})</CardTitle>
        <CardDescription>Top tokens by value</CardDescription>
      </CardHeader>
      <CardContent>
        <AnimatePresence mode="wait">
          <div className="space-y-3">
            {holdings.slice(0, 15).map((holding, index) => (
              <motion.div
                key={`${holding.address}-${index}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.4, delay: index * 0.05 }}
              >
                <AnimatedHover type="card">
                  <div
                    key={`${holding.address}-${index}`}
                    className="flex items-center justify-between p-3 rounded-lg transition-shadow border border-blue-500/20 hover:border-blue-500/40"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <TrendingUp className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">{holding.symbol}</p>
                        <p className="text-xs text-muted-foreground">
                          {getChainName(holding.chain)}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">
                        $
                        {holding.value.toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {holding.balance} {holding.symbol}
                      </p>
                    </div>
                  </div>
                </AnimatedHover>
              </motion.div>
            ))}
          </div>
        </AnimatePresence>
      </CardContent>
    </Card>
  );
}
