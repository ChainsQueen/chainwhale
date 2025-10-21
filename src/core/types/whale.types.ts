/**
 * Whale tracker type definitions
 */

/**
 * Data source for whale transfers
 */
export type DataSource = 'mcp' | 'http' | 'hybrid';

/**
 * Token information
 */
export interface TokenInfo {
  address: string;
  name?: string;
  symbol: string;
  decimals?: string;
  /** Exchange rate (USD per token) at transaction time */
  exchangeRate?: string;
}

/**
 * Whale transfer data
 */
export interface WhaleTransfer {
  hash: string;
  from: string;
  to: string;
  value: string;
  valueUsd?: number;
  token: TokenInfo;
  chainId: string;
  chainName: string;
  timestamp?: number;
  dataSource?: DataSource;
}

/**
 * Whale statistics
 */
export interface WhaleStats {
  totalTransfers: number;
  totalVolume: number;
  largestTransfer: number;
  uniqueWhales: number;
}

/**
 * Whale feed filters
 */
export interface WhaleFilters {
  chains?: string[];
  minValue?: number;
  maxValue?: number;
  tokens?: string[];
  timeRange?: {
    from: number;
    to: number;
  };
}