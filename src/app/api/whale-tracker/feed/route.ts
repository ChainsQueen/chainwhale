import { NextRequest, NextResponse } from 'next/server';
import { createBlockscoutClient, type IBlockscoutClient } from '@/lib/blockscout/factory';
import { WhaleService } from '@/core/services/whale-service';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  let blockscout: IBlockscoutClient | null = null;

  try {
    const { searchParams } = new URL(request.url);
    
    // Get query parameters
    const chainsParam = searchParams.get('chains');
    const timeRange = searchParams.get('timeRange') || '1h';
    const minValue = parseInt(searchParams.get('minValue') || '100000');
    const tokenSymbol = searchParams.get('token');

    // Parse chains
    const chainIds = chainsParam ? chainsParam.split(',') : ['1', '8453', '42161'];

    console.log(`[Whale Feed API] Starting request`);
    console.log(`[Whale Feed API] Chains: ${chainIds.join(', ')}`);
    console.log(`[Whale Feed API] Time Range: ${timeRange}`);
    console.log(`[Whale Feed API] Min value: $${minValue.toLocaleString()}`);
    console.log(`[Whale Feed API] Token filter: ${tokenSymbol || 'none'}`);
    console.log(`[Whale Feed API] Environment: ${process.env.NODE_ENV}`);
    console.log(`[Whale Feed API] Vercel: ${process.env.VERCEL}`);

    // Initialize services
    blockscout = createBlockscoutClient();
    await blockscout.connect();

    // Use WhaleService (works with known addresses)
    const whaleService = new WhaleService(minValue, blockscout);

    // Fetch whale transactions from each chain
    const allTransactions = [];

    for (const chainId of chainIds) {
      try {
        console.log(`Fetching whale transactions for chain ${chainId}...`);
        const chainName = getChainName(chainId);
        const transactions = await whaleService.getWhaleFeed(chainId, chainName, timeRange);
        console.log(`Found ${transactions.length} whale transactions on chain ${chainId}`);
        
        // Debug: Check if hashes are present
        const withoutHash = transactions.filter(t => !t.hash || t.hash === '');
        if (withoutHash.length > 0) {
          console.warn(`⚠️ ${withoutHash.length} transactions without hash on chain ${chainId}`);
        }
        
        allTransactions.push(...transactions);
      } catch (error) {
        console.error(`Error detecting whales on chain ${chainId}:`, error);
      }
    }

    // Filter by token if specified
    let filteredTransactions = allTransactions;
    if (tokenSymbol) {
      filteredTransactions = allTransactions.filter(t => 
        t.token?.symbol.toLowerCase() === tokenSymbol.toLowerCase()
      );
    }

    // Sort by timestamp (newest first)
    const sorted = filteredTransactions.sort((a, b) => b.timestamp - a.timestamp);

    // Calculate stats
    const stats = {
      totalTransfers: sorted.length,
      totalVolume: sorted.reduce((sum, t) => sum + (t.valueUsd || 0), 0),
      largestTransfer: Math.max(...sorted.map(t => t.valueUsd || 0), 0),
      uniqueWhales: new Set([...sorted.map(t => t.from), ...sorted.map(t => t.to)]).size
    };

    // Get top whales
    const whaleMap = new Map<string, { volume: number; count: number }>();
    sorted.forEach(t => {
      const fromData = whaleMap.get(t.from) || { volume: 0, count: 0 };
      fromData.volume += (t.valueUsd || 0);
      fromData.count += 1;
      whaleMap.set(t.from, fromData);

      const toData = whaleMap.get(t.to) || { volume: 0, count: 0 };
      toData.volume += (t.valueUsd || 0);
      toData.count += 1;
      whaleMap.set(t.to, toData);
    });

    const topWhales = Array.from(whaleMap.entries())
      .map(([address, data]) => ({
        address,
        volume: data.volume,
        count: data.count,
        chain: sorted.find(t => t.from === address || t.to === address)?.chainId || 'Unknown'
      }))
      .sort((a, b) => b.volume - a.volume)
      .slice(0, 10);

    console.log(`Total transactions found: ${sorted.length}`);

    // Convert to new format
    const transfers = sorted.slice(0, 50).map(t => ({
      hash: t.hash,
      chainId: t.chainId,
      chainName: t.chainName,
      from: t.from,
      to: t.to,
      value: t.value,
      valueUsd: t.valueUsd,
      timestamp: t.timestamp,
      token: t.token,
      dataSource: t.dataSource
    }));

    // Return response
    return NextResponse.json({
      transfers,
      stats,
      topWhales,
      metadata: {
        timeRange,
        minValueUsd: `$${minValue.toLocaleString()}`,
        chains: chainIds.map(id => getChainName(id)),
        tokenFilter: tokenSymbol || null,
        timestamp: new Date().toISOString(),
        monitoredAddresses: 9,
        dataSources: {
          mcp: transfers.filter(t => t.dataSource === 'mcp').length,
          http: transfers.filter(t => t.dataSource === 'http').length,
          total: transfers.length
        },
        description: `Monitoring 9 known whale addresses (Binance, Coinbase, Vitalik, Polygon Bridge, and large holders) across selected chains. Showing transfers above $${minValue.toLocaleString()} USD.`
      }
    });
  } catch (error) {
    console.error('Error in whale-feed API:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch whale transactions',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  } finally {
    if (blockscout) {
      await blockscout.disconnect();
    }
  }
}

/**
 * Get human-readable chain name
 */
function getChainName(chainId: string): string {
  const chains: Record<string, string> = {
    '1': 'Ethereum',
    '8453': 'Base',
    '42161': 'Arbitrum',
    '10': 'Optimism',
    '137': 'Polygon',
    '324': 'zkSync Era',
    '534352': 'Scroll',
    '100': 'Gnosis',
  };
  return chains[chainId] || `Chain ${chainId}`;
}
