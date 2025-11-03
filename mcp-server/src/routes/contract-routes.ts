import express from 'express';
import { BlockscoutService, ContractInfo } from '../services/blockscout-service';

export const contractRoutes = (blockscoutService: BlockscoutService) => {
  const router = express.Router();

  // GET /api/contract/info/:chainId/:address
  router.get('/info/:chainId/:address', async (req, res) => {
    try {
      const { chainId, address } = req.params;

      const contractInfo = await blockscoutService.getContractInfo(chainId, address);

      res.json({
        success: true,
        data: contractInfo,
        metadata: {
          chainId,
          address,
          fetchedAt: new Date().toISOString()
        }
      });

    } catch (error) {
      console.error('Error in contract info endpoint:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch contract information',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // POST /api/contract/batch
  router.post('/batch', async (req, res) => {
    try {
      const { contracts } = req.body;

      if (!contracts || !Array.isArray(contracts)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid request body',
          message: 'Expected { contracts: [{ chainId: string, address: string }] }'
        });
      }

      // Group contracts by chain for efficiency
      const chainGroups: Record<string, string[]> = {};
      contracts.forEach((contract: { chainId: string; address: string }) => {
        if (!chainGroups[contract.chainId]) {
          chainGroups[contract.chainId] = [];
        }
        chainGroups[contract.chainId].push(contract.address);
      });

      // Fetch contract info for each chain
      const promises = Object.entries(chainGroups).map(async ([chainId, addresses]) => {
        try {
          const contractInfos = await blockscoutService.getMultipleContractInfo(chainId, addresses);
          return { chainId, contracts: contractInfos, error: null };
        } catch (error) {
          console.error(`Error fetching contracts for chain ${chainId}:`, error);
          return {
            chainId,
            contracts: [],
            error: error instanceof Error ? error.message : 'Unknown error'
          };
        }
      });

      const results = await Promise.all(promises);

      // Flatten results
      const allContracts: ContractInfo[] = [];
      const errors: Array<{ chainId: string; error: string }> = [];

      results.forEach(result => {
        allContracts.push(...result.contracts);
        if (result.error) {
          errors.push({ chainId: result.chainId, error: result.error });
        }
      });

      res.json({
        success: true,
        data: {
          contracts: allContracts,
          totalFetched: allContracts.length,
          errors: errors.length > 0 ? errors : undefined
        },
        metadata: {
          requestedCount: contracts.length,
          chainsRequested: Object.keys(chainGroups).length,
          fetchedAt: new Date().toISOString()
        }
      });

    } catch (error) {
      console.error('Error in contract batch endpoint:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch contract information',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  return router;
};
