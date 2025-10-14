import type { AddressInfo, TokenTransfer, Chain } from '../shared/types';

/**
 * Blockscout HTTP Client
 * Direct REST API client for production environments (Vercel, etc.)
 * This replaces the MCP client which requires Docker
 */
export class BlockscoutHttpClient {
  private baseUrls: Record<string, string> = {
    '1': 'https://eth.blockscout.com',
    '8453': 'https://base.blockscout.com',
    '42161': 'https://arbitrum.blockscout.com',
    '10': 'https://optimism.blockscout.com',
    '137': 'https://polygon.blockscout.com',
  };

  constructor() {}

  /**
   * Get the base URL for a chain
   */
  private getBaseUrl(chainId: string): string {
    const url = this.baseUrls[chainId];
    if (!url) {
      throw new Error(`Unsupported chain ID: ${chainId}`);
    }
    return url;
  }

  /**
   * Make a request to Blockscout API with retry logic
   */
  private async request<T>(
    chainId: string, 
    endpoint: string, 
    params?: Record<string, string>,
    retries: number = 2
  ): Promise<T> {
    const baseUrl = this.getBaseUrl(chainId);
    const url = new URL(`${baseUrl}/api/v2${endpoint}`);
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        url.searchParams.append(key, value);
      });
    }

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        // Create abort controller for timeout (compatible with older Node.js)
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // Reduced to 10s for faster failures

        const response = await fetch(url.toString(), {
          headers: {
            'Accept': 'application/json',
          },
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          // Handle rate limiting and timeouts
          if (response.status === 429 || response.status === 524) {
            if (attempt < retries) {
              const delay = Math.pow(2, attempt) * 1000; // Exponential backoff
              console.log(`⏳ Rate limited/timeout on chain ${chainId}, retrying in ${delay}ms...`);
              await new Promise(resolve => setTimeout(resolve, delay));
              continue;
            }
          }
          throw new Error(`Blockscout API error: ${response.status} ${response.statusText}`);
        }

        return response.json();
      } catch (error) {
        if (attempt < retries && (error instanceof Error && (error.name === 'AbortError' || error.name === 'TimeoutError'))) {
          const delay = Math.pow(2, attempt) * 1000;
          console.log(`⏳ Request timeout on chain ${chainId}, retrying in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
        
        // Log error for debugging
        console.error(`❌ Request failed for chain ${chainId}:`, error instanceof Error ? error.message : 'Unknown error');
        throw error;
      }
    }

    throw new Error(`Failed after ${retries + 1} attempts`);
  }

  /**
   * Connect (no-op for HTTP client, kept for API compatibility)
   */
  async connect(): Promise<void> {
    // No connection needed for HTTP client
  }

  /**
   * Disconnect (no-op for HTTP client, kept for API compatibility)
   */
  async disconnect(): Promise<void> {
    // No disconnection needed for HTTP client
  }

  /**
   * Get address information including balance and ENS name
   */
  async getAddressInfo(chainId: string, address: string): Promise<AddressInfo> {
    try {
      const data = await this.request<{
        hash?: string;
        coin_balance?: string;
        exchange_rate?: string;
        is_contract?: boolean;
        ens_domain_name?: string;
      }>(chainId, `/addresses/${address}`);
      
      // Calculate USD value
      let balanceUsd: number | undefined;
      if (data.coin_balance && data.exchange_rate) {
        const balanceInEth = parseFloat(data.coin_balance) / 1e18;
        balanceUsd = balanceInEth * parseFloat(data.exchange_rate);
      }
      
      return {
        address: data.hash || address,
        balance: data.coin_balance || '0',
        balanceUsd,
        isContract: data.is_contract || false,
        ensName: data.ens_domain_name,
      };
    } catch (error) {
      console.error('Error getting address info:', error);
      throw error;
    }
  }

  /**
   * Convert relative time strings to ISO 8601 timestamps
   */
  private convertToISOTimestamp(timeStr: string): string {
    if (timeStr === 'now') {
      return new Date().toISOString();
    }

    if (timeStr.includes('T') || timeStr.includes('-')) {
      return timeStr;
    }

    const match = timeStr.match(/^(\d+)(h|d|m)$/);
    if (!match) {
      return timeStr;
    }

    const [, amount, unit] = match;
    const now = new Date();
    const value = parseInt(amount);

    switch (unit) {
      case 'h':
        now.setHours(now.getHours() - value);
        break;
      case 'd':
        now.setDate(now.getDate() - value);
        break;
      case 'm':
        now.setMinutes(now.getMinutes() - value);
        break;
    }

    return now.toISOString();
  }

  /**
   * Get token transfers for an address within a time range
   */
  async getTokenTransfers(
    chainId: string,
    address: string | null,
    ageFrom: string,
    ageTo: string,
    token?: string,
    cursor?: string
  ): Promise<{ items: TokenTransfer[]; nextCursor?: string }> {
    try {
      if (!address) {
        // Blockscout API requires an address
        return { items: [] };
      }

      // Use RPC-style API endpoint which includes transaction hashes
      const params: Record<string, string> = {
        module: 'account',
        action: 'tokentx',
        address: address,
        sort: 'desc',
        page: '1',
        offset: '50', // Reduced to 50 for faster response
      };

      if (token) params.contractaddress = token;

      interface BlockscoutRpcTransferItem {
        hash: string;
        timeStamp: string;
        from: string;
        to: string;
        value: string;
        tokenName?: string;
        tokenSymbol?: string;
        tokenDecimal?: string;
        contractAddress?: string;
        gasPrice?: string;
        gasUsed?: string;
      }

      interface BlockscoutRpcResponse {
        status: string;
        message: string;
        result: BlockscoutRpcTransferItem[];
      }

      const data = await this.request<BlockscoutRpcResponse>(chainId, `/api`, params);
      
      // Check if API call was successful
      if (data.status !== '1' || !Array.isArray(data.result)) {
        console.warn(`[Blockscout RPC] API returned status: ${data.status}, message: ${data.message}`);
        return { items: [] };
      }

      const rawItems = data.result;
      
      // Debug: Log first item to see structure
      if (rawItems.length > 0) {
        console.log(`[Blockscout RPC] Sample transfer data for chain ${chainId}:`, {
          hash: rawItems[0].hash,
          hasHash: !!rawItems[0].hash,
          from: rawItems[0].from,
          to: rawItems[0].to,
          tokenSymbol: rawItems[0].tokenSymbol
        });
      }
      
      const fromTimestamp = new Date(this.convertToISOTimestamp(ageFrom)).getTime() / 1000; // Convert to seconds
      const toTimestamp = new Date(this.convertToISOTimestamp(ageTo)).getTime() / 1000;
      
      const items: TokenTransfer[] = rawItems
        .filter((item: BlockscoutRpcTransferItem) => {
          const timestamp = parseInt(item.timeStamp);
          // Filter by time range
          return timestamp >= fromTimestamp && timestamp <= toTimestamp;
        })
        .map((item: BlockscoutRpcTransferItem): TokenTransfer => {
          const timestamp = parseInt(item.timeStamp) * 1000; // Convert to milliseconds

          // Calculate USD value from token decimals and value
          let valueUsd: number | undefined = undefined;
          
          if (item.value && item.tokenDecimal) {
            try {
              const decimals = parseInt(item.tokenDecimal);
              const tokenAmount = parseFloat(item.value) / Math.pow(10, decimals);
              
              // For now, we'll estimate based on common token values
              // In production, you'd fetch real-time prices from an API
              // This is a placeholder - actual USD values will need price data
              valueUsd = tokenAmount; // Placeholder - needs real price data
            } catch (e) {
              // If calculation fails, leave undefined
            }
          }
          
          return {
            hash: item.hash,
            from: item.from,
            to: item.to,
            value: item.value,
            token: {
              symbol: item.tokenSymbol || 'UNKNOWN',
              address: item.contractAddress || '',
              name: item.tokenName,
            },
            timestamp,
            valueUsd,
          };
        });

      console.log(`[Blockscout RPC] Fetched ${items.length} transfers for chain ${chainId}`);

      return {
        items,
        nextCursor: undefined, // RPC API uses page/offset, not cursor
      };
    } catch (error) {
      console.error('Error getting token transfers:', error);
      throw error;
    }
  }

  /**
   * Get tokens held by an address
   */
  async getTokensByAddress(chainId: string, address: string): Promise<Record<string, unknown>[]> {
    try {
      const data = await this.request<{ items?: Record<string, unknown>[] }>(chainId, `/addresses/${address}/tokens`, {
        type: 'ERC-20',
      });
      return data.items || [];
    } catch (error) {
      console.error('Error getting tokens by address:', error);
      return [];
    }
  }

  /**
   * Get list of supported chains
   */
  async getChainsList(): Promise<Chain[]> {
    return [
      { id: '1', name: 'Ethereum', displayName: 'Ethereum' },
      { id: '8453', name: 'Base', displayName: 'Base' },
      { id: '42161', name: 'Arbitrum', displayName: 'Arbitrum One' },
      { id: '10', name: 'Optimism', displayName: 'Optimism' },
      { id: '137', name: 'Polygon', displayName: 'Polygon' },
    ];
  }
}
