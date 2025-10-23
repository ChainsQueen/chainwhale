import { Badge } from '@/components/ui/badge';
import { Sparkles } from 'lucide-react';

/**
 * Props for DataSourceBadge component
 */
interface DataSourceBadgeProps {
  /** Data source type (MCP, HTTP, or Hybrid) */
  dataSource?: 'mcp' | 'http' | 'hybrid';
  /** Badge size variant */
  size?: 'xs' | 'sm' | 'md';
}

/**
 * Displays a badge indicating the data source for blockchain data
 * 
 * Shows different visual styles based on data source:
 * - **MCP**: Purple-to-blue gradient with sparkles icon (Model Context Protocol)
 * - **Hybrid**: Purple-blue-slate gradient with sparkles (mixed sources)
 * - **HTTP**: Gray badge (standard HTTP API)
 * 
 * Returns null if no data source is provided.
 * 
 * @component
 * 
 * @example
 * // MCP data source
 * <DataSourceBadge dataSource="mcp" size="md" />
 * 
 * @example
 * // HTTP data source (small)
 * <DataSourceBadge dataSource="http" size="sm" />
 * 
 * @example
 * // Hybrid data source
 * <DataSourceBadge dataSource="hybrid" />
 */
export function DataSourceBadge({ dataSource, size = 'md' }: DataSourceBadgeProps) {
  if (!dataSource) return null;
  
  const sizeClasses = size === 'xs' ? 'text-[9px] px-1 py-0' : size === 'sm' ? 'text-[10px] px-1.5 py-0.5' : 'text-xs px-2 py-1';
  const showIcon = size !== 'xs';
  
  if (dataSource === 'mcp') {
    return (
      <Badge variant="default" className={`${sizeClasses} bg-gradient-to-r from-purple-500 to-blue-500`}>
        {showIcon && <Sparkles className="w-2.5 h-2.5 mr-0.5" />}
        MCP
      </Badge>
    );
  }
  
  if (dataSource === 'hybrid') {
    return (
      <Badge variant="default" className={`${sizeClasses} bg-gradient-to-r from-purple-500 via-blue-500 to-slate-500`}>
        {showIcon && <Sparkles className="w-2.5 h-2.5 mr-0.5" />}
        HYBRID
      </Badge>
    );
  }
  
  return (
    <Badge variant="secondary" className={`${sizeClasses} bg-slate-600`}>
      HTTP
    </Badge>
  );
}