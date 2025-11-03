/**
 * Whale tracking and analysis service
 * 
 * @module core/services/whale-service
 */

import type { IBlockscoutClient } from '@/lib/blockscout/factory';
import type { TokenTransfer, Chain } from '@/lib/shared/types';
import type { WhaleTransfer, WhaleStats } from '@/core/types/whale.types';

// Re-export types for backward compatibility
export type { WhaleTransfer, WhaleStats } from '@/core/types/whale.types';

/**
 * Whale Detection Service
 * 
 * Handles real-time whale tracking and analysis across multiple blockchains.
 * Monitors known whale addresses and provides statistics on large transfers.
 * 
 * @class WhaleService
 * 
 * @example
 * const service = new WhaleService(100000, blockscoutClient);
 * const transfers = await service.getWhaleFeed('1', 'Ethereum', '24h');
 * const stats = service.getWhaleStats(transfers);
 */
export class WhaleService {
  private client: IBlockscoutClient;
  private minWhaleValue: number;
  private readonly CONCURRENT_REQUESTS = 3; // Limit concurrent API calls to avoid rate limiting

  // Known whale addresses (same as WhaleDetector)
  private readonly WHALE_ADDRESSES = [
    '0x28C6c06298d514Db089934071355E5743bf21d60', // Binance
    '0x21a31Ee1afC51d94C2eFcCAa2092aD1028285549', // Binance 2
    '0xDFd5293D8e347dFe59E90eFd55b2956a1343963d', // Binance 3
    '0xF977814e90dA44bFA03b6295A0616a897441aceC', // Binance 8
    '0x001866Ae5B3de6cAa5a51543FD9fB64f524F5478', // Coinbase
    '0x71660c4005BA85c37ccec55d0C4493E66Fe775d3', // Coinbase 2
    '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045', // Vitalik
    '0x40ec5B33f54e0E8A33A975908C5BA1c14e5BbbDf', // Polygon Bridge
    '0x47ac0Fb4F2D84898e4D9E7b4DaB3C24507a6D503', // Large holder
  ];

  constructor(minWhaleValue: number = 100000, client?: IBlockscoutClient) {
    // Client will be injected from API routes
    this.client = client as IBlockscoutClient;
    this.minWhaleValue = minWhaleValue;
  }

  /**
   * Get real-time whale feed for a specific chain
   * 
   * Fetches token transfers from known whale addresses within the specified time range.
   * Filters transfers by minimum USD value and sorts by value descending.
   * 
   * @param chainId - Blockchain chain ID (e.g., '1' for Ethereum)
   * @param chainName - Human-readable chain name (e.g., 'Ethereum')
   * @param timeRange - Time range for transfers (e.g., '24h', '7d')
   * @returns Promise resolving to array of whale transfers sorted by USD value
   * 
   * @example
   * const transfers = await service.getWhaleFeed('1', 'Ethereum', '24h');
   * console.log(`Found ${transfers.length} whale transfers`);
   */
  async getWhaleFeed(
    chainId: string,
    chainName: string,
    timeRange: string = '24h'
  ): Promise<WhaleTransfer[]> {
    try {
      await this.client.connect();

      // Check if HTTP MCP is available for direct whale transfers
      const httpMcpAvailable = this.checkHttpMcpAvailable();

      if (httpMcpAvailable) {
        console.log(`[WhaleService] HTTP MCP available, fetching whale transfers directly from MCP server...`);
        try {
          // Use HTTP MCP for direct whale transfers
          const mcpTransfers = await this.getMcpWhaleTransfers(chainId, chainName);
          await this.client.disconnect();
          return mcpTransfers;
        } catch (error) {
          console.warn(`[WhaleService] HTTP MCP failed, falling back to individual address queries:`, error);
        }
      }

      // Fallback: Fetch all whale addresses in parallel for better performance
      const transferPromises = this.WHALE_ADDRESSES.map(async (whaleAddress) => {
        try {
          const allTransfers: TokenTransfer[] = [];
          let cursor: string | undefined = undefined;
          
          // Fetch all pages (limit to 200 transfers per whale to avoid excessive API calls)
          do {
            const { items: transfers, nextCursor } = await this.client.getTokenTransfers(
              chainId,
              whaleAddress,
              timeRange,
              'now',
              undefined,
              cursor
            );
            
            allTransfers.push(...transfers);
            cursor = nextCursor;
            
            // Safety limit to avoid excessive API calls (reduced for performance)
            if (allTransfers.length >= 20) break;
          } while (cursor);

          // Filter by minimum value and add chain info
          return allTransfers
            .filter(t => (t.valueUsd || 0) >= this.minWhaleValue)
            .map(transfer => ({
              ...transfer,
              chainId,
              chainName
            }));
        } catch (error) {
          // Log error but continue with other addresses
          console.warn(`⚠️ Skipping ${whaleAddress} on ${chainName}:`, error instanceof Error ? error.message : 'Unknown error');
          return [];
        }
      });

      // Wait for all requests to complete (with concurrency limit to avoid rate limiting)
      const results = await this.batchPromises(transferPromises, this.CONCURRENT_REQUESTS);
      const allTransfers: WhaleTransfer[] = results.flat();

      await this.client.disconnect();
      
      return allTransfers.sort((a, b) => 
        (b.valueUsd || 0) - (a.valueUsd || 0)
      );
    } catch (error) {
      console.error(`Error getting whale feed for ${chainName}:`, error);
      await this.client.disconnect();
      return [];
    }
  }

  /**
   * Check if HTTP MCP client is available
   */
  private checkHttpMcpAvailable(): boolean {
    // This is a simple check - we assume if the client is a HybridBlockscoutClient with MCP configured, it's available
    // We can't directly access the internal state, so we'll try the MCP call and see if it works
    return true; // We'll handle errors in the calling method
  }

  /**
   * Get whale transfers directly from MCP server
   */
  private async getMcpWhaleTransfers(chainId: string, chainName: string): Promise<WhaleTransfer[]> {
    // Since we can't directly access the HttpMcpClient, we'll use a simple HTTP call
    // This is a workaround - ideally the client interface would expose MCP methods
    try {
      const mcpUrl = process.env.MCP_URL || process.env.BLOCKSCOUT_MCP_URL || process.env.MCP_SERVER_URL;
      if (!mcpUrl) {
        throw new Error('No MCP server URL configured');
      }

      const response = await fetch(`${mcpUrl}/api/whale/transfers/${chainId}?minValue=${this.minWhaleValue}&limit=50`);
      if (!response.ok) {
        throw new Error(`MCP server returned ${response.status}`);
      }

      const data = await response.json();
      const transfers = data.data?.transfers || [];

      // Convert to WhaleTransfer format and add metadata
      return transfers.map((transfer: any) => ({
        ...transfer,
        chainId,
        chainName,
        dataSource: 'mcp' as const
      }));
    } catch (error) {
      console.error('[WhaleService] Failed to fetch from MCP server:', error);
      throw error;
    }
  }

  /**
   * Get whale feed across multiple chains
   * 
   * Fetches whale transfers from multiple blockchains in parallel and combines results.
   * Handles failures gracefully by continuing with successful chains.
   * 
   * @param chains - Array of chain configurations to monitor
   * @param timeRange - Time range for transfers (default: '1h')
   * @returns Promise resolving to combined array of whale transfers sorted by USD value
   * 
   * @example
   * const chains = [{ id: '1', name: 'Ethereum' }, { id: '8453', name: 'Base' }];
   * const transfers = await service.getMultiChainWhaleFeed(chains, '24h');
   */
  async getMultiChainWhaleFeed(
    chains: Chain[],
    timeRange: string = '1h'
  ): Promise<WhaleTransfer[]> {
    const allTransfers: WhaleTransfer[] = [];

    // Process chains in parallel
    const results = await Promise.allSettled(
      chains.map(chain => 
        this.getWhaleFeed(chain.id, chain.name, timeRange)
      )
    );

    // Collect successful results
    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        allTransfers.push(...result.value);
      } else {
        console.error(`Failed to fetch whales for ${chains[index].name}:`, result.reason);
      }
    });

    // Sort by USD value descending
    return allTransfers.sort((a, b) => 
      (b.valueUsd || 0) - (a.valueUsd || 0)
    );
  }

  /**
   * Calculate statistics for whale transfers
   * 
   * Aggregates transfer data to provide insights on total volume, largest transfer,
   * and unique whale addresses involved.
   * 
   * @param transfers - Array of whale transfers to analyze
   * @returns Statistics object with aggregated metrics
   * 
   * @example
   * const stats = service.getWhaleStats(transfers);
   * console.log(`Total volume: $${stats.totalVolume.toLocaleString()}`);
   * console.log(`Unique whales: ${stats.uniqueWhales}`);
   */
  getWhaleStats(transfers: WhaleTransfer[]): WhaleStats {
    const uniqueAddresses = new Set<string>();
    let totalVolume = 0;
    let largestTransfer = 0;

    transfers.forEach(transfer => {
      uniqueAddresses.add(transfer.from);
      uniqueAddresses.add(transfer.to);
      
      const value = transfer.valueUsd || 0;
      totalVolume += value;
      
      if (value > largestTransfer) {
        largestTransfer = value;
      }
    });

    return {
      totalTransfers: transfers.length,
      totalVolume,
      largestTransfer,
      uniqueWhales: uniqueAddresses.size
    };
  }

  /**
   * Get detailed activity profile for a specific whale address
   * 
   * Fetches all token transfers for a whale address over the specified time period
   * and calculates total volume and transfer count.
   * 
   * @param chainId - Blockchain chain ID
   * @param chainName - Human-readable chain name
   * @param address - Whale wallet address to analyze
   * @param days - Number of days to look back (default: 7)
   * @returns Promise resolving to whale profile with transfers and statistics
   * 
   * @example
   * const profile = await service.getWhaleProfile(
   *   '1',
   *   'Ethereum',
   *   '0x28C6c06298d514Db089934071355E5743bf21d60',
   *   30
   * );
   * console.log(`${profile.transferCount} transfers, $${profile.totalVolume} volume`);
   */
  async getWhaleProfile(
    chainId: string,
    chainName: string,
    address: string,
    days: number = 7
  ): Promise<{
    address: string;
    chainId: string;
    chainName: string;
    transfers: TokenTransfer[];
    totalVolume: number;
    transferCount: number;
  }> {
    try {
      await this.client.connect();
      
      const { items: transfers } = await this.client.getTokenTransfers(
        chainId,
        address,
        `${days * 24}h`,
        'now'
      );

      const totalVolume = transfers.reduce(
        (sum, transfer) => sum + (transfer.valueUsd || 0),
        0
      );

      await this.client.disconnect();

      return {
        address,
        chainId,
        chainName,
        transfers,
        totalVolume,
        transferCount: transfers.length
      };
    } catch (error) {
      console.error(`Error getting whale profile for ${address}:`, error);
      await this.client.disconnect();
      
      return {
        address,
        chainId,
        chainName,
        transfers: [],
        totalVolume: 0,
        transferCount: 0
      };
    }
  }

  /**
   * Filter transfers by token symbol
   * 
   * Case-insensitive filtering of transfers by token symbol.
   * 
   * @param transfers - Array of whale transfers to filter
   * @param tokenSymbol - Token symbol to filter by (e.g., 'USDC', 'ETH')
   * @returns Filtered array of transfers matching the token symbol
   * 
   * @example
   * const usdcTransfers = service.filterByToken(allTransfers, 'USDC');
   */
  filterByToken(transfers: WhaleTransfer[], tokenSymbol: string): WhaleTransfer[] {
    return transfers.filter(t => 
      t.token.symbol.toLowerCase() === tokenSymbol.toLowerCase()
    );
  }

  /**
   * Filter transfers by minimum USD value
   * 
   * Returns only transfers with USD value greater than or equal to the specified minimum.
   * 
   * @param transfers - Array of whale transfers to filter
   * @param minValue - Minimum USD value threshold
   * @returns Filtered array of transfers meeting the minimum value
   * 
   * @example
   * const largeTransfers = service.filterByMinValue(allTransfers, 1000000);
   */
  filterByMinValue(transfers: WhaleTransfer[], minValue: number): WhaleTransfer[] {
    return transfers.filter(t => 
      t.valueUsd && t.valueUsd >= minValue
    );
  }

  /**
   * Get top whale addresses ranked by total volume
   * 
   * Aggregates transfer data to identify the most active whale addresses
   * by total USD volume. Counts both sent and received transfers.
   * 
   * @param transfers - Array of whale transfers to analyze
   * @param limit - Maximum number of top whales to return (default: 10)
   * @returns Array of top whales sorted by volume descending
   * 
   * @example
   * const topWhales = service.getTopWhales(transfers, 5);
   * topWhales.forEach(whale => {
   *   console.log(`${whale.address}: $${whale.volume} (${whale.transferCount} txs)`);
   * });
   */
  getTopWhales(transfers: WhaleTransfer[], limit: number = 10): Array<{
    address: string;
    volume: number;
    transferCount: number;
  }> {
    const whaleMap = new Map<string, { volume: number; count: number }>();

    transfers.forEach(transfer => {
      const value = transfer.valueUsd || 0;
      
      // Track sender
      const fromData = whaleMap.get(transfer.from) || { volume: 0, count: 0 };
      fromData.volume += value;
      fromData.count += 1;
      whaleMap.set(transfer.from, fromData);

      // Track receiver
      const toData = whaleMap.get(transfer.to) || { volume: 0, count: 0 };
      toData.volume += value;
      toData.count += 1;
      whaleMap.set(transfer.to, toData);
    });

    // Convert to array and sort by volume
    return Array.from(whaleMap.entries())
      .map(([address, data]) => ({
        address,
        volume: data.volume,
        transferCount: data.count
      }))
      .sort((a, b) => b.volume - a.volume)
      .slice(0, limit);
  }
}
