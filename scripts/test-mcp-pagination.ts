import { BlockscoutClient } from '../src/lib/blockscout/client';

async function testPagination() {
  const client = new BlockscoutClient();
  
  try {
    console.log('🔌 Connecting to MCP server...');
    await client.connect();
    console.log('✅ Connected!');
    
    // Test with Binance wallet (known to have many transfers)
    console.log('\n📊 Fetching transfers for Binance wallet (7d range)...');
    const result = await client.getTokenTransfers(
      '1',
      '0x28C6c06298d514Db089934071355E5743bf21d60',
      '7d',
      'now'
    );
    
    console.log(`\n✅ Results:`);
    console.log(`   - Transfers: ${result.items.length}`);
    console.log(`   - Has next page: ${!!result.nextCursor}`);
    console.log(`   - Next cursor: ${result.nextCursor?.substring(0, 20)}...`);
    
    if (result.items.length > 0) {
      console.log(`   - First transfer: ${result.items[0].token.symbol} - $${result.items[0].valueUsd?.toLocaleString()}`);
    }
    
    // Test pagination if cursor exists
    if (result.nextCursor) {
      console.log('\n📄 Fetching page 2...');
      const page2 = await client.getTokenTransfers(
        '1',
        '0x28C6c06298d514Db089934071355E5743bf21d60',
        '7d',
        'now',
        undefined,
        result.nextCursor
      );
      
      console.log(`   - Page 2 transfers: ${page2.items.length}`);
      console.log(`   - Different from page 1: ${page2.items[0]?.hash !== result.items[0]?.hash ? '✅' : '❌'}`);
    }
    
    await client.disconnect();
    console.log('\n✅ Test complete!');
    
  } catch (error) {
    console.error('❌ Error:', error);
    await client.disconnect();
    process.exit(1);
  }
}

testPagination();