/**
 * Wallet-related utility functions
 * Pure functions with no side effects
 * 
 * @module core/utils/wallet-utils
 */

import { CHAINS, DEFAULT_CHAIN_ID } from '@/core/constants/chains.constants';

/**
 * Validates if a string is a valid Ethereum address or ENS name
 * 
 * @param addr - Address string to validate
 * @returns True if valid Ethereum address (0x + 40 hex chars) or ENS name (.eth)
 * 
 * @example
 * validateAddress('0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb') // true
 * validateAddress('vitalik.eth') // true
 * validateAddress('invalid') // false
 */
export function validateAddress(addr: string): boolean {
  const ethAddressRegex = /^0x[a-fA-F0-9]{40}$/;
  const ensNameRegex = /^[a-zA-Z0-9-]+\.eth$/;
  return ethAddressRegex.test(addr) || ensNameRegex.test(addr);
}

/**
 * Generates a blockchain explorer URL for a given address or transaction
 * 
 * @param address - Ethereum address or transaction hash
 * @param chainId - Chain ID (defaults to Ethereum mainnet)
 * @param type - Type of explorer page ('tx' | 'address' | 'token')
 * @returns Full explorer URL
 * 
 * @example
 * getExplorerUrl('1', '0x123...', 'address') 
 * // 'https://etherscan.io/address/0x123...'
 * 
 * getExplorerUrl('8453', '0xabc...', 'tx')
 * // 'https://basescan.org/tx/0xabc...'
 */
export function getExplorerUrl(
  chainId: string,
  address: string,
  type: 'tx' | 'address' | 'token' = 'address'
): string {
  const chain = CHAINS[chainId || DEFAULT_CHAIN_ID];
  const baseUrl = chain?.explorerUrl || CHAINS[DEFAULT_CHAIN_ID].explorerUrl;
  return `${baseUrl}/${type}/${address}`;
}

/**
 * Gets the human-readable name for a chain ID
 * 
 * @param chainId - Blockchain chain ID
 * @returns Chain name (e.g., 'Ethereum', 'Base') or 'Chain {id}' if unknown
 * 
 * @example
 * getChainName('1') // 'Ethereum'
 * getChainName('8453') // 'Base'
 * getChainName('999') // 'Chain 999'
 */
export function getChainName(chainId: string): string {
  return CHAINS[chainId]?.name || `Chain ${chainId}`;
}

/**
 * Formats an ETH balance from wei to ETH with 2 decimal places
 * 
 * @param wei - Balance value in wei (as string)
 * @returns Formatted ETH balance
 * 
 * @example
 * formatEthBalance('1000000000000000000') // '1.00'
 * formatEthBalance('1500000000000000000') // '1.50'
 */
export function formatEthBalance(wei: string): string {
  const ethValue = Number(wei) / 1e18;
  return ethValue.toFixed(2);
}

/**
 * Formats a USD value with proper formatting
 * 
 * @param value - Value in USD
 * @param options - Formatting options (compact for K/M notation)
 * @returns Formatted USD string
 * 
 * @example
 * formatUsdValue(1234.56) // '$1,234.56'
 * formatUsdValue(1500000, { compact: true }) // '$1.5M'
 */
export function formatUsdValue(
  value: number,
  options?: { compact?: boolean }
): string {
  if (options?.compact && value >= 1000000) {
    return `$${(value / 1000000).toFixed(1)}M`;
  }
  
  if (options?.compact && value >= 1000) {
    return `$${(value / 1000).toFixed(1)}K`;
  }
  
  return `$${value.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

/**
 * Gets the Tailwind CSS color class for a risk score
 * 
 * @param score - Risk score (0-10)
 * @returns Tailwind text color class
 * 
 * @example
 * getRiskColor(2) // 'text-green-500' (low risk)
 * getRiskColor(5) // 'text-yellow-500' (medium risk)
 * getRiskColor(8) // 'text-red-500' (high risk)
 */
export function getRiskColor(score: number): string {
  if (score <= 3) return 'text-green-500';
  if (score <= 6) return 'text-yellow-500';
  return 'text-red-500';
}

/**
 * Gets the human-readable label for a risk score
 * 
 * @param score - Risk score (0-10)
 * @returns Risk level label
 * 
 * @example
 * getRiskLabel(2) // 'Low'
 * getRiskLabel(5) // 'Medium'
 * getRiskLabel(8) // 'High'
 */
export function getRiskLabel(score: number): string {
  if (score <= 3) return 'Low';
  if (score <= 6) return 'Medium';
  return 'High';
}