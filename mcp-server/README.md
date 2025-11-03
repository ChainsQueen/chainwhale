# ChainWhale MCP HTTP Server

HTTP wrapper service for Blockscout MCP server functionality, designed to run on Railway. This service provides REST API endpoints that replicate the Blockscout MCP server's whale tracking and contract analysis capabilities.

## 🚀 Features

- **Whale Transfer Tracking**: Monitor large token transfers across 5 EVM chains
- **Contract Security Analysis**: Get comprehensive contract information and security data
- **Multi-Chain Support**: Ethereum, Base, Arbitrum, Optimism, Polygon
- **Railway Optimized**: Designed for Railway deployment with health checks and auto-scaling
- **TypeScript**: Full TypeScript support with proper type definitions

## 🏗️ Architecture

This service provides HTTP REST endpoints that wrap Blockscout's v2 API, offering the same data as the official MCP server but accessible via standard HTTP requests.

### Supported Chains

- **Ethereum** (Chain ID: 1) - `https://eth.blockscout.com`
- **Base** (Chain ID: 8453) - `https://base.blockscout.com`
- **Arbitrum** (Chain ID: 42161) - `https://arbitrum.blockscout.com`
- **Optimism** (Chain ID: 10) - `https://optimism.blockscout.com`
- **Polygon** (Chain ID: 137) - `https://polygon.blockscout.com`

## 📡 API Endpoints

### Whale Transfers

#### Get transfers for specific chain
```http
GET /api/whale/transfers/:chainId?minValue=100000&limit=50&offset=0
```

**Parameters:**
- `chainId`: Chain ID (1, 8453, 42161, 10, 137)
- `minValue`: Minimum USD value (default: 100000)
- `limit`: Maximum transfers to return (default: 50)
- `offset`: Pagination offset (optional)

#### Get transfers across all chains
```http
GET /api/whale/transfers?minValue=100000&limit=50
```

**Response:**
```json
{
  "success": true,
  "data": {
    "transfers": [...],
    "totalTransfers": 150,
    "chainStats": {
      "1": 45,
      "8453": 32,
      "42161": 28,
      "10": 25,
      "137": 20
    }
  },
  "metadata": {
    "chains": 5,
    "minValue": 100000,
    "fetchedAt": "2024-01-01T12:00:00.000Z"
  }
}
```

### Contract Information

#### Get single contract info
```http
GET /api/contract/info/:chainId/:address
```

#### Get multiple contracts (batch)
```http
POST /api/contract/batch
Content-Type: application/json

{
  "contracts": [
    { "chainId": "1", "address": "0xdAC17F958D2ee523a2206206994597C13D831ec7" },
    { "chainId": "8453", "address": "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913" }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "contracts": [
      {
        "address": "0xdAC17F958D2ee523a2206206994597C13D831ec7",
        "chain_id": "1",
        "is_verified": true,
        "is_scam": false,
        "token_type": "ERC-20",
        "name": "Tether USD",
        "symbol": "USDT",
        "decimals": 6,
        "total_supply": "1000000000000000",
        "holders_count": 10641594,
        "exchange_rate": 1.0,
        "market_cap": 181962846734
      }
    ],
    "totalFetched": 2
  }
}
```

### Health Check

```http
GET /health
```

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T12:00:00.000Z",
  "version": "1.0.0"
}
```

## 🚂 Railway Deployment

### Prerequisites

1. **Railway Account**: Sign up at [railway.app](https://railway.app)
2. **Railway CLI**: Install the Railway CLI
   ```bash
   npm install -g @railway/cli
   railway login
   ```

### Step 1: Prepare the Project

```bash
cd /path/to/chainwhale/mcp-server

# Install dependencies
npm install

# Build the project
npm run build

# Test locally (optional)
npm run dev
```

### Step 2: Deploy to Railway

```bash
# Initialize Railway project
railway init

# Choose "Empty Project" when prompted
# Name your project (e.g., "chainwhale-mcp-server")

# Deploy
railway up

# Get the deployment URL
railway domain
```

### Step 3: Configure Environment Variables (Optional)

The service works without additional environment variables, but you can configure:

```bash
# Set custom port (Railway sets PORT automatically)
railway variables set PORT=3000

# Add any Blockscout API keys if needed in the future
railway variables set BLOCKSCOUT_API_KEY=your_key_here
```

### Step 4: Verify Deployment

```bash
# Check health endpoint
curl https://your-railway-url.up.railway.app/health

# Test whale transfers endpoint
curl "https://your-railway-url.up.railway.app/api/whale/transfers?minValue=100000&limit=10"
```

## 🔧 Development

### Local Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

### Project Structure

```
mcp-server/
├── src/
│   ├── routes/
│   │   ├── whale-routes.ts      # Whale transfer endpoints
│   │   └── contract-routes.ts   # Contract info endpoints
│   ├── services/
│   │   └── blockscout-service.ts # Blockscout API client
│   └── server.ts                # Express server setup
├── package.json
├── tsconfig.json
├── railway.json
└── README.md
```

### Adding New Endpoints

1. Create route handler in `src/routes/`
2. Add service method in `src/services/blockscout-service.ts`
3. Register routes in `src/server.ts`

## 📊 Integration with ChainWhale

To use this MCP server with the main ChainWhale application:

1. Deploy this service to Railway
2. Get the Railway URL (e.g., `https://chainwhale-mcp-server.up.railway.app`)
3. Update ChainWhale's environment variables:
   ```bash
   railway variables set MCP_SERVER_URL=https://chainwhale-mcp-server.up.railway.app
   ```
4. Modify ChainWhale's `src/lib/blockscout/hybrid-client.ts` to use HTTP endpoints instead of MCP protocol

## 🛠️ Troubleshooting

### Common Issues

**Port Issues:**
- Railway automatically assigns a `PORT` environment variable
- The service defaults to `process.env.PORT || 3000`

**Timeout Errors:**
- Blockscout API calls have 30-second timeout
- Large requests may need pagination

**Rate Limiting:**
- Blockscout has rate limits - implement exponential backoff if needed

### Logs

View Railway logs:
```bash
railway logs
```

### Monitoring

The service includes:
- Health check endpoint: `/health`
- Structured error responses
- Request logging via Express middleware

## 🤝 Contributing

1. Follow the existing TypeScript patterns
2. Add proper error handling
3. Update this README for new endpoints
4. Test locally before deploying

## 📄 License

MIT License - see LICENSE file for details.
