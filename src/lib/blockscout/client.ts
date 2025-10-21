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
   * Convert token value from wei to decimal format
   * Uses string manipulation to avoid JavaScript floating-point precision issues
   */
  private convertTokenValue(value: string, decimals: number): number {
    if (!value || value === '0') return 0;
    
    // Remove leading zeros
    const cleanValue = value.replace(/^0+/, '') || '0';
    
    // If decimals is 0, just parse as integer
    if (decimals === 0) {
      return parseInt(cleanValue);
    }
    
    // Pad with zeros if needed
    const paddedValue = cleanValue.padStart(decimals + 1, '0');
    
    // Split at decimal point
    const integerPart = paddedValue.slice(0, -decimals) || '0';
    const decimalPart = paddedValue.slice(-decimals);
    
    // Combine and parse
    const result = parseFloat(`${integerPart}.${decimalPart}`);
    
    return result;
  }

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
   * Get comprehensive address information from Blockscout
   * 
   * Returns detailed data including:
   * - Balance (native coin) and USD value
   * - ENS name association (if any)
   * - Contract status (is_contract, is_verified, is_scam)
   * - Contract creation details (creator, transaction hash)
   * - Proxy implementation addresses (if proxy contract)
   * - Token metadata (if address is a token contract):
   *   - Symbol, name, decimals, total supply
   *   - Holder count, exchange rate, market cap
   *   - Trading volume, icon URL
   * - Security reputation score
   * 
   * @param chainId - Blockchain chain ID (e.g., '1' for Ethereum)
   * @param address - Wallet or contract address to query
   * @returns Promise resolving to AddressInfo with comprehensive data
   * 
   * @example
   * // Get USDT token contract info
   * const info = await client.getAddressInfo('1', '0xdAC17F958D2ee523a2206206994597C13D831ec7');
   * console.log(info.token.symbol); // 'USDT'
   * console.log(info.is_verified); // true
   */
  async getAddressInfo(chainId: string, address: string): Promise<AddressInfo> {
    this.ensureConnected();

    try {
      const requestArgs = {
        chain_id: chainId,
        address: address,
      };
      
      // console.log('[MCP Client] Calling get_address_info with args:', requestArgs);
      
      const result = await this.client!.callTool({
        name: 'get_address_info',
        arguments: requestArgs,
      });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const responseText = (result.content as any)[0].text;
      
      // Check if response is an error message
      if (responseText.startsWith('Error')) {
        throw new Error(`Blockscout API error: ${responseText}`);
      }
      
      const data = JSON.parse(responseText);
      
      // Debug: Log the raw response to see what we actually received
      // console.log('[MCP Client] Raw response data:', JSON.stringify(data, null, 2));
      
      // MCP server wraps response in data.basic_info
      const basicInfo = data.data?.basic_info || data;
      
      // Calculate USD value: convert Wei to ETH, then multiply by exchange rate
      let balanceUsd: number | undefined;
      if (basicInfo.coin_balance && basicInfo.exchange_rate) {
        const balanceInEth = parseFloat(basicInfo.coin_balance) / 1e18; // Wei to ETH
        balanceUsd = balanceInEth * parseFloat(basicInfo.exchange_rate);
      }
      
      return {
        address: basicInfo.hash || address,
        balance: basicInfo.coin_balance || '0',
        balanceUsd,
        isContract: basicInfo.is_contract || false,
        ensName: basicInfo.ens_domain_name,
        // Contract-specific fields
        is_verified: basicInfo.is_verified,
        is_scam: basicInfo.is_scam,
        reputation: basicInfo.reputation,
        creator_address_hash: basicInfo.creator_address_hash,
        creation_transaction_hash: basicInfo.creation_transaction_hash,
        creation_status: basicInfo.creation_status,
        implementations: basicInfo.implementations,
        token: basicInfo.token ? {
          type: basicInfo.token.type,
          name: basicInfo.token.name,
          symbol: basicInfo.token.symbol,
          decimals: basicInfo.token.decimals,
          total_supply: basicInfo.token.total_supply,
          holders: basicInfo.token.holders_count || basicInfo.token.holders,
          exchange_rate: basicInfo.token.exchange_rate,
          circulating_market_cap: basicInfo.token.circulating_market_cap,
          volume_24h: basicInfo.token.volume_24h,
          icon_url: basicInfo.token.icon_url,
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
        
        // Debug: Check what fields are in total object
        if (rawItems.length > 0 && item === rawItems[0]) {
          console.log('[MCP Client] ===== CHECKING USD FIELD =====');
          console.log('[MCP Client] item.total object:', JSON.stringify(item.total, null, 2));
          console.log('[MCP Client] item.total.usd exists?', 'usd' in (item.total || {}));
          console.log('[MCP Client] item.total.usd value:', item.total?.usd);
          console.log('[MCP Client] item.token.exchange_rate:', item.token?.exchange_rate);
          console.log('[MCP Client] ======================================');
        }
        
        if (item.total?.usd) {
          // Direct USD value provided by MCP
          console.log(`[MCP Client] ✅ Found total.usd: ${item.total.usd}`);
          valueUsd = parseFloat(item.total.usd);
        } else if (item.total?.value && item.token?.exchange_rate) {
          // Calculate from token value * historical exchange rate
          // Use item.total.decimals (preferred) or fallback to item.token.decimals
          const decimals = item.total?.decimals || item.token?.decimals || '18';
          try {
            const exchangeRate = parseFloat(item.token.exchange_rate);
            const decimalPlaces = parseInt(decimals);
            // Use string-based conversion to avoid floating-point precision loss
            const tokenAmount = this.convertTokenValue(item.total.value, decimalPlaces);
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
            exchangeRate: item.token?.exchange_rate, // USD per token
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
        nextCursor: data.pagination?.next_call?.params?.cursor,
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
