import { TrendingUp, TrendingDown, AlertTriangle, CheckCircle2, BarChart3, Lightbulb } from "lucide-react";
import { fmtPercentNumber, fmtNumber, fmtCurrency } from "@/lib/format";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

interface InsightsPanelProps {
  totalActivities: number;
  completed: number;
  pending: number;
  backlog: number;
  totalTargets: number;
  totalActuals: number;
  totalBudget: number;
  quarterlyData: { quarter: string; target: number; actual: number }[];
}

export default function InsightsPanel({
  totalActivities, completed, pending, backlog,
  totalTargets, totalActuals, totalBudget, quarterlyData,
}: InsightsPanelProps) {
  const completionRate = totalTargets > 0 ? (totalActuals / totalTargets) * 100 : 0;
  const gap = totalTargets - totalActuals;

  // Find best & worst quarters
  const qWithCompletion = quarterlyData
    .filter(q => q.target > 0)
    .map(q => ({ ...q, rate: q.target > 0 ? (q.actual / q.target) * 100 : 0 }));
  const bestQ = qWithCompletion.length ? qWithCompletion.reduce((a, b) => a.rate > b.rate ? a : b) : null;
  const worstQ = qWithCompletion.length ? qWithCompletion.reduce((a, b) => a.rate < b.rate ? a : b) : null;

  // Trend analysis
  const hasActuals = totalActuals > 0;
  const performanceLevel = completionRate >= 100 ? "excellent" : completionRate >= 75 ? "good" : completionRate >= 50 ? "fair" : completionRate > 0 ? "needs_improvement" : "no_data";

  const performanceColor = {
    excellent: "text-emerald-600 bg-emerald-50 border-emerald-200",
    good: "text-blue-600 bg-blue-50 border-blue-200",
    fair: "text-amber-600 bg-amber-50 border-amber-200",
    needs_improvement: "text-red-600 bg-red-50 border-red-200",
    no_data: "text-muted-foreground bg-muted border-border",
  };

  const performanceLabel = {
    excellent: "Excellent", good: "Good", fair: "Fair",
    needs_improvement: "Needs Improvement", no_data: "No Data Yet",
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Lightbulb className="h-5 w-5 text-amber-500" />
          Automated Performance Insights
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Overall Rating */}
        <div className={`rounded-lg border p-4 ${performanceColor[performanceLevel]}`}>
          <div className="flex items-center justify-between mb-2">
            <span className="font-semibold text-sm">Overall Performance</span>
            <Badge variant="outline" className="font-bold">{performanceLabel[performanceLevel]}</Badge>
          </div>
          <Progress value={Math.min(completionRate, 100)} className="h-2 mb-2" />
          <p className="text-xs">{fmtPercentNumber(completionRate)} completion rate — {fmtNumber(totalActuals)} of {fmtNumber(totalTargets)} targets achieved</p>
        </div>

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-lg bg-muted/50 p-3">
            <div className="flex items-center gap-1.5 mb-1">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
              <span className="text-xs font-medium">Completed</span>
            </div>
            <p className="text-lg font-bold">{completed}<span className="text-xs text-muted-foreground ml-1">/ {totalActivities}</span></p>
          </div>
          <div className="rounded-lg bg-muted/50 p-3">
            <div className="flex items-center gap-1.5 mb-1">
              <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
              <span className="text-xs font-medium">Performance Gap</span>
            </div>
            <p className="text-lg font-bold">{gap > 0 ? gap : 0}<span className="text-xs text-muted-foreground ml-1">targets remaining</span></p>
          </div>
        </div>

        {/* Quarterly Insights */}
        {bestQ && worstQ && (
          <div className="space-y-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Quarterly Breakdown</p>
            <div className="flex items-center gap-2 text-sm">
              <TrendingUp className="h-4 w-4 text-emerald-500 flex-shrink-0" />
              <span>Best: <strong>{bestQ.quarter}</strong> at {fmtPercentNumber(bestQ.rate)} completion</span>
            </div>
            {worstQ.quarter !== bestQ.quarter && (
              <div className="flex items-center gap-2 text-sm">
                <TrendingDown className="h-4 w-4 text-red-500 flex-shrink-0" />
                <span>Weakest: <strong>{worstQ.quarter}</strong> at {fmtPercentNumber(worstQ.rate)} completion</span>
              </div>
            )}
          </div>
        )}

        {/* Summary Text */}
        <div className="rounded-lg bg-muted/30 p-3 text-xs text-muted-foreground space-y-1">
          <p className="flex items-center gap-1.5"><BarChart3 className="h-3 w-3" /> <strong>{totalActivities}</strong> total program activities tracked</p>
          <p className="flex items-center gap-1.5"><BarChart3 className="h-3 w-3" /> Budget allocation: <strong>{fmtCurrency(totalBudget)}</strong></p>
          {pending > 0 && <p>⏳ {pending} activities still pending implementation</p>}
          {backlog > 0 && <p>⚠️ {backlog} activities in progress but behind target</p>}
        </div>
      </CardContent>
    </Card>
  );
}
