import { NextRequest, NextResponse } from 'next/server';
import { BlockscoutClient } from '@/lib/blockscout';
import { AIEngine } from '@/lib/ai';

export async function POST(request: NextRequest) {
  let blockscout: BlockscoutClient | null = null;

  try {
    const body = await request.json();
    const { address, chains = ['1', '8453', '42161', '10', '137'] } = body;

    if (!address) {
      return NextResponse.json(
        { error: 'Address is required' },
        { status: 400 }
      );
    }

    // Initialize services
    blockscout = new BlockscoutClient();
    await blockscout.connect();

    // Don't initialize AI here - it will be called on-demand via separate endpoint
    const apiKey = process.env.OPENAI_API_KEY;

    // Get ENS name (only on Ethereum mainnet)
    let ensName: string | undefined;
    try {
      const addressInfo = await blockscout.getAddressInfo('1', address);
      ensName = addressInfo.ensName;
    } catch (error) {
      console.log('ENS lookup failed:', error);
    }

    // Fetch data for each chain
    const holdings = [];
    const chainBalances: Record<string, number> = {};
    const recentTransactions: any[] = [];
    let totalValue = 0;

    for (const chainId of chains) {
      try {
        // Get address info
        const addressInfo = await blockscout.getAddressInfo(chainId, address);
        
        console.log(`Chain ${chainId} address info:`, {
          balance: addressInfo.balance,
          balanceUsd: addressInfo.balanceUsd,
        });
        
        // Get tokens
        const tokens = await blockscout.getTokensByAddress(chainId, address);

        // Calculate native balance value
        const nativeBalanceUsd = addressInfo.balanceUsd || 0;
        
        // Add native balance to holdings if significant
        if (nativeBalanceUsd > 0.01) {
          const nativeSymbol = chainId === '1' ? 'ETH' 
            : chainId === '8453' ? 'ETH' 
            : chainId === '42161' ? 'ETH' 
            : chainId === '10' ? 'ETH'
            : chainId === '137' ? 'MATIC'
            : 'Native';
          const nativeBalance = parseFloat(addressInfo.balance || '0') / 1e18; // Wei to native token
          
          holdings.push({
            symbol: nativeSymbol,
            balance: nativeBalance.toFixed(4),
            value: nativeBalanceUsd,
            chain: chainId,
            address: 'native',
          });
        }
        
        // Calculate token values
        let tokenValue = 0;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        for (const token of tokens as any[]) {
          const tokenSymbol = token.token?.symbol || 'UNKNOWN';
          const tokenBalance = token.value || '0';
          const tokenDecimals = parseInt(token.token?.decimals || '18');
          const exchangeRate = parseFloat(token.token?.exchange_rate || '0');
          
          // Calculate actual token amount
          const tokenAmount = parseFloat(tokenBalance) / Math.pow(10, tokenDecimals);
          const tokenValueUsd = tokenAmount * exchangeRate;
          
          tokenValue += tokenValueUsd;
          
          // Only add tokens with value > $0.01
          if (tokenValueUsd > 0.01) {
            holdings.push({
              symbol: tokenSymbol,
              balance: tokenAmount.toFixed(4),
              value: tokenValueUsd,
              chain: chainId,
              address: token.token?.address || '',
            });
          }
        }

        // Total chain value
        const chainValue = nativeBalanceUsd + tokenValue;
        chainBalances[chainId] = chainValue;
        totalValue += chainValue;

        // Get recent token transfers (last 24h)
        try {
          const { items: transfers } = await blockscout.getTokenTransfers(
            chainId,
            address,
            '24h',
            'now'
          );
          
          // Add chain info and format transfers
          recentTransactions.push(...transfers.slice(0, 15).map((transfer: any) => ({
            hash: transfer.hash,
            from: transfer.from,
            to: transfer.to,
            token: transfer.token,
            value: transfer.value,
            valueUsd: transfer.valueUsd,
            timestamp: transfer.timestamp,
            chainId,
          })));
        } catch (error) {
          console.log(`No recent token transfers on chain ${chainId}`);
        }
      } catch (error) {
        console.error(`Error analyzing wallet on chain ${chainId}:`, error);
      }
    }

    // Get AI analysis (or provide basic analysis if no API key)
    const walletData = {
      address,
      totalValue,
      chains: chainBalances,
    };

    // Sort holdings by value
    holdings.sort((a, b) => b.value - a.value);

    // Calculate whale score based on transfer activity
    const totalVolume24h = recentTransactions.reduce((sum, tx) => sum + (tx.valueUsd || 0), 0);
    const uniqueTokens = new Set(recentTransactions.map(tx => tx.token?.address).filter(Boolean)).size;
    const transferCount = recentTransactions.length;

    // Calculate risk score based on activity patterns
    let riskScore = 50; // Start with medium risk
    let riskFactors: string[] = [];
    
    // Lower risk for high activity (established wallet)
    if (transferCount > 20) {
      riskScore -= 10;
      riskFactors.push('High activity suggests established wallet');
    } else if (transferCount < 5) {
      riskScore += 10;
      riskFactors.push('Low activity - limited transaction history');
    }
    
    // Lower risk for token diversity
    if (uniqueTokens > 10) {
      riskScore -= 10;
      riskFactors.push('Diversified portfolio across multiple tokens');
    } else if (uniqueTokens < 3) {
      riskScore += 5;
      riskFactors.push('Limited token diversity');
    }
    
    // Lower risk for high volume (whale/institutional)
    if (totalVolume24h > 100000) {
      riskScore -= 15;
      riskFactors.push('High transaction volume indicates institutional or whale activity');
    } else if (totalVolume24h < 1000 && transferCount > 10) {
      riskScore += 10;
      riskFactors.push('Many small transactions - potential dusting or testing');
    }
    
    // Ensure score stays in 0-100 range
    riskScore = Math.max(0, Math.min(100, riskScore));
    
    // Generate summary with risk insights
    const riskLevel = riskScore < 30 ? 'low' : riskScore < 70 ? 'medium' : 'high';
    const summaryParts = [
      `Wallet analyzed across ${Object.keys(chainBalances).length} chains.`,
      transferCount > 0 
        ? `Detected ${transferCount} token transfers in the last 24 hours with a total volume of $${totalVolume24h.toLocaleString()}.`
        : 'No recent transfer activity detected.',
      uniqueTokens > 0 ? `Active with ${uniqueTokens} different tokens.` : '',
      `\n\nRisk assessment: ${riskLevel} (${riskScore}/100).`,
      riskFactors.length > 0 ? riskFactors.join('. ') + '.' : '',
    ];
    
    // Basic analysis without AI (AI will be called on-demand)
    const analysis = {
      address,
      totalValue,
      chains: chainBalances,
      tokens: holdings,
      summary: summaryParts.filter(Boolean).join(' '),
      riskScore,
      insights: [],
    };
    
    // Whale scoring (0-100)
    const volumeScore = Math.min(totalVolume24h / 10_000_000, 1) * 40; // 40% weight
    const tokenScore = Math.min(uniqueTokens / 50, 1) * 20; // 20% weight
    const activityScore = Math.min(transferCount / 100, 1) * 20; // 20% weight
    const holdingsScore = Math.min(totalValue / 1_000_000, 1) * 20; // 20% weight
    
    const whaleScore = Math.round(volumeScore + tokenScore + activityScore + holdingsScore);
    
    // Determine whale category
    let whaleCategory = 'Unknown';
    if (whaleScore >= 80) whaleCategory = 'Mega Whale';
    else if (whaleScore >= 60) whaleCategory = 'Large Whale';
    else if (whaleScore >= 40) whaleCategory = 'Medium Whale';
    else if (whaleScore >= 20) whaleCategory = 'Small Whale';
    else whaleCategory = 'Regular User';
    
    // Update insights with whale category
    const insights = [
      `Whale Category: ${whaleCategory} (Score: ${whaleScore}/100)`,
      `24h Transfer Volume: $${totalVolume24h.toLocaleString()}`,
      `Active with ${transferCount} transfers in last 24h`,
      uniqueTokens > 0 ? `Holds ${uniqueTokens} different tokens` : 'No token diversity detected',
    ];

    return NextResponse.json({
      holdings,
      analysis,
      ensName,
      recentTransactions: recentTransactions.slice(0, 10),
    });
  } catch (error) {
    console.error('Error in analyze-wallet API:', error);
    return NextResponse.json(
      { error: 'Failed to analyze wallet' },
      { status: 500 }
    );
  } finally {
    // Clean up connection
    if (blockscout) {
      await blockscout.disconnect();
    }
  }
}
