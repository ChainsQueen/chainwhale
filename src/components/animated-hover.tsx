'use client';

import { motion, Variants } from 'framer-motion';
import { ReactNode } from 'react';

type AnimationType = 'card' | 'button' | 'filter' | 'text' | 'scale' | 'lift' | 'stat' | 'label';

interface AnimatedHoverProps {
  children: ReactNode;
  type?: AnimationType;
  className?: string;
  disabled?: boolean;
}

// Predefined animation variants
const animationVariants: Record<AnimationType, Variants> = {
  card: {
    rest: { 
      scale: 1, 
      y: 0, 
      boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1)' 
    },
    hover: { 
      scale: 1.02, 
      y: -4, 
      boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
      transition: { duration: 0.2, ease: 'easeOut' }
    }
  },
  button: {
    rest: { scale: 1 },
    hover: { 
      scale: 1.05, 
      transition: { duration: 0.2, ease: 'easeOut' } 
    },
    tap: { scale: 0.95 }
  },
  filter: {
    rest: { scale: 1, opacity: 0.9 },
    hover: { 
      scale: 1.05, 
      opacity: 1, 
      transition: { duration: 0.2, ease: 'easeOut' } 
    },
    tap: { scale: 0.95 }
  },
  text: {
    rest: { scale: 1 },
    hover: { 
      scale: 1.03,
      originX: 0.5,
      originY: 0.5,
      transition: { duration: 0.2, ease: 'easeOut' } 
    }
  },
  scale: {
    rest: { scale: 1 },
    hover: { 
      scale: 1.1, 
      transition: { duration: 0.2, ease: 'easeOut' } 
    },
    tap: { scale: 0.9 }
  },
  lift: {
    rest: { y: 0 },
    hover: { 
      y: -8, 
      transition: { duration: 0.3, ease: 'easeOut' } 
    }
  },
  stat: {
    rest: { 
      scale: 1
    },
    hover: { 
      scale: 1.03,
      transition: { duration: 0.2, ease: 'easeOut' }
    }
  },
  label: {
    rest: { opacity: 0.8 },
    hover: { 
      opacity: 1,
      transition: { duration: 0.15, ease: 'easeOut' } 
    }
  }
};

/**
 * Reusable animated hover component with predefined animation types
 * 
 * @example
 * <AnimatedHover type="card">
 *   <Card>Content</Card>
 * </AnimatedHover>
 * 
 * <AnimatedHover type="button">
 *   <Button>Click me</Button>
 * </AnimatedHover>
 */
export function AnimatedHover({ 
  children, 
  type = 'button', 
  className = '',
  disabled = false 
}: AnimatedHoverProps) {
  const variants = animationVariants[type];

  if (disabled) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      className={className}
      variants={variants}
      initial="rest"
      whileHover="hover"
      whileTap="tap"
      animate="rest"
    >
      {children}
    </motion.div>
  );
}