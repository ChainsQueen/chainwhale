import express from 'express';
import { BlockscoutService, WhaleTransfer } from '../services/blockscout-service';

export const whaleRoutes = (blockscoutService: BlockscoutService) => {
  const router = express.Router();

  // GET /api/whale/transfers/:chainId
  router.get('/transfers/:chainId', async (req, res) => {
    try {
      const { chainId } = req.params;
      const { minValue = 100000, limit = 50, offset } = req.query;

      const result = await blockscoutService.getWhaleTransfers(
        chainId,
        parseInt(minValue as string),
        parseInt(limit as string),
        offset ? parseInt(offset as string) : undefined
      );

      res.json({
        success: true,
        data: result,
        metadata: {
          chainId,
          minValue: parseInt(minValue as string),
          limit: parseInt(limit as string),
          fetchedAt: new Date().toISOString()
        }
      });

    } catch (error) {
      console.error('Error in whale transfers endpoint:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch whale transfers',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // GET /api/whale/transfers (all chains)
  router.get('/transfers', async (req, res) => {
    try {
      const { minValue = 100000, limit = 50 } = req.query;
      const chains = blockscoutService.getSupportedChains();

      const promises = chains.map(chainId =>
        blockscoutService.getWhaleTransfers(chainId, parseInt(minValue as string), limit as number)
      );

      const results = await Promise.allSettled(promises);

      const allTransfers: WhaleTransfer[] = [];
      const chainStats: Record<string, number> = {};

      results.forEach((result, index) => {
        const chainId = chains[index];
        if (result.status === 'fulfilled') {
          allTransfers.push(...result.value.transfers);
          chainStats[chainId] = result.value.transfers.length;
        } else {
          console.error(`Failed to fetch transfers for chain ${chainId}:`, result.reason);
          chainStats[chainId] = 0;
        }
      });

      // Sort by timestamp descending (most recent first)
      allTransfers.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

      res.json({
        success: true,
        data: {
          transfers: allTransfers.slice(0, parseInt(limit as string)),
          totalTransfers: allTransfers.length,
          chainStats
        },
        metadata: {
          chains: chains.length,
          minValue: parseInt(minValue as string),
          limit: parseInt(limit as string),
          fetchedAt: new Date().toISOString()
        }
      });

    } catch (error) {
      console.error('Error in whale transfers (all chains) endpoint:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch whale transfers',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  return router;
};
