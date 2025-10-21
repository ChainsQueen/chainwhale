import { NextRequest, NextResponse } from 'next/server';
import { createBlockscoutClient } from '@/lib/blockscout/factory';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

interface TokenToFetch {
  symbol: string;
  address: string;
  chainId: string;
}

/**
 * API endpoint for fetching contract security data
 * Used by AI insights checklist to pre-fetch contract information
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as { tokens: TokenToFetch[] };
    const { tokens } = body;

    if (!tokens || !Array.isArray(tokens)) {
      return NextResponse.json(
        { error: 'Invalid tokens array' },
        { status: 400 }
      );
    }

    const securityData = [];
    const client = createBlockscoutClient();
    
    try {
      await client.connect();

      // Fetch contract info for all tokens
      for (const token of tokens) {
        try {
          const addressInfo = await client.getAddressInfo(
            token.chainId,
            token.address
          );

          if (addressInfo) {
            securityData.push({
              // Basic token info
              symbol: token.symbol,
              address: token.address,
              chainId: token.chainId,
              
              // Contract verification & security
              isVerified: addressInfo.is_verified || false,
              isScam: addressInfo.is_scam || false,
              reputation: addressInfo.reputation,
              
              // Proxy contract info
              isProxy: (addressInfo.implementations?.length || 0) > 0,
              implementations: addressInfo.implementations?.map(impl => ({
                address: impl.address,
                name: impl.name,
              })) || [],
              
              // Contract creator info
              creatorAddress: addressInfo.creator_address_hash,
              creationTxHash: addressInfo.creation_transaction_hash,
              creationStatus: addressInfo.creation_status,
              
              // Token metadata
              tokenType: addressInfo.token?.type,
              tokenName: addressInfo.token?.name,
              tokenSymbol: addressInfo.token?.symbol,
              decimals: addressInfo.token?.decimals,
              iconUrl: addressInfo.token?.icon_url,
              
              // Supply & holders
              totalSupply: addressInfo.token?.total_supply,
              holders: addressInfo.token?.holders,
              
              // Market data
              price: addressInfo.token?.exchange_rate,
              marketCap: addressInfo.token?.circulating_market_cap,
              volume24h: addressInfo.token?.volume_24h,
              
              // Address balance (if querying a wallet)
              balance: addressInfo.balance,
              balanceUsd: addressInfo.balanceUsd,
              isContract: addressInfo.isContract,
              ensName: addressInfo.ensName,
            });
          }
        } catch (err) {
          console.error(`Failed to fetch contract info for ${token.symbol}:`, err);
          // Continue with other tokens even if one fails
        }
      }

      await client.disconnect();
    } catch (error) {
      console.error('Error connecting to Blockscout client:', error);
      await client.disconnect();
      throw error;
    }

    return NextResponse.json({
      securityData,
      count: securityData.length,
    });
  } catch (error) {
    console.error('Error in contract-security API:', error);
    return NextResponse.json(
      { error: 'Failed to fetch contract security data' },
      { status: 500 }
    );
  }
}