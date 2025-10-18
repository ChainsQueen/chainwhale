import { AlertTriangle, XCircle, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

type AlertVariant = 'warning' | 'error' | 'info' | 'success';

interface AlertBoxProps {
  variant: AlertVariant;
  title: string;
  description: string;
  icon?: LucideIcon;
  className?: string;
}

const variantStyles: Record<AlertVariant, { container: string; icon: string; title: string }> = {
  warning: {
    container: 'bg-yellow-500/10 border-yellow-500/20',
    icon: 'text-yellow-500',
    title: 'text-yellow-500',
  },
  error: {
    container: 'bg-red-600/20 border-red-600/40',
    icon: 'text-red-600',
    title: 'text-red-600',
  },
  info: {
    container: 'bg-orange-500/10 border-orange-500/20',
    icon: 'text-orange-500',
    title: 'text-orange-500',
  },
  success: {
    container: 'bg-green-500/10 border-green-500/20',
    icon: 'text-green-500',
    title: 'text-green-500',
  },
};

const defaultIcons: Record<AlertVariant, LucideIcon> = {
  warning: AlertTriangle,
  error: XCircle,
  info: AlertTriangle,
  success: AlertTriangle,
};

/**
 * Reusable alert box component for displaying warnings, errors, and info messages
 * 
 * @example
 * <AlertBox
 *   variant="error"
 *   title="SCAM WARNING"
 *   description="This contract has been flagged as a potential scam."
 * />
 */
export function AlertBox({ variant, title, description, icon, className }: AlertBoxProps) {
  const styles = variantStyles[variant];
  const Icon = icon || defaultIcons[variant];

  return (
    <div className={cn('p-3 border rounded-lg', styles.container, className)}>
      <div className="flex gap-2">
        <Icon className={cn('h-4 w-4 shrink-0 mt-0.5', styles.icon)} />
        <div className="space-y-1">
          <p className={cn('text-sm font-medium', styles.title)}>{title}</p>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
      </div>
    </div>
  );
}