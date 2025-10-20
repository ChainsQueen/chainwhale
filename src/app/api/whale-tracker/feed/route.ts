import { NextRequest, NextResponse } from 'next/server';
import { createBlockscoutClient, type IBlockscoutClient } from '@/lib/blockscout/factory';
import { WhaleService } from '@/core/services/whale-service';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * GET /api/whale-tracker/feed
 * 
 * Fetches real-time whale transactions across multiple blockchains.
 * Monitors 9 known whale addresses (Binance, Coinbase, Vitalik, etc.) and returns
 * large token transfers with comprehensive metadata and statistics.
 * 
 * @route GET /api/whale-tracker/feed
 * 
 * @queryparam {string} [chains='1,8453,42161'] - Comma-separated chain IDs to monitor
 * @queryparam {string} [timeRange='1h'] - Time range for transfers (e.g., '1h', '24h', '7d')
 * @queryparam {string} [minValue='100000'] - Minimum USD value for whale transfers
 * @queryparam {string} [token] - Optional token symbol filter (e.g., 'USDC', 'USDT')
 * 
 * @returns {Object} 200 - Successful response with whale transfers
 * @returns {Array} returns.transfers - Array of whale transfers (max 50)
 * @returns {Object} returns.stats - Aggregated statistics
 * @returns {number} returns.stats.totalTransfers - Total number of transfers
 * @returns {number} returns.stats.totalVolume - Total USD volume
 * @returns {number} returns.stats.largestTransfer - Largest single transfer
 * @returns {number} returns.stats.uniqueWhales - Count of unique whale addresses
 * @returns {Array} returns.topWhales - Top 10 whales by volume
 * @returns {Object} returns.metadata - Request metadata and configuration
 * 
 * @returns {Object} 500 - Server error
 * @returns {string} returns.error - Error message
 * @returns {string} returns.details - Detailed error information
 * @returns {string} returns.timestamp - Error timestamp
 * 
 * @example
 * // Request
 * GET /api/whale-tracker/feed?chains=1,8453&timeRange=24h&minValue=500000
 * 
 * // Success Response
 * {
 *   "transfers": [
 *     {
 *       "hash": "0x123...",
 *       "chainId": "1",
 *       "chainName": "Ethereum",
 *       "from": "0xabc...",
 *       "to": "0xdef...",
 *       "value": "1000000000000",
 *       "valueUsd": 1500000,
 *       "timestamp": 1234567890,
 *       "token": { "symbol": "USDC", "name": "USD Coin", "address": "0x..." },
 *       "dataSource": "mcp"
 *     }
 *   ],
 *   "stats": {
 *     "totalTransfers": 42,
 *     "totalVolume": 50000000,
 *     "largestTransfer": 5000000,
 *     "uniqueWhales": 15
 *   },
 *   "topWhales": [...],
 *   "metadata": {
 *     "timeRange": "24h",
 *     "minValueUsd": "$500,000",
 *     "chains": ["Ethereum", "Base"],
 *     "monitoredAddresses": 9
 *   }
 * }
 */
export async function GET(request: NextRequest) {
  let blockscout: IBlockscoutClient | null = null;

  try {
    const { searchParams } = new URL(request.url);
    
    // Get query parameters
    const chainsParam = searchParams.get('chains');
    const timeRange = searchParams.get('timeRange') || '1h';
    const minValue = parseInt(searchParams.get('minValue') || '100000');
    const tokenSymbol = searchParams.get('token');

    // Parse chains
    const chainIds = chainsParam ? chainsParam.split(',') : ['1', '8453', '42161'];

    console.log(`[Whale Feed API] Starting request`);
    console.log(`[Whale Feed API] Chains: ${chainIds.join(', ')}`);
    console.log(`[Whale Feed API] Time Range: ${timeRange}`);
    console.log(`[Whale Feed API] Min value: $${minValue.toLocaleString()}`);
    console.log(`[Whale Feed API] Token filter: ${tokenSymbol || 'none'}`);
    console.log(`[Whale Feed API] Environment: ${process.env.NODE_ENV}`);
    console.log(`[Whale Feed API] Vercel: ${process.env.VERCEL}`);

    // Initialize services
    try {
      blockscout = createBlockscoutClient();
      await blockscout.connect();
    } catch (error) {
      console.error('[Whale Feed API] Failed to initialize Blockscout client:', error);
      throw new Error(
        'Failed to connect to blockchain data service. ' +
        'Please ensure the Blockscout MCP server is running (requires Docker) or check your configuration.'
      );
    }

    // Use WhaleService (works with known addresses)
    const whaleService = new WhaleService(minValue, blockscout);

    // Fetch whale transactions from each chain
    const allTransactions = [];
    const chainErrors: string[] = [];

    for (const chainId of chainIds) {
      try {
        console.log(`[Whale Feed API] Fetching whale transactions for chain ${chainId}...`);
        const chainName = getChainName(chainId);
        const transactions = await whaleService.getWhaleFeed(chainId, chainName, timeRange);
        console.log(`[Whale Feed API] Found ${transactions.length} whale transactions on chain ${chainId}`);
        
        // Debug: Check if hashes are present
        const withoutHash = transactions.filter(t => !t.hash || t.hash === '');
        if (withoutHash.length > 0) {
          console.warn(`[Whale Feed API] ⚠️ ${withoutHash.length} transactions without hash on chain ${chainId}`);
        }
        
        allTransactions.push(...transactions);
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
        console.error(`[Whale Feed API] Error detecting whales on chain ${chainId}:`, errorMsg);
        chainErrors.push(`${getChainName(chainId)}: ${errorMsg}`);
      }
    }

    // If all chains failed, return error
    if (allTransactions.length === 0 && chainErrors.length === chainIds.length) {
      throw new Error(
        `Failed to fetch whale data from all chains. Errors: ${chainErrors.join('; ')}`
      );
    }

    // Filter by token if specified
    let filteredTransactions = allTransactions;
    if (tokenSymbol) {
      filteredTransactions = allTransactions.filter(t => 
        t.token?.symbol.toLowerCase() === tokenSymbol.toLowerCase()
      );
    }

    // Sort by timestamp (newest first)
    const sorted = filteredTransactions.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

    // Calculate stats
    const stats = {
      totalTransfers: sorted.length,
      totalVolume: sorted.reduce((sum, t) => sum + (t.valueUsd || 0), 0),
      largestTransfer: Math.max(...sorted.map(t => t.valueUsd || 0), 0),
      uniqueWhales: new Set([...sorted.map(t => t.from), ...sorted.map(t => t.to)]).size
    };

    // Get top whales
    const whaleMap = new Map<string, { volume: number; count: number }>();
    sorted.forEach(t => {
      const fromData = whaleMap.get(t.from) || { volume: 0, count: 0 };
      fromData.volume += (t.valueUsd || 0);
      fromData.count += 1;
      whaleMap.set(t.from, fromData);

      const toData = whaleMap.get(t.to) || { volume: 0, count: 0 };
      toData.volume += (t.valueUsd || 0);
      toData.count += 1;
      whaleMap.set(t.to, toData);
    });

    const topWhales = Array.from(whaleMap.entries())
      .map(([address, data]) => ({
        address,
        volume: data.volume,
        count: data.count,
        chain: sorted.find(t => t.from === address || t.to === address)?.chainId || 'Unknown'
      }))
      .sort((a, b) => b.volume - a.volume)
      .slice(0, 10);

    console.log(`[Whale Feed API] Total transactions found: ${sorted.length}`);
    console.log(`[Whale Feed API] Chain errors: ${chainErrors.length > 0 ? chainErrors.join('; ') : 'none'}`);

    // Convert to new format
    const transfers = sorted.slice(0, 50).map(t => ({
      hash: t.hash,
      chainId: t.chainId,
      chainName: t.chainName,
      from: t.from,
      to: t.to,
      value: t.value,
      valueUsd: t.valueUsd,
      timestamp: t.timestamp,
      token: t.token,
      dataSource: t.dataSource
    }));

    // Return response
    return NextResponse.json({
      transfers,
      stats,
      topWhales,
      metadata: {
        timeRange,
        minValueUsd: `$${minValue.toLocaleString()}`,
        chains: chainIds.map(id => getChainName(id)),
        tokenFilter: tokenSymbol || null,
        timestamp: new Date().toISOString(),
        monitoredAddresses: 9,
        dataSources: {
          mcp: transfers.filter(t => t.dataSource === 'mcp').length,
          http: transfers.filter(t => t.dataSource === 'http').length,
          hybrid: transfers.filter(t => t.dataSource === 'hybrid').length,
          total: transfers.length
        },
        warnings: chainErrors.length > 0 ? chainErrors : undefined,
        description: `Monitoring 9 known whale addresses (Binance, Coinbase, Vitalik, Polygon Bridge, and large holders) across selected chains. Showing transfers above $${minValue.toLocaleString()} USD.`
      }
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : undefined;
    
    console.error('[Whale Feed API] Error:', errorMessage);
    if (errorStack) {
      console.error('[Whale Feed API] Stack trace:', errorStack);
    }
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch whale transactions',
        details: errorMessage,
        timestamp: new Date().toISOString()
      },
      { 
        status: 500,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
  } finally {
    if (blockscout) {
      try {
        await blockscout.disconnect();
      } catch (disconnectError) {
        console.error('[Whale Feed API] Error disconnecting:', disconnectError);
      }
    }
  }
}

/**
 * Maps chain ID to human-readable chain name
 * 
 * @param chainId - Blockchain chain ID
 * @returns Human-readable chain name or 'Chain {id}' if unknown
 * 
 * @example
 * getChainName('1') // 'Ethereum'
 * getChainName('8453') // 'Base'
 * getChainName('999') // 'Chain 999'
 */
function getChainName(chainId: string): string {
  const chains: Record<string, string> = {
    '1': 'Ethereum',
    '8453': 'Base',
    '42161': 'Arbitrum',
    '10': 'Optimism',
    '137': 'Polygon',
    '324': 'zkSync Era',
    '534352': 'Scroll',
    '100': 'Gnosis',
  };
  return chains[chainId] || `Chain ${chainId}`;
}
