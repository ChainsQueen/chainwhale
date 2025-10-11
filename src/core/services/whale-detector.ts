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
    thresholdUsd: number = 1000 // Reduced from 100000 to 1000 for testing
  ) {
    this.blockscout = blockscout;
    this.ai = ai;
    this.thresholdUsd = thresholdUsd;
  }

  /**
   * Known whale addresses to monitor (exchanges, large holders, etc.)
   */
  private readonly KNOWN_WHALES = [
    '0x28C6c06298d514Db089934071355E5743bf21d60', // Binance Hot Wallet
    '0x47ac0Fb4F2D84898e4D9E7b4DaB3C24507a6D503', // Binance 2
    '0xD551234Ae421e3BCBA99A0Da6d736074f22192FF', // Binance 3
    '0x21a31Ee1afC51d94C2eFcCAa2092aD1028285549', // Binance 4
    '0xDFd5293D8e347dFe59E90eFd55b2956a1343963d', // Binance 5
    '0x56Eddb7aa87536c09CCc2793473599fD21A8b17F', // Binance 6
    '0x9696f59E4d72E237BE84fFD425DCaD154Bf96976', // Binance 7
    '0x4E9ce36E442e55EcD9025B9a6E0D88485d628A67', // Binance 8
    '0xBE0eB53F46cd790Cd13851d5EFf43D12404d33E8', // Binance 9
    '0xF977814e90dA44bFA03b6295A0616a897441aceC', // Binance 10
    '0x8894E0a0c962CB723c1976a4421c95949bE2D4E3', // Binance 11
    '0x3f5CE5FBFe3E9af3971dD833D26bA9b5C936f0bE', // Binance: Binance 1
    '0xd551234Ae421e3BCBA99A0Da6d736074f22192FF', // Binance 12
    '0x564286362092D8e7936f0549571a803B203aAceD', // Binance 13
    '0x0681d8Db095565FE8A346fA0277bFfdE9C0eDBBF', // Binance 14
    '0xfE9e8709d3215310075d67E3ed32A380CCf451C8', // Binance 15
  ];

  /**
   * Detect whale transactions on a specific chain by monitoring known whale addresses
   */
  async detectWhaleTransactions(
    chainId: string,
    limit: number = 20
  ): Promise<WhaleTransaction[]> {
    try {
      const allTransfers = [];

      // Monitor each known whale address
      for (const whaleAddress of this.KNOWN_WHALES.slice(0, 5)) { // Check first 5 to avoid rate limits
        try {
          const { items: transfers } = await this.blockscout.getTokenTransfers(
            chainId,
            whaleAddress,
            '24h',
            'now'
          );
          
          if (transfers.length > 0) {
            console.log(`Found ${transfers.length} transfers for ${whaleAddress.substring(0, 10)}...`);
            allTransfers.push(...transfers);
          }
        } catch (error) {
          console.error(`Error fetching transfers for ${whaleAddress}:`, error);
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
      
      console.log(`Chain ${chainId}: ${whaleTransfers.length} transfers above $${this.thresholdUsd}`);

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
   * Generate demo transactions for presentation (when live data unavailable)
   */
  private generateDemoTransactions(chainId: string, limit: number): WhaleTransaction[] {
    const now = Date.now();
    const demoTransactions: WhaleTransaction[] = [
      {
        hash: '0x1a2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p7q8r9s0t1u2v3w4x5y6z7a8b9c0d1e2f',
        chain: this.getChainName(chainId),
        chainId,
        from: '0x28C6c06298d514Db089934071355E5743bf21d60',
        to: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
        value: '5000000',
        valueUsd: 150000,
        timestamp: now - 1000 * 60 * 15, // 15 min ago
        type: 'transfer',
        token: {
          symbol: 'USDT',
          address: '0xdac17f958d2ee523a2206206994597c13d831ec7',
          name: 'Tether USD',
        },
        aiAnalysis: 'Large USDT transfer from Binance hot wallet. Likely exchange withdrawal to cold storage or institutional client.',
      },
      {
        hash: '0x2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p7q8r9s0t1u2v3w4x5y6z7a8b9c0d1e2f3g',
        chain: this.getChainName(chainId),
        chainId,
        from: '0xF977814e90dA44bFA03b6295A0616a897441aceC',
        to: '0x1111111254fb6c44bAC0beD2854e76F90643097d',
        value: '2500',
        valueUsd: 8750000,
        timestamp: now - 1000 * 60 * 45, // 45 min ago
        type: 'buy',
        token: {
          symbol: 'ETH',
          address: '0x0000000000000000000000000000000000000000',
          name: 'Ethereum',
        },
        aiAnalysis: 'Significant ETH purchase through 1inch aggregator. Whale accumulation pattern detected.',
      },
      {
        hash: '0x3c4d5e6f7g8h9i0j1k2l3m4n5o6p7q8r9s0t1u2v3w4x5y6z7a8b9c0d1e2f3g4h',
        chain: this.getChainName(chainId),
        chainId,
        from: '0x47ac0Fb4F2D84898e4D9E7b4DaB3C24507a6D503',
        to: '0x3f5CE5FBFe3E9af3971dD833D26bA9b5C936f0bE',
        value: '10000000',
        valueUsd: 10000000,
        timestamp: now - 1000 * 60 * 90, // 90 min ago
        type: 'transfer',
        token: {
          symbol: 'USDC',
          address: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
          name: 'USD Coin',
        },
        aiAnalysis: 'Major USDC transfer between Binance wallets. Internal exchange rebalancing detected.',
      },
      {
        hash: '0x4d5e6f7g8h9i0j1k2l3m4n5o6p7q8r9s0t1u2v3w4x5y6z7a8b9c0d1e2f3g4h5i',
        chain: this.getChainName(chainId),
        chainId,
        from: '0xBE0eB53F46cd790Cd13851d5EFf43D12404d33E8',
        to: '0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45',
        value: '1500',
        valueUsd: 5250000,
        timestamp: now - 1000 * 60 * 120, // 2 hours ago
        type: 'sell',
        token: {
          symbol: 'ETH',
          address: '0x0000000000000000000000000000000000000000',
          name: 'Ethereum',
        },
        aiAnalysis: 'Large ETH sell order through Uniswap V3 router. Potential profit-taking or portfolio rebalancing.',
      },
      {
        hash: '0x5e6f7g8h9i0j1k2l3m4n5o6p7q8r9s0t1u2v3w4x5y6z7a8b9c0d1e2f3g4h5i6j',
        chain: this.getChainName(chainId),
        chainId,
        from: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045',
        to: '0x0000000000000000000000000000000000000000',
        value: '50000000',
        valueUsd: 50000000,
        timestamp: now - 1000 * 60 * 180, // 3 hours ago
        type: 'transfer',
        token: {
          symbol: 'DAI',
          address: '0x6b175474e89094c44da98b954eedeac495271d0f',
          name: 'Dai Stablecoin',
        },
        aiAnalysis: 'Massive DAI transfer from Vitalik\'s address. High-profile transaction - possibly donation or protocol funding.',
      },
    ];

    return demoTransactions.slice(0, limit);
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
