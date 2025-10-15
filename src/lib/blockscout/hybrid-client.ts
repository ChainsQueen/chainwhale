import type { AddressInfo, TokenTransfer, Chain } from '../shared/types';
import { BlockscoutClient } from './client';
import { BlockscoutHttpClient } from './http-client';

/**
 * Hybrid Blockscout Client (MCP-first)
 * - Prefers MCP for all calls
 * - Falls back to HTTP/RPC for token transfers if MCP items lack transaction hashes
 */
export class HybridBlockscoutClient {
  private mcp = new BlockscoutClient();
  private http = new BlockscoutHttpClient();
  private connected = false;

  async connect(): Promise<void> {
    // Connect MCP first (HTTP is stateless)
    if (!this.connected) {
      try {
        await this.mcp.connect();
        this.connected = true;
        console.log('🔌 HybridClient: MCP connected');
      } catch (err) {
        // If MCP connection fails, we still allow HTTP fallback usage
        console.warn('HybridClient: MCP connect failed, HTTP-only mode enabled:', err instanceof Error ? err.message : err);
      }
    }
  }

  async disconnect(): Promise<void> {
    try {
      await this.mcp.disconnect();
    } finally {
      this.connected = false;
    }
  }

  async getAddressInfo(chainId: string, address: string): Promise<AddressInfo> {
    // Prefer MCP, fallback to HTTP on error
    try {
      if (this.connected) return await this.mcp.getAddressInfo(chainId, address);
      return await this.http.getAddressInfo(chainId, address);
    } catch (e) {
      console.warn('HybridClient.getAddressInfo: MCP failed, using HTTP:', e instanceof Error ? e.message : e);
      return await this.http.getAddressInfo(chainId, address);
    }
  }

  private hasCompleteHashes(items: TokenTransfer[]): boolean {
    if (!items.length) return false; // require some data
    return items.every(i => !!i.hash);
  }

  async getTokenTransfers(
    chainId: string,
    address: string | null,
    ageFrom: string,
    ageTo: string,
    token?: string,
    cursor?: string
  ): Promise<{ items: TokenTransfer[]; nextCursor?: string }> {
    // Try MCP first when available
    if (this.connected) {
      try {
        const res = await this.mcp.getTokenTransfers(chainId, address, ageFrom, ageTo, token, cursor);
        const mcpHasHashes = this.hasCompleteHashes(res.items);
        if (mcpHasHashes) {
          console.log(`HybridClient: using MCP transfers (count=${res.items.length}) for chain ${chainId}`);
          return res;
        }
        console.log(`HybridClient: MCP transfers missing hashes or empty (count=${res.items.length}). Considering HTTP fallback...`);
      } catch (e) {
        console.warn('HybridClient.getTokenTransfers: MCP failed, considering HTTP fallback:', e instanceof Error ? e.message : e);
      }
    }

    // HTTP/RPC fallback requires an address
    if (!address) {
      // If we don't have an address, return MCP (which might be empty) or nothing
      // As last resort, return empty to avoid misleading data without hashes
      console.warn('HybridClient: HTTP fallback skipped (address required but not provided). Returning empty set.');
      return { items: [], nextCursor: undefined };
    }

    const httpRes = await this.http.getTokenTransfers(chainId, address, ageFrom, ageTo, token);
    console.log(`HybridClient: using HTTP/RPC transfers (count=${httpRes.items.length}) for chain ${chainId}`);
    return httpRes;
  }

  async getTokensByAddress(chainId: string, address: string): Promise<Record<string, unknown>[]> {
    try {
      if (this.connected) return await this.mcp.getTokensByAddress(chainId, address);
      return await this.http.getTokensByAddress(chainId, address);
    } catch (e) {
      console.warn('HybridClient.getTokensByAddress: MCP failed, using HTTP:', e instanceof Error ? e.message : e);
      return await this.http.getTokensByAddress(chainId, address);
    }
  }

  async getChainsList(): Promise<Chain[]> {
    try {
      if (this.connected) return await this.mcp.getChainsList();
      return await this.http.getChainsList();
    } catch (e) {
      console.warn('HybridClient.getChainsList: MCP failed, using HTTP:', e instanceof Error ? e.message : e);
      return await this.http.getChainsList();
    }
  }
}
