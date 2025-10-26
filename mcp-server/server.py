"""
HTTP API Wrapper for Blockscout MCP Server
Allows the MCP server to be deployed as a standalone service on Railway
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Dict, Any, Optional
import subprocess
import json
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Blockscout MCP Server API",
    description="HTTP wrapper for Blockscout MCP server",
    version="1.0.0"
)

# Enable CORS for ChainWhale app
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, restrict to your Railway app domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class MCPToolRequest(BaseModel):
    """Request model for MCP tool calls"""
    tool: str
    arguments: Dict[str, Any]

class MCPToolResponse(BaseModel):
    """Response model for MCP tool calls"""
    success: bool
    data: Optional[Dict[str, Any]] = None
    error: Optional[str] = None

@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "service": "Blockscout MCP Server",
        "status": "running",
        "version": "1.0.0",
        "endpoints": {
            "health": "/health",
            "mcp_call": "/mcp/call (POST)",
            "address_info": "/mcp/address-info (POST)",
            "token_transfers": "/mcp/token-transfers (POST)"
        }
    }

@app.get("/health")
async def health():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "mcp-server"
    }

@app.post("/mcp/call", response_model=MCPToolResponse)
async def call_mcp_tool(request: MCPToolRequest):
    """
    Generic MCP tool call endpoint
    
    Example:
    {
        "tool": "get_address_info",
        "arguments": {
            "chain_id": "1",
            "address": "0x..."
        }
    }
    """
    try:
        logger.info(f"Calling MCP tool: {request.tool}")
        logger.info(f"Arguments: {request.arguments}")
        
        # Call the MCP server via subprocess
        # Note: This is a simplified implementation
        # In production, you'd want to maintain a persistent connection
        result = subprocess.run(
            [
                "python", "-m", "blockscout_mcp_server",
                "--tool", request.tool,
                "--args", json.dumps(request.arguments)
            ],
            capture_output=True,
            text=True,
            timeout=30
        )
        
        if result.returncode != 0:
            logger.error(f"MCP tool call failed: {result.stderr}")
            return MCPToolResponse(
                success=False,
                error=result.stderr or "Unknown error"
            )
        
        # Parse the output
        output_data = json.loads(result.stdout)
        
        return MCPToolResponse(
            success=True,
            data=output_data
        )
        
    except subprocess.TimeoutExpired:
        logger.error("MCP tool call timed out")
        raise HTTPException(status_code=504, detail="Request timed out")
    except json.JSONDecodeError as e:
        logger.error(f"Failed to parse MCP response: {e}")
        raise HTTPException(status_code=500, detail="Invalid response from MCP server")
    except Exception as e:
        logger.error(f"Unexpected error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/mcp/address-info")
async def get_address_info(chain_id: str, address: str):
    """
    Convenience endpoint for getting address information
    
    Example: POST /mcp/address-info
    {
        "chain_id": "1",
        "address": "0xdAC17F958D2ee523a2206206994597C13D831ec7"
    }
    """
    return await call_mcp_tool(MCPToolRequest(
        tool="get_address_info",
        arguments={"chain_id": chain_id, "address": address}
    ))

@app.post("/mcp/token-transfers")
async def get_token_transfers(
    chain_id: str,
    address: Optional[str] = None,
    age_from: Optional[str] = None,
    age_to: Optional[str] = None,
    token: Optional[str] = None,
    cursor: Optional[str] = None
):
    """
    Convenience endpoint for getting token transfers
    
    Example: POST /mcp/token-transfers
    {
        "chain_id": "1",
        "address": "0x...",
        "age_from": "2024-01-01T00:00:00Z",
        "age_to": "2024-01-02T00:00:00Z"
    }
    """
    arguments = {"chain_id": chain_id}
    
    if address:
        arguments["address"] = address
    if age_from:
        arguments["age_from"] = age_from
    if age_to:
        arguments["age_to"] = age_to
    if token:
        arguments["token"] = token
    if cursor:
        arguments["cursor"] = cursor
    
    return await call_mcp_tool(MCPToolRequest(
        tool="get_token_transfers",
        arguments=arguments
    ))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8080)
