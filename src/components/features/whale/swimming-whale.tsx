'use client';

import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { SingleWhale } from './single-whale';

type Direction = 'left' | 'right';

interface WhaleActivityData {
  volume: number; // Total USD volume in last 1h
  count: number;  // Number of transfers in last 1h
  tier?: 'largest' | 'smallest' | 'middle'; // Color tier based on relative volume
}

/**
 * Animated swimming whale component with continuous swimming.
 * 
 * Animation sequence:
 * - Frames 1-7: Swimming animation (loops continuously)
 * - Swims across screen, teleports back when reaching edge
 */
// Whale configuration for 6 whales (2 on row 1, 2 on row 3)
const WHALE_POSITIONS = [
  { startPos: 20, topPos: '8%', speed: 0.1, startDir: 'right' as Direction, zIndex: 1, delay: 0 },
  { startPos: 50, topPos: '28%', speed: 0.08, startDir: 'left' as Direction, zIndex: 2, delay: 0.2 },
  { startPos: 30, topPos: '48%', speed: 0.12, startDir: 'right' as Direction, zIndex: 3, delay: 0.4 },
  { startPos: 65, topPos: '68%', speed: 0.09, startDir: 'left' as Direction, zIndex: 4, delay: 0.6 },
  { startPos: 10, topPos: '48%', speed: 0.11, startDir: 'left' as Direction, zIndex: 3, delay: 0.3 },
  { startPos: 55, topPos: '8%', speed: 0.09, startDir: 'left' as Direction, zIndex: 1, delay: 0.1 },
];

/**
 * Main component displaying multiple animated whales with activity badges
 * 
 * @component
 * @param props - Component props
 * @param props.whaleActivity - Array of whale activity data for top 6 whales
 * 
 * @example
 * <SwimmingWhale
 *   whaleActivity={[
 *     { volume: 5200000, count: 12, tier: 'largest' },
 *     { volume: 2800000, count: 8, tier: 'middle' },
 *     // ... up to 6 whales
 *   ]}
 * />
 */
export function SwimmingWhale({ whaleActivity }: { whaleActivity?: WhaleActivityData[] }) {
  // Preload all whale animation frames (only 7 frames available)
  useEffect(() => {
    const frames = [1, 2, 3, 4, 5, 6, 7];
    frames.forEach(frame => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'image';
      link.href = `/whale-${String(frame).padStart(2, '0')}.png`;
      document.head.appendChild(link);
    });
  }, []);

  // Debug logging
  useEffect(() => {
    console.log('[SwimmingWhale] whaleActivity prop:', whaleActivity);
    if (whaleActivity && whaleActivity.length > 0) {
      console.log('[SwimmingWhale] ✅ Received', whaleActivity.length, 'whale activities');
      whaleActivity.forEach((activity, index) => {
        console.log(`[SwimmingWhale] Whale ${index}:`, activity);
      });
    } else {
      console.log('[SwimmingWhale] ❌ No whale activity data');
    }
  }, [whaleActivity]);

  return (
    <motion.div
      className="relative w-full h-full flex items-center justify-center overflow-visible"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1 }}
    >
      {/* Sonar Radar Tracking System */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden" style={{ zIndex: -1 }}>
        {/* Ocean background - adapts to theme */}
        <div
          className="absolute inset-0 bg-gradient-to-b from-slate-100/40 via-slate-200/50 to-slate-100/60 dark:from-slate-900/60 dark:via-slate-800/70 dark:to-slate-900/80"
        />

        {/* Sonar radar rings emanating from center */}
        {[...Array(4)].map((_, i) => (
          <div
            key={`sonar-${i}`}
            className="absolute border border-blue-500/40 dark:border-blue-400/40 rounded-full md:border-2"
            style={{
              top: '50%',
              left: '50%',
              width: '60px',
              height: '60px',
              transform: 'translate(-50%, -50%)',
              animation: `sonar-pulse ${4 + i * 0.5}s ease-out infinite`,
              animationDelay: `${i * 1}s`,
            }}
          />
        ))}

        {/* Scanning sweep line */}
        <div
          className="absolute w-0.5 h-1/2 bg-gradient-to-b from-blue-600/60 to-transparent dark:from-blue-400/60 dark:to-transparent"
          style={{
            top: '50%',
            left: '50%',
            transformOrigin: 'top center',
            transform: 'translate(-50%, 0)',
            animation: 'radar-sweep 8s linear infinite',
          }}
        />

        {/* Grid overlay for tech feel */}
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `
              linear-gradient(rgba(59, 130, 246, 0.06) 1px, transparent 1px),
              linear-gradient(90deg, rgba(59, 130, 246, 0.06) 1px, transparent 1px)
            `,
            backgroundSize: '50px 50px',
          }}
        />

        {/* Whale detection pulses */}
        {WHALE_POSITIONS.map((whale, index) => (
          <div
            key={`pulse-${index}`}
            className="absolute rounded-full border border-cyan-500/50 dark:border-cyan-400/50 md:border-2"
            style={{
              left: `${whale.startPos}%`,
              top: whale.topPos,
              width: '25px',
              height: '25px',
              transform: 'translate(-50%, -50%)',
              animation: `whale-detect ${3 + index * 0.3}s ease-out infinite`,
              animationDelay: `${whale.delay + 1}s`,
            }}
          />
        ))}
      </div>

      {/* Whales layer - 6 whales with activity badges */}
      <div className="absolute inset-0 pointer-events-none">
        {WHALE_POSITIONS.map((whale, index) => (
          <SingleWhale
            key={index}
            startPos={whale.startPos}
            topPos={whale.topPos}
            speed={whale.speed}
            startDir={whale.startDir}
            zIndex={whale.zIndex}
            delay={whale.delay}
            activity={whaleActivity?.[index]}
          />
        ))}
      </div>

      {/* CSS to hide broken image placeholders */}
      <style dangerouslySetInnerHTML={{
        __html: `
          img[src*="whale-"] {
            font-size: 0 !important;
            color: transparent !important;
          }
          img[src*="whale-"]::before,
          img[src*="whale-"]::after {
            display: none !important;
          }
        `
      }} />

      {/* CSS Keyframes for sonar radar tracking */}
      <style>{`
        @keyframes sonar-pulse {
          0% { width: 100px; height: 100px; opacity: 0.6; }
          100% { width: 1200px; height: 1200px; opacity: 0; }
        }
        @keyframes radar-sweep {
          0% { transform: translate(-50%, 0) rotate(0deg); }
          100% { transform: translate(-50%, 0) rotate(360deg); }
        }
        @keyframes whale-detect {
          0%, 100% { opacity: 0; transform: translate(-50%, -50%) scale(0.8); }
          50% { opacity: 1; transform: translate(-50%, -50%) scale(1.3); }
        }
      `}</style>
    </motion.div>
  );
}
