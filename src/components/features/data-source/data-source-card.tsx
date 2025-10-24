// /Users/destiny/Desktop/chainwhale/src/components/features/mcp/mcp-info-card.tsx
'use client';

import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Sparkles, CheckCircle2, ExternalLink } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

/**
 * Props for DataSourceCard component
 */
export interface DataSourceCardProps {
  /** Number of requests served by MCP */
  mcpCount: number;
  /** Number of requests served by HTTP fallback */
  httpCount: number;
  /** Total number of requests */
  totalCount: number;
  /** Optional custom class name */
  className?: string;
}

/**
 * Displays data source statistics - shows MCP or HTTP card based on dominant source
 * 
 * Automatically determines which data source is primary and displays appropriate
 * branding, animations, and statistics. Shows MCP card when MCP data is present,
 * otherwise shows HTTP card.
 * 
 * @component
 * @example
 * // MCP dominant
 * <DataSourceCard
 *   mcpCount={150}
 *   httpCount={50}
 *   totalCount={200}
 * />
 * 
 * @example
 * // HTTP only
 * <DataSourceCard
 *   mcpCount={0}
 *   httpCount={200}
 *   totalCount={200}
 * />
 */
export function DataSourceCard({
  mcpCount,
  httpCount,
  totalCount,
  className = '',
}: DataSourceCardProps) {
  const isMCPActive = mcpCount > 0;
  const mcpPercentage = totalCount > 0 ? Math.round((mcpCount / totalCount) * 100) : 0;
  const httpPercentage = totalCount > 0 ? Math.round((httpCount / totalCount) * 100) : 0;

  // Render MCP card if MCP is active, otherwise HTTP card
  if (isMCPActive) {
    return (
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className={className}
      >
        <Card className="transition-shadow border border-blue-500/20 hover:border-blue-500/40">
          <CardContent className="p-3 sm:p-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              {/* Left: MCP Branding with animated sparkles */}
              <div className="flex items-center gap-2">
                <motion.div
                  animate={{
                    rotate: [0, 10, -10, 10, 0],
                    scale: [1, 1.1, 1, 1.1, 1],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    repeatDelay: 3,
                  }}
                >
                  <Sparkles className="h-5 w-5 text-primary" />
                </motion.div>
                <div>
                  <h3 className="text-sm font-semibold flex items-center gap-2">
                    Powered by Blockscout MCP
                    <Badge
                      className="text-[10px] px-1.5 py-0 gap-1 bg-gradient-to-r from-green-500 to-emerald-500"
                    >
                      <CheckCircle2 className="h-2.5 w-2.5" />
                      Live
                    </Badge>
                  </h3>
                  <p className="text-[10px] sm:text-xs text-muted-foreground">
                    Model Context Protocol • Multi-chain • AI-optimized
                  </p>
                </div>
              </div>

              {/* Right: Compact Stats */}
              <div className="flex items-center gap-3 sm:gap-4 w-full sm:w-auto">
                {totalCount > 0 && (
                  <div className="flex items-center gap-2 flex-1 sm:flex-initial">
                    <div className="flex-1 sm:w-24">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] text-muted-foreground">MCP Data</span>
                        <span className="text-xs font-bold text-primary">{mcpPercentage}%</span>
                      </div>
                      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${mcpPercentage}%` }}
                          transition={{ duration: 1, ease: 'easeOut' }}
                          className="h-full bg-gradient-to-r from-purple-500 to-blue-500"
                        />
                      </div>
                    </div>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Badge className="bg-gradient-to-r from-purple-500 to-blue-500 text-white text-[10px] px-2 py-0.5 cursor-help">
                            <motion.div
                              animate={{ rotate: [0, 360] }}
                              transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
                            >
                              <Sparkles className="h-2.5 w-2.5 mr-1" />
                            </motion.div>
                            {mcpCount.toLocaleString()}
                          </Badge>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="text-xs">{mcpCount.toLocaleString()} requests via MCP</p>
                          {httpCount > 0 && (
                            <p className="text-xs text-muted-foreground">
                              {httpCount.toLocaleString()} via HTTP fallback
                            </p>
                          )}
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                )}

                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <a
                        href="https://docs.blockscout.com/devs/mcp-server"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="text-xs">Learn about Blockscout MCP</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  // HTTP-only card (when MCP is not available)
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className={className}
    >
      <Card className="border border-blue-500/30 bg-gradient-to-r from-blue-500/5 via-slate-500/5 to-blue-500/5">
        <CardContent className="p-3 sm:p-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            {/* Left: HTTP Branding */}
            <div className="flex items-center gap-2">
              <div>
                <h3 className="text-sm font-semibold flex items-center gap-2">
                  Blockscout REST API
                  <Badge className="text-[10px] px-1.5 py-0 gap-1 bg-blue-500">
                    <CheckCircle2 className="h-2.5 w-2.5" />
                    Active
                  </Badge>
                </h3>
                <p className="text-[10px] sm:text-xs text-muted-foreground">
                  Direct API access • Multi-chain • Production-ready
                </p>
              </div>
            </div>

            {/* Right: Compact Stats */}
            <div className="flex items-center gap-3 sm:gap-4 w-full sm:w-auto">
              {totalCount > 0 && (
                <div className="flex items-center gap-2 flex-1 sm:flex-initial">
                  <div className="flex-1 sm:w-24">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] text-muted-foreground">HTTP Data</span>
                      <span className="text-xs font-bold text-blue-500">{httpPercentage}%</span>
                    </div>
                    <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${httpPercentage}%` }}
                        transition={{ duration: 1, ease: 'easeOut' }}
                        className="h-full bg-blue-500"
                      />
                    </div>
                  </div>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Badge className="bg-blue-500 text-white text-[10px] px-2 py-0.5 cursor-help">
                          {httpCount.toLocaleString()}
                        </Badge>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="text-xs">{httpCount.toLocaleString()} requests via HTTP API</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          MCP server not available
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              )}

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <a
                      href="https://docs.blockscout.com/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-xs text-blue-500 hover:text-blue-500/80 transition-colors"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-xs">Learn about Blockscout API</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// Backward compatibility export
export { DataSourceCard as MCPInfoCard };