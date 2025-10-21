import { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AnimatedHover } from '@/components/ui/animated-hover';
import { Trophy, Copy, Check } from 'lucide-react';
import type { WhaleTopWhale } from '@/core/hooks/use-whale-feed';

export interface WhaleTopLeaderboardProps {
  topWhales: WhaleTopWhale[];
}

const MEDALS = ['🥇', '🥈', '🥉'];
const RANK_COLORS = [
  'from-yellow-500 to-yellow-600', // Gold
  'from-gray-400 to-gray-500',     // Silver
  'from-orange-600 to-orange-700', // Bronze
];

/**
 * Whale top leaderboard component
 * 
 * @component
 * @example
 * <WhaleTopLeaderboard topWhales={topWhales} />
 */
export function WhaleTopLeaderboard({ topWhales }: WhaleTopLeaderboardProps) {
  const [copiedAddresses, setCopiedAddresses] = useState<Set<string>>(new Set());

  const copyAddress = async (e: React.MouseEvent, address: string) => {
    e.stopPropagation();
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(address);
      } else {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = address;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
      // Add address to copied set
      setCopiedAddresses(prev => new Set(prev).add(address));
      // Remove after 2 seconds
      setTimeout(() => {
        setCopiedAddresses(prev => {
          const newSet = new Set(prev);
          newSet.delete(address);
          return newSet;
        });
      }, 2000);
    } catch (error) {
      console.error('Failed to copy address:', error);
    }
  };

  if (topWhales.length === 0) return null;

  return (
    <motion.div
      key="top-whales"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.5, delay: 0.3 }}
      className="space-y-3"
    >
      <div className="space-y-1">
        <AnimatedHover type="label">
          <h2 className="text-lg sm:text-xl font-semibold flex items-center gap-2">
            <Trophy className="w-5 h-5 text-yellow-500" />
            Top {Math.min(topWhales.length, 3)} Whales by Volume
          </h2>
        </AnimatedHover>
        <AnimatedHover type="label">
          <p className="text-xs text-muted-foreground">
            Most active addresses by total transfer volume
          </p>
        </AnimatedHover>
      </div>
      
      {/* Top Whales as Stat Cards - Dynamic grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {topWhales.slice(0, 3).map((whale, index) => (
          <motion.div
            key={whale.address}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, delay: 0.4 + index * 0.1 }}
          >
            <AnimatedHover type="card">
              <Card className="h-full border border-blue-500/30 bg-gradient-to-r from-blue-500/5 via-slate-500/5 to-blue-500/5">
                <CardContent className="p-4 space-y-3">
                  {/* Rank Badge with Medal */}
                  <div className="flex items-center justify-between">
                    <Badge 
                      variant="default" 
                      className={`bg-gradient-to-r ${RANK_COLORS[index]} text-white font-bold px-3 py-1 text-base`}
                    >
                      {MEDALS[index]} #{index + 1}
                    </Badge>
                  </div>
                  
                  {/* Address with Copy Button */}
                  <div className="space-y-1">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wide">
                      Address
                    </p>
                    <div className="group relative">
                      <div className="flex items-center gap-2">
                        <code className="block text-xs font-mono bg-muted px-2 py-1 rounded truncate flex-1 cursor-help">
                          {whale.address}
                        </code>
                        <button
                          onClick={(e) => copyAddress(e, whale.address)}
                          className="shrink-0 p-1.5 bg-muted hover:bg-muted/80 active:scale-95 rounded transition-all duration-150 opacity-0 group-hover:opacity-100"
                          title="Copy address"
                        >
                          {copiedAddresses.has(whale.address) ? (
                            <Check className="w-3.5 h-3.5 text-green-500" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                      {/* Tooltip on hover */}
                      <div className="absolute left-0 right-0 top-full mt-1 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                        <code className="block text-xs font-mono bg-popover text-popover-foreground px-3 py-2 rounded-md shadow-lg border border-border break-all">
                          {whale.address}
                        </code>
                      </div>
                    </div>
                  </div>
                  
                  {/* Volume */}
                  <div className="space-y-1">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wide">
                      Total Volume
                    </p>
                    <p className="text-xl font-bold text-primary">
                      ${(whale.volume / 1000000).toFixed(2)}M
                    </p>
                  </div>
                  
                  {/* Transfer Count */}
                  <div className="space-y-1">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wide">
                      Transfers
                    </p>
                    <p className="text-sm font-semibold">
                      {whale.count} transfer{whale.count !== 1 ? 's' : ''}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </AnimatedHover>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
