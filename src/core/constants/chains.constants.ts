/**
 * Blockchain chain constants and configuration
 * Centralized chain data for the application
 */

export interface ChainConfig {
  id: string;
  name: string;
  explorerUrl: string;
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
}

/**
 * Supported blockchain chains
 */
export const CHAINS: Record<string, ChainConfig> = {
  '1': {
    id: '1',
    name: 'Ethereum',
    explorerUrl: 'https://eth.blockscout.com',
    nativeCurrency: {
      name: 'Ether',
      symbol: 'ETH',
      decimals: 18,
    },
  },
  '8453': {
    id: '8453',
    name: 'Base',
    explorerUrl: 'https://base.blockscout.com',
    nativeCurrency: {
      name: 'Ether',
      symbol: 'ETH',
      decimals: 18,
    },
  },
  '42161': {
    id: '42161',
    name: 'Arbitrum',
    explorerUrl: 'https://arbitrum.blockscout.com',
    nativeCurrency: {
      name: 'Ether',
      symbol: 'ETH',
      decimals: 18,
    },
  },
  '10': {
    id: '10',
    name: 'Optimism',
    explorerUrl: 'https://optimism.blockscout.com',
    nativeCurrency: {
      name: 'Ether',
      symbol: 'ETH',
      decimals: 18,
    },
  },
  '137': {
    id: '137',
    name: 'Polygon',
    explorerUrl: 'https://polygon.blockscout.com',
    nativeCurrency: {
      name: 'MATIC',
      symbol: 'MATIC',
      decimals: 18,
    },
  },
} as const;

/**
 * Default chain ID (Ethereum Mainnet)
 */
export const DEFAULT_CHAIN_ID = '1';

/**
 * List of all supported chain IDs
 */
export const SUPPORTED_CHAIN_IDS = Object.keys(CHAINS);