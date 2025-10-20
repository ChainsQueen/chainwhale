import { Badge } from '@/components/ui/badge';
import { Sparkles } from 'lucide-react';

interface DataSourceBadgeProps {
  dataSource?: 'mcp' | 'http' | 'hybrid';
  size?: 'sm' | 'md';
}

export function DataSourceBadge({ dataSource, size = 'md' }: DataSourceBadgeProps) {
  if (!dataSource) return null;
  
  const sizeClasses = size === 'sm' ? 'text-[10px] px-1.5 py-0.5' : 'text-xs px-2 py-1';
  
  if (dataSource === 'mcp') {
    return (
      <Badge variant="default" className={`${sizeClasses} bg-gradient-to-r from-purple-500 to-blue-500`}>
        <Sparkles className="w-2.5 h-2.5 mr-0.5" />
        MCP
      </Badge>
    );
  }
  
  if (dataSource === 'hybrid') {
    return (
      <Badge variant="default" className={`${sizeClasses} bg-gradient-to-r from-purple-500 via-blue-500 to-slate-500`}>
        <Sparkles className="w-2.5 h-2.5 mr-0.5" />
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