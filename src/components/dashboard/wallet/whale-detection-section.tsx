import { Wallet } from "lucide-react";

interface WhaleDetectionSectionProps {
  insights: string[];
}

export function WhaleDetectionSection({
  insights,
}: WhaleDetectionSectionProps) {
  if (!insights || !insights[0]?.includes("Whale Category")) {
    return null;
  }

  const whaleCategory = insights[0].split(":")[1]?.split("(")[0]?.trim() || "Unknown";
  const whaleScore = insights[0].match(/Score: (\d+)/)?.[1] || "0";

  return (
    <div className="p-6 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-lg border border-blue-500/20">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-blue-500/10 rounded-full">
            <Wallet className="h-6 w-6 text-blue-500" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">
              Whale Detection
            </p>
            <p className="font-semibold text-xl">{whaleCategory}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-xs text-muted-foreground mb-1">Score</p>
          <p className="text-2xl font-bold text-blue-500">{whaleScore}/100</p>
        </div>
      </div>
    </div>
  );
}
