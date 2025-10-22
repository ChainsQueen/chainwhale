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
}: FloatingInfoCardProps) {
  const positionClasses = {
    'top-right': '-top-8 -right-8',
    'bottom-left': '-bottom-8 -left-8',
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
      className={`absolute z-20 ${positionClasses[position]}`}
    >
      <Card className="p-4 shadow-lg border-blue-500/30 bg-gradient-to-r from-blue-500/5 via-slate-500/5 to-blue-500/5">
        <div className="flex items-center gap-2">
          <Icon className="w-5 h-5 text-blue-500" />
          <div>
            <p className="text-xs text-muted-foreground">{title}</p>
            {children}
          </div>
        </div>
      </Card>
    </motion.div>
  );
}
