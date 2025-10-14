import { BlockscoutClient } from './client';
import { BlockscoutHttpClient } from './http-client';
import type { AddressInfo, TokenTransfer, Chain } from '../shared/types';

/**
 * Interface that both clients must implement
 */
export interface IBlockscoutClient {
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  getAddressInfo(chainId: string, address: string): Promise<AddressInfo>;
  getTokenTransfers(
    chainId: string,
    address: string | null,
    ageFrom: string,
    ageTo: string,
    token?: string,
    cursor?: string
  ): Promise<{ items: TokenTransfer[]; nextCursor?: string }>;
  getTokensByAddress(chainId: string, address: string): Promise<Record<string, unknown>[]>;
  getChainsList(): Promise<Chain[]>;
}

/**
 * Factory to create the appropriate Blockscout client based on environment
 * - Production (Vercel): Uses HTTP client (no Docker required)
 * - Development with BLOCKSCOUT_USE_HTTP=true: Uses HTTP client
 * - Development (default): Uses MCP client (requires Docker)
 */
export function createBlockscoutClient(): IBlockscoutClient {
  const isProduction = process.env.NODE_ENV === 'production';
  const isVercel = process.env.VERCEL === '1';
  const forceHttp = process.env.BLOCKSCOUT_USE_HTTP === 'true';
  
  // Use HTTP client in production, on Vercel, or when explicitly requested
  if (isProduction || isVercel || forceHttp) {
    console.log('🌐 Using Blockscout HTTP client (REST API mode)');
    return new BlockscoutHttpClient() as unknown as IBlockscoutClient;
  }
  
  // Use MCP client in development (requires Docker)
  console.log('🐳 Using Blockscout MCP client (requires Docker)');
  return new BlockscoutClient() as unknown as IBlockscoutClient;
}
