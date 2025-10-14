# ChainWhale 🐋

[![Deploy to GitHub Pages](https://github.com/ChainsQueen/chainwhale/actions/workflows/deploy.yml/badge.svg)](https://github.com/ChainsQueen/chainwhale/actions/workflows/deploy.yml)

**AI-powered blockchain analytics platform** for intelligent wallet analysis, whale tracking, and multi-chain portfolio monitoring.

## ✨ Features

### 📊 Feature Comparison

| Feature | AI Chat | Whale Feed (Tab) | Wallet Analysis | Whale Tracker (Page) |
|---------|---------|------------------|-----------------|---------------------|
| **Location** | Dashboard tab | Dashboard tab | Dashboard tab | Dedicated page `/whales` |
| **Purpose** | Ask blockchain questions | Quick whale monitoring | Analyze specific wallet | Advanced whale monitoring |
| **Chains** | 3 (ETH, Base, Arbitrum) | 3 (ETH, Base, Arbitrum) | 5 (+ Optimism, Polygon) | 5 (+ Optimism, Polygon) |
| **Filtering** | N/A | Fixed ($100K+, 24h) | By address | Advanced (chain, time, value) |
| **Time Range** | N/A | 24 hours | 24 hours | 1h, 6h, 24h, 7d |
| **Min Value** | N/A | $100K+ | N/A | $10K - $1M+ |
| **Auto-refresh** | No | No | No | Yes (5 min) |
| **Display** | Chat messages | Scrollable feed (600px) | Analysis cards | Full-page list |
| **AI Integration** | Yes (required) | No | Yes (optional) | No |
| **Risk Assessment** | No | No | Yes | No |
| **Whale Detection** | No | No | Yes | No |
| **Copy Addresses** | No | Yes | Yes | Yes |
| **Block Explorer Links** | No | Yes | Yes | Yes |
| **Statistics** | No | No | Yes (wallet stats) | Yes (aggregate stats) |
| **Best For** | Questions & research | Quick monitoring | Wallet investigation | Comprehensive tracking |

### 🎯 Quick Reference

**When to use each feature:**

- **AI Chat** 💬 - "What is the current gas price on Ethereum?" or "Explain this smart contract"
- **Whale Feed** 🐋 - Quick glance at recent large transfers while working in dashboard
- **Wallet Analysis** 💼 - "Is this wallet address safe?" or "What's the risk level of 0x123...?"
- **Whale Tracker** 📊 - "Show me all $500K+ transfers on Polygon in the last 6 hours"

### 🚀 Dashboard (`/dashboard`)

#### 💬 AI Chat Interface
- Natural language blockchain queries
- Context-aware conversations
- Smart contract analysis

#### 🐋 Whale Feed (Dashboard Tab)
**Compact whale monitoring within dashboard:**
- Fixed filters: Ethereum, Base, Arbitrum
- Minimum value: $100K+ transactions
- Last 24 hours of activity
- Manual refresh button
- Scrollable feed (600px height)
- Transaction cards with:
  - USD value and token amount
  - Chain and token badges
  - From/To addresses with copy functionality
  - Links to block explorers
  - Type indicators (transfer/buy/sell)
- Empty state with helpful suggestions
- Loading skeletons

**Note:** For advanced filtering and full-screen view, use the dedicated Whale Tracker page (`/whales`)

#### 💼 Wallet Analysis (Enhanced)
**Recent Activity Tracking:**
- 24-hour token transfer history with USD values
- Full address display with copy-to-clipboard
- Token amounts with proper decimal handling
- Transfer direction indicators (IN/OUT)
- Multi-chain activity aggregation (5 chains)

**Intelligent Risk Assessment:**
- Dynamic risk scoring (0-100) based on activity patterns
- Risk factors: activity level, token diversity, transaction volume
- Detailed explanations (why wallet is risky)
- Risk levels: Low (<30), Medium (30-69), High (70+)
- Real-time analysis from transfer data

**Whale Detection:**
- Activity-based whale scoring algorithm
- Categories: Mega Whale, Large Whale, Medium Whale, Small Whale, Regular User
- Based on: 24h transfer volume (40%), token diversity (20%), activity (20%), holdings (20%)
- Works without balance data (transfer-based)

**Address Features:**
- Ethereum address & ENS validation with visual feedback
- ENS name resolution and display
- Multi-chain support (Ethereum, Base, Arbitrum, Optimism, Polygon)
- Conditional UI rendering (only show sections with data)

**AI Integration:**
- On-demand AI insights generation (cost control)
- Multi-provider support (OpenAI, Anthropic, Google AI, Custom)
- User-managed API keys (client-side storage)
- Smart button with status indicators
- Auto-redirect to Settings if no API key

**Note:** Balance and token holdings display is limited by Blockscout MCP data availability. Analysis focuses on transaction activity and transfer patterns.

#### ⚙️ Settings
- Multi-provider AI configuration
- API key management (stored locally)
- Test key functionality
- Privacy-focused (keys never sent to backend)

### 🐋 Whale Tracker (`/whales`)
**Dedicated full-page whale monitoring interface with:**

**Advanced Filtering:**
- Chain selection (Ethereum, Base, Arbitrum, Optimism, Polygon)
- Time range (1h, 6h, 24h, 7d)
- Minimum value thresholds ($10K, $50K, $100K, $500K, $1M+)
- Real-time filter updates

**Live Features:**
- Auto-refresh every 5 minutes
- Manual refresh button
- Transfer count display
- Statistics dashboard (volume, transfers, unique whales)

**Transfer Display:**
- Detailed whale transfer cards
- Token amounts with proper decimals
- USD values for each transfer
- Copy-to-clipboard for addresses
- Chain badges
- Links to block explorers

**UI/UX:**
- Full-screen dedicated interface
- Loading and error states
- Empty state with helpful messages
- Responsive design

### 🔧 Technical Features
- 🔍 **Multi-Chain Support** - Ethereum, Base, Arbitrum, Optimism, Polygon
- 🤖 **AI-Powered** - Optional AI insights with user-provided keys
- 💾 **No Database Required** - Real-time data only (MVP)
- 🔐 **Privacy-First** - API keys stored client-side only
- 📊 **Activity-Based Analysis** - Works without balance data

## 🚀 Quick Start

### Prerequisites

- Node.js 20+
- pnpm 9+

### Installation

```bash
# Install dependencies
pnpm install

# Run development server
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) to view the app.

### Explore the App

**Dashboard (All-in-One):**
```
http://localhost:3000/dashboard
```
- Chat with AI about blockchain data
- Quick whale monitoring
- Wallet analysis

**Whale Tracker (Dedicated):**
```
http://localhost:3000/whales
```
- Advanced filtering and statistics
- Full-screen whale monitoring

### Test the Backend

```bash
# Test whale service
pnpm tsx test-whale-service.ts

# Test API directly
curl http://localhost:3000/api/whale-feed
```

**Note:** Requires Docker to be running for Blockscout MCP connection.

## 📁 Complete File Structure

```
chainwhale/
├── src/
│   ├── app/                           # Next.js App Router
│   │   ├── dashboard/
│   │   │   └── page.tsx              # Dashboard with 4 tabs (Chat, Whale Feed, Wallet, Settings)
│   │   ├── whales/
│   │   │   └── page.tsx              # Dedicated whale tracker with advanced filtering
│   │   ├── api/
│   │   │   ├── whale-feed/
│   │   │   │   └── route.ts          # Whale feed API endpoint
│   │   │   ├── chat/
│   │   │   │   └── route.ts          # AI chat API endpoint
│   │   │   ├── analyze-wallet/
│   │   │   │   └── route.ts          # Wallet analysis API endpoint
│   │   │   ├── analyze-wallet-ai/
│   │   │   │   └── route.ts          # On-demand AI insights endpoint
│   │   │   └── test-openai-key/
│   │   │       └── route.ts          # API key validation endpoint
│   │   ├── layout.tsx                # Root layout
│   │   ├── page.tsx                  # Landing page
│   │   └── globals.css               # Global styles
│   ├── components/
│   │   ├── dashboard/                # Dashboard-specific components
│   │   │   ├── chat-interface.tsx    # AI chat interface
│   │   │   ├── whale-feed.tsx        # Compact whale feed (dashboard tab)
│   │   │   ├── wallet-analysis.tsx   # Enhanced wallet investigation tool
│   │   │   └── api-settings.tsx      # Multi-provider AI configuration
│   │   ├── ui/                       # Base UI components (shadcn/ui)
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── badge.tsx
│   │   │   ├── label.tsx
│   │   │   ├── alert.tsx
│   │   │   ├── select.tsx
│   │   │   └── ...                   # Other UI primitives
│   │   ├── whale-tracker-card.tsx    # Detailed whale transfer card (tracker page)
│   │   ├── whale-stats.tsx           # Statistics dashboard component
│   │   ├── theme-provider.tsx        # Dark/light mode provider
│   │   └── theme-toggle.tsx          # Theme switcher
│   ├── lib/                          # External integrations & clients
│   │   ├── blockscout/
│   │   │   ├── client.ts             # Blockscout MCP client (enhanced)
│   │   │   └── index.ts              # Exports
│   │   ├── ai/
│   │   │   └── ...                   # AI service integration
│   │   └── shared/
│   │       └── types.ts              # Shared type definitions
│   ├── core/                         # Business logic (UI-agnostic)
│   │   └── services/
│   │       ├── whale-service.ts      # Whale detection service (no DB)
│   │       ├── whale-detector.ts     # Legacy whale detector
│   │       └── index.ts              # Service exports
│   ├── styles/                       # Global CSS and Tailwind
│   └── config/                       # Configuration files
├── public/                           # Static assets
│   ├── chainwhale-logo.svg
│   └── whales.png
├── .github/workflows/                # GitHub Actions
│   └── deploy.yml                    # Auto-deployment workflow
├── FEATURES.md                       # Complete feature guide
├── WHALE_TRACKING.md                 # Whale detection technical guide
├── COMPARISON.md                     # Dashboard vs Whale Tracker comparison
├── test-whale-service.ts             # Whale service test script
├── test-blockscout-data.ts           # Blockscout data test
├── README.md                         # This file
└── package.json                      # Dependencies and scripts
```

### Folder Guidelines

- **`app/`** - Next.js routing, layouts, and pages only
- **`components/`** - Reusable UI components
  - `ui/` for base components
  - `features/` for domain-specific components
- **`lib/`** - External API clients and integrations
- **`core/`** - Business logic that's UI-agnostic
- **`styles/`** - Global styles and Tailwind configuration
- **`config/`** - App configuration files

## 🎨 Code Style

### Naming Conventions

- **Files**: Use `kebab-case` (e.g., `user-profile-card.tsx`)
- **Components**: Use `PascalCase` (e.g., `UserProfileCard`)
- **Functions/Variables**: Use `camelCase`
- **Constants**: Use `UPPER_SNAKE_CASE`

### File Size Limit

- Maximum **500 lines** per file
- Split into smaller modules if approaching this limit

### Module Organization

- Keep files focused on a single responsibility
- Business logic in `core/`, never in components
- UI components should be presentational

## 🛠️ Tech Stack

- **Framework**: Next.js 15.5.4
- **React**: 19.1.0
- **TypeScript**: 5.x
- **Styling**: Tailwind CSS 4.x
- **Package Manager**: pnpm 9.x
- **Blockchain Data**: Blockscout MCP Server
- **AI**: OpenAI (optional)

## 📦 Available Scripts

```bash
pnpm dev          # Start development server
pnpm build        # Build for production
pnpm start        # Start production server
pnpm lint         # Run ESLint
```

## 🚢 Deployment

### Vercel (Recommended for Production)

**Quick Deploy:**

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/ChainsQueen/chainwhale)

**Manual Setup:**

1. **Import Project to Vercel:**
   - Go to [vercel.com](https://vercel.com)
   - Click "Add New Project"
   - Import your GitHub repository: `ChainsQueen/chainwhale`
   - Select the `main` branch

2. **Configure Build Settings:**
   - **Framework Preset**: Next.js
   - **Root Directory**: `./` (leave as default)
   - **Build Command**: `pnpm build` (auto-detected)
   - **Install Command**: `pnpm install` (auto-detected)
   - **Output Directory**: `.next` (auto-detected)

3. **Set Environment Variables (Optional):**
   
   Your app has a **Settings tab** where users can add their own API keys (stored client-side).
   
   **Option A - No Server-Side API Key (Recommended):**
   - Skip adding `OPENAI_API_KEY`
   - Users add their own keys via Settings tab
   - More secure and cost-effective
   - Each user manages their own API usage
   
   **Option B - Shared Server-Side API Key:**
   ```
   OPENAI_API_KEY=your_openai_api_key_here
   ```
   - All users share this key
   - You pay for all API usage
   - Convenient for private/internal deployments
   
   **Optional (for custom Blockscout MCP):**
   ```
   BLOCKSCOUT_MCP_URL=http://localhost:3001
   ```

4. **Deploy:**
   - Click "Deploy"
   - Wait for build to complete (~2-3 minutes)
   - Your app will be live at `https://your-project.vercel.app`

**Post-Deployment:**

- **Custom Domain**: Add your domain in Vercel project settings
- **Environment Variables**: Update via Vercel dashboard → Settings → Environment Variables
- **Auto-Deploy**: Every push to `main` triggers automatic redeployment

**Troubleshooting:**

- If build fails, check that `pnpm` is available (it should be auto-detected)
- Ensure all environment variables are set correctly
- Check build logs in Vercel dashboard for specific errors

### GitHub Pages (Static Export)

This project is also configured for GitHub Pages deployment.

- **Live URL**: https://chainsqueen.github.io/chainwhale/
- **Workflow**: `.github/workflows/deploy.yml`

Every push to `main` triggers a new deployment.

**Note:** GitHub Pages uses static export, which means API routes won't work. For full functionality (including AI chat and whale feed), use Vercel deployment.

## 📚 Documentation

- **[Features Overview](./FEATURES.md)** - Complete feature guide and usage
- **[Whale Tracking Guide](./WHALE_TRACKING.md)** - Technical whale detection details
- [Next.js Documentation](https://nextjs.org/docs)
- [React Documentation](https://react.dev)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Blockscout MCP](https://github.com/blockscout/mcp-server)

## 🎯 Roadmap

### Phase 1: Core Features ✅ (Completed)
- [x] Real-time whale feed
- [x] Multi-chain support (5 chains)
- [x] Filtering and statistics
- [x] No database required
- [x] Enhanced wallet analysis
- [x] Intelligent risk assessment
- [x] Activity-based whale detection
- [x] Multi-provider AI integration
- [x] User-managed API keys (client-side)

### Phase 2: Enhanced UX (In Progress)
- [x] localStorage for API keys
- [ ] User watchlists
- [ ] Browser notifications
- [ ] Export to CSV
- [ ] Historical charts
- [ ] Portfolio tracking over time

### Phase 3: Production
- [ ] Database integration (Supabase)
- [ ] Historical data storage
- [ ] Whale profiles & reputation
- [ ] Advanced analytics dashboard
- [ ] Email/SMS alerts
- [ ] Custom alert rules
- [ ] API for developers

## 📄 License

MIT
