"use client";

import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { Wallet } from "lucide-react";

interface WalletAddressTooltipProps {
  address: string;
}

/**
 * Wallet address tooltip that uses a portal to render at document body level,
 * avoiding any parent container overflow or transform issues.
 * 
 * @example
 * ```tsx
 * <WalletAddressTooltip address="0x123..." />
 * ```
 */
export function WalletAddressTooltip({ address }: WalletAddressTooltipProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });
  const iconRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isHovered && iconRef.current) {
      const rect = iconRef.current.getBoundingClientRect();
      setTooltipPosition({
        top: rect.top - 8, // 8px above the icon
        left: rect.right, // Align to right edge of icon
      });
    }
  }, [isHovered]);

  return (
    <>
      <div
        ref={iconRef}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className="inline-flex"
      >
        <Wallet className="w-4 h-4 text-green-500 cursor-pointer transition-transform hover:scale-110" />
      </div>

      {isHovered && typeof document !== "undefined" &&
        createPortal(
          <div
            className="fixed px-3 py-2 rounded-lg shadow-xl text-xs text-slate-100 bg-slate-900/90 backdrop-blur-md border border-slate-700/60 transition-opacity duration-200 pointer-events-none whitespace-nowrap"
            style={{
              top: `${tooltipPosition.top}px`,
              left: `${tooltipPosition.left}px`,
              transform: "translate(-100%, -100%)", // Position above and to the left
              zIndex: 99999,
            }}
          >
            {address}
          </div>,
          document.body
        )}
    </>
  );
}
