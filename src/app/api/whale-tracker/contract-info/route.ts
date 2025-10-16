import { NextRequest, NextResponse } from 'next/server';
import { BlockscoutHttpClient } from '@/lib/blockscout/http-client';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * Whale Tracker Contract Info API
 * Fetches contract information using hybrid MCP-first approach
 */
export async function GET(request: NextRequest) {
  let blockscout: BlockscoutHttpClient | null = null;

  try {
    const { searchParams } = new URL(request.url);
    const address = searchParams.get('address');
    const chainId = searchParams.get('chainId');

    if (!address || !chainId) {
      return NextResponse.json(
        { error: 'Missing required parameters: address and chainId' },
        { status: 400 }
      );
    }

    console.log(`[Whale Tracker Contract Info] Fetching info for ${address} on chain ${chainId}`);

    // Use HTTP client directly for contract info (MCP doesn't return full contract data)
    blockscout = new BlockscoutHttpClient();
    await blockscout.connect();

    // Fetch address info using HTTP client
    const addressInfo = await blockscout.getAddressInfo(chainId, address);

    if (!addressInfo) {
      return NextResponse.json(
        { error: 'Contract not found' },
        { status: 404 }
      );
    }

    // Debug: Log what we received from the API
    console.log('[Whale Tracker Contract Info] Raw addressInfo:', JSON.stringify(addressInfo, null, 2));
    console.log('[Whale Tracker Contract Info] is_verified value:', addressInfo.is_verified);
    console.log('[Whale Tracker Contract Info] implementations:', addressInfo.implementations);
    console.log('[Whale Tracker Contract Info] token:', addressInfo.token);

    // Extract relevant information
    const contractInfo = {
      isVerified: addressInfo.is_verified, // Keep undefined to distinguish from false
      isProxy: addressInfo.implementations && addressInfo.implementations.length > 0,
      implementationAddress: addressInfo.implementations?.[0]?.address,
      tokenType: addressInfo.token?.type || 'ERC-20',
      holderCount: addressInfo.token?.holders,
      totalSupply: addressInfo.token?.total_supply,
      tokenName: addressInfo.token?.name,
      tokenSymbol: addressInfo.token?.symbol,
      // High priority additions
      tokenPrice: addressInfo.token?.exchange_rate,
      marketCap: addressInfo.token?.circulating_market_cap,
      volume24h: addressInfo.token?.volume_24h,
      iconUrl: addressInfo.token?.icon_url,
      isScam: addressInfo.is_scam,
      reputation: addressInfo.reputation,
      creatorAddress: addressInfo.creator_address_hash,
      creationTxHash: addressInfo.creation_transaction_hash,
    };

    console.log('[Whale Tracker Contract Info] Final contractInfo being returned:', JSON.stringify(contractInfo, null, 2));
    console.log('[Whale Tracker Contract Info] isVerified type:', typeof addressInfo.is_verified, 'value:', addressInfo.is_verified);
    console.log('[Whale Tracker Contract Info] holderCount:', addressInfo.token?.holders);
    console.log(`[Whale Tracker Contract Info] Successfully fetched contract info`);

    return NextResponse.json(contractInfo);
  } catch (error) {
    console.error('[Whale Tracker Contract Info] Error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch contract information',
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