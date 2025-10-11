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
    thresholdUsd: number = 100000
  ) {
    this.blockscout = blockscout;
    this.ai = ai;
    this.thresholdUsd = thresholdUsd;
  }

  /**
   * Detect whale transactions on a specific chain
   */
  async detectWhaleTransactions(
    chainId: string,
    limit: number = 20
  ): Promise<WhaleTransaction[]> {
    try {
      // Get recent token transfers from the last 24 hours
      const { items: transfers } = await this.blockscout.getTokenTransfers(
        chainId,
        null, // all addresses
        '24h',
        'now'
      );

      // Filter by USD value threshold
      const whaleTransfers = transfers.filter(
        (transfer) => transfer.valueUsd && transfer.valueUsd >= this.thresholdUsd
      );

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
