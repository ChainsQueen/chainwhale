// Test Blockscout API connection
async function testBlockscout() {
  try {
    console.log('🔍 Testing Blockscout API connection...\n');
    
    // Test address (Vitalik's address)
    const testAddress = '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045';
    
    console.log('Test 1: Analyzing wallet via API endpoint');
    console.log('Address:', testAddress);
    console.log('Chain: Ethereum Mainnet (1)\n');
    
    const response = await fetch('http://localhost:3000/api/analyze-wallet', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        address: testAddress,
        chains: ['1']
      })
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    console.log('✅ SUCCESS! Blockscout API is working!\n');
    console.log('📊 Results:');
    console.log('- Address:', data.analysis?.address || 'N/A');
    console.log('- ENS Name:', data.ensName || 'None');
    console.log('- Total Value:', data.analysis?.totalValue || 0);
    console.log('- Holdings:', data.holdings?.length || 0, 'tokens');
    console.log('- Recent Transactions:', data.recentTransactions?.length || 0);
    console.log('- Risk Score:', data.analysis?.riskScore || 'N/A');
    console.log('\n✨ Blockscout MCP is connected and working properly!');
    
  } catch (error) {
    console.error('\n❌ Test Failed:', error.message);
    
    if (error.message.includes('ECONNREFUSED')) {
      console.log('\n💡 Solution: Start the dev server first:');
      console.log('   pnpm dev');
    } else if (error.message.includes('fetch')) {
      console.log('\n💡 Make sure Node.js version supports fetch (v18+)');
    } else {
      console.log('\n💡 Check if Docker is running (required for Blockscout MCP)');
    }
  }
}

testBlockscout();
