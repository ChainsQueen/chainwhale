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
    timeRange: string = '24h'
  ): Promise<WhaleTransfer[]> {
    try {
      await this.client.connect();
      
      const allTransfers: WhaleTransfer[] = [];

      // Monitor each whale address
      for (const whaleAddress of this.WHALE_ADDRESSES) {
        try {
          const { items: transfers } = await this.client.getTokenTransfers(
            chainId,
            whaleAddress,
            timeRange,
            'now'
          );

          // Filter by minimum value and add chain info
          const filtered = transfers
            .filter(t => (t.valueUsd || 0) >= this.minWhaleValue)
            .map(transfer => ({
              ...transfer,
              chainId,
              chainName
            }));

          allTransfers.push(...filtered);
        } catch {
          // Skip addresses with no transfers
          continue;
        }
      }

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
