'use client';

import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { LucideIcon } from 'lucide-react';
import { ReactNode } from 'react';

/**
 * Props for FloatingInfoCard component
 */
interface FloatingInfoCardProps {
  /** Lucide icon component to display */
  icon: LucideIcon;
  /** Title text for the card */
  title: string;
  /** Content to display in the card */
  children: ReactNode;
  /** Position of the card */
  position: 'top-right' | 'bottom-left';
  /** Animation delay in seconds */
  animationDelay?: number;
  /** Animation duration in seconds */
  duration?: number;
  /** Optional badge to display in top-left corner */
  badge?: ReactNode;
}

/**
 * Reusable floating info card component with animation.
 * Used for whale alerts, live activity, and other floating information.
 * 
 * @example
 * ```tsx
 * <FloatingInfoCard
 *   icon={TrendingUp}
 *   title="Whale Alert (1h)"
 *   position="top-right"
 *   duration={3}
 * >
 *   <p className="font-semibold">$5.2M Transfer</p>
 * </FloatingInfoCard>
 * ```
 */
export function FloatingInfoCard({
  icon: Icon,
  title,
  children,
  position,
  animationDelay = 0,
  duration = 3,
  badge,
}: FloatingInfoCardProps) {
  const positionClasses = {
    'top-right': '-top-12 right-2 md:-top-8 md:-right-8',
    'bottom-left': '-bottom-12 left-2 md:-bottom-8 md:-left-8',
  };

  const rotationDirection = position === 'top-right' ? [0, 5, 0] : [0, -5, 0];
  const yDirection = position === 'top-right' ? [0, -15, 0] : [0, 15, 0];

  return (
    <motion.div
      animate={{
        y: yDirection,
        rotate: rotationDirection,
      }}
      transition={{
        duration,
        repeat: Infinity,
        ease: 'easeInOut',
        delay: animationDelay,
      }}
      className={`absolute z-20 pointer-events-auto ${positionClasses[position]}`}
    >
      <Card className="relative p-3 md:p-4 shadow-lg border-blue-500/30 bg-gradient-to-r from-blue-500/5 via-slate-500/5 to-blue-500/5">
        {badge && (
          <div className="absolute top-1 left-1 z-10">
            {badge}
          </div>
        )}
        <div className="flex items-center gap-2">
          <Icon className="w-4 h-4 md:w-5 md:h-5 text-blue-500" />
          <div>
            <p className="text-xs text-muted-foreground">{title}</p>
            {children}
          </div>
        </div>
      </Card>
    </motion.div>
  );
}
