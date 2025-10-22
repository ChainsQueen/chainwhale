import React from "react";

interface AddressPillProps {
  address: string;
  size?: "sm" | "md";
  className?: string;
  truncate?: boolean;
}

export function AddressPill({ address, size = "sm", className, truncate = false }: AddressPillProps) {
  const textSize = size === "sm" ? "text-[10px]" : "text-xs";
  const padding = size === "sm" ? "px-2.5 py-0.5" : "px-3 py-1";
  const truncateClass = truncate ? "max-w-[180px] sm:max-w-[240px] overflow-hidden text-ellipsis whitespace-nowrap" : "break-all";
  return (
    <code
      className={`${padding} rounded-full ${textSize} font-mono ${truncateClass} border border-blue-500/30 bg-gradient-to-r from-blue-500/5 via-slate-500/5 to-blue-500/5 ${className ?? ""}`}
      title={address}
    >
      {address}
    </code>
  );
}