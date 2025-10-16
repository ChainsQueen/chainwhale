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
    console.log('HybridClient: Attempting to connect to MCP...');
    try {
      await this.mcp.connect();
      this.connected = true;
      console.log('✅ HybridClient: MCP connected successfully - will use MCP-first approach');
    } catch (error) {
      console.error('❌ HybridClient: MCP connection failed:', error instanceof Error ? error.message : error);
      console.warn('⚠️  HybridClient: Will use HTTP-only mode (no MCP data)');
      this.connected = false;
    }
    // Always ensure HTTP client is ready
    await this.http.connect();
    console.log('HybridClient: HTTP client ready as fallback');
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
      console.log(`HybridClient: MCP is connected, attempting to fetch transfers for chain ${chainId}...`);
      try {
        const res = await this.mcp.getTokenTransfers(chainId, address, ageFrom, ageTo, token, cursor);
        
        // If MCP returns data, enrich it with hashes from HTTP
        if (res.items.length > 0) {
          const mcpHasHashes = this.hasCompleteHashes(res.items);
          
          if (!mcpHasHashes && address) {
            console.log(`HybridClient: MCP returned ${res.items.length} transfers without hashes. Enriching with HTTP data...`);
            
            // Get hashes from HTTP API
            try {
              const httpRes = await this.http.getTokenTransfers(chainId, address, ageFrom, ageTo, token);
              
              // Match MCP transfers with HTTP transfers to add hashes
              const enrichedItems = res.items.map(mcpItem => {
                // Find matching HTTP transfer by from/to/timestamp
                const match = httpRes.items.find(httpItem => 
                  httpItem.from.toLowerCase() === mcpItem.from.toLowerCase() &&
                  httpItem.to.toLowerCase() === mcpItem.to.toLowerCase() &&
                  Math.abs(httpItem.timestamp - mcpItem.timestamp) < 5000 // Within 5 seconds
                );
                
                if (match?.hash) {
                  return { ...mcpItem, hash: match.hash, dataSource: 'mcp' as const };
                }
                return { ...mcpItem, dataSource: 'mcp' as const };
              });
              
              const enrichedCount = enrichedItems.filter(i => i.hash).length;
              console.log(`HybridClient: Enriched ${enrichedCount}/${res.items.length} MCP transfers with hashes from HTTP`);
              
              return { ...res, items: enrichedItems };
            } catch (enrichError) {
              console.warn('HybridClient: Failed to enrich MCP data with hashes:', enrichError);
              // Return MCP data anyway, tagged as MCP
              const taggedItems = res.items.map(item => ({ ...item, dataSource: 'mcp' as const }));
              return { ...res, items: taggedItems };
            }
          } else if (mcpHasHashes) {
            console.log(`HybridClient: using MCP transfers with hashes (count=${res.items.length}) for chain ${chainId}`);
            const taggedItems = res.items.map(item => ({ ...item, dataSource: 'mcp' as const }));
            return { ...res, items: taggedItems };
          }
        }
        console.log(`HybridClient: MCP returned empty results. Trying HTTP fallback...`);
      } catch (e) {
        console.warn('HybridClient.getTokenTransfers: MCP failed, trying HTTP fallback:', e instanceof Error ? e.message : e);
      }
    }

    // HTTP fallback
    console.log(`HybridClient: Using HTTP fallback (MCP not connected or failed)`);
    
    if (!address) {
      console.warn('HybridClient: HTTP fallback skipped (address required but not provided). Returning empty set.');
      return { items: [], nextCursor: undefined };
    }

    const httpRes = await this.http.getTokenTransfers(chainId, address, ageFrom, ageTo, token);
    console.log(`HybridClient: ✅ HTTP returned ${httpRes.items.length} transfers for chain ${chainId}`);
    // Tag transfers as HTTP data
    const taggedItems = httpRes.items.map(item => ({ ...item, dataSource: 'http' as const }));
    return { ...httpRes, items: taggedItems };
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
