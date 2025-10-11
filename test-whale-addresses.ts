import { BlockscoutClient } from './src/lib/blockscout/client';

async function testWhaleAddresses() {
  const client = new BlockscoutClient();
  
  try {
    await client.connect();
    console.log('✅ Connected to Blockscout\n');

    const testAddresses = [
      '0x28C6c06298d514Db089934071355E5743bf21d60', // Binance Hot Wallet
      '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045', // Vitalik
    ];

    for (const address of testAddresses) {
      console.log(`\n📍 Testing: ${address}`);
      console.log('='.repeat(60));
      
      // Test 1: Get address info
      try {
        const info = await client.getAddressInfo('1', address);
        console.log('✅ Address Info:', JSON.stringify(info, null, 2));
      } catch (error) {
        console.log('❌ Address Info Error:', error);
      }

      // Test 2: Get token transfers (24h)
      try {
        const { items } = await client.getTokenTransfers('1', address, '24h', 'now');
        console.log(`✅ Token Transfers (24h): ${items.length} transfers`);
        if (items.length > 0) {
          console.log('Sample:', JSON.stringify(items[0], null, 2));
        }
      } catch (error) {
        console.log('❌ Token Transfers Error:', error);
      }

      // Test 3: Get tokens held
      try {
        const tokens = await client.getTokensByAddress('1', address);
        console.log(`✅ Tokens Held: ${tokens.length} tokens`);
        if (tokens.length > 0) {
          console.log('Sample:', JSON.stringify(tokens[0], null, 2));
        }
      } catch (error) {
        console.log('❌ Tokens Error:', error);
      }
    }

  } catch (error) {
    console.error('Fatal error:', error);
  } finally {
    await client.disconnect();
    console.log('\n🔌 Disconnected');
  }
}

testWhaleAddresses();
