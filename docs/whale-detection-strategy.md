# Whale Detection Strategy (Without Balance Data)

Since Blockscout MCP doesn't provide balance data, we detect whales through transaction and transfer activity analysis.

## Detection Methods

### 1. High-Value Token Transfers
**What to track:**
- Token transfers with `valueUsd > $100,000`
- Aggregate transfer volume over 24h, 7d, 30d
- Direction: incoming vs outgoing

**Implementation:**
```typescript
// Get token transfers for last 24h
const transfers = await blockscout.getTokenTransfers(chainId, address, '24h', 'now');

// Calculate total volume
const totalVolume = transfers.reduce((sum, t) => sum + (t.valueUsd || 0), 0);

// Whale threshold: $1M+ in 24h
const isWhale = totalVolume > 1_000_000;
```

### 2. Transaction Activity Patterns
**Whale indicators:**
- High transaction frequency (100+ txs per day)
- Interactions with major DeFi protocols
- Multiple token types in transfers
- Large gas spending

**Implementation:**
```typescript
// Get recent transactions
const txs = await blockscout.getTransactionsByAddress(chainId, address, '7d', 'now');

// Analyze patterns
const uniqueTokens = new Set(transfers.map(t => t.token.address)).size;
const avgTransferValue = totalVolume / transfers.length;
const isActiveWhale = txs.length > 100 && uniqueTokens > 10;
```

### 3. Known Whale Address Lists
**Maintain lists of:**
- Exchange hot/cold wallets
- DeFi protocol treasuries
- Known large holders
- MEV bots and arbitrage bots

### 4. Transfer Network Analysis
**Whale connections:**
- Transfers to/from other known whales
- Interactions with major liquidity pools
- Bridge usage (cross-chain activity)

## Whale Scoring System

```typescript
interface WhaleScore {
  totalVolume24h: number;      // Weight: 40%
  totalVolume7d: number;       // Weight: 30%
  transactionCount: number;    // Weight: 10%
  uniqueTokens: number;        // Weight: 10%
  knownWhaleInteractions: number; // Weight: 10%
}

function calculateWhaleScore(data: WhaleScore): number {
  const volumeScore = Math.min(data.totalVolume24h / 10_000_000, 1) * 40;
  const weekScore = Math.min(data.totalVolume7d / 50_000_000, 1) * 30;
  const txScore = Math.min(data.transactionCount / 1000, 1) * 10;
  const tokenScore = Math.min(data.uniqueTokens / 50, 1) * 10;
  const connectionScore = Math.min(data.knownWhaleInteractions / 20, 1) * 10;
  
  return volumeScore + weekScore + txScore + tokenScore + connectionScore;
}
```

## Whale Categories

### Mega Whale (Score: 80-100)
- $10M+ daily volume
- 1000+ transactions/week
- 50+ unique tokens
- Multiple chain activity

### Large Whale (Score: 60-79)
- $1M-$10M daily volume
- 500+ transactions/week
- 20+ unique tokens

### Medium Whale (Score: 40-59)
- $100K-$1M daily volume
- 100+ transactions/week
- 10+ unique tokens

### Small Whale (Score: 20-39)
- $10K-$100K daily volume
- 50+ transactions/week

## Implementation Priority

1. ✅ **Token Transfer Monitoring** (Already working!)
   - Use `get_token_transfers` with time ranges
   - Calculate USD volumes
   - Track transfer patterns

2. **Transaction Analysis**
   - Use `get_transactions_by_address`
   - Analyze gas spending
   - Identify protocol interactions

3. **Whale Feed Enhancement**
   - Real-time transfer monitoring
   - Volume-based filtering
   - Whale scoring display

4. **Known Whale Database**
   - Maintain list of known addresses
   - Tag whale categories
   - Track whale movements

## Example Query

```typescript
async function analyzeWhaleActivity(address: string) {
  const chains = ['1', '8453', '42161', '10', '137'];
  let totalVolume = 0;
  let allTransfers = [];
  
  for (const chainId of chains) {
    const { items } = await blockscout.getTokenTransfers(
      chainId,
      address,
      '24h',
      'now'
    );
    
    allTransfers.push(...items);
    totalVolume += items.reduce((sum, t) => sum + (t.valueUsd || 0), 0);
  }
  
  return {
    isWhale: totalVolume > 100_000,
    volume24h: totalVolume,
    transferCount: allTransfers.length,
    uniqueTokens: new Set(allTransfers.map(t => t.token.address)).size,
  };
}
```

## Benefits of This Approach

✅ **Works with available data** (transfers, not balances)
✅ **Real-time detection** (based on activity)
✅ **Multi-chain support** (aggregate across chains)
✅ **Catches active whales** (not dormant holders)
✅ **No external APIs needed** (uses Blockscout MCP)

## Next Steps

1. Implement whale scoring in `/api/analyze-wallet`
2. Add whale badge/indicator in UI
3. Create whale feed with volume filtering
4. Build whale tracking dashboard
