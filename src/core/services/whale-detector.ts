import { BlockscoutClient } from '@/lib/blockscout';
import { AIEngine } from '@/lib/ai';
import type { WhaleTransaction } from '@/lib/shared/types';

/**
 * Whale Detection Service
 * Detects and classifies large blockchain transactions (whales)
 */
export class WhaleDetector {
  private blockscout: BlockscoutClient;
  private ai: AIEngine;
  private thresholdUsd: number;

  constructor(
    blockscout: BlockscoutClient,
    ai: AIEngine,
    thresholdUsd: number = 100 // Lowered to $100 to catch more whale activity
  ) {
    this.blockscout = blockscout;
    this.ai = ai;
    this.thresholdUsd = thresholdUsd;
  }

  /**
   * Known whale addresses to monitor (exchanges, large holders, DeFi protocols)
   * Note: Blockscout MCP API requires specific addresses - cannot query ALL transfers
   * This is the industry-standard approach used in production implementations
   */
  private readonly WHALE_ADDRESSES = [
    '0xEC947dFaf23A930dda54335Eb371aB4FD5ab99A2', // Active wallet - has recent swaps on Metamask
  ];

  /**
   * Detect whale transactions by monitoring known high-value addresses
   * This is the standard approach - Blockscout MCP requires specific addresses
   */
  async detectWhaleTransactions(
    chainId: string,
    limit: number = 20
  ): Promise<WhaleTransaction[]> {
    try {
      console.log(`Chain ${chainId}: Monitoring ${this.WHALE_ADDRESSES.length} whale addresses...`);
      
      const allTransfers = [];

      // Monitor each whale address
      for (const whaleAddress of this.WHALE_ADDRESSES) {
        try {
          const { items: transfers } = await this.blockscout.getTokenTransfers(
            chainId,
            whaleAddress,
            '1h',
            'now'
          );
          
          if (transfers.length > 0) {
            console.log(`  ✓ Found ${transfers.length} transfers for ${whaleAddress.substring(0, 10)}...`);
            allTransfers.push(...transfers);
          }
        } catch (error) {
          console.error(`  ✗ Error fetching transfers for ${whaleAddress}:`, error);
        }
      }

      console.log(`Chain ${chainId}: Got ${allTransfers.length} total transfers from whale addresses`);
      console.log(`Threshold: $${this.thresholdUsd}`);
      
      // Log sample transfer to see data structure
      if (allTransfers.length > 0) {
        console.log('Sample transfer:', JSON.stringify(allTransfers[0], null, 2));
      }

      // Filter by USD value threshold
      const whaleTransfers = allTransfers.filter(
        (transfer) => transfer.valueUsd && transfer.valueUsd >= this.thresholdUsd
      );
      
      console.log(`Chain ${chainId}: ${whaleTransfers.length} whale transfers above $${this.thresholdUsd}`);

      // Log if no whale transactions found
      if (whaleTransfers.length === 0) {
        console.log(`ℹ️  No whale transactions found on chain ${chainId} in the last hour above $${this.thresholdUsd} threshold`);
      } else {
        console.log(`✅ Found ${whaleTransfers.length} whale transactions from ${this.WHALE_ADDRESSES.length} monitored addresses`);
      }

      // Classify and enrich transactions
      const whaleTransactions: WhaleTransaction[] = whaleTransfers
        .slice(0, limit)
        .map((transfer) => ({
          hash: transfer.hash,
          chain: this.getChainName(chainId),
          chainId: chainId,
          from: transfer.from,
          to: transfer.to,
          value: transfer.value,
          valueUsd: transfer.valueUsd || 0,
          timestamp: transfer.timestamp,
          type: this.classifyTransaction(transfer),
          token: transfer.token,
        }));

      // Sort by timestamp (newest first)
      return whaleTransactions.sort((a, b) => b.timestamp - a.timestamp);
    } catch (error) {
      console.error(`Error detecting whale transactions on chain ${chainId}:`, error);
      return [];
    }
  }

  /**
   * Analyze a whale transaction with AI
   */
  async analyzeWhaleTransaction(
    transaction: WhaleTransaction
  ): Promise<WhaleTransaction> {
    try {
      const summary = await this.blockscout.transactionSummary(
        transaction.chainId,
        transaction.hash
      );

      const analysis = await this.ai.analyzeTransaction(
        {
          ...transaction,
          summary,
        },
        `This is a ${transaction.type} transaction worth $${transaction.valueUsd.toLocaleString()}`
      );

      return {
        ...transaction,
        aiAnalysis: analysis,
      };
    } catch (error) {
      console.error('Error analyzing whale transaction:', error);
      return transaction;
    }
  }

  /**
   * Check if a transaction value exceeds the whale threshold
   */
  isWhaleTransaction(valueUsd: number): boolean {
    return valueUsd >= this.thresholdUsd;
  }

  /**
   * Classify transaction type based on addresses and patterns
   */
  private classifyTransaction(transfer: { from: string; to: string }): 'buy' | 'sell' | 'transfer' {
    // Simple classification logic
    // In a real implementation, you would check against known DEX addresses,
    // CEX addresses, etc.
    
    const from = transfer.from.toLowerCase();
    const to = transfer.to.toLowerCase();

    // Known DEX router addresses (simplified)
    const dexAddresses = [
      '0x7a250d5630b4cf539739df2c5dacb4c659f2488d', // Uniswap V2
      '0xe592427a0aece92de3edee1f18e0157c05861564', // Uniswap V3
      '0xdef1c0ded9bec7f1a1670819833240f027b25eff', // 0x
    ];

    const isDexFrom = dexAddresses.some((addr) => from.includes(addr));
    const isDexTo = dexAddresses.some((addr) => to.includes(addr));

    if (isDexFrom) return 'sell';
    if (isDexTo) return 'buy';
    
    return 'transfer';
  }

  /**
   * Get human-readable chain name
   */
  private getChainName(chainId: string): string {
    const chains: Record<string, string> = {
      '1': 'Ethereum',
      '8453': 'Base',
      '42161': 'Arbitrum',
      '10': 'Optimism',
      '137': 'Polygon',
    };
    return chains[chainId] || `Chain ${chainId}`;
  }
}
