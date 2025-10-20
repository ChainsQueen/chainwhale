/**
 * Wallet-related type definitions
 */

/**
 * Ethereum address format (0x + 40 hex characters)
 */
export type EthereumAddress = `0x${string}`;

/**
 * ENS domain name format
 */
export type ENSName = `${string}.eth`;

/**
 * Valid wallet address (Ethereum address or ENS name)
 */
export type WalletAddress = EthereumAddress | ENSName;

/**
 * Wallet balance information
 */
export interface WalletBalance {
  address: string;
  balance: string;
  balanceUsd?: number;
  chainId: string;
}

/**
 * Token holding information
 */
export interface TokenHolding {
  address: string;
  name: string;
  symbol: string;
  decimals: number;
  balance: string;
  balanceUsd?: number;
  price?: number;
}

/**
 * Wallet analysis result
 */
export interface WalletAnalysis {
  address: string;
  ensName?: string;
  totalValueUsd: number;
  nativeBalance: WalletBalance[];
  tokens: TokenHolding[];
  chains: string[];
  lastUpdated: number;
}

/**
 * Risk assessment levels
 */
export type RiskLevel = 'low' | 'medium' | 'high';

/**
 * Risk score (0-100)
 */
export type RiskScore = number;