import type { AddressInfo, TokenTransfer, Chain } from '../shared/types';

/**
 * Blockscout REST API v2 token transfer item
 */
interface BlockscoutTokenTransfer {
  transaction_hash: string;
  token_type: string;
  block_hash: string;
  log_index: number;
  method?: string;
  timestamp: string;
  type: string;
  from: {
    hash: string;
    name?: string;
    is_contract?: boolean;
    is_verified?: boolean;
  };
  to: {
    hash: string;
    name?: string;
    is_contract?: boolean;
    is_verified?: boolean;
  };
  total: {
    value: string;
    decimals: string;
  };
  token: {
    address_hash: string;
    symbol: string;
    name: string;
    decimals: string;
    type: string;
    exchange_rate?: string;
    icon_url?: string;
  };
  [key: string]: unknown;
}

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
        const timeoutId = setTimeout(() => controller.abort(), 10000);

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
              const delay = Math.pow(2, attempt) * 1000;
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
        is_verified?: boolean;
        is_scam?: boolean;
        reputation?: string;
        creator_address_hash?: string;
        creation_transaction_hash?: string;
        creation_status?: string;
        implementations?: Array<{
          address_hash: string;
          name?: string;
        }>;
        token?: {
          type?: string;
          name?: string;
          symbol?: string;
          decimals?: string;
          total_supply?: string;
          holders_count?: string;
          exchange_rate?: string;
          circulating_market_cap?: string;
          volume_24h?: string;
          icon_url?: string;
        };
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
        // Contract-specific fields
        is_verified: data.is_verified,
        is_scam: data.is_scam,
        reputation: data.reputation,
        creator_address_hash: data.creator_address_hash,
        creation_transaction_hash: data.creation_transaction_hash,
        creation_status: data.creation_status,
        implementations: data.implementations?.map(impl => ({
          address: impl.address_hash,
          name: impl.name,
        })),
        token: data.token ? {
          type: data.token.type,
          name: data.token.name,
          symbol: data.token.symbol,
          decimals: data.token.decimals,
          total_supply: data.token.total_supply,
          holders: data.token.holders_count,
          exchange_rate: data.token.exchange_rate,
          circulating_market_cap: data.token.circulating_market_cap,
          volume_24h: data.token.volume_24h,
          icon_url: data.token.icon_url,
        } : undefined,
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
    token?: string
  ): Promise<{ items: TokenTransfer[]; nextCursor?: string }> {
    try {
      if (!address) {
        return { items: [] };
      }

      // Use REST API v2 endpoint
      const params: Record<string, string> = {
        type: 'ERC-20',
      };

      if (token) {
        params.filter = 'address';
        params.token = token;
      }

      const data = await this.request<{ items: BlockscoutTokenTransfer[]; next_page_params?: unknown }>(
        chainId,
        `/addresses/${address}/token-transfers`,
        params
      );
      
      if (!Array.isArray(data.items)) {
        console.warn(`[Blockscout] API returned invalid items`);
        return { items: [] };
      }

      const rawItems = data.items;
      
      // Convert timestamps for filtering
      const fromTimestamp = new Date(this.convertToISOTimestamp(ageFrom)).getTime();
      const toTimestamp = new Date(this.convertToISOTimestamp(ageTo)).getTime();
      
      const items: TokenTransfer[] = rawItems
        .filter((item) => {
          const timestamp = new Date(item.timestamp).getTime();
          return timestamp >= fromTimestamp && timestamp <= toTimestamp;
        })
        .map((item): TokenTransfer => {
          const timestamp = new Date(item.timestamp).getTime();
          
          // Calculate USD value using historical exchange rate from transaction time
          let valueUsd: number | undefined;
          if (item.token?.exchange_rate && item.total?.value && item.total?.decimals) {
            try {
              const exchangeRate = parseFloat(item.token.exchange_rate);
              const decimals = parseInt(item.total.decimals);
              const tokenAmount = parseFloat(item.total.value) / Math.pow(10, decimals);
              valueUsd = tokenAmount * exchangeRate;
            } catch (error) {
              console.warn(`[Blockscout] Failed to calculate USD value for ${item.token?.symbol}:`, error);
            }
          }

          return {
            hash: item.transaction_hash || '',
            from: item.from?.hash || '',
            to: item.to?.hash || '',
            value: item.total?.value || '0',
            token: {
              symbol: item.token?.symbol || 'UNKNOWN',
              address: item.token?.address_hash || '',
              name: item.token?.name,
              decimals: item.total?.decimals || item.token?.decimals || '18',
            },
            timestamp,
            valueUsd, // Use historical price from transaction time
            dataSource: 'http' as const,
          };
        });

      console.log(`[Blockscout] Fetched ${items.length} transfers for chain ${chainId}`);
      
      // Count how many have historical USD values
      const withUsdCount = items.filter(t => t.valueUsd !== undefined).length;
      console.log(`[Blockscout] ${withUsdCount}/${items.length} transfers have historical USD values`);

      // Only enrich transfers that don't have USD values yet (fallback to current price)
      const itemsNeedingEnrichment = items.filter(t => t.valueUsd === undefined);
      if (itemsNeedingEnrichment.length > 0) {
        console.log(`[Blockscout] Enriching ${itemsNeedingEnrichment.length} transfers with current prices (fallback)`);
        const enrichedFallback = await this.enrichWithUsdValues(chainId, itemsNeedingEnrichment);
        
        // Merge enriched items back
        const enrichedMap = new Map(enrichedFallback.map(t => [t.hash, t]));
        const finalItems = items.map(t => 
          t.valueUsd !== undefined ? t : (enrichedMap.get(t.hash) || t)
        );
        
        return {
          items: finalItems,
          nextCursor: data.next_page_params ? JSON.stringify(data.next_page_params) : undefined,
        };
      }

      return {
        items,
        nextCursor: data.next_page_params ? JSON.stringify(data.next_page_params) : undefined,
      };
    } catch (error) {
      console.error('Error getting token transfers:', error);
      throw error;
    }
  }

  /**
   * Get token exchange rate from Blockscout
   */
  private async getTokenExchangeRate(chainId: string, tokenAddress: string): Promise<number | null> {
    try {
      const response = await this.request<{
        exchange_rate?: string;
      }>(chainId, `/tokens/${tokenAddress}`);
      
      return response.exchange_rate ? parseFloat(response.exchange_rate) : null;
    } catch {
      // Token might not have exchange rate data
      return null;
    }
  }

  /**
   * Enrich transfers with USD values using Blockscout exchange rates
   */
  private async enrichWithUsdValues(
    chainId: string,
    transfers: TokenTransfer[]
  ): Promise<TokenTransfer[]> {
    // Get unique token addresses
    const uniqueTokens = new Map<string, { address: string; decimals: string }>();
    
    for (const transfer of transfers) {
      if (transfer.token.address && !uniqueTokens.has(transfer.token.address.toLowerCase())) {
        uniqueTokens.set(transfer.token.address.toLowerCase(), {
          address: transfer.token.address,
          decimals: transfer.token.decimals || '18',
        });
      }
    }

    // Fetch exchange rates for all unique tokens
    const exchangeRates = new Map<string, number>();
    
    console.log(`[Blockscout] Fetching exchange rates for ${uniqueTokens.size} unique tokens...`);
    
    for (const [addressKey, tokenInfo] of uniqueTokens.entries()) {
      const rate = await this.getTokenExchangeRate(chainId, tokenInfo.address);
      if (rate !== null) {
        exchangeRates.set(addressKey, rate);
      }
    }

    console.log(`[Blockscout] Got exchange rates for ${exchangeRates.size}/${uniqueTokens.size} tokens`);

    // Calculate USD values
    return transfers.map(transfer => {
      let valueUsd: number | undefined = undefined;

      if (transfer.token.address && transfer.value) {
        const rate = exchangeRates.get(transfer.token.address.toLowerCase());
        
        if (rate && rate > 0) {
          try {
            const decimals = parseInt(transfer.token.decimals || '18');
            const tokenAmount = parseFloat(transfer.value) / Math.pow(10, decimals);
            valueUsd = tokenAmount * rate;
          } catch (error) {
            console.error(`Error calculating USD for ${transfer.token.symbol}:`, error);
          }
        }
      }

      return {
        ...transfer,
        valueUsd,
      };
    });
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