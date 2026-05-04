import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Minus, AlertTriangle, CheckCircle2 } from "lucide-react";
import { fmtPercentNumber, fmtNumber } from "@/lib/format";
import { Tooltip as UITooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

const OO_CARD_PALETTE = ['#EFF6FF', '#ECFDF5', '#FFFBEB', '#FFF1F2', '#F5F3FF', '#FFF0F6'];

const MONTH_LABELS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

interface InsightData {
  monthlyTargets: number[];
  monthlyAccomps: number[];
  quarterlyTargets: number[];
  quarterlyAccomps: number[];
  label: string; // "OORC" or "PGS"
  pisWithAccomp?: { oo?: string; indicator: string; type?: string }[];
}

function calcTrend(values: number[]): { trend: "up" | "down" | "stable"; firstHalf: number; secondHalf: number } {
  const nonZero = values.filter((v) => v > 0);
  if (nonZero.length < 2) return { trend: "stable", firstHalf: 0, secondHalf: 0 };
  const half = Math.floor(nonZero.length / 2);
  const first = nonZero.slice(0, half).reduce((a, b) => a + b, 0) / half;
  const second = nonZero.slice(half).reduce((a, b) => a + b, 0) / (nonZero.length - half);
  if (second > first * 1.1) return { trend: "up", firstHalf: first, secondHalf: second };
  if (second < first * 0.9) return { trend: "down", firstHalf: first, secondHalf: second };
  return { trend: "stable", firstHalf: first, secondHalf: second };
}

export default function DataInsightsPanel({ data, aside, center, noCard, className, controlsLeft }: { data: InsightData; aside?: React.ReactNode; center?: React.ReactNode; noCard?: boolean; className?: string; controlsLeft?: React.ReactNode }) {
  const { monthlyTargets, monthlyAccomps, quarterlyTargets, quarterlyAccomps, label } = data;
  const [showList, setShowList] = useState<null | 'with' | 'without'>(null);

  const totalTarget = monthlyTargets.reduce((a, b) => a + b, 0);
  const totalAccomp = monthlyAccomps.reduce((a, b) => a + b, 0);
  const overallPct = totalTarget > 0 ? (totalAccomp / totalTarget) * 100 : 0;

  // Monthly pct
  const monthlyPct = monthlyTargets.map((t, i) => t > 0 ? (monthlyAccomps[i] / t) * 100 : 0);
  const activeMonths = monthlyPct.map((p, i) => ({ month: MONTH_LABELS[i], pct: p, target: monthlyTargets[i], accomp: monthlyAccomps[i] })).filter((m) => m.target > 0);

  const bestMonth = activeMonths.length > 0 ? activeMonths.reduce((a, b) => a.pct > b.pct ? a : b) : null;
  const worstMonth = activeMonths.length > 0 ? activeMonths.reduce((a, b) => a.pct < b.pct ? a : b) : null;

  // Quarterly pct
  const qLabels = ["Q1", "Q2", "Q3", "Q4"];
  const qPct = quarterlyTargets.map((t, i) => t > 0 ? (quarterlyAccomps[i] / t) * 100 : 0);
  const bestQ = qPct.reduce((best, v, i) => quarterlyTargets[i] > 0 && v > (qPct[best] || 0) ? i : best, 0);
  const worstQ = qPct.reduce((worst, v, i) => quarterlyTargets[i] > 0 && (v < (qPct[worst] ?? Infinity)) ? i : worst, 0);

  // Gaps
  const gaps = activeMonths.filter((m) => m.pct < 75);
  const belowThreshold = gaps.length;

  const { trend, firstHalf, secondHalf } = calcTrend(monthlyAccomps);
  const TrendIcon = trend === "up" ? TrendingUp : trend === "down" ? TrendingDown : Minus;
  const trendColor = trend === "up" ? "text-emerald-600" : trend === "down" ? "text-red-600" : "text-amber-600";
  const trendText = trend === "up" ? "Increasing" : trend === "down" ? "Decreasing" : "Stable";

  const insights: { icon: React.ReactNode; text: React.ReactNode; tooltip?: React.ReactNode; type: "success" | "warning" | "info" }[] = [];

  // If PI-level lists are provided, show simplified counts to avoid clutter
  if ((data as any).pisWithAccomp) {
    const withList = (data as any).pisWithAccomp as { oo?: string; indicator: string; type?: string }[] | undefined;

    insights.push({
      icon: <CheckCircle2 className="h-4 w-4 text-emerald-600" />,
      text: `${withList ? withList.length : 0} PI(s) with accomplishment`,
      type: "success",
    });
  } else {
    insights.push({
      icon: overallPct >= 75 ? <CheckCircle2 className="h-4 w-4 text-emerald-600" /> : <AlertTriangle className="h-4 w-4 text-amber-600" />,
      text: `Overall ${label} achievement: ${fmtPercentNumber(overallPct)} (${fmtNumber(totalAccomp)} of ${fmtNumber(totalTarget)})`,
      tooltip: `Total Accomplishment (${fmtNumber(totalAccomp)}) ÷ Total Target (${fmtNumber(totalTarget)}) = ${fmtPercentNumber(overallPct)}`,
      type: overallPct >= 75 ? "success" : "warning",
    });
  }

  insights.push({
    icon: <TrendIcon className={`h-4 w-4 ${trendColor}`} />,
    text: `Performance trend: ${trendText} across months`,
    tooltip: firstHalf > 0 || secondHalf > 0 ? `Avg. accomplishment: First half (${fmtNumber(firstHalf)}) vs Second half (${fmtNumber(secondHalf)})` : undefined,
    type: trend === "up" ? "success" : trend === "down" ? "warning" : "info",
  });

  if (bestMonth) {
    insights.push({
      icon: <TrendingUp className="h-4 w-4 text-emerald-600" />,
      text: `Best performing month: ${bestMonth.month} at ${fmtPercentNumber(bestMonth.pct)}`,
      tooltip: `${bestMonth.month} Accomplishment (${fmtNumber(bestMonth.accomp)}) ÷ Target (${fmtNumber(bestMonth.target)}) = ${fmtPercentNumber(bestMonth.pct)}`,
      type: "success",
    });
  }

  if (worstMonth && worstMonth.month !== bestMonth?.month) {
    insights.push({
      icon: <TrendingDown className="h-4 w-4 text-red-600" />,
      text: `Lowest performing month: ${worstMonth.month} at ${fmtPercentNumber(worstMonth.pct)}`,
      tooltip: `${worstMonth.month} Accomplishment (${fmtNumber(worstMonth.accomp)}) ÷ Target (${fmtNumber(worstMonth.target)}) = ${fmtPercentNumber(worstMonth.pct)}`,
      type: "warning",
    });
  }

  if (quarterlyTargets.some((t) => t > 0)) {
    insights.push({
      icon: <CheckCircle2 className="h-4 w-4 text-primary" />,
      text: `Best quarter: ${qLabels[bestQ]} (${fmtPercentNumber(qPct[bestQ])}), Weakest: ${qLabels[worstQ]} (${fmtPercentNumber(qPct[worstQ])})`,
      tooltip: `Best: Accomplishment (${fmtNumber(quarterlyAccomps[bestQ])}) ÷ Target (${fmtNumber(quarterlyTargets[bestQ])}) = ${fmtPercentNumber(qPct[bestQ])} | Weakest: Accomplishment (${fmtNumber(quarterlyAccomps[worstQ])}) ÷ Target (${fmtNumber(quarterlyTargets[worstQ])}) = ${fmtPercentNumber(qPct[worstQ])}`,
      type: "info",
    });
  }

  if (belowThreshold > 0) {
    insights.push({
      icon: <AlertTriangle className="h-4 w-4 text-red-600" />,
      text: `${belowThreshold} month(s) below 75% threshold: ${gaps.map((g) => g.month).join(", ")}`,
      type: "warning",
    });
  }

  const header = (
    <div className="w-full flex justify-center items-center gap-3">
      <div className="flex items-center gap-2">
        <span className="text-lg font-semibold leading-tight">{label} Insights</span>
      </div>
    </div>
  );

  const hasCenter = Boolean(center || (data as any).pisWithAccomp);
  const hasAside = Boolean(aside);
  const colCount = 1 + (hasCenter ? 1 : 0) + (hasAside ? 1 : 0);
  const colClass = colCount === 3 ? "md:w-1/3" : colCount === 2 ? "md:w-1/2" : "w-full";

  const body = (
    <div className={`w-full ${className ?? ''}`}>
      <div className="w-full max-w-[1100px] mx-auto">
        <div className="flex flex-col md:flex-row md:justify-between items-stretch">
          <div className={`w-full ${colClass} flex flex-col justify-start gap-3 ${(hasCenter || hasAside) ? 'pb-6 mb-6 border-b border-border md:pb-0 md:mb-0 md:border-b-0 md:pr-6 md:mr-6 md:border-r' : ''}`}>
            {controlsLeft && (
              <div className="mb-2 w-full">{controlsLeft}</div>
            )}

            <div className="space-y-2">
              {insights.map((ins, i) => (
                <div key={i} className="flex items-start md:items-center gap-3 text-sm break-words">
                  <div className="flex-shrink-0 flex items-center justify-center w-5 h-5">{ins.icon}</div>
                  <div className="leading-tight text-sm text-left">
                    {ins.tooltip ? (
                      <Popover>
                        <PopoverTrigger asChild>
                          <span className="cursor-pointer border-b border-dotted border-muted-foreground/50 hover:text-primary hover:border-primary transition-colors">{ins.text}</span>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto px-3 py-2 text-sm" side="top">
                          <p>{ins.tooltip}</p>
                        </PopoverContent>
                      </Popover>
                    ) : (
                      ins.text
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {hasCenter && (
            <div className={`w-full ${colClass} flex flex-col items-center gap-3 ${hasAside ? 'pb-6 mb-6 border-b border-border md:pb-0 md:mb-0 md:border-b-0 md:pr-6 md:mr-6 md:border-r' : ''}`}>
              {center}

              {((data as any).pisWithAccomp) && (
                <div className="mt-3 w-full">
                  <div className="flex flex-col sm:flex-row sm:justify-start justify-center items-center gap-3">
                    <button
                      className="text-sm px-4 py-2 border rounded-md text-emerald-700 hover:bg-emerald-50 w-full sm:w-auto transition-colors"
                      onClick={() => setShowList('with')}
                      aria-label="Show PIs with accomplishment"
                    >
                      Show PIs with accomplishment
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {hasAside && (
            <div className={`w-full ${colClass} flex items-start justify-center`}>
              <div className="w-full flex items-start justify-center px-2 md:-mt-8" style={{ maxWidth: 'min(360px, 90vw)' }}>
                {aside}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  // Simple modal/panel for listing PIs
  const listContent = () => {
    const withList = (data as any).pisWithAccomp as { oo?: string; indicator: string; type?: string }[] | undefined;
    const arr = withList || [];
    // group by OO
    const groups: Record<string, { indicator: string; type?: string }[]> = {};
    arr.forEach((it) => {
      const key = it.oo || 'Unknown';
      if (!groups[key]) groups[key] = [];
      groups[key].push({ indicator: it.indicator, type: it.type });
    });
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        <div className="absolute inset-0 bg-black/40" onClick={() => setShowList(null)} />
        <div className="relative bg-white rounded shadow-lg max-w-3xl w-[90%] max-h-[70vh] overflow-auto p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="text-lg font-semibold">PIs with accomplishment</div>
            <button className="text-sm text-muted-foreground" onClick={() => setShowList(null)}>Close</button>
          </div>
          {arr.length === 0 ? (
            <div className="text-sm text-muted-foreground">None</div>
          ) : (
            <div className="space-y-4">
              {Object.entries(groups).map(([oo, items], idx) => {
                const bg = OO_CARD_PALETTE[idx % OO_CARD_PALETTE.length];
                return (
                  <div key={oo} className="mb-3 rounded-md p-3" style={{ backgroundColor: bg }}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <span className="w-3 h-3 rounded-sm" style={{ backgroundColor: bg ? bg : '#eee', display: 'inline-block' }} />
                        <div className="text-sm font-semibold">{oo}</div>
                      </div>
                    </div>
                    <div className="w-full bg-transparent rounded-md">
                      <div className="divide-y divide-gray-200">
                        {items.map((it, i) => (
                          <div key={i} className="flex items-start sm:items-center justify-between py-3">
                            <div className="flex items-start sm:items-center">
                              <span className="h-2.5 w-2.5 rounded-full bg-slate-400 mt-1 sm:mt-0 mr-3 flex-shrink-0" />
                              <div className="text-sm leading-snug">{it.indicator}</div>
                            </div>
                            <div className="text-xs text-muted-foreground ml-4 shrink-0">{it.type || '-'}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  };

  if (noCard) {
    return (
      <div>
        {header}
        {body}
      </div>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">{header}</CardTitle>
      </CardHeader>
      <CardContent className="p-3">{body}</CardContent>
      {showList && listContent()}
    </Card>
  );
}
