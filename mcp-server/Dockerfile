# Blockscout MCP Server with HTTP API Wrapper
# This allows the MCP server to be deployed as a standalone Railway service

FROM ghcr.io/blockscout/mcp-server:latest

# Copy requirements first for better caching
COPY requirements.txt /app/requirements.txt

# Install FastAPI and Uvicorn for HTTP server
RUN pip install --no-cache-dir -r /app/requirements.txt

# Copy the HTTP wrapper
COPY server.py /app/server.py

WORKDIR /app

# Railway provides PORT environment variable
ENV PORT=8080

# Expose port for Railway
EXPOSE $PORT

# Start the HTTP server using Railway's PORT variable
CMD uvicorn server:app --host 0.0.0.0 --port ${PORT:-8080}
