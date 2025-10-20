import { Badge } from "@/components/ui/badge";
import { AlertTriangle } from "lucide-react";
import { getRiskLabel, getRiskColor } from "@/core/utils/wallet-utils";

interface RiskAssessmentSectionProps {
  riskScore: number;
}

export function RiskAssessmentSection({
  riskScore,
}: RiskAssessmentSectionProps) {
  return (
    <div className="p-6 bg-muted/30 rounded-lg border border-muted">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-primary/10 rounded-full">
            <AlertTriangle className="h-6 w-6 text-primary" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">
              Risk Assessment
            </p>
            <p className="font-semibold text-xl">{getRiskLabel(riskScore)}</p>
          </div>
        </div>
        <Badge
          variant="outline"
          className={`${getRiskColor(riskScore)} text-lg px-4 py-2`}
        >
          {riskScore}/100
        </Badge>
      </div>
      <div className="space-y-2">
        <div className="h-3 bg-muted rounded-full overflow-hidden">
          <div
            className={`h-full transition-all ${
              riskScore < 30
                ? "bg-green-500"
                : riskScore < 70
                ? "bg-yellow-500"
                : "bg-red-500"
            }`}
            style={{ width: `${riskScore}%` }}
          />
        </div>
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Low Risk</span>
          <span>Medium Risk</span>
          <span>High Risk</span>
        </div>
      </div>
    </div>
  );
}
