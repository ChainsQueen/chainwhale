import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { BlockscoutService } from './services/blockscout-service';
import { whaleRoutes } from './routes/whale-routes';
import { contractRoutes } from './routes/contract-routes';

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Initialize services
const blockscoutService = new BlockscoutService();

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// API routes
app.use('/api/whale', whaleRoutes(blockscoutService));
app.use('/api/contract', contractRoutes(blockscoutService));

// Error handling middleware
app.use((err: Error, req: express.Request, res: express.Response) => {
  console.error('Error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: err.message
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not found',
    path: req.path,
    method: req.method
  });
});

app.listen(port, () => {
  console.log(`🚀 MCP HTTP Server running on port ${port}`);
  console.log(`📊 Health check: http://localhost:${port}/health`);
});

export { app };
