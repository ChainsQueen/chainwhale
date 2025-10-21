import { BlockscoutClient } from '../src/lib/blockscout/client';

/**
 * Test get_token_transfers_by_address endpoint (same as whale tracker)
 * 
 * This script tests the exact endpoint used by the whale tracker.
 * Shows ALL raw arguments and response data without filtering.
 * 
 * Usage:
 *   pnpm tsx scripts/test-token-transfers.ts
 */

async function testTokenTransfersEndpoint() {
  const client = new BlockscoutClient();
  
  // Test parameters
  const chainId = '1'; // Ethereum Mainnet
  const address = '0x28C6c06298d514Db089934071355E5743bf21d60'; // Binance Hot Wallet
  const timeRange = '1h'; // Last 1 hour
  
  try {
    console.log('🔌 Connecting to Blockscout MCP server...');
    await client.connect();
    console.log('✅ Connected!\n');
    
    console.log('='.repeat(80));
    console.log('📊 TESTING get_token_transfers_by_address ENDPOINT');
    console.log('='.repeat(80));
    console.log(`Chain ID: ${chainId} (Ethereum)`);
    console.log(`Address: ${address} (Binance)`);
    console.log(`Time Range: ${timeRange}`);
    console.log('='.repeat(80));
    console.log('');
    
    // ========================================
    // TEST get_token_transfers_by_address
    // ========================================
    console.log('\n🔍 Testing get_token_transfers_by_address endpoint...');
    console.log('-'.repeat(80));
    console.log('⚡ This is the SAME endpoint used by the whale tracker!');
    console.log('');
    
    // Calculate time range
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const ageFrom = oneHourAgo.toISOString();
    const ageTo = now.toISOString();
    
    console.log(`Time Range:`);
    console.log(`   From: ${ageFrom}`);
    console.log(`   To: ${ageTo}`);
    console.log(`   Address: ${address}`);
    console.log('');
    
    // Prepare arguments for MCP call
    const mcpArguments = {
      chain_id: chainId,
      address: address,
      age_from: ageFrom,
      age_to: ageTo,
    };
    
    console.log('\n' + '='.repeat(80));
    console.log('📤 RAW MCP ARGUMENTS');
    console.log('='.repeat(80));
    console.log('Endpoint: get_token_transfers_by_address');
    console.log('\nArguments sent to MCP:');
    console.log(JSON.stringify(mcpArguments, null, 2));
    console.log('='.repeat(80));
    
    const transfersResult = await (client as unknown as { client?: { callTool: (args: { name: string; arguments: Record<string, unknown> }) => Promise<unknown> } }).client!.callTool({
      name: 'get_token_transfers_by_address',
      arguments: mcpArguments,
    });
    
    console.log('\n' + '='.repeat(80));
    console.log('📥 RAW MCP RESPONSE (COMPLETE)');
    console.log('='.repeat(80));
    console.log('Full MCP result object:');
    console.log(JSON.stringify(transfersResult, null, 2));
    console.log('='.repeat(80));
    
    // Type the MCP result for safe property access
    const typedResult = transfersResult as { content: Array<{ text: string }> };
    const transfersText = typedResult.content[0].text;
    
    if (transfersText.startsWith('Error')) {
      console.error('\n❌ Error fetching token transfers:', transfersText);
      throw new Error(transfersText);
    }
    
    const transfersData = JSON.parse(transfersText);
    
    console.log('\n' + '='.repeat(80));
    console.log('📦 RAW PARSED JSON DATA (ALL FIELDS)');
    console.log('='.repeat(80));
    console.log('Parsed response data (unfiltered):');
    console.log(JSON.stringify(transfersData, null, 2));
    console.log('='.repeat(80));
    
    // Summary
    const rawItems = transfersData.data || transfersData.items || [];
    console.log('\n' + '='.repeat(80));
    console.log('📊 SUMMARY');
    console.log('='.repeat(80));
    console.log(`Total transfers found: ${rawItems.length}`);
    console.log(`Pagination available: ${transfersData.pagination?.next_call ? 'Yes' : 'No'}`);
    if (transfersData.pagination?.next_call) {
      console.log(`Next cursor: ${transfersData.pagination.next_call.params?.cursor}`);
    }
    
    console.log('\n' + '='.repeat(80));
    console.log('✅ TEST COMPLETE');
    console.log('='.repeat(80));
    console.log('\n💡 This endpoint is used by:');
    console.log('   - WhaleService.getWhaleFeed() in /src/core/services/whale-service.ts');
    console.log('   - Whale tracker API at /api/whale-tracker/feed');
    console.log('   - Monitors 9 known whale addresses for large transfers');
    
    await client.disconnect();
    console.log('\n✅ Disconnected from MCP server');
    
  } catch (error) {
    console.error('\n❌ Error:', error);
    await client.disconnect();
    process.exit(1);
  }
}

testTokenTransfersEndpoint();
