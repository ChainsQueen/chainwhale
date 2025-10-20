'use client';

import { motion, Variants } from 'framer-motion';
import { ReactNode } from 'react';

/**
 * Available animation types for hover effects
 */
type AnimationType = 'card' | 'button' | 'filter' | 'text' | 'scale' | 'lift' | 'stat' | 'label';

/**
 * Props for AnimatedHover component
 */
interface AnimatedHoverProps {
  /** Content to be animated */
  children: ReactNode;
  /** Predefined animation type */
  type?: AnimationType;
  /** Additional CSS classes */
  className?: string;
  /** Disable animations (renders static div) */
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
 * Reusable animated hover wrapper with predefined Framer Motion animations
 * 
 * Provides 8 predefined animation types optimized for different UI elements:
 * - **card**: Scale + lift with shadow (1.02x scale, -4px lift)
 * - **button**: Scale on hover and tap (1.05x hover, 0.95x tap)
 * - **filter**: Scale + opacity change (1.05x scale, full opacity)
 * - **text**: Subtle scale from center (1.03x scale)
 * - **scale**: Larger scale effect (1.1x hover, 0.9x tap)
 * - **lift**: Vertical lift only (-8px on hover)
 * - **stat**: Gentle scale for stat cards (1.03x scale)
 * - **label**: Opacity fade (0.8 to 1.0)
 * 
 * All animations use smooth easing and appropriate durations for polished UX.
 * Animations can be disabled via the `disabled` prop for accessibility or performance.
 * 
 * @component
 * 
 * @example
 * // Card with lift and shadow
 * <AnimatedHover type="card">
 *   <Card>Hover me</Card>
 * </AnimatedHover>
 * 
 * @example
 * // Button with scale and tap feedback
 * <AnimatedHover type="button">
 *   <Button>Click me</Button>
 * </AnimatedHover>
 * 
 * @example
 * // Disabled animations
 * <AnimatedHover type="card" disabled={true}>
 *   <Card>No animation</Card>
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