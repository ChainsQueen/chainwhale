import { NextRequest, NextResponse } from 'next/server';
import { BlockscoutClient } from '@/lib/blockscout';
import { WhaleDetector } from '@/core/services/whale-detector';

export async function GET(request: NextRequest) {
  let blockscout: BlockscoutClient | null = null;

  try {
    const { searchParams } = new URL(request.url);
    
    // Get query parameters
    const chainsParam = searchParams.get('chains');
    const minValue = parseInt(searchParams.get('minValue') || '100000');
    const tokenSymbol = searchParams.get('token');

    // Parse chains
    const chainIds = chainsParam ? chainsParam.split(',') : ['1', '8453', '42161'];

    console.log(`Fetching whale feed for ${chainIds.length} chains...`);
    console.log(`Min value: $${minValue.toLocaleString()}`);

    // Initialize services
    blockscout = new BlockscoutClient();
    await blockscout.connect();

    // Use WhaleDetector (works with known addresses)
    const detector = new WhaleDetector(blockscout, null as any, minValue);

    // Fetch whale transactions from each chain
    const allTransactions = [];

    for (const chainId of chainIds) {
      try {
        console.log(`Fetching whale transactions for chain ${chainId}...`);
        const transactions = await detector.detectWhaleTransactions(chainId, 50);
        console.log(`Found ${transactions.length} whale transactions on chain ${chainId}`);
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
      totalVolume: sorted.reduce((sum, t) => sum + t.valueUsd, 0),
      largestTransfer: Math.max(...sorted.map(t => t.valueUsd), 0),
      uniqueWhales: new Set([...sorted.map(t => t.from), ...sorted.map(t => t.to)]).size
    };

    // Get top whales
    const whaleMap = new Map<string, { volume: number; count: number }>();
    sorted.forEach(t => {
      const fromData = whaleMap.get(t.from) || { volume: 0, count: 0 };
      fromData.volume += t.valueUsd;
      fromData.count += 1;
      whaleMap.set(t.from, fromData);

      const toData = whaleMap.get(t.to) || { volume: 0, count: 0 };
      toData.volume += t.valueUsd;
      toData.count += 1;
      whaleMap.set(t.to, toData);
    });

    const topWhales = Array.from(whaleMap.entries())
      .map(([address, data]) => ({
        address,
        volume: data.volume,
        transferCount: data.count
      }))
      .sort((a, b) => b.volume - a.volume)
      .slice(0, 10);

    console.log(`Total transactions found: ${sorted.length}`);

    // Convert to new format
    const transfers = sorted.slice(0, 50).map(t => ({
      hash: t.hash,
      chainId: t.chainId,
      chainName: t.chain,
      from: t.from,
      to: t.to,
      value: t.value,
      valueUsd: t.valueUsd,
      timestamp: t.timestamp,
      token: t.token
    }));

    // Return response
    return NextResponse.json({
      transfers,
      stats,
      topWhales,
      metadata: {
        timeRange: '24 hours',
        minValueUsd: `$${minValue.toLocaleString()}`,
        chains: chainIds.map(id => getChainName(id)),
        tokenFilter: tokenSymbol || null,
        timestamp: new Date().toISOString(),
        monitoredAddresses: 27,
        description: `Monitoring 27 known whale addresses (major exchanges like Binance & Coinbase, large holders, DeFi protocols) over the last 24 hours. Showing transfers above $${minValue.toLocaleString()} USD.`
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
