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
        const response = await fetch(url.toString(), {
          headers: {
            'Accept': 'application/json',
          },
          signal: AbortSignal.timeout(30000), // 30 second timeout
        });

        if (!response.ok) {
          // Handle rate limiting and timeouts
          if (response.status === 429 || response.status === 524) {
            if (attempt < retries) {
              const delay = Math.pow(2, attempt) * 1000; // Exponential backoff
              console.log(`⏳ Rate limited/timeout on ${chainId}, retrying in ${delay}ms...`);
              await new Promise(resolve => setTimeout(resolve, delay));
              continue;
            }
          }
          throw new Error(`Blockscout API error: ${response.status} ${response.statusText}`);
        }

        return response.json();
      } catch (error) {
        if (attempt < retries && (error instanceof Error && error.name === 'TimeoutError')) {
          const delay = Math.pow(2, attempt) * 1000;
          console.log(`⏳ Request timeout on ${chainId}, retrying in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
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
      const data = await this.request<any>(chainId, `/addresses/${address}`);
      
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

      const params: Record<string, string> = {
        type: 'ERC-20',
      };

      if (token) params.token = token;
      if (cursor) params.cursor = cursor;

      const data = await this.request<any>(chainId, `/addresses/${address}/token-transfers`, params);
      
      const rawItems = data.items || [];
      const fromTimestamp = new Date(this.convertToISOTimestamp(ageFrom)).getTime();
      const toTimestamp = new Date(this.convertToISOTimestamp(ageTo)).getTime();
      
      const items: TokenTransfer[] = rawItems
        .map((item: any) => {
          const timestamp = item.timestamp ? new Date(item.timestamp).getTime() : Date.now();
          
          // Filter by time range
          if (timestamp < fromTimestamp || timestamp > toTimestamp) {
            return null;
          }

          // Calculate USD value
          let valueUsd: number | undefined;
          
          if (item.total?.usd) {
            valueUsd = parseFloat(item.total.usd);
          } else if (item.total?.value && item.token?.exchange_rate && item.token?.decimals) {
            const tokenValue = parseFloat(item.total.value) / Math.pow(10, parseInt(item.token.decimals));
            valueUsd = tokenValue * parseFloat(item.token.exchange_rate);
          }
          
          return {
            hash: item.tx_hash || item.hash,
            from: item.from?.hash || item.from || '',
            to: item.to?.hash || item.to || '',
            value: item.total?.value || '0',
            token: {
              symbol: item.token?.symbol || 'UNKNOWN',
              address: item.token?.address || '',
              name: item.token?.name,
              decimals: item.token?.decimals?.toString() || '18',
            },
            timestamp,
            valueUsd,
          };
        })
        .filter((item: TokenTransfer | null): item is TokenTransfer => item !== null);

      return {
        items,
        nextCursor: data.next_page_params?.items_count ? 'has_more' : undefined,
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
      const data = await this.request<any>(chainId, `/addresses/${address}/tokens`, {
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
