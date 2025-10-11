/**
 * Test script for Blockscout MCP Client
 * Run with: node test-blockscout.js
 */

import { BlockscoutClient } from './src/lib/blockscout/client.ts';

async function testBlockscout() {
  console.log('🧪 Testing Blockscout MCP Client...\n');

  const client = new BlockscoutClient();

  try {
    // Test 1: Connect to MCP server
    console.log('1️⃣ Connecting to Blockscout MCP server...');
    await client.connect();
    console.log('✅ Connected successfully!\n');

    // Test 2: Get chains list
    console.log('2️⃣ Fetching supported chains...');
    const chains = await client.getChainsList();
    console.log(`✅ Found ${chains.length} chains`);
    console.log('Sample chains:', chains.slice(0, 5).map(c => c.name).join(', '));
    console.log('');

    // Test 3: Get address info (Vitalik's address)
    console.log('3️⃣ Getting address info for vitalik.eth...');
    const addressInfo = await client.getAddressInfo('1', 'vitalik.eth');
    console.log('✅ Address info retrieved:');
    console.log(`   Address: ${addressInfo.address}`);
    console.log(`   Balance: ${addressInfo.balance} ETH`);
    console.log(`   ENS: ${addressInfo.ensName || 'N/A'}`);
    console.log('');

    // Test 4: Get recent token transfers on Base
    console.log('4️⃣ Fetching recent token transfers on Base...');
    const { items: transfers } = await client.getTokenTransfers(
      '8453', // Base
      null,   // all addresses
      '1h',   // last hour
      'now'
    );
    console.log(`✅ Found ${transfers.length} transfers`);
    if (transfers.length > 0) {
      const sample = transfers[0];
      console.log('Sample transfer:');
      console.log(`   Token: ${sample.token.symbol}`);
      console.log(`   Value: ${sample.value}`);
      console.log(`   USD: $${sample.valueUsd?.toLocaleString() || 'N/A'}`);
    }
    console.log('');

    // Test 5: Get transaction summary
    if (transfers.length > 0) {
      console.log('5️⃣ Getting transaction summary...');
      const summary = await client.transactionSummary('8453', transfers[0].hash);
      console.log('✅ Transaction summary:');
      console.log(`   ${summary.substring(0, 150)}...`);
      console.log('');
    }

    console.log('🎉 All tests passed! Blockscout MCP Client is working correctly.\n');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('\nTroubleshooting:');
    console.error('1. Make sure you have npx installed: npm install -g npx');
    console.error('2. Check your internet connection');
    console.error('3. Verify @blockscout/mcp-server is accessible');
  } finally {
    // Cleanup
    await client.disconnect();
    console.log('🔌 Disconnected from MCP server');
  }
}

// Run the test
testBlockscout();
