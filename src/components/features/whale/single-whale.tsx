"use client";

import { useState, useEffect, useRef } from "react";
import { formatVolume, getExplorerUrl } from "@/core/utils/wallet-utils";

type Direction = "left" | "right";

interface WhaleActivityData {
  volume: number;
  count: number;
  tier?: "largest" | "smallest" | "middle";
  hash?: string;
  chainId?: string;
}

interface SingleWhaleProps {
  startPos: number;
  topPos: string;
  speed: number;
  startDir: Direction;
  zIndex: number;
  delay: number;
  activity?: WhaleActivityData;
}

// Frame sequence for animation (only 7 frames available)
const SWIM_FRAMES = [1, 2, 3, 4, 5, 6, 7];

/**
 * Gets triangle color based on tier
 * @param tier - Tier classification
 * @returns Hex color code
 */
function getTriangleColor(tier?: "largest" | "smallest" | "middle"): string {
  if (tier === "largest") {
    return "#22c55e";
  } else if (tier === "smallest") {
    return "#0ea5e9";
  } else {
    return "#6b7280";
  }
}

/**
 * Renders a single animated whale with optional activity badge
 *
 * @component
 * @param props - Component props
 * @param props.startPos - Starting horizontal position (0-100%)
 * @param props.topPos - Vertical position as CSS string
 * @param props.speed - Movement speed multiplier
 * @param props.startDir - Initial swimming direction
 * @param props.zIndex - Z-index for layering
 * @param props.delay - Animation delay in seconds
 * @param props.activity - Optional whale activity data for badge display
 *
 * @example
 * <SingleWhale
 *   startPos={10}
 *   topPos="20%"
 *   speed={1.2}
 *   startDir="right"
 *   zIndex={1}
 *   delay={0}
 *   activity={{ volume: 5200000, count: 12, tier: 'largest' }}
 * />
 */
export function SingleWhale({
  startPos,
  topPos,
  speed,
  startDir,
  zIndex,
  delay,
  activity,
}: SingleWhaleProps) {
  // Debug: Log when activity data is present
  useEffect(() => {
    if (activity) {
      console.log(
        "[SingleWhale] Activity data:",
        activity,
        "Volume > 0?",
        activity.volume > 0
      );
      if (activity.volume > 0) {
        console.log(
          "[SingleWhale] Should render badge - Tier:",
          activity.tier,
          "Volume:",
          activity.volume
        );
        console.log(
          "[SingleWhale] ✅ Should render badge - Tier:",
          activity.tier,
          "Volume:",
          activity.volume
        );
      } else {
        console.log("[SingleWhale] ❌ No badge - Volume is 0");
      }
    } else {
      console.log("[SingleWhale] ❌ No activity data");
    }
  }, [activity]);

  const [currentFrame, setCurrentFrame] = useState(1);
  const [position, setPosition] = useState(startPos);
  const frameIndexRef = useRef(0);
  const directionRef = useRef<Direction>(startDir);
  const [isFlipped, setIsFlipped] = useState(startDir === "right");
  const [isTurning, setIsTurning] = useState(false);
  const isMovingRef = useRef(true);

  // Frame animation - continuous loop (only when not turning)
  useEffect(() => {
    const interval = setInterval(() => {
      if (isTurning) return;
      frameIndexRef.current = (frameIndexRef.current + 1) % SWIM_FRAMES.length;
      setCurrentFrame(SWIM_FRAMES[frameIndexRef.current]);
    }, 200);

    return () => clearInterval(interval);
  }, [isTurning]);

  // Position animation - move whale across screen
  useEffect(() => {
    const moveInterval = setInterval(() => {
      if (!isMovingRef.current) return;

      setPosition((prev) => {
        const delta = directionRef.current === "right" ? speed : -speed;
        const newPos = Math.round((prev + delta) * 100) / 100; // snap to 2 decimals
        // Check boundaries and turn
        if (directionRef.current === "right" && newPos >= 70) {
          isMovingRef.current = false;
          setIsTurning(true);

          setTimeout(() => {
            directionRef.current = "left";
            setIsFlipped(false);
            setIsTurning(false);
            frameIndexRef.current = 0;
            setCurrentFrame(SWIM_FRAMES[0]);
            isMovingRef.current = true;
          }, 500);

          return 70;
        } else if (directionRef.current === "left" && newPos <= 10) {
          isMovingRef.current = false;
          setIsTurning(true);

          setTimeout(() => {
            directionRef.current = "right";
            setIsFlipped(true);
            setIsTurning(false);
            frameIndexRef.current = 0;
            setCurrentFrame(SWIM_FRAMES[0]);
            isMovingRef.current = true;
          }, 500);

          return 10;
        }

        return newPos;
      });
    }, 50);

    return () => clearInterval(moveInterval);
  }, [speed]);

  return (
    <div
      className="absolute animate-in fade-in"
      style={{
        left: `${position}%`,
        top: topPos,
        width: "150px",
        height: "150px",
        transform: isFlipped ? "scaleX(-1)" : "none",
        transition: "left 0.05s linear, opacity 0.8s ease-out",
        zIndex: zIndex,
        animationDelay: `${delay}s`,
        animationDuration: "0.8s",
        animationFillMode: "both",
        willChange: "transform, left",
      }}
    >
      {/* Activity Badge - speech bubble pointing to whale */}
      {activity && activity.volume > 0 ? (
        <div
          className="absolute left-1/2 z-[100]"
          style={{
            top: "15px",
            transform: isFlipped
              ? "translateX(-50%) scaleX(-1)"
              : "translateX(-50%)",
          }}
        >
          <div className="relative pointer-events-auto">
            {/* Speech bubble - flat drop shape */}
            {activity.hash ? (
              <a
                href={getExplorerUrl(
                  activity.chainId || "1",
                  activity.hash,
                  "tx"
                )}
                target="_blank"
                rel="noopener noreferrer"
                className={`absolute -top-8 left-1/2 -translate-x-1/2 z-50 ${
                  activity.tier === "largest"
                    ? "bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
                    : activity.tier === "smallest"
                    ? "bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700"
                    : "bg-gradient-to-r from-gray-500 to-slate-600 hover:from-gray-600 hover:to-slate-700"
                } rounded-lg px-3 py-0.5 shadow-lg cursor-pointer transition-all hover:scale-105`}
              >
                <div className="text-white font-bold text-xs whitespace-nowrap">
                  {formatVolume(activity.volume)}
                </div>
              </a>
            ) : (
              <div
                className={`absolute -top-8 left-1/2 -translate-x-1/2 z-50 ${
                  activity.tier === "largest"
                    ? "bg-gradient-to-r from-green-500 to-emerald-600"
                    : activity.tier === "smallest"
                    ? "bg-gradient-to-r from-blue-500 to-cyan-600"
                    : "bg-gradient-to-r from-gray-500 to-slate-600"
                } rounded-lg px-3 py-0.5 shadow-lg`}
              >
                <div className="text-white font-bold text-xs whitespace-nowrap">
                  {formatVolume(activity.volume)}
                </div>
              </div>
            )}
            {/* Triangle pointer pointing down */}
            <div
              className="absolute left-1/2 -translate-x-1/2"
              style={{
                bottom: "-6px",
                width: 0,
                height: 0,
                borderLeft: "6px solid transparent",
                borderRight: "6px solid transparent",
                borderTop: `6px solid ${getTriangleColor(activity.tier)}`,
              }}
            />
          </div>
        </div>
      ) : null}

      <div className="w-full h-full overflow-hidden rounded-full absolute isolate will-change-transform">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={`/whale-${String(currentFrame).padStart(2, "0")}.png`}
          alt=""
          width="150"
          height="150"
          loading="eager"
          suppressHydrationWarning
          className="w-full h-full object-contain select-none pointer-events-none will-change-transform"
          style={{
            display: "block",
            transform: "translateZ(0)",
            backfaceVisibility: "hidden",
            imageRendering: "-webkit-optimize-contrast",
          }}
        />
      </div>
    </div>
  );
}
