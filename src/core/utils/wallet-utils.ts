/**
 * Wallet-related utility functions
 * Pure functions with no side effects
 */

export function validateAddress(addr: string): boolean {
  const ethAddressRegex = /^0x[a-fA-F0-9]{40}$/;
  const ensNameRegex = /^[a-zA-Z0-9-]+\.eth$/;
  return ethAddressRegex.test(addr) || ensNameRegex.test(addr);
}

export function getExplorerUrl(address: string, chainId?: string, type: 'tx' | 'address' | 'token' = 'address'): string {
  const explorers: Record<string, string> = {
    '1': 'https://etherscan.io',
    '8453': 'https://basescan.org',
    '42161': 'https://arbiscan.io',
    '10': 'https://optimistic.etherscan.io',
    '137': 'https://polygonscan.com',
  };
  const baseUrl = chainId ? explorers[chainId] : explorers['1'];
  return `${baseUrl}/${type}/${address}`;
}

export function getChainName(chainId: string): string {
  const chains: Record<string, string> = {
    '1': 'Ethereum',
    '8453': 'Base',
    '42161': 'Arbitrum',
    '10': 'Optimism',
    '137': 'Polygon',
  };
  return chains[chainId] || `Chain ${chainId}`;
}

export function formatEthBalance(balance: number): string {
  return balance.toLocaleString('en-US', {
    minimumFractionDigits: 4,
    maximumFractionDigits: 4,
  });
}

export function formatUsdValue(value: number): string {
  return value.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function getRiskColor(score: number): string {
  if (score < 30) return 'text-green-500';
  if (score < 70) return 'text-yellow-500';
  return 'text-red-500';
}

export function getRiskLabel(score: number): string {
  if (score < 30) return 'Low Risk';
  if (score < 70) return 'Medium Risk';
  return 'High Risk';
}