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

# Create .env.local file (required for local development)
echo "BLOCKSCOUT_USE_HTTP=true" > .env.local

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
