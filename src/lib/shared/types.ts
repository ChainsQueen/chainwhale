// Shared types used across the application

export interface Chain {
  id: string;
  name: string;
  displayName?: string;
  icon?: string;
}

export interface WhaleTransaction {
  hash: string;
  chain: string;
  chainId: string;
  from: string;
  to: string;
  value: string;
  valueUsd: number;
  timestamp: number;
  type: 'buy' | 'sell' | 'transfer';
  token?: {
    symbol: string;
    address: string;
    name?: string;
  };
  aiAnalysis?: string;
}

export interface WalletAnalysis {
  address: string;
  totalValue: number;
  chains: Record<string, number>;
  tokens: Array<{
    symbol: string;
    balance: string;
    value: number;
    chain: string;
  }>;
  summary: string;
  riskScore: number;
  insights: string[];
}

export interface TokenTransfer {
  hash: string;
  from: string;
  to: string;
  value: string;
  token: {
    symbol: string;
    address: string;
    name?: string;
    decimals?: string;
    exchangeRate?: string; // USD per token
  };
  timestamp: number;
  valueUsd?: number;
  dataSource?: 'mcp' | 'http';
}

export interface AddressInfo {
  address: string;
  balance: string;
  balanceUsd?: number;
  isContract: boolean;
  ensName?: string;
  // Contract-specific fields
  is_verified?: boolean;
  is_scam?: boolean;
  implementations?: Array<{
    address: string;
    name?: string;
  }>;
  token?: {
    type?: string;
    name?: string;
    symbol?: string;
    decimals?: string;
    total_supply?: string;
    holders?: string;
    exchange_rate?: string;
    circulating_market_cap?: string;
    volume_24h?: string;
    icon_url?: string;
  };
  reputation?: string;
  creator_address_hash?: string;
  creation_transaction_hash?: string;
  creation_status?: string;
}

export interface Transaction {
  hash: string;
  from: string;
  to: string;
  value: string;
  gasUsed: number;
  gasPrice: string;
  timestamp: number;
  status: string;
}

export interface TokenHolding {
  symbol: string;
  balance: string;
  value: number;
  chain: string;
  address: string;
}
