# Blockscout MCP Server - Railway Deployment

This directory contains a standalone HTTP API wrapper for the Blockscout MCP server, designed to be deployed as a separate Railway service.

## Why This Exists

Railway doesn't support Docker-in-Docker, so we can't run the MCP server directly in the main ChainWhale app. This wrapper:
- Runs the MCP server in its own Railway service
- Exposes HTTP endpoints for the main app to call
- Handles MCP protocol internally

## Architecture

```
┌─────────────────────┐         ┌──────────────────────┐
│  ChainWhale App     │         │  MCP Server Service  │
│  (Next.js)          │ ◄─────► │  (Python + FastAPI)  │
│  Railway Service #1 │  HTTP   │  Railway Service #2  │
└─────────────────────┘         └──────────────────────┘
```

## Deployment Steps

### 1. Deploy MCP Service to Railway

```bash
# Navigate to this directory
cd mcp-server

# Initialize Railway project
railway init

# Deploy
railway up
```

### 2. Get Service URL

After deployment, Railway will provide a URL like:
```
https://mcp-server-production-xxxx.up.railway.app
```

### 3. Configure ChainWhale App

In your main ChainWhale Railway service, add environment variable:
```
MCP_SERVER_URL=https://mcp-server-production-xxxx.up.railway.app
```

### 4. Update ChainWhale Client

The client code needs to be updated to use HTTP connection when `MCP_SERVER_URL` is set.

See: `/docs/MCP_DEPLOYMENT_OPTIONS.md` for implementation details.

## API Endpoints

### Health Check
```bash
GET /health
```

Response:
```json
{
  "status": "healthy",
  "service": "mcp-server"
}
```

### Get Address Info
```bash
POST /mcp/address-info
Content-Type: application/json

{
  "chain_id": "1",
  "address": "0xdAC17F958D2ee523a2206206994597C13D831ec7"
}
```

### Get Token Transfers
```bash
POST /mcp/token-transfers
Content-Type: application/json

{
  "chain_id": "1",
  "address": "0x...",
  "age_from": "2024-01-01T00:00:00Z",
  "age_to": "2024-01-02T00:00:00Z"
}
```

### Generic MCP Tool Call
```bash
POST /mcp/call
Content-Type: application/json

{
  "tool": "get_address_info",
  "arguments": {
    "chain_id": "1",
    "address": "0x..."
  }
}
```

## Testing Locally

```bash
# Build the Docker image
docker build -t mcp-server .

# Run the container
docker run -p 8080:8080 mcp-server

# Test the health endpoint
curl http://localhost:8080/health

# Test address info
curl -X POST http://localhost:8080/mcp/address-info \
  -H "Content-Type: application/json" \
  -d '{
    "chain_id": "1",
    "address": "0xdAC17F958D2ee523a2206206994597C13D831ec7"
  }'
```

## Cost Considerations

Running a separate Railway service will incur additional costs:
- **Hobby Plan**: $5/month per service
- **Pro Plan**: Usage-based pricing

**Recommendation**: Only deploy this if you need MCP-specific features. The HTTP-only mode in ChainWhale works perfectly without this service.

## Monitoring

Railway provides built-in monitoring:
- View logs: `railway logs`
- Check metrics: Railway dashboard → Metrics tab
- Set up alerts: Railway dashboard → Settings → Notifications

## Troubleshooting

### Service Won't Start
- Check Railway logs: `railway logs`
- Verify Dockerfile builds locally: `docker build -t mcp-server .`
- Ensure port 8080 is exposed

### Connection Timeout
- Verify MCP_SERVER_URL is correct in ChainWhale app
- Check Railway service is running
- Test health endpoint: `curl https://your-service.railway.app/health`

### MCP Tool Errors
- Check MCP server logs in Railway dashboard
- Verify Blockscout API is accessible
- Test with curl to isolate issue

## Alternative: Stick with HTTP-Only

**Remember**: The HTTP client in ChainWhale provides identical data to MCP. Consider whether the added complexity and cost of running a separate service is worth it for your use case.

See `/docs/MCP_DEPLOYMENT_OPTIONS.md` for a detailed comparison.
