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

    // Known whale addresses (same as WhaleService)
    const whaleAddresses = [
      '0x28C6c06298d514Db089934071355E5743bf21d60', // Binance
      '0x21a31Ee1afC51d94C2eFcCAa2092aD1028285549', // Binance 2
      '0xDFd5293D8e347dFe59E90eFd55b2956a1343963d', // Binance 3
      '0xF977814e90dA44bFA03b6295A0616a897441aceC', // Binance 8
      '0x001866Ae5B3de6cAa5a51543FD9fB64f524F5478', // Coinbase
      '0x71660c4005BA85c37ccec55d0C4493E66Fe775d3', // Coinbase 2
      '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045', // Vitalik
      '0x40ec5B33f54e0E8A33A975908C5BA1c14e5BbbDf', // Polygon Bridge
      '0x47ac0Fb4F2D84898e4D9E7b4DaB3C24507a6D503', // Large holder
    ];

    try {
      const allTransfers: WhaleTransfer[] = [];

      // Get transfers for each whale address
      for (const whaleAddress of whaleAddresses) {
        try {
          console.log(`Fetching transfers for whale: ${whaleAddress}`);

          // Get token transfers for this whale address
          const response = await client.get(`/addresses/${whaleAddress}/token-transfers`, {
            params: {
              type: 'ERC-20',
              limit: 10, // Limit per address to avoid too much data
            }
          });

          console.log(`Got ${response.data.items?.length || 0} transfers for ${whaleAddress}`);

          if (response.data.items) {
            for (const item of response.data.items.slice(0, 5)) { // Limit to 5 transfers per address
              console.log(`Processing transfer: ${item.transaction_hash}, value: ${item.total?.usd_value}`);

              // Check if transfer value meets minimum threshold
              if (item.total?.usd_value && parseFloat(item.total.usd_value) >= minValue) {
                console.log(`Adding whale transfer: ${item.transaction_hash} with value ${item.total.usd_value}`);
                allTransfers.push({
                  hash: item.transaction_hash || item.tx_hash,
                  timestamp: item.timestamp,
                  from: item.from?.hash || item.from,
                  to: item.to?.hash || item.to,
                  value: item.total?.value || item.value,
                  token: {
                    address: item.token?.address_hash || '',
                    symbol: item.token?.symbol || 'UNKNOWN',
                    decimals: item.token?.decimals || 18,
                    name: item.token?.name
                  },
                  usd_value: item.total?.usd_value ? parseFloat(item.total.usd_value) : undefined,
                  chain_id: chainId
                });
              }
            }
          }
        } catch (error) {
          console.error(`Error fetching transfers for whale ${whaleAddress}:`, error);
          // Continue with other addresses
        }
      }

      // Sort by USD value descending and limit results
      const sortedTransfers = allTransfers
        .sort((a, b) => (b.usd_value || 0) - (a.usd_value || 0))
        .slice(0, limit);

      return {
        transfers: sortedTransfers,
        pagination: { has_more: false } // No pagination for whale transfers
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
