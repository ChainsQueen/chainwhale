'use client';

import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';

interface CelebrationAnimationProps {
  show: boolean;
}

/**
 * Celebration animation with fireworks and confetti
 * Displays when a new largest whale transaction is detected
 * 
 * @component
 * @param props - Component props
 * @param props.show - Whether to show the celebration animation
 * 
 * @example
 * <CelebrationAnimation show={showCelebration} />
 */
export function CelebrationAnimation({ show }: CelebrationAnimationProps) {
  if (!show) return null;

  return (
    <div className="absolute -top-20 left-1/2 -translate-x-1/2 z-50 pointer-events-none">
      {/* Firework bursts */}
      {[...Array(8)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute"
          initial={{ opacity: 1, scale: 0, x: 0, y: 0 }}
          animate={{
            opacity: [1, 1, 0],
            scale: [0, 1.5, 2],
            x: Math.cos((i * Math.PI * 2) / 8) * 60,
            y: Math.sin((i * Math.PI * 2) / 8) * 60,
          }}
          transition={{ duration: 1.5, ease: "easeOut" }}
        >
          <Sparkles className="w-6 h-6 text-yellow-400" />
        </motion.div>
      ))}
      {/* Center burst */}
      <motion.div
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
        initial={{ scale: 0, rotate: 0 }}
        animate={{ scale: [0, 1.5, 1], rotate: [0, 180, 360] }}
        transition={{ duration: 1, ease: "easeOut" }}
      >
        <Sparkles className="w-8 h-8 text-green-400" />
      </motion.div>
      {/* Confetti particles */}
      {[...Array(12)].map((_, i) => (
        <motion.div
          key={`confetti-${i}`}
          className="absolute w-2 h-2 rounded-full"
          style={{
            backgroundColor: ['#fbbf24', '#34d399', '#60a5fa', '#f472b6'][i % 4],
          }}
          initial={{ opacity: 1, scale: 1, x: 0, y: 0 }}
          animate={{
            opacity: [1, 1, 0],
            scale: [1, 0.5, 0],
            x: Math.cos((i * Math.PI * 2) / 12) * 80,
            y: Math.sin((i * Math.PI * 2) / 12) * 80 + 40,
          }}
          transition={{ duration: 2, ease: "easeOut", delay: i * 0.05 }}
        />
      ))}
    </div>
  );
}
