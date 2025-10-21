import { WhaleService } from '../src/core/services/whale-service';
import { createBlockscoutClient } from '../src/lib/blockscout/factory';

async function testWhaleService() {
  const client = createBlockscoutClient();
  const service = new WhaleService(100000, client);
  
  try {
    console.log('🐋 Testing WhaleService pagination...');
    
    const transfers = await service.getWhaleFeed('1', 'Ethereum', '7d');
    
    console.log(`\n✅ Results:`);
    console.log(`   - Total transfers: ${transfers.length}`);
    console.log(`   - Should be > 50 if pagination works: ${transfers.length > 50 ? '✅' : '❌'}`);
    
    // Check data sources
    const mcpCount = transfers.filter(t => t.dataSource === 'mcp').length;
    const httpCount = transfers.filter(t => t.dataSource === 'http').length;
    console.log(`   - MCP transfers: ${mcpCount}`);
    console.log(`   - HTTP transfers: ${httpCount}`);
    
    // Show top 3 transfers
    console.log(`\n🔝 Top 3 transfers:`);
    transfers.slice(0, 3).forEach((t, i) => {
      console.log(`   ${i + 1}. ${t.token.symbol}: $${t.valueUsd?.toLocaleString()} [${t.dataSource}]`);
    });
    
    console.log('\n✅ Test complete!');
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

testWhaleService();