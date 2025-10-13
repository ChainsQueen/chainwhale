import { BlockscoutClient } from '@/lib/blockscout/client';
import type { TokenTransfer, Chain } from '@/lib/shared/types';

export interface WhaleTransfer extends TokenTransfer {
  chainName: string;
  chainId: string;
}

export interface WhaleStats {
  totalTransfers: number;
  totalVolume: number;
  largestTransfer: number;
  uniqueWhales: number;
}

/**
 * Whale Detection Service
 * Handles whale tracking and analysis without database
 */
export class WhaleService {
  private client: BlockscoutClient;
  private minWhaleValue: number;

  constructor(minWhaleValue: number = 100000) {
    this.client = new BlockscoutClient();
    this.minWhaleValue = minWhaleValue;
  }

  /**
   * Get real-time whale feed for a specific chain
   */
  async getWhaleFeed(
    chainId: string,
    chainName: string,
    timeRange: string = '1h'
  ): Promise<WhaleTransfer[]> {
    try {
      await this.client.connect();
      
      const whaleTransfers = await this.client.getWhaleTransfers(
        chainId,
        this.minWhaleValue,
        timeRange,
        'now'
      );

      // Add chain info to each transfer
      const enrichedTransfers: WhaleTransfer[] = whaleTransfers.map(transfer => ({
        ...transfer,
        chainId,
        chainName
      }));

      await this.client.disconnect();
      
      return enrichedTransfers.sort((a, b) => 
        (b.valueUsd || 0) - (a.valueUsd || 0)
      );
    } catch (error) {
      console.error(`Error getting whale feed for ${chainName}:`, error);
      await this.client.disconnect();
      return [];
    }
  }

  /**
   * Get whale feed across multiple chains
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
   * Get statistics for whale transfers
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
   * Get activity for a specific whale address
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
      
      const { transfers, totalVolume } = await this.client.getWhaleActivity(
        chainId,
        address,
        `${days * 24}h`,
        'now'
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
   */
  filterByToken(transfers: WhaleTransfer[], tokenSymbol: string): WhaleTransfer[] {
    return transfers.filter(t => 
      t.token.symbol.toLowerCase() === tokenSymbol.toLowerCase()
    );
  }

  /**
   * Filter transfers by minimum USD value
   */
  filterByMinValue(transfers: WhaleTransfer[], minValue: number): WhaleTransfer[] {
    return transfers.filter(t => 
      t.valueUsd && t.valueUsd >= minValue
    );
  }

  /**
   * Get top whales by volume (from transfer data)
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
