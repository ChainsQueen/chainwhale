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
    // Major Exchanges (Hot Wallets)
    '0x28C6c06298d514Db089934071355E5743bf21d60', // Binance Hot Wallet
    '0x21a31Ee1afC51d94C2eFcCAa2092aD1028285549', // Binance Hot Wallet 2
    '0xDFd5293D8e347dFe59E90eFd55b2956a1343963d', // Binance Hot Wallet 3
    '0x56Eddb7aa87536c09CCc2793473599fD21A8b17F', // Binance Hot Wallet 4
    '0x9696f59E4d72E237BE84fFD425DCaD154Bf96976', // Binance Hot Wallet 5
    '0x4E9ce36E442e55EcD9025B9a6E0D88485d628A67', // Binance Hot Wallet 6
    '0xBE0eB53F46cd790Cd13851d5EFf43D12404d33E8', // Binance Hot Wallet 7
    '0xF977814e90dA44bFA03b6295A0616a897441aceC', // Binance Hot Wallet 8
    '0x001866Ae5B3de6cAa5a51543FD9fB64f524F5478', // Coinbase Hot Wallet
    '0x71660c4005BA85c37ccec55d0C4493E66Fe775d3', // Coinbase Hot Wallet 2
    '0x503828976D22510aad0201ac7EC88293211D23Da', // Coinbase Hot Wallet 3
    '0xddfAbCdc4D8FfC6d5beaf154f18B778f892A0740', // Coinbase Hot Wallet 4
    '0x3cD751E6b0078Be393132286c442345e5DC49699', // Coinbase Hot Wallet 5
    '0xb5d85CBf7cB3EE0D56b3bB207D5Fc4B82f43F511', // Coinbase Hot Wallet 6
    '0xeB2629a2734e272Bcc07BDA959863f316F4bD4Cf', // Coinbase Hot Wallet 7
    
    // Notable Holders
    '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045', // Vitalik Buterin
    '0xAb5801a7D398351b8bE11C439e05C5B3259aeC9B', // Vitalik (old)
    '0x220866B1A2219f40e72f5c628B65D54268cA3A9D', // Vitalik (old)
    
    // DeFi Protocols & Bridges
    '0x40ec5B33f54e0E8A33A975908C5BA1c14e5BbbDf', // Polygon Bridge
    '0xA0c68C638235ee32657e8f720a23ceC1bFc77C77', // Polygon Bridge 2
    '0x5fdcca53617f4d2b9134b29090c87d01058e27e9', // Immutable X
    '0x6B175474E89094C44Da98b954EedeAC495271d0F', // MakerDAO DAI
    '0x5d3a536E4D6DbD6114cc1Ead35777bAB948E3643', // Compound cDAI
    
    // Whale Wallets
    '0x47ac0Fb4F2D84898e4D9E7b4DaB3C24507a6D503', // Large holder
    '0x8103683202aa8DA10536036EDef04CDd865C225E', // Large holder
    '0x189B9cBd4AfF470aF2C0102f365FC1823d857965', // Large holder
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
            '24h',
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
        console.log(`ℹ️  No whale transactions found on chain ${chainId} in the last 24 hours above $${this.thresholdUsd} threshold`);
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
