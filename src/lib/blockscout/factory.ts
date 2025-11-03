import { BlockscoutClient } from './client';  // ← MCP client
import { BlockscoutHttpClient } from './http-client'; // ← HTTP/REST client
import { HybridBlockscoutClient } from './hybrid-client'; // ← Hybrid (tries MCP first, falls back to HTTP)
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
  const mcpFirst = process.env.BLOCKSCOUT_MCP_FIRST !== 'false';
  
  console.log('BlockscoutClient Factory Debug:');
  console.log('NODE_ENV:', process.env.NODE_ENV);
  console.log('VERCEL:', process.env.VERCEL);
  console.log('BLOCKSCOUT_USE_HTTP:', process.env.BLOCKSCOUT_USE_HTTP);
  console.log('BLOCKSCOUT_MCP_FIRST:', process.env.BLOCKSCOUT_MCP_FIRST);
  console.log('isProduction:', isProduction);
  console.log('isVercel:', isVercel);
  console.log('forceHttp:', forceHttp);
  console.log('mcpFirst:', mcpFirst);
  
  // Force HTTP when explicitly requested
  if (forceHttp) {
    console.log('🌐 Using Blockscout HTTP client (REST API mode)');
    return new BlockscoutHttpClient() as unknown as IBlockscoutClient;
  }
  
  // Prefer MCP-first hybrid client for prize qualification
  if (mcpFirst) {
    console.log('🤝 Using Blockscout Hybrid client (MCP-first with HTTP fallback)');
    return new HybridBlockscoutClient() as unknown as IBlockscoutClient;
  }

  // Legacy behavior: use HTTP in prod/Vercel, MCP in dev
  if (isProduction || isVercel) {
    console.log('🌐 Using Blockscout HTTP client (REST API mode)');
    return new BlockscoutHttpClient() as unknown as IBlockscoutClient;
  }

  console.log('🐳 Using Blockscout MCP client (requires Docker)');
  return new BlockscoutClient() as unknown as IBlockscoutClient;
}
