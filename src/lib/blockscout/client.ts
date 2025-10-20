import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import type { AddressInfo, TokenTransfer, Chain } from '../shared/types';

/**
 * Blockscout MCP Client
 * Wrapper for interacting with Blockscout's Model Context Protocol server
 */
export class BlockscoutClient {
  private client: Client | null = null;
  private transport: StdioClientTransport | null = null;
  private connected = false;

  constructor() {}

  /**
   * Connect to the Blockscout MCP server
   * Uses Docker with the official cloud-hosted MCP server
   */
  async connect(): Promise<void> {
    if (this.connected) {
      return;
    }

    try {
      console.log('[MCP Client] Starting connection to Blockscout MCP server...');
      console.log('[MCP Client] Using Docker image: ghcr.io/blockscout/mcp-server:latest');
      
      // Use Docker to connect to the official Blockscout MCP server
      // Official image: https://github.com/blockscout/mcp-server
      // This requires Docker to be installed and running
      this.transport = new StdioClientTransport({
        command: 'docker',
        args: [
          'run',
          '--rm',
          '-i',
          'ghcr.io/blockscout/mcp-server:latest',
          'python',
          '-m',
          'blockscout_mcp_server'
        ],
      });
      
      console.log('[MCP Client] Transport created successfully');

      this.client = new Client(
        {
          name: 'chainwhale-client',
          version: '1.0.0',
        },
        {
          capabilities: {},
        }
      );

      console.log('[MCP Client] Attempting to connect client to transport...');
      await this.client.connect(this.transport);
      this.connected = true;
      console.log('✅ [MCP Client] Blockscout MCP client connected successfully!');
      console.log('[MCP Client] MCP is ready to use');

      // Initialize the MCP server (required before using other tools)
      await this.client.callTool({
        name: '__unlock_blockchain_analysis__',
        arguments: {},
      });
      
      console.log('✅ Connected to Blockscout MCP server');
    } catch (error) {
      console.error('❌ [MCP Client] Failed to connect to Blockscout MCP server');
      console.error('[MCP Client] Error type:', error instanceof Error ? error.constructor.name : typeof error);
      console.error('[MCP Client] Error message:', error instanceof Error ? error.message : String(error));
      console.error('[MCP Client] Full error:', error);
      console.error('');
      console.error('💡 [MCP Client] Troubleshooting:');
      console.error('   1. Is Docker running? Run: docker ps');
      console.error('   2. Is the image pulled? Run: docker pull ghcr.io/blockscout/mcp-server:latest');
      console.error('   3. Can Docker run? Try: docker run --rm hello-world');
      console.error('');
      throw new Error('Failed to connect to Blockscout MCP server. Make sure Docker is installed and running.');
    }
  }

  /**
   * Disconnect from the MCP server
   */
  async disconnect(): Promise<void> {
    if (this.client) {
      await this.client.close();
      this.client = null;
    }
    if (this.transport) {
      await this.transport.close();
      this.transport = null;
    }
    this.connected = false;
  }

  /**
   * Ensure client is connected before making requests
   */
  private ensureConnected(): void {
    if (!this.connected || !this.client) {
      throw new Error('Client not connected. Call connect() first.');
    }
  }

  /**
   * Get address information including balance and ENS name
   */
  async getAddressInfo(chainId: string, address: string): Promise<AddressInfo> {
    this.ensureConnected();

    try {
      const result = await this.client!.callTool({
        name: 'get_address_info',
        arguments: {
          chain_id: chainId,
          address: address,
        },
      });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const responseText = (result.content as any)[0].text;
      
      // Check if response is an error message
      if (responseText.startsWith('Error')) {
        throw new Error(`Blockscout API error: ${responseText}`);
      }
      
      const data = JSON.parse(responseText);
      
      // Calculate USD value: convert Wei to ETH, then multiply by exchange rate
      let balanceUsd: number | undefined;
      if (data.coin_balance && data.exchange_rate) {
        const balanceInEth = parseFloat(data.coin_balance) / 1e18; // Wei to ETH
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
        implementations: data.implementations,
        token: data.token ? {
          type: data.token.type,
          name: data.token.name,
          symbol: data.token.symbol,
          decimals: data.token.decimals,
          total_supply: data.token.total_supply,
          holders: data.token.holders_count || data.token.holders,
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
   * Convert relative time strings (e.g., '1h', '24h', 'now') to ISO 8601 timestamps
   */
  private convertToISOTimestamp(timeStr: string): string {
    if (timeStr === 'now') {
      return new Date().toISOString();
    }

    // Check if already ISO format
    if (timeStr.includes('T') || timeStr.includes('-')) {
      return timeStr;
    }

    // Parse relative time (e.g., '1h', '24h', '7d')
    const match = timeStr.match(/^(\d+)(h|d|m)$/);
    if (!match) {
      return timeStr; // Return as-is if not recognized
    }

    const [, amount, unit] = match;
    const now = new Date();
    const value = parseInt(amount);

    switch (unit) {
      case 'h': // hours
        now.setHours(now.getHours() - value);
        break;
      case 'd': // days
        now.setDate(now.getDate() - value);
        break;
      case 'm': // minutes
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
    this.ensureConnected();

    try {
      const args: Record<string, string> = {
        chain_id: chainId,
        age_from: this.convertToISOTimestamp(ageFrom),
        age_to: this.convertToISOTimestamp(ageTo),
      };

      if (address) args.address = address;
      if (token) args.token = token;
      if (cursor) args.cursor = cursor;

      console.log('[MCP Client] Calling get_token_transfers_by_address with args:', args);

      const result = await this.client!.callTool({
        name: 'get_token_transfers_by_address',
        arguments: args,
      });
      
      console.log('[MCP Client] Raw MCP response:', JSON.stringify(result, null, 2));

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const responseText = (result.content as any)[0].text;
      
      // Check if response is an error message
      if (responseText.startsWith('Error')) {
        console.error(`Blockscout API error: ${responseText}`);
        throw new Error(`Blockscout API error: ${responseText}`);
      }
      
      const data = JSON.parse(responseText);
      
      console.log('[MCP Client] Parsed response data keys:', Object.keys(data));
      console.log('[MCP Client] Full parsed data:', JSON.stringify(data, null, 2));
      
      // The MCP returns data in { data: [...] } format, not { items: [...] }
      const rawItems = data.data || data.items || [];
      
      console.log('[MCP Client] Number of items:', rawItems.length);
      
      // Debug: Log first item to see structure
      if (rawItems.length > 0) {
        console.log('[MCP Client] ===== FIRST TRANSFER SAMPLE =====');
        console.log('[MCP Client] Full item:', JSON.stringify(rawItems[0], null, 2));
        console.log('[MCP Client] item.hash:', rawItems[0].hash);
        console.log('[MCP Client] item.tx_hash:', rawItems[0].tx_hash);
        console.log('[MCP Client] item.transaction_hash:', rawItems[0].transaction_hash);
        console.log('[MCP Client] All keys in item:', Object.keys(rawItems[0]));
        console.log('[MCP Client] =====================================');
      } else {
        console.warn('[MCP Client] No items returned from MCP');
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const items: TokenTransfer[] = rawItems.map((item: any) => {
        // Calculate USD value using historical exchange rate from transaction time
        let valueUsd: number | undefined;
        
        if (item.total?.usd) {
          // Direct USD value provided by MCP
          valueUsd = parseFloat(item.total.usd);
        } else if (item.total?.value && item.token?.exchange_rate) {
          // Calculate from token value * historical exchange rate
          // Use item.total.decimals (preferred) or fallback to item.token.decimals
          const decimals = item.total?.decimals || item.token?.decimals || '18';
          try {
            const exchangeRate = parseFloat(item.token.exchange_rate);
            const decimalPlaces = parseInt(decimals);
            const tokenAmount = parseFloat(item.total.value) / Math.pow(10, decimalPlaces);
            valueUsd = tokenAmount * exchangeRate;
          } catch (error) {
            console.warn(`[MCP Client] Failed to calculate USD value for ${item.token?.symbol}:`, error);
          }
        }
        
        return {
          hash: item.hash || item.tx_hash,
          from: item.from?.hash || item.from || '',
          to: item.to?.hash || item.to || '',
          value: item.total?.value || '0',
          token: {
            symbol: item.token?.symbol || 'UNKNOWN',
            address: item.token?.address_hash || item.token?.address || '',
            name: item.token?.name,
            decimals: item.total?.decimals || item.token?.decimals || '18',
          },
          timestamp: item.timestamp ? new Date(item.timestamp as string).getTime() : Date.now(),
          valueUsd,
          dataSource: 'mcp' as const,
        };
      });

      // Count how many have historical USD values
      const withUsdCount = items.filter(t => t.valueUsd !== undefined).length;
      console.log(`[MCP Client] ${withUsdCount}/${items.length} transfers have USD values`);

      return {
        items,
        nextCursor: data.next_page_params?.cursor,
      };
    } catch (error) {
      console.error('Error getting token transfers:', error);
      throw error;
    }
  }


  /**
   * Get transaction summary in human-readable format
   */
  async transactionSummary(chainId: string, hash: string): Promise<string> {
    this.ensureConnected();

    try {
      const result = await this.client!.callTool({
        name: 'transaction_summary',
        arguments: {
          chain_id: chainId,
          transaction_hash: hash,
        },
      });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (result.content as any)[0].text;
    } catch (error) {
      console.error('Error getting transaction summary:', error);
      return 'Unable to generate transaction summary';
    }
  }

  /**
   * Get list of supported chains
   */
  async getChainsList(): Promise<Chain[]> {
    this.ensureConnected();

    try {
      const result = await this.client!.callTool({
        name: 'get_chains_list',
        arguments: {},
      });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const data = JSON.parse((result.content as any)[0].text);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (data.items || []).map((item: any) => ({
        id: item.id,
        name: item.name,
        displayName: item.name,
      }));
    } catch (error) {
      console.error('Error getting chains list:', error);
      // Return default chains if API fails
      return [
        { id: '1', name: 'Ethereum', displayName: 'Ethereum' },
        { id: '8453', name: 'Base', displayName: 'Base' },
        { id: '42161', name: 'Arbitrum', displayName: 'Arbitrum One' },
      ];
    }
  }

  /**
   * Get tokens held by an address
   */
  async getTokensByAddress(chainId: string, address: string): Promise<Record<string, unknown>[]> {
    this.ensureConnected();

    try {
      const result = await this.client!.callTool({
        name: 'get_tokens_by_address',
        arguments: {
          chain_id: chainId,
          address: address,
        },
      });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const data = JSON.parse((result.content as any)[0].text);
      return data.items || [];
    } catch (error) {
      console.error('Error getting tokens by address:', error);
      return [];
    }
  }

  /**
   * Get whale transfers (large value transfers) for a specific time range
   * This is optimized for whale detection
   */
  async getWhaleTransfers(
    chainId: string,
    minValueUsd: number = 100000,
    ageFrom: string = '1h',
    ageTo: string = 'now'
  ): Promise<TokenTransfer[]> {
    this.ensureConnected();

    try {
      // Get all transfers in the time range
      const { items } = await this.getTokenTransfers(
        chainId,
        null, // all addresses
        ageFrom,
        ageTo
      );

      // Filter for whale-sized transfers
      return items.filter(transfer => 
        transfer.valueUsd && transfer.valueUsd >= minValueUsd
      );
    } catch (error) {
      console.error('Error getting whale transfers:', error);
      return [];
    }
  }

  /**
   * Get activity for a specific whale address
   */
  async getWhaleActivity(
    chainId: string,
    address: string,
    ageFrom: string = '24h',
    ageTo: string = 'now'
  ): Promise<{ transfers: TokenTransfer[]; totalVolume: number }> {
    this.ensureConnected();

    try {
      const { items } = await this.getTokenTransfers(
        chainId,
        address,
        ageFrom,
        ageTo
      );

      const totalVolume = items.reduce(
        (sum, transfer) => sum + (transfer.valueUsd || 0),
        0
      );

      return {
        transfers: items,
        totalVolume
      };
    } catch (error) {
      console.error('Error getting whale activity:', error);
      return { transfers: [], totalVolume: 0 };
    }
  }

  /**
   * Get transactions for an address (native currency transfers and contract interactions)
   */
  async getTransactionsByAddress(
    chainId: string,
    address: string,
    ageFrom: string,
    ageTo: string
  ): Promise<Array<Record<string, unknown>>> {
    this.ensureConnected();

    try {
      const args: Record<string, string> = {
        chain_id: chainId,
        address: address,
        age_from: this.convertToISOTimestamp(ageFrom),
        age_to: this.convertToISOTimestamp(ageTo),
      };

      const result = await this.client!.callTool({
        name: 'get_transactions_by_address',
        arguments: args,
      });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const responseText = (result.content as any)[0].text;
      
      if (responseText.startsWith('Error')) {
        console.error(`Blockscout API error: ${responseText}`);
        return [];
      }
      
      const data = JSON.parse(responseText);
      return data.data || data.items || [];
    } catch (error) {
      console.error('Error getting transactions by address:', error);
      return [];
    }
  }
}
