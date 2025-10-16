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
