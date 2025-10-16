# 🐋 ChainWhale

AI-powered blockchain analytics platform for intelligent wallet analysis, whale tracking, and multi-chain portfolio monitoring.

## ✨ Features

- **💬 AI Chat** - Natural language blockchain queries and smart contract analysis
- **🐋 Whale Tracker** - Monitor large transfers ($10K-$1M+) across 5 chains in real-time
- **💼 Wallet Analysis** - Comprehensive wallet investigation with risk assessment
- **📊 Multi-Chain Support** - Ethereum, Base, Arbitrum, Optimism, Polygon
- **🔐 Privacy-First** - User-managed API keys stored client-side only

## 🚀 Quick Start

### Prerequisites

- Node.js 20+
- pnpm 9+
- Docker (for Blockscout MCP integration)

### Installation

```bash
# Install dependencies
pnpm install

# (Optional) Create .env.local for configuration
# By default, uses Blockscout MCP Server (requires Docker)
# MCP provides complete data including transaction hashes
# To force HTTP-only mode: BLOCKSCOUT_USE_HTTP=true
# To disable MCP: BLOCKSCOUT_MCP_FIRST=false

# Run development server
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) and navigate to:
- `/dashboard` - AI chat, whale feed, wallet analysis
- `/whales` - Full-screen whale tracker with advanced filters

## 🛠️ Tech Stack

- Next.js 15.5.4 + React 19 + TypeScript
- Tailwind CSS 4.x + shadcn/ui
- **Blockscout MCP Server** (Docker) + REST API v2 for blockchain data
- Model Context Protocol SDK v1.20.0

## 🔗 Blockscout Integration

ChainWhale leverages multiple Blockscout APIs and tools across different features:

### **🐋 Whale Tracker**
- **API Used**: Blockscout MCP Server (Docker)
  - **Primary**: Blockscout MCP Server via Docker (`get_token_transfers_by_address`)
  - **Data**: Complete transfer data including transaction hashes from MCP
  - **Fallback**: REST API v2 only when MCP connection fails or returns empty
  - **Safety Net**: Hash enrichment from HTTP if MCP data lacks hashes (rarely needed)
- **Docker Image**: `ghcr.io/blockscout/mcp-server:latest` (official v0.11.0)
- **Purpose**: Fetch ERC-20 token transfers from known whale addresses
- **Data Retrieved**: Transaction hashes, token transfers, timestamps, addresses, USD values, data source tags
- **Strategy**: 100% MCP data usage - MCP provides complete blockchain data
- **Chains**: Ethereum, Base, Arbitrum, Optimism, Polygon
- **Features**: 
  - Real-time whale monitoring (Binance, Coinbase, Vitalik, etc.)
  - **MCP Data Source Badges** - Visual indicators showing when data comes from MCP
  - **Token Filter** - Filter by USDC, USDT, WETH, DAI, WBTC
  - **Top 5 Whales Leaderboard** - Most active addresses by volume
  - **Advanced Filters** - Chains, time range (1h-7d), minimum value ($10K-$1M+)
  - Clickable transaction links to block explorers
  - Multi-chain aggregation with parallel processing
  - Smooth animations with Framer Motion

#### **Whale Tracker Architecture**

```
┌─────────────────────────────────────────────────────────────────┐
│                    🐋 Whale Tracker UI (/whales)                │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Filters:                                                 │  │
│  │  • Chains: [ETH] [Base] [Arbitrum] [Optimism] [Polygon] │  │
│  │  • Time: [1h] [6h] [24h] [7d]                            │  │
│  │  • Value: [$10K+] [$50K+] [$100K+] [$500K+] [$1M+]       │  │
│  │  • Token: [All] [USDC] [USDT] [WETH] [DAI] [WBTC]       │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  📊 Stats Dashboard                                       │  │
│  │  Total: 25 | Volume: $5M | Largest: $1M | Whales: 15    │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  🏆 Top 5 Whales by Volume                                │  │
│  │  #1 0x28C6...21d60  $2.5M  (12 transfers)                │  │
│  │  #2 0xF977...1aceC  $1.8M  (8 transfers)                 │  │
│  │  #3 0x0018...5478   $1.2M  (5 transfers)                 │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Transfer Cards (with animations)                         │  │
│  │  [Ethereum] [✨ MCP] [USDC]  $150K  →  Explorer Link     │  │
│  │  [Base] [USDT]  $200K  →  Explorer Link                  │  │
│  │  [Arbitrum] [✨ MCP] [WETH]  $500K  →  Explorer Link     │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              ↓
                    User Interaction
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                   API Route: /api/whale-feed                     │
│                                                                  │
│  1. Parse Query Params:                                          │
│     • chains: '1,8453,42161' (Ethereum, Base, Arbitrum)          │
│     • timeRange: '1h' | '6h' | '24h' | '7d'                     │
│     • minValue: 100000 (USD, e.g., $100,000)                     │
│     • token: 'USDC' (optional filter)                            │
│                                                                  │
│  2. Initialize Services:                                         │
│     • createBlockscoutClient() → Returns MCP or HTTP client      │
│     • WhaleService(minValue, client)                             │
│                                                                  │
│  3. Fetch Data (parallel):                                       │
│     • For each chain: getWhaleFeed(chainId, timeRange)           │
│     • Monitor 9 whale addresses (Binance, Coinbase, Vitalik...)  │
│                                                                  │
│  4. Process Results:                                             │
│     • Filter by token (if specified)                             │
│     • Sort by timestamp                                          │
│     • Calculate stats (volume, largest, unique whales)           │
│     • Generate Top 10 Whales leaderboard                         │
│     • Limit to 50 transfers                                      │
│     • Pass through dataSource field (mcp/http)                   │
│                                                                  │
│  5. Return JSON:                                                 │
│     { transfers, stats, topWhales, metadata }                    │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                      WhaleService Layer                          │
│                                                                  │
│  getWhaleFeed(chainId, chainName, timeRange):                   │
│    • Loop through WHALE_ADDRESSES array                          │
│    • Call client.getTokenTransfers() for each address            │
│    • Filter transfers >= minWhaleValue                           │
│    • Add chainId and chainName to each transfer                  │
│    • Preserve dataSource field from client                       │
│    • Return aggregated transfers                                 │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│              HybridBlockscoutClient (MCP-first)                  │
│                                                                  │
│  getTokenTransfers(chainId, address, ageFrom, ageTo):           │
│                                                                  │
│    ┌─────────────────────────────────────────┐                  │
│    │ Step 1: Try MCP First                   │                  │
│    │  • Call mcp.getTokenTransfers()         │                  │
│    │  • Tool: get_token_transfers_by_address │                  │
│    │  • Check if items have hashes           │                  │
│    └─────────────────────────────────────────┘                  │
│                      ↓                                           │
│    ┌─────────────────────────────────────────┐                  │
│    │ Step 2: Verify & Return MCP Data        │                  │
│    │  • MCP data includes transaction hashes │                  │
│    │  • Tag items: dataSource = 'mcp' ⭐     │                  │
│    │  • Return complete MCP data             │                  │
│    │  • (Hash enrichment available if needed)│                  │
│    └─────────────────────────────────────────┘                  │
│                      ↓                                           │
│    ┌─────────────────────────────────────────┐                  │
│    │ Step 3: HTTP Fallback (only if needed)  │                  │
│    │  • Only if MCP fails or returns empty   │                  │
│    │  • Call http.getTokenTransfers()        │                  │
│    │  • Tag items: dataSource = 'http'       │                  │
│    │  • Return HTTP data                     │                  │
│    └─────────────────────────────────────────┘                  │
└─────────────────────────────────────────────────────────────────┘
                              ↓
              ┌───────────────┴───────────────┐
              ↓                               ↓
┌──────────────────────────┐    ┌──────────────────────────┐
│   Blockscout MCP Server  │    │  Blockscout REST API v2  │
│                          │    │                          │
│  Tools:                  │    │  Endpoints:              │
│  • get_token_transfers   │    │  • /api/v2/addresses/... │
│  • get_address_info      │    │  • /tokens/:address      │
│  • get_tokens_by_address │    │  • /transactions/:hash   │
│                          │    │                          │
│  Returns:                │    │  Returns:                │
│  • Complete transfer data│    │  • Transfer data         │
│  • Transaction hashes ✅ │    │  • Transaction hashes ✅ │
│  • Token metadata        │    │  • Token metadata        │
│  • USD values            │    │  • Exchange rates        │
│  • Timestamps            │    │  • Timestamps            │
│                          │    │                          │
│  Tagged: dataSource='mcp'│    │  Tagged: dataSource='http'│
└──────────────────────────┘    └──────────────────────────┘
              ↓                               ↓
              └───────────────┬───────────────┘
                              ↓
                    Blockchain Networks
              [Ethereum] [Base] [Arbitrum]
              [Optimism] [Polygon]
```

**Key Features:**
- ⭐ **MCP-First**: Uses Blockscout MCP Server when Docker is available
- 🏷️ **Data Source Tagging**: Every transfer tagged as 'mcp' or 'http'
- 🎨 **Visual Indicators**: Purple/blue MCP badges in UI
- 🔄 **Smart Fallback**: Uses HTTP only when MCP connection fails
- 📊 **Rich Analytics**: Stats dashboard + Top Whales leaderboard
- 🎯 **Advanced Filtering**: 4 filter types (chains, time, value, token)
- 💰 **Value Filters**: $10K, $50K, $100K, $500K, $1M+ thresholds
- ✨ **Professional Polish**: Framer Motion animations throughout

### **💬 AI Chat**
- **API Used**: Blockscout HTTP Client → RPC API
- **Purpose**: Fetch whale activity data for AI analysis
- **Integration**: Uses `WhaleService` to aggregate data from multiple chains
- **AI Provider**: User-configured (supports OpenAI, Anthropic, etc.)
- **Features**:
  - Natural language queries about whale activity
  - Cross-chain transaction analysis
  - Market trend insights
  - Contextual blockchain data for LLM

### **💼 Wallet Analysis**
- **API Used**: Blockscout MCP Server (Model Context Protocol)
- **Purpose**: Deep wallet investigation with AI-powered insights
- **MCP Tools Used**:
  - `get_address_info` - Wallet balance and metadata
  - `get_token_transfers_by_address` - Transaction history
  - `get_tokens_by_address` - Token holdings
- **AI Provider**: OpenAI GPT-4 (user-configured)
- **Features**:
  - Comprehensive wallet profiling
  - Risk assessment
  - Transaction pattern analysis
  - Token portfolio breakdown

### **📊 Whale Feed (Dashboard)**
- **API Used**: Blockscout RPC API
- **Purpose**: Display recent whale transactions in dashboard
- **Features**:
  - Time range filtering (1h, 24h, 7d)
  - Chain selection
  - Minimum value filtering
  - Top whale leaderboard

### **Architecture**

```
┌─────────────────────────────────────────────────────────┐
│                     ChainWhale App                       │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ┌────────────────────┐  ┌──────────────┐  ┌───────────┐ │
│  │   Whale Tracker    │  │   AI Chat    │  │Analysis   │ │
│  │  MCP-first Hybrid  │  │ MCP + RPC    │  │   (MCP)   │ │
│  └─────────┬──────────┘  └──────┬───────┘  └─────┬─────┘ │
│            │                    │                  │       │
│            └──────────┬─────────┴──────────────────┘       │
│                       │                                    │
└───────────────────────┼────────────────────────────────────┘
                        │
            ┌───────────┴───────────┐
            │                       │
    ┌───────▼────────┐     ┌───────▼────────┐
    │ Blockscout MCP │     │ Blockscout RPC │
    │     Server     │     │      API       │
    │                │     │                │
    │ • get_address  │     │ • tokentx      │
    │ • get_tokens   │     │ • account      │
    │ • get_transfers│     │ • tx details   │
    └───────┬────────┘     └────────┬───────┘
            │  primary               │  fallback (hash guarantee)
            └────────────────────────┴───────────────────────
```

### **Why Hybrid (MCP-first)?**

1. **MCP Server first** - Rich AI context and multi-chain coverage; preferred path for prize alignment.
2. **HTTP/RPC fallback** - Ensures `hash` is present for explorer links when MCP responses omit it.
3. **Factory/Hybrid Pattern** - Automatically selects the best source per-request.

### **MCP-first Runtime & Env Flags**

- **Default behavior**: MCP-first with automatic HTTP/RPC fallback for transfers without hashes.
- **Env overrides**:
  - `BLOCKSCOUT_USE_HTTP=true` → Force HTTP/RPC-only mode.
  - `BLOCKSCOUT_MCP_FIRST=false` → Disable hybrid preference and use legacy selection.
    - See `src/lib/blockscout/factory.ts` and `src/lib/blockscout/hybrid-client.ts`.

## 🚢 Deployment

### Vercel (Recommended)

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/ChainsQueen/chainwhale)

1. Import your repository to Vercel
2. Configure build settings (auto-detected):
   - Build Command: `pnpm build`
   - Install Command: `pnpm install`
3. (Optional) Add `OPENAI_API_KEY` environment variable
   - Users can also add their own keys via Settings tab
4. Deploy

**Note:** No Docker required - uses HTTP-based Blockscout client in production.

## 📄 License

MIT
