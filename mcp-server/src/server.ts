import express from 'express';
import cors from 'cors';
import { BlockscoutClient } from '@/lib/blockscout/client';

const app = express();
const port = process.env.PORT || 8080;

app.use(cors());
app.use(express.json());

let client: BlockscoutClient | null = null;
let clientPromise: Promise<BlockscoutClient> | null = null;

/**
 * @function getClient
 * @description Initializes and returns a singleton instance of BlockscoutClient.
 * Ensures only one connection to the MCP server is established.
 * @returns {Promise<BlockscoutClient>}
 */
async function getClient(): Promise<BlockscoutClient> {
  if (client && client.connected) {
    return client;
  }

  if (!clientPromise) {
    clientPromise = new Promise(async (resolve, reject) => {
      try {
        const newClient = new BlockscoutClient();
        await newClient.connect();
        client = newClient;
        resolve(newClient);
      } catch (error) {
        clientPromise = null; // Reset promise on failure to allow retries
        reject(error);
      }
    });
  }

  return clientPromise;
}

app.get('/health', (req, res) => {
  res.json({ status: 'healthy' });
});

app.post('/mcp/call', async (req, res) => {
  try {
    const { tool, args } = req.body;
    const mcpClient = await getClient();

    let result;
    switch (tool) {
      case 'get_address_info':
        result = await mcpClient.getAddressInfo(args.chain_id, args.address);
        break;
      case 'get_token_transfers_by_address':
        result = await mcpClient.getTokenTransfers(
          args.chain_id,
          args.address,
          args.age_from,
          args.age_to,
          args.token,
          args.cursor
        );
        break;
      case 'get_chains_list':
        result = await mcpClient.getChainsList();
        break;
      case 'get_tokens_by_address':
        result = await mcpClient.getTokensByAddress(args.chain_id, args.address);
        break;
      case 'get_whale_activity':
        result = await mcpClient.getWhaleActivity(
          args.chain_id,
          args.address,
          args.age_from,
          args.age_to
        );
        break;
      case 'get_transactions_by_address':
        result = await mcpClient.getTransactionsByAddress(
          args.chain_id,
          args.address,
          args.age_from,
          args.age_to
        );
        break;
      case 'transaction_summary':
        result = await mcpClient.transactionSummary(args.chain_id, args.transaction_hash);
        break;
      default:
        return res.status(400).json({ success: false, error: { code: 'UNKNOWN_TOOL', message: `Unknown tool: ${tool}` } });
    }

    res.json({ success: true, data: result });
  } catch (error) {
    console.error('Error in MCP call:', error);
    res.status(500).json({ success: false, error: { code: 'MCP_ERROR', message: (error as Error).message } });
  }
});

app.listen(port, () => {
  console.log(`MCP server listening at http://localhost:${port}`);
});
