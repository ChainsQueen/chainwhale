# 🐋 ChainWhale

AI-powered blockchain analytics platform for intelligent wallet analysis, whale tracking, and multi-chain portfolio monitoring.

## ✨ Features

- **💬 AI Chat** - Natural language blockchain queries and smart contract analysis
- **🐋 Whale Tracker** - Monitor large transfers ($100K+) across 5 chains in real-time
- **💼 Wallet Analysis** - Comprehensive wallet investigation with risk assessment
- **📊 Multi-Chain Support** - Ethereum, Base, Arbitrum, Optimism, Polygon
- **🔐 Privacy-First** - User-managed API keys stored client-side only

## 🚀 Quick Start

### Prerequisites

- Node.js 20+
- pnpm 9+

### Installation

```bash
# Install dependencies
pnpm install

# (Optional) Create .env.local to override defaults
# By default, the app runs MCP-first with HTTP/RPC fallback.
# To force HTTP-only, set: BLOCKSCOUT_USE_HTTP=true

# Run development server
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) and navigate to:
- `/dashboard` - AI chat, whale feed, wallet analysis
- `/whales` - Full-screen whale tracker with advanced filters

## 🛠️ Tech Stack

- Next.js 15.5.4 + React 19 + TypeScript
- Tailwind CSS 4.x + shadcn/ui
- Blockscout API for blockchain data
- OpenAI API (optional, user-provided)

## 🔗 Blockscout Integration

ChainWhale leverages multiple Blockscout APIs and tools across different features:

### **🐋 Whale Tracker**
- **API Used**: MCP-first Hybrid
  - Primary: Blockscout MCP tools (`get_token_transfers_by_address`)
  - Fallback: RPC API (`/api?module=account&action=tokentx`) only when MCP results lack `hash`
- **Purpose**: Fetch ERC-20 token transfers from known whale addresses
- **Data Retrieved**: Transaction hashes, token transfers, timestamps, addresses
- **Why Hybrid**: Demonstrates Blockscout MCP usage for prize eligibility while preserving explorer links via guaranteed hashes
- **Chains**: Ethereum, Base, Arbitrum, Optimism, Polygon
- **Features**: 
  - Real-time whale monitoring (Binance, Coinbase, Vitalik, etc.)
  - Clickable transaction links to block explorers
  - Multi-chain aggregation
  - $100K+ transfer filtering

### **💬 AI Chat**
- **API Used**: Blockscout HTTP Client → RPC API
- **Purpose**: Fetch whale activity data for AI analysis
- **Integration**: Uses `WhaleService` to aggregate data from multiple chains
- **AI Provider**: OpenAI GPT-4 (user-configured)
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
