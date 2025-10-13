# 🚀 ChainWhale Features Overview

## 📱 Application Structure

ChainWhale has **two main interfaces** for different use cases:

### 1. 🚀 Dashboard (`/dashboard`)
**All-in-one interface** with three integrated tabs:

#### 💬 Chat Interface
- **AI-Powered Blockchain Assistant**
- Ask questions about wallets, transactions, and chains
- Natural language queries
- Powered by OpenAI
- Real-time blockchain data integration

**Example Queries:**
- "What's the balance of vitalik.eth?"
- "Show me recent whale transactions on Base"
- "Analyze wallet 0x..."

#### 🐋 Whale Feed (Compact View)
- **Quick whale monitoring**
- Card-based compact layout
- Shows transactions >$1,000
- Real-time updates
- Multi-chain (Ethereum, Base, Arbitrum)
- Perfect for **quick glances** alongside other tasks

#### 💼 Wallet Analysis
- **Deep wallet investigation**
- Portfolio breakdown
- Token holdings
- Transaction history
- Risk assessment
- Multi-chain wallet tracking

---

### 2. 🐋 Whale Tracker (`/whales`)
**Dedicated full-page whale monitoring** with advanced features:

#### Advanced Filtering
- **Chain Selection** - Toggle between 5+ chains
- **Time Ranges** - 1h, 6h, 24h, 7 days
- **Minimum Value** - $10K to $1M+ thresholds
- **Token Filter** - Focus on specific tokens (USDC, USDT, etc.)

#### Rich Statistics Dashboard
- **Total Transfers** - Count of whale movements
- **Total Volume** - Aggregate USD value
- **Largest Transfer** - Biggest single move
- **Unique Whales** - Number of active addresses

#### Top Whales Leaderboard
- Most active addresses by volume
- Transfer counts per whale
- Real-time rankings

#### Detailed Transfer Cards
- Full transaction details
- Token metadata
- Timestamp tracking
- Direct links to block explorers
- Visual indicators for transfer size

---

## 🎯 When to Use Each Interface

### Use Dashboard (`/dashboard`) When:
- ✅ You want to **chat with AI** about blockchain data
- ✅ You need to **analyze specific wallets**
- ✅ You want **all tools in one place**
- ✅ You prefer a **compact, tabbed interface**
- ✅ You're doing **multi-task analysis**

### Use Whale Tracker (`/whales`) When:
- ✅ You want to **focus solely on whale activity**
- ✅ You need **advanced filtering options**
- ✅ You want **detailed statistics**
- ✅ You're **monitoring specific chains or tokens**
- ✅ You need a **full-screen dedicated view**
- ✅ You want to see **top whale rankings**

---

## 🔄 Data Flow

Both interfaces use the **same backend**:

```
User Interface
    ↓
/api/whale-feed (REST API)
    ↓
WhaleService (Business Logic)
    ↓
BlockscoutClient (MCP Integration)
    ↓
Blockscout MCP Server (Docker)
    ↓
Blockchain Data (Real-time)
```

### Key Features:
- ✅ **No Database Required** - All data fetched in real-time
- ✅ **Stateless** - Works on serverless platforms
- ✅ **Always Fresh** - Direct from blockchain
- ✅ **Multi-Chain** - Supports 80+ chains via Blockscout

---

## 📊 API Endpoints

### `/api/whale-feed` (GET)
**Whale transaction monitoring**

**Parameters:**
- `chains` - Comma-separated chain IDs (default: `1,8453,42161`)
- `timeRange` - Time window (default: `1h`)
- `minValue` - Minimum USD value (default: `100000`)
- `token` - Filter by token symbol (optional)

**Response:**
```json
{
  "transfers": [...],
  "stats": {
    "totalTransfers": 25,
    "totalVolume": 5000000,
    "largestTransfer": 1000000,
    "uniqueWhales": 15
  },
  "topWhales": [...],
  "metadata": {...}
}
```

### `/api/chat` (POST)
**AI-powered blockchain chat**

**Body:**
```json
{
  "query": "What's the balance of vitalik.eth?",
  "chains": ["1", "8453", "42161"]
}
```

**Response:**
```json
{
  "response": "AI-generated answer with blockchain data",
  "data": {...}
}
```

### `/api/analyze-wallet` (POST)
**Wallet analysis and investigation**

**Body:**
```json
{
  "address": "0x...",
  "chains": ["1", "8453"]
}
```

**Response:**
```json
{
  "address": "0x...",
  "totalValue": 1000000,
  "tokens": [...],
  "analysis": "AI-generated insights"
}
```

---

## 🎨 UI Components

### Shared Components
- `whale-feed-card.tsx` - Transfer display card
- `whale-stats.tsx` - Statistics dashboard
- `ui/*` - Base UI components (buttons, cards, badges, etc.)

### Dashboard Components
- `chat-interface.tsx` - AI chat interface
- `whale-feed.tsx` - Compact whale feed
- `wallet-analysis.tsx` - Wallet investigation

### Pages
- `/` - Landing page
- `/dashboard` - Main dashboard (3 tabs)
- `/whales` - Dedicated whale tracker

---

## 🔧 Services & Logic

### Core Services (`src/core/services/`)
- **WhaleService** - Whale detection and analysis
  - `getWhaleFeed()` - Single chain monitoring
  - `getMultiChainWhaleFeed()` - Multi-chain aggregation
  - `getWhaleStats()` - Statistics calculation
  - `getTopWhales()` - Leaderboard generation
  - `filterByToken()` - Token filtering
  - `filterByMinValue()` - Value filtering

- **WhaleDetector** - Legacy whale detection (address-based)

### Blockchain Integration (`src/lib/blockscout/`)
- **BlockscoutClient** - MCP client wrapper
  - `getWhaleTransfers()` - Fetch large transfers
  - `getWhaleActivity()` - Address-specific activity
  - `getTokenTransfers()` - Token transfer history
  - `getAddressInfo()` - Address details
  - `getChainsList()` - Supported chains
  - `transactionSummary()` - AI-friendly summaries

---

## 🚀 Getting Started

### 1. Start the Application
```bash
# Install dependencies
pnpm install

# Start dev server
pnpm dev
```

### 2. Choose Your Interface

**For General Use:**
```
http://localhost:3000/dashboard
```
- Chat with AI
- Quick whale monitoring
- Wallet analysis

**For Whale Tracking:**
```
http://localhost:3000/whales
```
- Advanced filtering
- Detailed statistics
- Full-screen monitoring

### 3. Test the API
```bash
# Get whale feed
curl http://localhost:3000/api/whale-feed

# With filters
curl "http://localhost:3000/api/whale-feed?chains=1&timeRange=24h&minValue=500000"

# Filter by token
curl "http://localhost:3000/api/whale-feed?token=USDC"
```

---

## 💡 Pro Tips

### Dashboard Tips:
1. **Use Chat for Quick Queries** - Faster than manual searching
2. **Switch Tabs Frequently** - All data stays loaded
3. **Wallet Analysis First** - Then ask AI about findings

### Whale Tracker Tips:
1. **Start with 1h Range** - Faster loading
2. **Lower Threshold for More Data** - Try $10K instead of $100K
3. **Filter by Chain** - Focus on high-activity chains
4. **Use Token Filter** - Track specific assets like USDC
5. **Check Top Whales** - Identify most active addresses

### Performance Tips:
1. **Fewer Chains = Faster** - Select only chains you need
2. **Shorter Time Ranges** - 1h loads faster than 24h
3. **Higher Thresholds** - Less data to process
4. **Auto-Refresh** - Runs every 5 minutes automatically

---

## 🔮 Future Enhancements

### Phase 2: Enhanced UX
- [ ] localStorage for user preferences
- [ ] Watchlist (save favorite whales)
- [ ] Browser notifications
- [ ] Export to CSV
- [ ] Dark/Light mode persistence
- [ ] Custom chain selection saving

### Phase 3: Production Features
- [ ] Database integration (Supabase)
- [ ] Historical data storage
- [ ] Whale profiles over time
- [ ] Activity charts and graphs
- [ ] Email/SMS alerts
- [ ] Whale leaderboards (all-time)
- [ ] Pattern detection
- [ ] Predictive analytics

### Phase 4: Advanced Features
- [ ] Multi-user support
- [ ] Shared watchlists
- [ ] Social features
- [ ] API rate limiting
- [ ] Premium tiers
- [ ] Mobile app

---

## 📚 Documentation

- **[README.md](./README.md)** - Project overview and setup
- **[WHALE_TRACKING.md](./WHALE_TRACKING.md)** - Whale detection deep dive
- **[FEATURES.md](./FEATURES.md)** - This file

---

## 🎉 Summary

ChainWhale gives you **two powerful interfaces**:

1. **Dashboard** - All-in-one tool with AI chat, whale feed, and wallet analysis
2. **Whale Tracker** - Dedicated full-screen whale monitoring with advanced features

Both use the **same real-time blockchain data** from Blockscout MCP, ensuring consistency and freshness across the entire application.

**Choose the right tool for your task and start tracking whales! 🐋**
