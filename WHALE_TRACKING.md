# 🐋 Whale Tracking Feature

## Overview

The Whale Tracking feature monitors large blockchain transfers (>$100k USD) across multiple chains in real-time without requiring a database.

## Architecture

### Phase 1: MVP (Current Implementation)

**No Database Required** - All data is fetched in real-time from Blockscout MCP.

```
User Request → API Route → WhaleService → BlockscoutClient → Blockscout MCP → Response
```

### Components

#### 1. **BlockscoutClient** (`src/lib/blockscout/client.ts`)
- `getWhaleTransfers()` - Fetch large transfers for a chain
- `getWhaleActivity()` - Get activity for specific address
- `getTokenTransfers()` - Base transfer fetching

#### 2. **WhaleService** (`src/core/services/whale-service.ts`)
- `getWhaleFeed()` - Single chain whale feed
- `getMultiChainWhaleFeed()` - Multi-chain aggregation
- `getWhaleStats()` - Calculate statistics
- `getTopWhales()` - Identify most active whales
- `filterByToken()` - Filter by token symbol
- `filterByMinValue()` - Filter by USD value

#### 3. **API Route** (`src/app/api/whale-feed/route.ts`)
- Handles HTTP requests
- Manages query parameters
- Returns JSON response

#### 4. **UI Components**
- `WhaleFeedCard` - Individual transfer display
- `WhaleStatsComponent` - Statistics dashboard
- `WhalesPage` - Main whale feed page

## API Usage

### Endpoint: `/api/whale-feed`

**Query Parameters:**
- `chains` - Comma-separated chain IDs (default: `1,8453,42161`)
- `timeRange` - Time range (default: `1h`)
  - Options: `1h`, `6h`, `24h`, `7d`
- `minValue` - Minimum USD value (default: `100000`)
- `token` - Filter by token symbol (optional)

**Example Requests:**

```bash
# Default (Ethereum, Base, Arbitrum - last hour)
GET /api/whale-feed

# Custom chains and time range
GET /api/whale-feed?chains=1,137&timeRange=24h

# Filter by minimum value
GET /api/whale-feed?minValue=500000

# Filter by token
GET /api/whale-feed?token=USDC
```

**Response Format:**

```json
{
  "transfers": [
    {
      "hash": "0x...",
      "chainId": "1",
      "chainName": "Ethereum",
      "from": "0x...",
      "to": "0x...",
      "value": "1000000000000",
      "valueUsd": 150000,
      "timestamp": 1697123456789,
      "token": {
        "symbol": "USDC",
        "address": "0x...",
        "name": "USD Coin"
      }
    }
  ],
  "stats": {
    "totalTransfers": 25,
    "totalVolume": 5000000,
    "largestTransfer": 1000000,
    "uniqueWhales": 15
  },
  "topWhales": [
    {
      "address": "0x...",
      "volume": 2000000,
      "transferCount": 5
    }
  ],
  "metadata": {
    "timeRange": "1h",
    "minValue": 100000,
    "chains": ["Ethereum", "Base", "Arbitrum"],
    "tokenFilter": null,
    "timestamp": "2025-10-13T10:30:00.000Z"
  }
}
```

## Features

### ✅ Implemented (Phase 1 - MVP)

- [x] Real-time whale feed
- [x] Multi-chain support (5 chains)
- [x] USD value filtering
- [x] Time range filtering
- [x] Token filtering
- [x] Statistics dashboard
- [x] Top whales identification
- [x] Responsive UI
- [x] Auto-refresh (5 min)

### 🔄 Future Enhancements (Phase 2)

- [ ] localStorage for user preferences
- [ ] Watchlist (client-side)
- [ ] Favorite chains
- [ ] Custom alerts (browser notifications)
- [ ] Export to CSV

### 🚀 Future Enhancements (Phase 3 - Database)

- [ ] Historical data storage
- [ ] Whale profiles
- [ ] Activity charts
- [ ] Email/SMS alerts
- [ ] Whale leaderboards
- [ ] Pattern detection
- [ ] AI-powered insights

## Supported Chains

Currently monitoring:
- **Ethereum** (Chain ID: 1)
- **Base** (Chain ID: 8453)
- **Arbitrum** (Chain ID: 42161)
- **Optimism** (Chain ID: 10)
- **Polygon** (Chain ID: 137)

Easy to add more chains - just update the `availableChains` array in `WhalesPage`.

## How It Works

### 1. Discovery (No Specific Addresses Needed)

```typescript
// Fetch ALL transfers in time range
const transfers = await client.getTokenTransfers(
  chainId,
  null,  // null = all addresses
  '1h',
  'now'
);

// Filter for whales
const whales = transfers.filter(t => t.valueUsd >= 100000);
```

### 2. Multi-Chain Aggregation

```typescript
// Process chains in parallel
const results = await Promise.allSettled(
  chains.map(chain => getWhaleFeed(chain.id, chain.name, '1h'))
);

// Combine and sort by value
const allWhales = results
  .filter(r => r.status === 'fulfilled')
  .flatMap(r => r.value)
  .sort((a, b) => b.valueUsd - a.valueUsd);
```

### 3. Real-Time Updates

- Auto-refresh every 5 minutes
- Manual refresh button
- Loading states
- Error handling

## Performance

### Without Database:
- ✅ **Fast initial load** - No database queries
- ✅ **Always fresh data** - Direct from blockchain
- ✅ **Stateless** - Works on serverless
- ❌ **No history** - Only current time range
- ❌ **Repeated API calls** - Same data fetched multiple times

### Optimization Tips:
1. Use shorter time ranges (1h vs 24h)
2. Limit number of chains
3. Increase minimum value threshold
4. Cache responses (future enhancement)

## Testing

### Manual Testing:

1. **Start the dev server:**
   ```bash
   pnpm dev
   ```

2. **Navigate to whale feed:**
   ```
   http://localhost:3000/whales
   ```

3. **Test filters:**
   - Toggle different chains
   - Change time ranges
   - Adjust minimum values
   - Try token filters

4. **Test API directly:**
   ```bash
   curl http://localhost:3000/api/whale-feed
   ```

### Expected Behavior:

- **Loading state** - Shows spinner while fetching
- **Empty state** - Shows message if no whales found
- **Error state** - Shows error message if API fails
- **Success** - Displays whale transfers with stats

## Troubleshooting

### No whales found?

1. **Lower the threshold:**
   - Try $10K instead of $100K
   - Some chains have less activity

2. **Increase time range:**
   - Try 24h instead of 1h
   - More time = more transfers

3. **Check different chains:**
   - Ethereum has most activity
   - Try Base or Arbitrum

4. **Check Docker:**
   ```bash
   docker ps  # Should show mcp-proxy container
   ```

### API errors?

1. **Check Docker is running:**
   ```bash
   docker --version
   docker ps
   ```

2. **Check logs:**
   - Open browser console
   - Check terminal output

3. **Verify Blockscout MCP:**
   ```bash
   # Test connection
   docker run --rm -i sparfenyuk/mcp-proxy:latest \
     --transport streamablehttp \
     https://mcp.blockscout.com/mcp
   ```

## Code Examples

### Custom Whale Detection:

```typescript
import { WhaleService } from '@/core/services/whale-service';

// Create service with custom threshold
const service = new WhaleService(500000); // $500K minimum

// Get whales for specific chain
const whales = await service.getWhaleFeed(
  '1',        // Ethereum
  'Ethereum',
  '24h'       // Last 24 hours
);

// Filter by token
const usdcWhales = service.filterByToken(whales, 'USDC');

// Get statistics
const stats = service.getWhaleStats(usdcWhales);
console.log(`Found ${stats.totalTransfers} USDC whale transfers`);
console.log(`Total volume: $${stats.totalVolume.toLocaleString()}`);
```

### Track Specific Whale:

```typescript
// Get activity for specific address
const profile = await service.getWhaleProfile(
  '1',
  'Ethereum',
  '0x47ac0Fb4F2D84898e4D9E7b4DaB3C24507a6D503', // Binance
  7 // Last 7 days
);

console.log(`Whale made ${profile.transferCount} transfers`);
console.log(`Total volume: $${profile.totalVolume.toLocaleString()}`);
```

## Next Steps

1. **Test the implementation** ✓
2. **Add more chains** (easy)
3. **Implement localStorage** (Phase 2)
4. **Add database** (Phase 3 - when needed)

## Resources

- [Blockscout MCP Documentation](https://github.com/blockscout/mcp-server)
- [ChainWhale Project Structure](./README.md)
- [Blockscout API](https://docs.blockscout.com)
