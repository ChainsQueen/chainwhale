import axios, { AxiosInstance } from 'axios';

export interface WhaleTransfer {
  hash: string;
  timestamp: string;
  from: string;
  to: string;
  value: string;
  token: {
    address: string;
    symbol: string;
    decimals: number;
    name?: string;
  };
  usd_value?: number;
  chain_id: string;
}

export interface ContractInfo {
  address: string;
  chain_id: string;
  is_verified: boolean;
  is_scam?: boolean;
  token_type?: string;
  name?: string;
  symbol?: string;
  decimals?: number;
  total_supply?: string;
  holders_count?: number;
  exchange_rate?: number;
  market_cap?: number;
}

export interface WhaleTransfersResponse {
  transfers: WhaleTransfer[];
  pagination?: {
    has_more: boolean;
    next_page_params?: Record<string, unknown>;
  };
}

export class BlockscoutService {
  private clients: Map<string, AxiosInstance> = new Map();

  private readonly CHAIN_CONFIGS = {
    '1': 'https://eth.blockscout.com/api/v2',
    '8453': 'https://base.blockscout.com/api/v2',
    '42161': 'https://arbitrum.blockscout.com/api/v2',
    '10': 'https://optimism.blockscout.com/api/v2',
    '137': 'https://polygon.blockscout.com/api/v2'
  };

  constructor() {
    // Initialize axios clients for each chain
    Object.entries(this.CHAIN_CONFIGS).forEach(([chainId, baseUrl]) => {
      this.clients.set(chainId, axios.create({
        baseURL: baseUrl,
        timeout: 30000,
        headers: {
          'User-Agent': 'ChainWhale-MCP-Server/1.0.0'
        }
      }));
    });
  }

  private getClient(chainId: string): AxiosInstance {
    const client = this.clients.get(chainId);
    if (!client) {
      throw new Error(`Unsupported chain ID: ${chainId}`);
    }
    return client;
  }

  async getWhaleTransfers(
    chainId: string,
    minValue: number = 100000,
    limit: number = 50,
    offset?: number
  ): Promise<WhaleTransfersResponse> {
    const client = this.getClient(chainId);

    try {
      const params: Record<string, string | number> = {
        'filter': 'to',
        'type': 'ERC-20',
        'q': minValue.toString()
      };

      if (offset) {
        params.offset = offset;
      }

      const response = await client.get('/tokens', { params });

      // Transform Blockscout response to our format
      const transfers: WhaleTransfer[] = [];

      if (response.data.items) {
        for (const item of response.data.items.slice(0, limit)) {
          // Get transfer details for this token
          const transfersResponse = await client.get(`/tokens/${item.address}/transfers`, {
            params: { limit: 10 }
          });

          if (transfersResponse.data.items) {
            for (const transfer of transfersResponse.data.items) {
              if (parseFloat(transfer.total.value || '0') >= minValue) {
                transfers.push({
                  hash: transfer.transaction_hash || transfer.tx_hash,
                  timestamp: transfer.timestamp,
                  from: transfer.from?.hash || transfer.from,
                  to: transfer.to?.hash || transfer.to,
                  value: transfer.total?.value || transfer.value,
                  token: {
                    address: item.address,
                    symbol: item.symbol || 'UNKNOWN',
                    decimals: item.decimals || 18,
                    name: item.name
                  },
                  usd_value: transfer.total?.usd_value,
                  chain_id: chainId
                });
              }
            }
          }
        }
      }

      return {
        transfers,
        pagination: response.data.next_page_params ? {
          has_more: true,
          next_page_params: response.data.next_page_params
        } : { has_more: false }
      };

    } catch (error) {
      console.error(`Error fetching whale transfers for chain ${chainId}:`, error);
      throw new Error(`Failed to fetch whale transfers: ${error}`);
    }
  }

  async getContractInfo(chainId: string, address: string): Promise<ContractInfo> {
    const client = this.getClient(chainId);

    try {
      const response = await client.get(`/addresses/${address}`);

      const data = response.data;

      return {
        address,
        chain_id: chainId,
        is_verified: data.is_verified || false,
        is_scam: data.is_scam || false,
        token_type: data.token?.type,
        name: data.token?.name || data.ens_domain_name,
        symbol: data.token?.symbol,
        decimals: data.token?.decimals,
        total_supply: data.token?.total_supply,
        holders_count: data.token?.holders,
        exchange_rate: data.token?.exchange_rate,
        market_cap: data.token?.market_cap
      };

    } catch (error) {
      console.error(`Error fetching contract info for ${address} on chain ${chainId}:`, error);
      throw new Error(`Failed to fetch contract info: ${error}`);
    }
  }

  async getMultipleContractInfo(chainId: string, addresses: string[]): Promise<ContractInfo[]> {
    const promises = addresses.map(address => this.getContractInfo(chainId, address));
    return Promise.all(promises);
  }

  getSupportedChains(): string[] {
    return Object.keys(this.CHAIN_CONFIGS);
  }
}
