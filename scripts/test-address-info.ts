import { BlockscoutClient } from '../src/lib/blockscout/client';

async function testAddressInfo() {
  const client = new BlockscoutClient();
  
  try {
    console.log('🔌 Connecting to MCP server...');
    await client.connect();
    console.log('✅ Connected!\n');
    
    // Test 1: USDT Token Contract
    console.log('📊 Test 1: USDT Token Contract');
    console.log('=' .repeat(50));
    const usdt = await client.getAddressInfo(
      '1',
      '0xdAC17F958D2ee523a2206206994597C13D831ec7'
    );
    
    console.log('\n✅ Received data:');
    console.log('   - Address:', usdt.address);
    console.log('   - Is Contract:', usdt.isContract);
    console.log('   - Is Verified:', usdt.is_verified);
    console.log('   - Is Scam:', usdt.is_scam);
    console.log('   - Reputation:', usdt.reputation);
    if (usdt.token) {
      console.log('   - Token Symbol:', usdt.token.symbol);
      console.log('   - Token Name:', usdt.token.name);
      console.log('   - Decimals:', usdt.token.decimals);
      console.log('   - Holders:', usdt.token.holders?.toLocaleString());
      console.log('   - Price (USD):', `$${usdt.token.exchange_rate}`);
      console.log('   - Market Cap:', `$${parseFloat(usdt.token.circulating_market_cap || '0').toLocaleString()}`);
    }
    
    // Test 2: Regular Wallet (Binance)
    console.log('\n\n📊 Test 2: Binance Hot Wallet');
    console.log('=' .repeat(50));
    const binance = await client.getAddressInfo(
      '1',
      '0x28C6c06298d514Db089934071355E5743bf21d60'
    );
    
    console.log('\n✅ Received data:');
    console.log('   - Address:', binance.address);
    console.log('   - Balance (Wei):', binance.balance);
    console.log('   - Balance (USD):', binance.balanceUsd ? `$${binance.balanceUsd.toLocaleString()}` : 'N/A');
    console.log('   - Is Contract:', binance.isContract);
    console.log('   - ENS Name:', binance.ensName || 'None');
    
    // Test 3: Another Token (LINK)
    console.log('\n\n📊 Test 3: Chainlink Token Contract');
    console.log('=' .repeat(50));
    const link = await client.getAddressInfo(
      '1',
      '0x514910771AF9Ca656af840dff83E8264EcF986CA'
    );
    
    console.log('\n✅ Received data:');
    console.log('   - Token Symbol:', link.token?.symbol);
    console.log('   - Token Name:', link.token?.name);
    console.log('   - Is Verified:', link.is_verified);
    console.log('   - Holders:', link.token?.holders?.toLocaleString());
    console.log('   - Price (USD):', `$${link.token?.exchange_rate}`);
    
    await client.disconnect();
    console.log('\n\n✅ All tests complete!');
    
  } catch (error) {
    console.error('❌ Error:', error);
    await client.disconnect();
    process.exit(1);
  }
}

testAddressInfo();