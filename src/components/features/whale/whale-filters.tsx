import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { AnimatedHover } from '@/components/ui/animated-hover';
import { Filter } from 'lucide-react';
import type { WhaleFilters } from '@/core/hooks/use-whale-filters';

export interface WhaleFiltersProps {
  filters: WhaleFilters;
  onToggleChain: (chainId: string) => void;
  onSetTimeRange: (range: string) => void;
  onSetMinValue: (value: number) => void;
  onSetTokenFilter: (token: string) => void;
  onFilterChange?: () => void;
}

const AVAILABLE_CHAINS = [
  { id: '1', name: 'Ethereum' },
  { id: '8453', name: 'Base' },
  { id: '42161', name: 'Arbitrum' },
  { id: '10', name: 'Optimism' },
  { id: '137', name: 'Polygon' },
];

const TIME_RANGES = [
  { value: '1h', label: '1 Hour' },
  { value: '6h', label: '6 Hours' },
  { value: '24h', label: '24 Hours' },
  { value: '7d', label: '7 Days' },
];

const MIN_VALUES = [10000, 50000, 100000, 500000, 1000000];

const TOKEN_FILTERS = ['USDC', 'USDT', 'WETH', 'DAI', 'WBTC'];

/**
 * Whale tracker filters component
 * 
 * @component
 * @example
 * <WhaleFiltersComponent
 *   filters={filters}
 *   onToggleChain={toggleChain}
 *   onSetTimeRange={setTimeRange}
 *   onSetMinValue={setMinValue}
 *   onSetTokenFilter={setTokenFilter}
 * />
 */
export function WhaleFiltersComponent({
  filters,
  onToggleChain,
  onSetTimeRange,
  onSetMinValue,
  onSetTokenFilter,
  onFilterChange,
}: WhaleFiltersProps) {
  const handleFilterChange = (callback: () => void) => {
    callback();
    onFilterChange?.();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1 }}
      className="space-y-3 sm:space-y-4"
    >
      {/* Chain Filter */}
      <div>
        <AnimatedHover type="label">
          <h3 className="text-xs sm:text-sm font-medium mb-2 flex items-center gap-2">
            <Filter className="w-3 h-3 sm:w-4 sm:h-4" />
            Chains
          </h3>
        </AnimatedHover>
        <div className="flex flex-wrap gap-1.5 sm:gap-2">
          {AVAILABLE_CHAINS.map(chain => (
            <AnimatedHover key={chain.id} type="filter">
              <Badge
                variant={filters.selectedChains.includes(chain.id) ? 'default' : 'outline'}
                className="cursor-pointer text-xs sm:text-sm px-2 py-1 sm:px-2.5"
                onClick={() => handleFilterChange(() => onToggleChain(chain.id))}
              >
                {chain.name}
              </Badge>
            </AnimatedHover>
          ))}
        </div>
      </div>

      {/* Time Range Filter */}
      <div>
        <AnimatedHover type="label">
          <h3 className="text-xs sm:text-sm font-medium mb-2">Time Range</h3>
        </AnimatedHover>
        <div className="flex flex-wrap gap-1.5 sm:gap-2">
          {TIME_RANGES.map(range => (
            <AnimatedHover key={range.value} type="filter">
              <Badge
                variant={filters.timeRange === range.value ? 'default' : 'outline'}
                className="cursor-pointer text-xs sm:text-sm px-2 py-1 sm:px-2.5"
                onClick={() => handleFilterChange(() => onSetTimeRange(range.value))}
              >
                {range.label}
              </Badge>
            </AnimatedHover>
          ))}
        </div>
      </div>

      {/* Min Value Filter */}
      <div>
        <AnimatedHover type="label">
          <h3 className="text-xs sm:text-sm font-medium mb-2">Minimum Value</h3>
        </AnimatedHover>
        <div className="flex flex-wrap gap-1.5 sm:gap-2">
          {MIN_VALUES.map(value => (
            <AnimatedHover key={value} type="filter">
              <Badge
                variant={filters.minValue === value ? 'default' : 'outline'}
                className="cursor-pointer text-xs sm:text-sm px-2 py-1 sm:px-2.5"
                onClick={() => handleFilterChange(() => onSetMinValue(value))}
              >
                ${(value / 1000).toLocaleString()}K+
              </Badge>
            </AnimatedHover>
          ))}
        </div>
      </div>

      {/* Token Filter */}
      <div>
        <AnimatedHover type="label">
          <h3 className="text-xs sm:text-sm font-medium mb-2">Token Filter</h3>
        </AnimatedHover>
        <div className="flex flex-wrap gap-1.5 sm:gap-2">
          <AnimatedHover key="all-tokens" type="filter">
            <Badge
              variant={filters.tokenFilter === '' ? 'default' : 'outline'}
              className="cursor-pointer text-xs sm:text-sm px-2 py-1 sm:px-2.5"
              onClick={() => handleFilterChange(() => onSetTokenFilter(''))}
            >
              All Tokens
            </Badge>
          </AnimatedHover>
          {TOKEN_FILTERS.map(token => (
            <AnimatedHover key={token} type="filter">
              <Badge
                variant={filters.tokenFilter === token ? 'default' : 'outline'}
                className="cursor-pointer text-xs sm:text-sm px-2 py-1 sm:px-2.5"
                onClick={() => handleFilterChange(() => onSetTokenFilter(token))}
              >
                {token}
              </Badge>
            </AnimatedHover>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
