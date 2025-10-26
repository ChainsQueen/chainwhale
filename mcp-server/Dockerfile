# Blockscout MCP Server with HTTP API Wrapper
# This allows the MCP server to be deployed as a standalone Railway service

FROM ghcr.io/blockscout/mcp-server:latest

# Install FastAPI and Uvicorn for HTTP server
RUN pip install fastapi uvicorn python-multipart

# Copy the HTTP wrapper
COPY server.py /app/server.py

WORKDIR /app

# Expose port for Railway
EXPOSE 8080

# Start the HTTP server
CMD ["uvicorn", "server:app", "--host", "0.0.0.0", "--port", "8080"]
