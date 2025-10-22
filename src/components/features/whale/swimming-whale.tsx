'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';

type Direction = 'left' | 'right';

/**
 * Animated swimming whale component with continuous swimming.
 * 
 * Animation sequence:
 * - Frames 1-7: Swimming animation (loops continuously)
 * - Swims across screen, teleports back when reaching edge
 */
// Frame sequence - only swimming frames (defined outside to prevent re-creation)
const SWIM_FRAMES = [1, 2, 3, 4, 5, 6, 7];

// Whale configuration for 6 whales (2 on row 1, 2 on row 3)
const WHALES = [
  { id: 1, startPos: 20, topPos: '8%', speed: 0.1, startDir: 'right' as Direction, zIndex: 1, delay: 0 },
  { id: 2, startPos: 50, topPos: '28%', speed: 0.08, startDir: 'left' as Direction, zIndex: 2, delay: 0.2 },
  { id: 3, startPos: 30, topPos: '48%', speed: 0.12, startDir: 'right' as Direction, zIndex: 3, delay: 0.4 },
  { id: 4, startPos: 65, topPos: '68%', speed: 0.09, startDir: 'left' as Direction, zIndex: 4, delay: 0.6 },
  { id: 5, startPos: 10, topPos: '48%', speed: 0.11, startDir: 'left' as Direction, zIndex: 3, delay: 0.3 },
  { id: 6, startPos: 55, topPos: '8%', speed: 0.09, startDir: 'left' as Direction, zIndex: 1, delay: 0.1 },
];

function SingleWhale({ startPos, topPos, speed, startDir, zIndex, delay }: { 
  startPos: number; 
  topPos: string; 
  speed: number; 
  startDir: Direction;
  zIndex: number;
  delay: number;
}) {
  const [currentFrame, setCurrentFrame] = useState(1);
  const [position, setPosition] = useState(startPos);
  const frameIndexRef = useRef(0);
  const directionRef = useRef<Direction>(startDir);
  const [isFlipped, setIsFlipped] = useState(startDir === 'right');
  const [isTurning, setIsTurning] = useState(false);
  const isMovingRef = useRef(true);
  
  
  // Frame animation - continuous loop (only when not turning)
  useEffect(() => {
    const interval = setInterval(() => {
      if (isTurning) return; // Don't animate frames during turn
      frameIndexRef.current = (frameIndexRef.current + 1) % SWIM_FRAMES.length;
      setCurrentFrame(SWIM_FRAMES[frameIndexRef.current]);
    }, 200); // 200ms = 5 FPS for swimming
    
    return () => {
      clearInterval(interval);
    };
  }, [isTurning]); // Re-run when turning state changes
  
  // Position animation - move whale across screen
  useEffect(() => {
    const moveInterval = setInterval(() => {
      if (!isMovingRef.current) return; // Don't move during turn
      
      setPosition(prev => {
        const newPos = directionRef.current === 'right' ? prev + speed : prev - speed;
        
        // Check boundaries and turn
        if (directionRef.current === 'right' && newPos >= 70) {
          // Reached right edge - start turn (before going off-screen)
          isMovingRef.current = false;
          setIsTurning(true);
          // Keep current frame (don't change to frame 9 which doesn't exist)
          
          setTimeout(() => {
            directionRef.current = 'left';
            setIsFlipped(false); // Face left
            setIsTurning(false);
            frameIndexRef.current = 0; // Reset to first frame
            setCurrentFrame(SWIM_FRAMES[0]); // Resume swimming
            isMovingRef.current = true;
          }, 500); // Turn duration
          
          return 70; // Stay at edge
        } else if (directionRef.current === 'left' && newPos <= 10) {
          // Reached left edge - start turn
          isMovingRef.current = false;
          setIsTurning(true);
          // Keep current frame (don't change to frame 9 which doesn't exist)
          
          setTimeout(() => {
            directionRef.current = 'right';
            setIsFlipped(true); // Face right
            setIsTurning(false);
            frameIndexRef.current = 0; // Reset to first frame
            setCurrentFrame(SWIM_FRAMES[0]); // Resume swimming
            isMovingRef.current = true;
          }, 500); // Turn duration
          
          return 10; // Stay at edge
        }
        
        return newPos;
      });
    }, 50); // Update position every 50ms
    
    return () => clearInterval(moveInterval);
  }, [speed]); // Include speed dependency

  return (
    <div
      className="absolute animate-in fade-in"
      style={{ 
        left: `${position}%`,
        top: topPos,
        width: '150px', 
        height: '150px',
        transform: isFlipped ? 'scaleX(-1)' : 'none',
        transition: 'left 0.05s linear, opacity 0.8s ease-out',
        zIndex: zIndex,
        animationDelay: `${delay}s`,
        animationDuration: '0.8s',
        animationFillMode: 'both',
        willChange: 'transform, left', // Performance optimization
      }}
    >
      <Image
        src={`/whale-${String(currentFrame).padStart(2, '0')}.png`}
        alt="Swimming Whale"
        width={150}
        height={150}
        priority
        className="w-full h-full object-contain"
      />
    </div>
  );
}

export function SwimmingWhale() {
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
            className="absolute border-2 border-blue-500/40 dark:border-blue-400/40 rounded-full"
            style={{
              top: '50%',
              left: '50%',
              width: '100px',
              height: '100px',
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
        {WHALES.map((whale) => (
          <div
            key={`pulse-${whale.id}`}
            className="absolute rounded-full border-2 border-cyan-500/50 dark:border-cyan-400/50"
            style={{
              left: `${whale.startPos}%`,
              top: whale.topPos,
              width: '40px',
              height: '40px',
              transform: 'translate(-50%, -50%)',
              animation: `whale-detect ${3 + whale.id * 0.3}s ease-out infinite`,
              animationDelay: `${whale.delay + 1}s`,
            }}
          />
        ))}
      </div>

      {/* Render 6 whales at different positions */}
      {WHALES.map((whale) => (
        <SingleWhale
          key={whale.id}
          startPos={whale.startPos}
          topPos={whale.topPos}
          speed={whale.speed}
          startDir={whale.startDir}
          zIndex={whale.zIndex}
          delay={whale.delay}
        />
      ))}

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
