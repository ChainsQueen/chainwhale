# TypeScript MCP Server

This directory contains a standalone TypeScript-based HTTP API wrapper for the Blockscout MCP server, designed to be deployed as a separate Railway service.

## Why This Exists

Railway doesn't support Docker-in-Docker, so we can't run the MCP server directly in the main ChainWhale app. This wrapper:
- Runs the MCP server in its own Railway service
- Exposes HTTP endpoints for the main app to call
- Handles MCP protocol internally

## Architecture

```
┌─────────────────────┐         ┌──────────────────────┐
│  ChainWhale App     │         │  MCP Server Service  │
│  (Next.js)          │ ◄─────► │  (TypeScript)        │
│  Railway Service #1 │  HTTP   │  Railway Service #2  │
└─────────────────────┘         └──────────────────────┘
```

## Getting Started

### Prerequisites

- Node.js (v18 or later)
- pnpm
- Docker

### Installation

1.  Install dependencies:

    ```bash
    pnpm install
    ```

### Running the Development Server

To run the server in development mode with hot-reloading:

```bash
pnpm dev
```

The server will be available at `http://localhost:8080`.

## Deployment to Railway

1.  **Deploy MCP Service to Railway**

    ```bash
    # Navigate to this directory
    cd mcp-server

    # Initialize Railway project
    railway init

    # Deploy
    railway up
    ```

2.  **Get Service URL**

    After deployment, Railway will provide a URL like:
    `https://mcp-server-production-xxxx.up.railway.app`

3.  **Configure ChainWhale App**

    In your main ChainWhale Railway service, add this environment variable:
    `MCP_SERVER_URL=https://mcp-server-production-xxxx.up.railway.app`

## API Endpoints

- `GET /health`
- `POST /mcp/call`

