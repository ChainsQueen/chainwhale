/**
 * Wallet-related utility functions
 * Pure functions with no side effects
 * 
 * @module core/utils/wallet-utils
 */

import { CHAINS, DEFAULT_CHAIN_ID } from '@/core/constants/chains.constants';
import type { RiskLevel, RiskScore } from '@/core/types/wallet.types';

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
 * getExplorerUrl('0x123...', '1', 'address') 
 * // 'https://etherscan.io/address/0x123...'
 * 
 * getExplorerUrl('0xabc...', '8453', 'tx')
 * // 'https://basescan.org/tx/0xabc...'
 */
export function getExplorerUrl(
  address: string,
  chainId?: string,
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
 * Formats an ETH balance with 4 decimal places
 * 
 * @param balance - Balance value in ETH
 * @returns Formatted string with thousands separators and 4 decimals
 * 
 * @example
 * formatEthBalance(1234.5678) // '1,234.5678'
 * formatEthBalance(0.0001) // '0.0001'
 */
export function formatEthBalance(balance: number): string {
  return balance.toLocaleString('en-US', {
    minimumFractionDigits: 4,
    maximumFractionDigits: 4,
  });
}

/**
 * Formats a USD value with 2 decimal places
 * 
 * @param value - Value in USD
 * @returns Formatted string with thousands separators and 2 decimals
 * 
 * @example
 * formatUsdValue(1234567.89) // '1,234,567.89'
 * formatUsdValue(0.5) // '0.50'
 */
export function formatUsdValue(value: number): string {
  return value.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/**
 * Gets the Tailwind CSS color class for a risk score
 * 
 * @param score - Risk score (0-100)
 * @returns Tailwind text color class
 * 
 * @example
 * getRiskColor(20) // 'text-green-500' (low risk)
 * getRiskColor(50) // 'text-yellow-500' (medium risk)
 * getRiskColor(80) // 'text-red-500' (high risk)
 */
export function getRiskColor(score: RiskScore): string {
  if (score < 30) return 'text-green-500';
  if (score < 70) return 'text-yellow-500';
  return 'text-red-500';
}

/**
 * Gets the human-readable label for a risk score
 * 
 * @param score - Risk score (0-100)
 * @returns Risk level label
 * 
 * @example
 * getRiskLabel(20) // 'Low Risk'
 * getRiskLabel(50) // 'Medium Risk'
 * getRiskLabel(80) // 'High Risk'
 */
export function getRiskLabel(score: RiskScore): RiskLevel {
  if (score < 30) return 'low';
  if (score < 70) return 'medium';
  return 'high';
}