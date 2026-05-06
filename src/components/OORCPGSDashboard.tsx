import React, { useState, useCallback, useEffect } from "react";
import { Upload, FileSpreadsheet, AlertCircle, PieChart as PieChartIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { OORCRow, parseOORCExcel } from "@/lib/oorcParser";
import { supabase } from "@/integrations/supabase/client";
import { PGSRow, parsePGSExcel } from "@/lib/pgsParser";
import { useOORCData, usePGSData, useSaveOORCData, useSavePGSData, dbToOORCRows, dbToPGSRows, resolveDivisionIdToUuid } from "@/hooks/useOORCPGSData";
import DataInsightsPanel from "@/components/DataInsightsPanel";
import DonutChart from "@/components/DonutChart";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, Legend,
} from "recharts";
import { CheckCircle2, AlertTriangle, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { fmtPercentNumber, fmtNumber } from "@/lib/format";
import { useAuth } from "@/contexts/AuthContext";

// Error boundary to prevent white screen on render crash
class DashboardErrorBoundary extends React.Component<{ children: React.ReactNode }, { error: Error | null }> {
  constructor(props: any) {
    super(props);
    this.state = { error: null };
  }
  static getDerivedStateFromError(error: Error) { return { error }; }
  render() {
    if (this.state.error) {
      return (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-6 w-6 text-red-500 mt-0.5 flex-shrink-0" />
              <div>
                <div className="font-semibold text-red-700 mb-1">Dashboard render error</div>
                <div className="text-sm text-red-600 font-mono whitespace-pre-wrap">{this.state.error.message}</div>
                <button
                  className="mt-3 text-xs underline text-red-500"
                  onClick={() => this.setState({ error: null })}
                >Try again</button>
              </div>
            </div>
          </CardContent>
        </Card>
      );
    }
    return this.props.children;
  }
}


// Soft palette for OO categories
const OO_PALETTE = [
  '#60A5FA', // blue-400
  '#34D399', // emerald-400
  '#F59E0B', // amber-500
  '#FB7185', // rose-400
  '#A78BFA', // purple-400
  '#F472B6', // pink-400
  '#60A5A6', // teal-ish
  '#FBBF24', // yellow-400
];

function hexToRgba(hex: string, alpha = 1) {
  const h = hex.replace('#', '');
  const bigint = parseInt(h, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

const MONTHS = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"] as const;
const MONTH_LABELS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function MonthlyChart({ data, title }: { data: { month: string; target: number; accomp: number }[]; title: string }) {
  return (
    <Card>
      <CardHeader className="text-center"><CardTitle className="text-base">{title}</CardTitle></CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(220,13%,91%)" />
            <XAxis dataKey="month" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 }).format(v)} />
            <Tooltip formatter={(v: any) => fmtNumber(Number(v))} />
            <Legend />
            <Bar dataKey="target" name="Target" fill="hsl(217,91%,50%)" radius={[4, 4, 0, 0]} />
            <Bar dataKey="accomp" name="Accomplishment" fill="hsl(160,60%,45%)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

function QuarterlyChart({ data, title }: { data: { quarter: string; target: number; accomp: number; pct: number }[]; title: string }) {
  return (
    <Card>
      <CardHeader className="text-center"><CardTitle className="text-base">{title}</CardTitle></CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(220,13%,91%)" />
            <XAxis dataKey="quarter" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 }).format(v)} />
            <Tooltip formatter={(v: any, name: string) => name === "pct" ? fmtPercentNumber(Number(v)) : fmtNumber(Number(v))} />
            <Legend />
            <Bar dataKey="target" name="Target" fill="hsl(217,91%,50%)" radius={[4, 4, 0, 0]} />
            <Bar dataKey="accomp" name="Accomplishment" fill="hsl(160,60%,45%)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

function PercentageChart({ data, title }: { data: { label: string; pct: number }[]; title: string }) {
  return (
    <Card>
      <CardHeader className="text-center"><CardTitle className="text-base">{title}</CardTitle></CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(220,13%,91%)" />
            <XAxis dataKey="label" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `${v}%`} domain={[0, 'auto']} />
            <Tooltip formatter={(v: number) => fmtPercentNumber(v)} />
            <Line type="monotone" dataKey="pct" name="% Accomplishment" stroke="hsl(35,92%,55%)" strokeWidth={2} dot={{ fill: "hsl(35,92%,55%)", r: 4 }} />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

function buildMonthlyAgg(rows: OORCRow[] | PGSRow[]) {
  return MONTHS.map((m, idx) => {
    const target = rows.reduce((s, r) => s + ((r.monthly as any)[m].target ?? 0), 0);
    const accomp = rows.reduce((s, r) => s + ((r.monthly as any)[m].accomp ?? 0), 0);
    return { month: MONTH_LABELS[idx], target, accomp };
  });
}

function buildQuarterlyAgg(rows: { targets: any; accomplishments: any }[]) {
  return ["Q1", "Q2", "Q3", "Q4"].map((q, i) => {
    const qKey = ["q1", "q2", "q3", "q4"][i];
    const target = rows.reduce((s, r) => s + (r.targets[qKey] ?? 0), 0);
    const accomp = rows.reduce((s, r) => s + (r.accomplishments[qKey] ?? 0), 0);
    return { quarter: q, target, accomp, pct: target > 0 ? (accomp / target) * 100 : 0 };
  });
}

function buildInsightData(monthly: { target: number; accomp: number }[], quarterly: { target: number; accomp: number }[], label: string) {
  return {
    monthlyTargets: monthly.map((m) => m.target),
    monthlyAccomps: monthly.map((m) => m.accomp),
    quarterlyTargets: quarterly.map((q) => q.target),
    quarterlyAccomps: quarterly.map((q) => q.accomp),
    label,
  };
}

function BreakdownTable({ targets, accomps, toDateTarget, toDateAccomp }: { targets: any, accomps: any, toDateTarget: number | null, toDateAccomp: number | null }) {
  return (
    <div className="mt-2 w-full rounded-md border shadow-sm">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50 hover:bg-muted/50">
            <TableHead className="w-[120px] font-semibold text-foreground">Period</TableHead>
            <TableHead className="text-right font-semibold text-foreground">Target</TableHead>
            <TableHead className="text-right font-semibold text-foreground">Accomplishment</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell>1st Qtr</TableCell>
            <TableCell className="text-right font-medium">{fmtNumber(targets?.q1)}</TableCell>
            <TableCell className="text-right font-medium">{fmtNumber(accomps?.q1)}</TableCell>
          </TableRow>
          <TableRow>
            <TableCell>2nd Qtr</TableCell>
            <TableCell className="text-right font-medium">{fmtNumber(targets?.q2)}</TableCell>
            <TableCell className="text-right font-medium">{fmtNumber(accomps?.q2)}</TableCell>
          </TableRow>
          <TableRow className="bg-muted/30 hover:bg-muted/40">
            <TableCell className="font-semibold text-foreground">1st SEM</TableCell>
            <TableCell className="text-right font-semibold text-foreground">{fmtNumber(targets?.sem1)}</TableCell>
            <TableCell className="text-right font-semibold text-foreground">{fmtNumber(accomps?.sem1)}</TableCell>
          </TableRow>
          <TableRow>
            <TableCell>3rd Qtr</TableCell>
            <TableCell className="text-right font-medium">{fmtNumber(targets?.q3)}</TableCell>
            <TableCell className="text-right font-medium">{fmtNumber(accomps?.q3)}</TableCell>
          </TableRow>
          <TableRow>
            <TableCell>4th Qtr</TableCell>
            <TableCell className="text-right font-medium">{fmtNumber(targets?.q4)}</TableCell>
            <TableCell className="text-right font-medium">{fmtNumber(accomps?.q4)}</TableCell>
          </TableRow>
          <TableRow className="bg-muted/30 hover:bg-muted/40">
            <TableCell className="font-semibold text-foreground">2nd SEM</TableCell>
            <TableCell className="text-right font-semibold text-foreground">{fmtNumber(targets?.sem2)}</TableCell>
            <TableCell className="text-right font-semibold text-foreground">{fmtNumber(accomps?.sem2)}</TableCell>
          </TableRow>
          <TableRow className="bg-slate-100 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-800 border-t-2">
            <TableCell className="font-bold text-foreground">To Date</TableCell>
            <TableCell className="text-right font-bold text-foreground text-base">{fmtNumber(toDateTarget)}</TableCell>
            <TableCell className="text-right font-bold text-foreground text-base">{fmtNumber(toDateAccomp)}</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>
  );
}

function SinglePeriodInsight({ target, accomp }: { target: number; accomp: number }) {
  const diff = accomp - target;
  const isMet = accomp >= target;
  return (
    <>
      <li className="flex items-start gap-2">
        <span className={isMet ? "text-emerald-600 mt-0.5" : "text-red-600 mt-0.5"}>
          {isMet ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
        </span>
        <div className="flex flex-wrap items-center gap-1.5">
          <span className={`px-2 py-0.5 rounded text-xs font-medium ${isMet ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}`}>
            Target {isMet ? "achieved" : "not achieved"}
          </span>
          <span className="text-foreground">
            : {fmtNumber(accomp)} vs {fmtNumber(target)} target
          </span>
        </div>
      </li>
      <li className="flex items-start gap-2">
        <span className={diff > 0 ? "text-emerald-600 mt-0.5" : diff < 0 ? "text-red-600 mt-0.5" : "text-amber-600 mt-0.5"}>
          {diff > 0 ? <TrendingUp className="w-4 h-4" /> : diff < 0 ? <TrendingDown className="w-4 h-4" /> : <Minus className="w-4 h-4" />}
        </span>
        <span className="text-foreground">Variance: {diff > 0 ? "+" : ""}{fmtNumber(diff)} ({target > 0 ? fmtPercentNumber(diff / target * 100) : "N/A"})</span>
      </li>
    </>
  );
}

// ─── Reusable Monthly Takeaways ─────────────────────────────────────────────
function MonthlyTakeaways({
  monthPcts,
  trend, first, second,
}: {
  monthPcts: { month: string; pct: number; target: number; accomp: number }[];
  trend: string; first: number; second: number;
}) {
  const highMonths = monthPcts.filter((m) => m.accomp >= m.target && m.target > 0);
  const lowMonths = monthPcts.filter((m) => m.accomp < m.target && m.target > 0);

  const monthChips = (items: typeof monthPcts, color: string) =>
    items.map((m, i) => (
      <Popover key={i}>
        <PopoverTrigger asChild>
          <span
            className={`cursor-pointer inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium border border-dotted transition-colors ${color} hover:opacity-80`}
          >
            {m.month} ({fmtPercentNumber(m.pct)})
          </span>
        </PopoverTrigger>
        <PopoverContent className="w-auto px-3 py-2 text-sm" side="top">
          <p>{m.month}: Accomplishment ({fmtNumber(m.accomp)}) ÷ Target ({fmtNumber(m.target)}) = {fmtPercentNumber(m.pct)}</p>
        </PopoverContent>
      </Popover>
    ));

  return (
    <ul className="space-y-2.5 text-sm text-muted-foreground">
      {/* High Performing */}
      <li className="flex items-start gap-2">
        <span className="text-emerald-600 mt-0.5 flex-shrink-0"><CheckCircle2 className="w-4 h-4" /></span>
        <div className="flex flex-col gap-1 min-w-0">
          <span className="font-medium text-foreground">High Performing Month(s)</span>
          {highMonths.length > 0 ? (
            <div className="flex flex-wrap gap-1">
              {monthChips(highMonths, 'text-emerald-700 border-emerald-300 bg-emerald-50')}
            </div>
          ) : (
            <span className="text-xs text-muted-foreground italic">None — target not met in any month</span>
          )}
        </div>
      </li>

      {/* Low Performing */}
      <li className="flex items-start gap-2">
        <span className="text-red-500 mt-0.5 flex-shrink-0"><AlertTriangle className="w-4 h-4" /></span>
        <div className="flex flex-col gap-1 min-w-0">
          <span className="font-medium text-foreground">Low Performing Month(s)</span>
          {lowMonths.length > 0 ? (
            <div className="flex flex-wrap gap-1">
              {monthChips(lowMonths, 'text-red-700 border-red-300 bg-red-50')}
            </div>
          ) : (
            <span className="text-xs text-emerald-600 italic">All months met target</span>
          )}
        </div>
      </li>

    </ul>
  );
}
// ─────────────────────────────────────────────────────────────────────────────

function OORCDashboard({ data }: { data: OORCRow[] }) {
  // Keep rows in the same order as they were parsed (Excel order).
  // Avoid re-sorting by indicator so the system reflects the source arrangement.
  const validRows = data.filter((r) => r.annualTarget !== null || r.targets.q1 !== null);
  const sortedRows = [...validRows];
  const [selectedOO, setSelectedOO] = useState<string>('All');
  const [typeFilter, setTypeFilter] = useState<'All' | 'Outcome' | 'Output'>('All');
  // Chart-specific filters
  const [quarterlyPIFilter, setQuarterlyPIFilter] = useState<string>('All');
  const [quarterlyQuarterFilter, setQuarterlyQuarterFilter] = useState<string>('All');
  const [selectedSemester, setSelectedSemester] = useState<'All' | '1st' | '2nd'>('All');
  const [donutSelection, setDonutSelection] = useState<string>('AGG_OO');

  // Derive semester/quarter logic
  const semesterMonths: Record<string, string[]> = {
    All: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    '1st': ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    '2nd': ['Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
  };
  const semesterQuarters: Record<string, string[]> = {
    All: ['Q1', 'Q2', 'Q3', 'Q4'],
    '1st': ['Q1', 'Q2'],
    '2nd': ['Q3', 'Q4'],
  };
  const allowedMonths = semesterMonths[selectedSemester];
  const allowedQuarters = semesterQuarters[selectedSemester];

  // Only include indicators that have a percent accomplishment value.
  // Previously we required annualTarget > 0 which excluded percentage-type PIs that store a pctAccomp
  // but may not have a non-zero numeric annualTarget. Include any row with pctAccomp !== null.
  const filteredByPct = sortedRows.filter((r) => r.pctAccomp !== null);

  // OO list for dropdown
  const ooList = Array.from(new Set(data.map((r) => r.oo || 'Unknown'))).filter(Boolean).sort((a, b) => String(a).localeCompare(String(b)));

  const rowsToUse = filteredByPct
    .filter((r) => selectedOO === 'All' ? true : (r.oo === selectedOO))
    .filter((r) => {
      if (typeFilter === 'All') return true;
      const cat = (r.category || '').toLowerCase();
      return cat.includes(typeFilter.toLowerCase());
    });

  const monthlyAgg = buildMonthlyAgg(rowsToUse);
  const quarterlyAgg = buildQuarterlyAgg(rowsToUse.map((r) => ({ targets: r.targets, accomplishments: r.accomplishments })));
  // Build OO summary cards dynamically for however many OOs are in the data
  const ooCards = ooList.map((oo, idx) => {
    const rows = sortedRows.filter((r) => (r.oo || 'Unknown') === oo);
    const allDataRows = data.filter((r) => (r.oo || 'Unknown') === oo);
    const pisWithPct = rows.filter((r) => r.pctAccomp !== null).length;
    const color = OO_PALETTE[idx % OO_PALETTE.length];
    return { oo, pisWithPct, totalPIs: allDataRows.length, color };
  });

  // Prepare PI selector options used by charts (cascading with selected OO)
  const piSource = selectedOO === 'All' ? sortedRows : sortedRows.filter((r) => (r.oo || 'Unknown') === selectedOO);
  const piOptions: { value: string; label: string }[] = [{ value: 'All', label: 'All PIs' }];
  piSource.forEach((r, i) => {
    if (r.pctAccomp !== null) {
      piOptions.push({ value: `PI|${sortedRows.indexOf(r)}`, label: r.indicator ? String(r.indicator) : `PI ${i + 1}` });
    }
  });

  // Reset chart-specific filters when the global OO changes
  useEffect(() => {
    setQuarterlyPIFilter('All');
    setQuarterlyQuarterFilter('All');
    setSelectedSemester('All');
    // reset donut selection to aggregated OO or first PI of selected OO
    const firstIdx = sortedRows.findIndex((r) => (r.oo || 'Unknown') === selectedOO && r.pctAccomp !== null);
    setDonutSelection(selectedOO === 'All' ? 'AGG_OO' : (firstIdx >= 0 ? `PI|${firstIdx}` : 'AGG_OO'));
  }, [selectedOO]);

  // Debug aggregates (per OO) to help track small discrepancies
  const debugAgg = (() => {
    const m = new Map<string, { rows: OORCRow[]; sumTarget: number; sumAccomp: number }>();
    for (const r of sortedRows) {
      const key = r.oo || 'Unknown';
      const entry = m.get(key) || { rows: [], sumTarget: 0, sumAccomp: 0 };
      entry.rows.push(r);
      entry.sumTarget += (r.annualTarget ?? 0);
      const accomp = (r.accomplishments.q1 ?? 0) + (r.accomplishments.q2 ?? 0) + (r.accomplishments.q3 ?? 0) + (r.accomplishments.q4 ?? 0);
      entry.sumAccomp += accomp;
      m.set(key, entry);
    }
    return m;
  })();

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className={`grid gap-3 grid-cols-2 ${ooCards.length <= 2 ? 'sm:grid-cols-2' : ooCards.length === 3 ? 'sm:grid-cols-3' : 'sm:grid-cols-2 md:grid-cols-4'} flex-1`}>
          {ooCards.map((c) => (
            <Card
              key={c.oo}
              className="transition-transform hover:-translate-y-1 hover:shadow-lg h-full flex flex-col"
              style={{ backgroundColor: hexToRgba(c.color, 0.08), border: `1px solid ${hexToRgba(c.color, 0.18)}` }}
            >
              <CardContent className="p-4 text-center flex flex-col items-center justify-between flex-1 gap-2 min-h-[96px]">
                <div className="flex-1 flex items-start justify-center w-full">
                  <p
                    className="text-lg font-semibold leading-tight"
                    style={{
                      color: hexToRgba(c.color, 0.95),
                      textShadow: '0 1px 0 rgba(255,255,255,0.6), 0 -1px 0 rgba(0,0,0,0.04)'
                    }}
                  >{c.oo}</p>
                </div>
                <div className="flex flex-col items-center w-full mt-auto">
                  <p className="text-2xl font-bold font-heading leading-tight" style={{ color: c.color }}>{c.pisWithPct}</p>
                  <p className="text-sm font-medium leading-tight mt-1" style={{ color: hexToRgba('#0f172a', 0.8) }}>Accomplishment ({c.totalPIs} total)</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="w-full md:w-auto md:ml-4 flex flex-col md:flex-row md:items-center gap-2">
          <div />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-1">
        {(() => {
          const totalTarget = monthlyAgg.reduce((s, m) => s + (m.target ?? 0), 0);
          const totalAccomp = monthlyAgg.reduce((s, m) => s + (m.accomp ?? 0), 0);

          // Build selector options for PI selection (center column)
          const selectorOptions: { value: string; label: string }[] = [];
          if (selectedOO === 'All') {
            selectorOptions.push({ value: 'AGG_OO', label: 'All OOs (by OO)' });
            sortedRows.forEach((r, i) => {
              if (r.pctAccomp !== null) {
                selectorOptions.push({ value: `PI|${i}`, label: `${r.indicator ? String(r.indicator) : `Indicator ${i + 1}`}` });
              }
            });
          } else {
            sortedRows.forEach((r, i) => {
              if ((r.oo || 'Unknown') === selectedOO && r.pctAccomp !== null) {
                selectorOptions.push({ value: `PI|${i}`, label: `${r.indicator ? String(r.indicator) : `Indicator ${i + 1}`}` });
              }
            });
          }

          // Compute donut data and PI insight based on donutSelection
          let donutData: { name: string; value: number }[] = [];
          let centerLabel = '';
          if (donutSelection === 'AGG_OO') {
            donutData = [{ name: 'No Data', value: 1 }];
            centerLabel = "Select PI";
          } else if (donutSelection.startsWith('PI|')) {
            const idx = Number(donutSelection.split('|')[1]);
            const r = sortedRows[idx];
            if (r) {
              const target = r.annualTarget ?? 0;
              const accompsum = (r.accomplishments.q1 ?? 0) + (r.accomplishments.q2 ?? 0) + (r.accomplishments.q3 ?? 0) + (r.accomplishments.q4 ?? 0);
              if (r.pctAccomp !== null) {
                donutData = [
                  { name: 'Accomplished', value: r.pctAccomp, rawCount: accompsum },
                  { name: 'Remaining', value: Math.max(1 - r.pctAccomp, 0), rawCount: Math.max(target - accompsum, 0) },
                ];
                centerLabel = fmtPercentNumber(r.pctAccomp * 100);
              } else {
                donutData = [
                  { name: 'Accomplished', value: accompsum },
                  { name: 'Remaining', value: Math.max(target - accompsum, 0) },
                ];
                centerLabel = target > 0 ? fmtPercentNumber((accompsum / target) * 100) : fmtPercentNumber(0);
              }
            } else {
              donutData = [{ name: 'None', value: 0 }];
              centerLabel = fmtPercentNumber(0);
            }
          } else {
            donutData = [{ name: 'None', value: 0 }];
            centerLabel = fmtPercentNumber(0);
          }

          const piInsight = (() => {
            if (!donutSelection.startsWith('PI|')) return null;
            const idx = Number(donutSelection.split('|')[1]);
            const r = sortedRows[idx];
            if (!r) return null;
            const target = r.annualTarget ?? 0;
            const accompsum = (r.accomplishments.q1 ?? 0) + (r.accomplishments.q2 ?? 0) + (r.accomplishments.q3 ?? 0) + (r.accomplishments.q4 ?? 0);
            const pct = r.pctAccomp !== null ? r.pctAccomp * 100 : (target > 0 ? (accompsum / target) * 100 : 0);
            const status = (r.pctAccomp === null && target === 0) ? 'No target set' : pct >= 100 ? 'Target achieved (met or exceeded)' : pct >= 75 ? 'Mostly achieved (>=75%)' : 'Target not achieved';
            return { pct, accompsum, target, status, isPctIndicator: r.pctAccomp !== null && target === 0, row: r };
          })();

          const centerContent = (
            <div className="w-full flex flex-col items-center gap-3">
              <label className="text-sm text-muted-foreground self-start">Performance Indicators (PIs):</label>
              <Select value={donutSelection} onValueChange={setDonutSelection}>
                <SelectTrigger className="w-full h-auto min-h-9 px-3 py-2 text-xs text-left [&>span]:whitespace-normal [&>span]:line-clamp-3">
                  <SelectValue placeholder="Select PI" />
                </SelectTrigger>
                <SelectContent className="max-w-[calc(100vw-2rem)] sm:max-w-[400px]">
                  {selectorOptions.map((o) => (
                    <SelectItem key={o.value} value={o.value} className="whitespace-normal break-words py-2 text-xs leading-relaxed pr-6">
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {piInsight && (
                <div className="w-full rounded-md border p-3 text-left bg-muted/30">
                  <div className="text-sm font-semibold">PI Accomplishment</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {fmtPercentNumber(piInsight.pct)}
                    {!piInsight.isPctIndicator && ` — ${fmtNumber(piInsight.accompsum)} of ${fmtNumber(piInsight.target)}`}
                  </div>
                  <div className="text-xs mt-2 flex flex-wrap items-center justify-between gap-1.5">
                    <div className="flex items-center gap-1.5">
                      <span>Status:</span>
                      <span className={`px-2 py-0.5 rounded text-white font-medium ${piInsight.status === 'No target set' ? 'bg-slate-500' :
                        piInsight.pct >= 100 ? 'bg-emerald-500' : 'bg-red-500'
                        }`}>
                        {piInsight.status}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );

          const asideContent = (
            <>
              {piInsight?.row ? (
                <Dialog>
                  <DialogTrigger asChild>
                    <div className="cursor-pointer hover:opacity-80 transition-opacity" title="Click to view breakdown">
                      <DonutChart
                        data={donutData}
                        title=""
                        colors={donutSelection === 'AGG_OO' ? ['#f1f5f9'] : undefined}
                        noCard
                        showCenterLabel
                        centerLabel={centerLabel}
                        showLegend={donutSelection !== 'AGG_OO'}
                      />
                    </div>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle>Data Breakdown</DialogTitle>
                    </DialogHeader>
                    <BreakdownTable
                      targets={piInsight.row.targets}
                      accomps={piInsight.row.accomplishments}
                      toDateTarget={piInsight.row.toDateTarget ?? piInsight.target}
                      toDateAccomp={piInsight.row.accomplishments.toDate ?? piInsight.accompsum}
                    />
                  </DialogContent>
                </Dialog>
              ) : (
                <DonutChart
                  data={donutData}
                  title=""
                  colors={donutSelection === 'AGG_OO' ? ['#f1f5f9'] : undefined}
                  noCard
                  showCenterLabel
                  centerLabel={centerLabel}
                  showLegend={donutSelection !== 'AGG_OO'}
                />
              )}
            </>
          );

          // Build PI-level summaries: which indicators have any accomplishment
          const piSourceForList = selectedOO === 'All' ? sortedRows : sortedRows.filter((r) => (r.oo || 'Unknown') === selectedOO);
          const pisWithAccomp: { oo?: string; indicator: string; type?: string }[] = [];
          piSourceForList.forEach((r, idx) => {
            const label = r.indicator ? String(r.indicator) : `PI ${idx + 1}`;
            const typ = (r.category || '').toLowerCase().includes('output') ? 'Output' : (r.category || '').toLowerCase().includes('outcome') ? 'Outcome' : '-';
            const ooName = r.oo || 'Unknown';
            if (r.pctAccomp !== null) pisWithAccomp.push({ oo: ooName, indicator: label, type: typ });
          });

          return (
            <DataInsightsPanel
              data={{
                ...buildInsightData(monthlyAgg, quarterlyAgg, `OORC${selectedOO === 'All' ? '' : ` — ${selectedOO}`}`),
                pisWithAccomp,
              }}
              center={centerContent}
              aside={asideContent}
              controlsLeft={(
                <div className="flex items-center gap-2 w-full">
                  <label className="text-sm text-muted-foreground">Filter OO:</label>
                  <Select value={selectedOO} onValueChange={setSelectedOO}>
                    <SelectTrigger className="w-full sm:w-[280px] h-auto min-h-9 px-3 py-2 text-sm text-left [&>span]:whitespace-normal [&>span]:line-clamp-3">
                      <SelectValue placeholder="Filter OO" />
                    </SelectTrigger>
                    <SelectContent className="max-w-[calc(100vw-2rem)] sm:max-w-[400px]">
                      <SelectItem value="All" className="whitespace-normal break-words py-2 text-sm leading-relaxed pr-6">
                        All OOs
                      </SelectItem>
                      {ooList.map((oo) => (
                        <SelectItem key={oo} value={oo} className="whitespace-normal break-words py-2 text-sm leading-relaxed pr-6">
                          {oo}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            />
          );
        })()}
      </div>

      {/* ── Shared Controls Bar (top) ── */}
      {(() => {
        const ControlsBar = () => (
          <div className="flex flex-col sm:flex-row flex-wrap gap-3 items-start sm:items-center bg-muted/30 border rounded-lg px-4 py-3">
            {/* Filter OO */}
            <div className="flex items-center gap-2 min-w-0 flex-1 bg-sky-50/50 p-2 rounded-md border border-sky-100/50">
              <label className="text-xs font-semibold text-sky-700 whitespace-nowrap uppercase tracking-wider">OO:</label>
              <Select value={selectedOO} onValueChange={setSelectedOO}>
                <SelectTrigger className="h-8 text-xs flex-1 min-w-[130px] max-w-[220px] bg-white">
                  <SelectValue placeholder="All OOs" />
                </SelectTrigger>
                <SelectContent className="max-w-[calc(100vw-2rem)] sm:max-w-[320px]">
                  <SelectItem value="All" className="text-xs">All OOs</SelectItem>
                  {ooList.map((oo) => (
                    <SelectItem key={oo} value={oo} className="text-xs whitespace-normal break-words">{oo}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {/* PI Selection */}
            <div className="flex items-center gap-2 min-w-0 flex-1 bg-emerald-50/50 p-2 rounded-md border border-emerald-100/50">
              <label className="text-xs font-semibold text-emerald-700 whitespace-nowrap uppercase tracking-wider">Indicator:</label>
              <Select value={donutSelection} onValueChange={setDonutSelection}>
                <SelectTrigger className="h-8 text-xs flex-1 min-w-[130px] max-w-[260px] bg-white">
                  <SelectValue placeholder="All PIs" />
                </SelectTrigger>
                <SelectContent className="max-w-[calc(100vw-2rem)] sm:max-w-[400px]">
                  <SelectItem value="AGG_OO" className="text-xs">All Indicators</SelectItem>
                  {sortedRows.filter(r => {
                    if (selectedOO !== 'All' && (r.oo || 'Unknown') !== selectedOO) return false;
                    return r.pctAccomp !== null;
                  }).map((r) => {
                    const globalIdx = sortedRows.indexOf(r);
                    return (
                      <SelectItem key={`top-pi-${globalIdx}`} value={`PI|${globalIdx}`} className="text-xs whitespace-normal break-words">
                        {r.indicator ? String(r.indicator) : `PI ${globalIdx + 1}`}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
            {/* Semester */}
            <div className="flex items-center gap-2 bg-amber-50/50 p-2 rounded-md border border-amber-100/50">
              <label className="text-xs font-semibold text-amber-700 whitespace-nowrap uppercase tracking-wider">Semester:</label>
              <select
                className="border bg-white rounded px-2 py-1.5 text-xs hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-300"
                value={selectedSemester}
                onChange={(e) => setSelectedSemester(e.target.value as 'All' | '1st' | '2nd')}
              >
                <option value="All">All Semesters</option>
                <option value="1st">1st Semester (Jan–Jun)</option>
                <option value="2nd">2nd Semester (Jul–Dec)</option>
              </select>
            </div>
            {/* Quarter */}
            <div className="flex items-center gap-2 bg-indigo-50/50 p-2 rounded-md border border-indigo-100/50">
              <label className="text-xs font-semibold text-indigo-700 whitespace-nowrap uppercase tracking-wider">Quarter:</label>
              <select
                className="border bg-white rounded px-2 py-1.5 text-xs hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                value={quarterlyQuarterFilter}
                onChange={(e) => setQuarterlyQuarterFilter(e.target.value)}
              >
                <option value="All">All Quarters</option>
                {allowedQuarters.map(q => <option key={q} value={q}>{q}</option>)}
              </select>
            </div>
          </div>
        );

        return <ControlsBar />;
      })()}

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="flex flex-col">
          {(() => {
            // build monthly chart data (and interpretation) so we can reuse values
            let monthlyChartData = monthlyAgg;
            if (donutSelection !== 'AGG_OO' && donutSelection.startsWith('PI|')) {
              const idx = Number(donutSelection.split('|')[1]);
              const r = sortedRows[idx];
              if (r) {
                monthlyChartData = MONTHS.map((m, idx2) => ({ month: MONTH_LABELS[idx2], target: ((r.monthly as any)[m].target ?? 0), accomp: ((r.monthly as any)[m].accomp ?? 0) }));
              }
            }

            // Sync with semester/quarter filters
            if (selectedSemester !== 'All') {
              monthlyChartData = monthlyChartData.filter((d) => allowedMonths.includes(d.month));
            }
            if (quarterlyQuarterFilter !== 'All') {
              const quarterMap: Record<string, string[]> = {
                'Q1': ['Jan', 'Feb', 'Mar'],
                'Q2': ['Apr', 'May', 'Jun'],
                'Q3': ['Jul', 'Aug', 'Sep'],
                'Q4': ['Oct', 'Nov', 'Dec']
              };
              const allowedQMonths = quarterMap[quarterlyQuarterFilter] || [];
              monthlyChartData = monthlyChartData.filter((d) => allowedQMonths.includes(d.month));
            }

            const totalTarget = monthlyChartData.reduce((s, m) => s + (m.target ?? 0), 0);
            const totalAccomp = monthlyChartData.reduce((s, m) => s + (m.accomp ?? 0), 0);
            const pct = totalTarget > 0 ? (totalAccomp / totalTarget) * 100 : 0;
            const active = monthlyChartData.filter((m) => m.target > 0);
            const monthPcts = active.map((m) => ({ month: m.month, pct: m.target > 0 ? (m.accomp / m.target) * 100 : 0, target: m.target, accomp: m.accomp }));
            const best = monthPcts.length ? monthPcts.reduce((a, b) => a.pct > b.pct ? a : b) : null;
            const worst = monthPcts.length ? monthPcts.reduce((a, b) => a.pct < b.pct ? a : b) : null;
            const nonZero = monthlyChartData.map((m) => m.accomp).filter((v) => v > 0);
            let trend = 'Stable';
            let first = 0;
            let second = 0;
            if (nonZero.length >= 2) {
              const half = Math.floor(nonZero.length / 2);
              first = nonZero.slice(0, half).reduce((a, b) => a + b, 0) / Math.max(1, half);
              second = nonZero.slice(half).reduce((a, b) => a + b, 0) / Math.max(1, nonZero.length - half);
              if (second > first * 1.1) trend = 'Increasing';
              else if (second < first * 0.9) trend = 'Decreasing';
            }

            return (
              <>
                <MonthlyChart data={monthlyChartData} title={selectedOO === 'All' ? "All OOs (Monthly)" : `${selectedOO} (Monthly)`} />
                <div className="mt-3 bg-white rounded-lg border p-4 shadow-sm">
                  <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                    <Popover>
                      <PopoverTrigger asChild>
                        <div className="flex-shrink-0 w-full sm:w-36 flex flex-col items-center cursor-pointer rounded-md p-2 hover:bg-muted/50 transition-colors">
                          <div className="text-xs text-muted-foreground">Overall</div>
                          <div className="text-2xl font-bold mt-1">{fmtPercentNumber(pct)}</div>
                          <div className="text-sm text-muted-foreground mt-1">{fmtNumber(totalAccomp)} of {fmtNumber(totalTarget)}</div>
                        </div>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto px-3 py-2 text-sm" side="top">
                        <p>Total Accomplishment ({fmtNumber(totalAccomp)}) ÷ Total Target ({fmtNumber(totalTarget)}) = {fmtPercentNumber(pct)}</p>
                      </PopoverContent>
                    </Popover>

                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium mb-2">Quick takeaways</div>
                      <MonthlyTakeaways monthPcts={monthPcts} trend={trend} first={first} second={second} />
                    </div>

                    <div className="hidden sm:flex sm:flex-col sm:items-start sm:w-32 flex-shrink-0">
                      <div className="text-sm font-medium mb-1">Details</div>
                      <div className="text-sm text-muted-foreground">Active months: <strong>{active.length}</strong></div>
                      <div className="text-sm text-muted-foreground">Months with data: <strong>{nonZero.length}</strong></div>
                    </div>
                  </div>
                </div>
              </>
            );
          })()}
        </div>

        <div className="flex flex-col">
          <QuarterlyChart data={(() => {
            let dataForChart = quarterlyAgg;
            if (donutSelection !== 'AGG_OO' && donutSelection.startsWith('PI|')) {
              const idx = Number(donutSelection.split('|')[1]);
              const r = sortedRows[idx];
              if (r) {
                dataForChart = [
                  { quarter: 'Q1', target: r.targets.q1 ?? 0, accomp: r.accomplishments.q1 ?? 0, pct: (r.targets.q1 ?? 0) > 0 ? ((r.accomplishments.q1 ?? 0) / (r.targets.q1 ?? 0)) * 100 : 0 },
                  { quarter: 'Q2', target: r.targets.q2 ?? 0, accomp: r.accomplishments.q2 ?? 0, pct: (r.targets.q2 ?? 0) > 0 ? ((r.accomplishments.q2 ?? 0) / (r.targets.q2 ?? 0)) * 100 : 0 },
                  { quarter: 'Q3', target: r.targets.q3 ?? 0, accomp: r.accomplishments.q3 ?? 0, pct: (r.targets.q3 ?? 0) > 0 ? ((r.accomplishments.q3 ?? 0) / (r.targets.q3 ?? 0)) * 100 : 0 },
                  { quarter: 'Q4', target: r.targets.q4 ?? 0, accomp: r.accomplishments.q4 ?? 0, pct: (r.targets.q4 ?? 0) > 0 ? ((r.accomplishments.q4 ?? 0) / (r.targets.q4 ?? 0)) * 100 : 0 },
                ];
              }
            }
            if (selectedSemester !== 'All') {
              dataForChart = dataForChart.filter((d) => allowedQuarters.includes(d.quarter));
            }
            if (quarterlyQuarterFilter !== 'All') {
              dataForChart = dataForChart.filter((d) => d.quarter === quarterlyQuarterFilter);
            }
            return dataForChart;
          })()} title={selectedOO === 'All' ? "All OOs (Quarterly)" : `${selectedOO} (Quarterly)`} />
          {/* Interpretation for quarterly chart */}
          {(() => {
            let qData = quarterlyAgg;
            if (donutSelection !== 'AGG_OO' && donutSelection.startsWith('PI|')) {
              const idx = Number(donutSelection.split('|')[1]);
              const r = sortedRows[idx];
              if (r) {
                qData = [
                  { quarter: 'Q1', target: r.targets.q1 ?? 0, accomp: r.accomplishments.q1 ?? 0, pct: (r.targets.q1 ?? 0) > 0 ? ((r.accomplishments.q1 ?? 0) / (r.targets.q1 ?? 0)) * 100 : 0 },
                  { quarter: 'Q2', target: r.targets.q2 ?? 0, accomp: r.accomplishments.q2 ?? 0, pct: (r.targets.q2 ?? 0) > 0 ? ((r.accomplishments.q2 ?? 0) / (r.targets.q2 ?? 0)) * 100 : 0 },
                  { quarter: 'Q3', target: r.targets.q3 ?? 0, accomp: r.accomplishments.q3 ?? 0, pct: (r.targets.q3 ?? 0) > 0 ? ((r.accomplishments.q3 ?? 0) / (r.targets.q3 ?? 0)) * 100 : 0 },
                  { quarter: 'Q4', target: r.targets.q4 ?? 0, accomp: r.accomplishments.q4 ?? 0, pct: (r.targets.q4 ?? 0) > 0 ? ((r.accomplishments.q4 ?? 0) / (r.targets.q4 ?? 0)) * 100 : 0 },
                ];
              }
            }

            if (selectedSemester !== 'All') qData = qData.filter((d) => allowedQuarters.includes(d.quarter));
            if (quarterlyQuarterFilter !== 'All') qData = qData.filter((d) => d.quarter === quarterlyQuarterFilter);

            const totalT = qData.reduce((s, q) => s + (q.target ?? 0), 0);
            const totalA = qData.reduce((s, q) => s + (q.accomp ?? 0), 0);
            const totalPct = totalT > 0 ? (totalA / totalT) * 100 : 0;
            const qPcts = qData.map((q) => ({ quarter: q.quarter, pct: q.target > 0 ? (q.accomp / q.target) * 100 : 0, target: q.target, accomp: q.accomp }));
            const bestQ = qPcts.length ? qPcts.reduce((a, b) => a.pct > b.pct ? a : b) : null;
            const worstQ = qPcts.length ? qPcts.reduce((a, b) => a.pct < b.pct ? a : b) : null;

            return (
              <div className="mt-3 bg-white rounded-lg border p-4 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  <Popover>
                    <PopoverTrigger asChild>
                      <div className="flex-shrink-0 w-full sm:w-36 flex flex-col items-center cursor-pointer rounded-md p-2 hover:bg-muted/50 transition-colors">
                        <div className="text-xs text-muted-foreground">Overall</div>
                        <div className="text-2xl font-bold mt-1">{fmtPercentNumber(totalPct)}</div>
                        <div className="text-sm text-muted-foreground mt-1">{fmtNumber(totalA)} of {fmtNumber(totalT)}</div>
                      </div>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto px-3 py-2 text-sm" side="top">
                      <p>Total Accomplishment ({fmtNumber(totalA)}) ÷ Total Target ({fmtNumber(totalT)}) = {fmtPercentNumber(totalPct)}</p>
                    </PopoverContent>
                  </Popover>

                  <div className="flex-1">
                    <div className="text-sm font-medium mb-2">Quick takeaways</div>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      {quarterlyQuarterFilter === 'All' ? (
                        <>
                          {bestQ ? (
                            <li className="flex items-start gap-2">
                              <span className="text-emerald-600 mt-0.5"><CheckCircle2 className="w-4 h-4" /></span>
                              <Popover>
                                <PopoverTrigger asChild>
                                  <span className="group cursor-pointer border-b border-dotted border-muted-foreground/50 hover:text-primary hover:border-primary transition-colors">Best quarter: <strong className="text-foreground group-hover:text-primary transition-colors">{bestQ.quarter}</strong> at {fmtPercentNumber(bestQ.pct)}</span>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto px-3 py-2 text-sm" side="top">
                                  <p>{bestQ.quarter} Accomplishment ({fmtNumber(bestQ.accomp)}) ÷ Target ({fmtNumber(bestQ.target)}) = {fmtPercentNumber(bestQ.pct)}</p>
                                </PopoverContent>
                              </Popover>
                            </li>
                          ) : null}
                          {worstQ ? (
                            <li className="flex items-start gap-2">
                              <span className="text-red-600 mt-0.5"><AlertTriangle className="w-4 h-4" /></span>
                              <Popover>
                                <PopoverTrigger asChild>
                                  <span className="group cursor-pointer border-b border-dotted border-muted-foreground/50 hover:text-primary hover:border-primary transition-colors">Weakest quarter: <strong className="text-foreground group-hover:text-primary transition-colors">{worstQ.quarter}</strong> at {fmtPercentNumber(worstQ.pct)}</span>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto px-3 py-2 text-sm" side="top">
                                  <p>{worstQ.quarter} Accomplishment ({fmtNumber(worstQ.accomp)}) ÷ Target ({fmtNumber(worstQ.target)}) = {fmtPercentNumber(worstQ.pct)}</p>
                                </PopoverContent>
                              </Popover>
                            </li>
                          ) : null}
                        </>
                      ) : (
                        <SinglePeriodInsight target={totalT} accomp={totalA} />
                      )}
                    </ul>
                  </div>

                  <div className="hidden sm:flex sm:flex-col sm:items-start sm:w-40">
                    <div className="text-sm font-medium mb-1">Notes</div>
                    <div className="text-sm text-muted-foreground">Quarters shown: <strong>{qData.length}</strong></div>
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      </div>
    </div>
  );
}

function PGSDashboard({ data }: { data: PGSRow[] }) {

  // Include any row that has at least one piece of numeric data:
  // cyTarget, any quarterly target/accomp, any monthly value, or pctAccomp.
  // The old filter (cyTarget || q1) was excluding sub-measures that only have monthly data.
  const hasAnyData = (r: PGSRow) => {
    if (r.cyTarget !== null) return true;
    if (r.pctAccomp !== null) return true;
    const qt = r.targets;
    if (qt.q1 !== null || qt.q2 !== null || qt.q3 !== null || qt.q4 !== null) return true;
    const qa = r.accomplishments;
    if (qa.q1 !== null || qa.q2 !== null || qa.q3 !== null || qa.q4 !== null) return true;
    const m = r.monthly;
    const months = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'] as const;
    return months.some(mo => m[mo].target !== null || m[mo].accomp !== null);
  };
  const validRows = data.filter(hasAnyData);
  const sortedRows = [...validRows];

  const [selectedPerspective, setSelectedPerspective] = useState<string>('All');


  const [quarterlyQuarterFilter, setQuarterlyQuarterFilter] = useState<string>('All');
  const [selectedSemester, setSelectedSemester] = useState<'All' | '1st' | '2nd'>('All');
  const [donutSelection, setDonutSelection] = useState<string>('AGG_PERSPECTIVE');

  // Derive quarter filter from semester selection
  const semesterMonths: Record<string, string[]> = {
    All: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    '1st': ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    '2nd': ['Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
  };
  const semesterQuarters: Record<string, string[]> = {
    All: ['Q1', 'Q2', 'Q3', 'Q4'],
    '1st': ['Q1', 'Q2'],
    '2nd': ['Q3', 'Q4'],
  };
  const allowedMonths = semesterMonths[selectedSemester];
  const allowedQuarters = semesterQuarters[selectedSemester];

  // Include rows that have pctAccomp OR any monthly/quarterly accomp data
  const filteredByPct = sortedRows.filter((r) => {
    if (r.pctAccomp !== null) return true;
    const qa = r.accomplishments;
    if (qa.q1 !== null || qa.q2 !== null || qa.q3 !== null || qa.q4 !== null) return true;
    const m = r.monthly;
    const months = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'] as const;
    return months.some(mo => m[mo].accomp !== null);
  });

  const customOrder = ['External stakeholders', 'Core Process', 'People & Org', 'Resources'];
  const perspectiveList = Array.from(new Set(data.map((r) => r.perspective?.trim())))
    .filter((pers): pers is string => {
      if (!pers) return false;
      const lowerPers = pers.toLowerCase();
      return customOrder.some(target => target.toLowerCase() === lowerPers);
    })
    .sort((a, b) => {
      const idxA = customOrder.findIndex(target => target.toLowerCase() === a.toLowerCase());
      const idxB = customOrder.findIndex(target => target.toLowerCase() === b.toLowerCase());
      return idxA - idxB;
    });

  // Exclude sub-measures (measureNo === null) from aggregation to avoid double-counting
  const rowsForAgg = filteredByPct.filter((r) => r.measureNo !== null);
  const rowsToUse = rowsForAgg.filter((r) => selectedPerspective === 'All' ? true : (r.perspective === selectedPerspective));

  // For the PI dropdown and insights panel, include ALL rows (including sub-measures) so users can drill down
  const allRowsToUse = filteredByPct.filter((r) => selectedPerspective === 'All' ? true : (r.perspective === selectedPerspective));

  const monthlyAgg = buildMonthlyAgg(rowsToUse as any);
  const quarterlyAgg = buildQuarterlyAgg(rowsToUse.map((r) => ({ targets: r.targets, accomplishments: r.accomplishments })));

  // Perspective cards — use filteredByPct as the source (same pool as pisWithAccomp)
  // so the card numbers always match the DataInsightsPanel count.
  const perspectiveCards = perspectiveList.map((pers, idx) => {
    const rows = filteredByPct.filter((r) => (r.perspective || 'Unknown') === pers);
    // Consistent with pisWithAccomp: a measure "has accomplishment" when pctAccomp is not null
    const measuresWithPct = rows.filter((r) => r.pctAccomp !== null).length;
    const color = OO_PALETTE[idx % OO_PALETTE.length];
    return { perspective: pers, measuresWithPct, totalMeasures: rows.length, color };
  });



  useEffect(() => {
    setQuarterlyQuarterFilter('All');
    setSelectedSemester('All');
    const firstIdx = sortedRows.findIndex((r) => (r.perspective || 'Unknown') === selectedPerspective && r.pctAccomp !== null);
    setDonutSelection(selectedPerspective === 'All' ? 'AGG_PERSPECTIVE' : (firstIdx >= 0 ? `MEASURE|${firstIdx}` : 'AGG_PERSPECTIVE'));
  }, [selectedPerspective]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className={`grid gap-3 grid-cols-2 ${perspectiveCards.length <= 2 ? 'sm:grid-cols-2' : perspectiveCards.length === 3 ? 'sm:grid-cols-3' : 'sm:grid-cols-2 md:grid-cols-4'} flex-1`}>
          {perspectiveCards.map((c) => (
            <Card
              key={c.perspective}
              className="transition-transform hover:-translate-y-1 hover:shadow-lg h-full flex flex-col"
              style={{ backgroundColor: hexToRgba(c.color, 0.08), border: `1px solid ${hexToRgba(c.color, 0.18)}` }}
            >
              <CardContent className="p-4 text-center flex flex-col items-center justify-between flex-1 gap-2 min-h-[96px]">
                <div className="flex-1 flex items-start justify-center w-full">
                  <p
                    className="text-lg font-semibold leading-tight"
                    style={{
                      color: hexToRgba(c.color, 0.95),
                      textShadow: '0 1px 0 rgba(255,255,255,0.6), 0 -1px 0 rgba(0,0,0,0.04)'
                    }}
                  >{c.perspective}</p>
                </div>
                <div className="flex flex-col items-center w-full mt-auto">
                  <p className="text-2xl font-bold font-heading leading-tight" style={{ color: c.color }}>{c.measuresWithPct}</p>
                  <p className="text-sm font-medium leading-tight mt-1" style={{ color: hexToRgba('#0f172a', 0.8) }}>Accomplishment ({c.totalMeasures} total)</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-1">
        {(() => {
          const totalTarget = monthlyAgg.reduce((s, m) => s + (m.target ?? 0), 0);
          const totalAccomp = monthlyAgg.reduce((s, m) => s + (m.accomp ?? 0), 0);

          const selectorOptions: { value: string; label: string }[] = [];
          if (selectedPerspective === 'All') {
            selectorOptions.push({ value: 'AGG_PERSPECTIVE', label: 'All Perspectives' });
            sortedRows.forEach((r, i) => {
              if (r.pctAccomp !== null) {
                const labelText = r.strategicMeasure ? String(r.strategicMeasure) : `Measure ${i + 1}`;
                const isMain = !labelText.startsWith('\u00A0');
                const label = isMain ? `• ${labelText}` : labelText;
                selectorOptions.push({ value: `MEASURE|${i}`, label });
              }
            });
          } else {
            sortedRows.forEach((r, i) => {
              if ((r.perspective || 'Unknown') === selectedPerspective && r.pctAccomp !== null) {
                const labelText = r.strategicMeasure ? String(r.strategicMeasure) : `Measure ${i + 1}`;
                const isMain = !labelText.startsWith('\u00A0');
                const label = isMain ? `• ${labelText}` : labelText;
                selectorOptions.push({ value: `MEASURE|${i}`, label });
              }
            });
          }

          let donutData: { name: string; value: number }[] = [];
          let centerLabel = '';
          if (donutSelection === 'AGG_PERSPECTIVE') {
            donutData = [{ name: 'No Data', value: 1 }];
            centerLabel = "Select Measure";
          } else if (donutSelection.startsWith('MEASURE|')) {
            const idx = Number(donutSelection.split('|')[1]);
            const r = sortedRows[idx];
            if (r) {
              const target = r.cyTarget ?? 0;
              const accompsum = (r.accomplishments.q1 ?? 0) + (r.accomplishments.q2 ?? 0) + (r.accomplishments.q3 ?? 0) + (r.accomplishments.q4 ?? 0);
              if (r.pctAccomp !== null) {
                donutData = [
                  { name: 'Accomplished', value: r.pctAccomp, rawCount: accompsum },
                  { name: 'Remaining', value: Math.max(1 - r.pctAccomp, 0), rawCount: Math.max(target - accompsum, 0) },
                ];
                centerLabel = fmtPercentNumber(r.pctAccomp * 100);
              } else {
                donutData = [
                  { name: 'Accomplished', value: accompsum },
                  { name: 'Remaining', value: Math.max(target - accompsum, 0) },
                ];
                centerLabel = target > 0 ? fmtPercentNumber((accompsum / target) * 100) : fmtPercentNumber(0);
              }
            } else {
              donutData = [{ name: 'None', value: 0 }];
              centerLabel = fmtPercentNumber(0);
            }
          } else {
            donutData = [{ name: 'None', value: 0 }];
            centerLabel = fmtPercentNumber(0);
          }

          const measureInsight = (() => {
            if (!donutSelection.startsWith('MEASURE|')) return null;
            const idx = Number(donutSelection.split('|')[1]);
            const r = sortedRows[idx];
            if (!r) return null;
            const target = r.cyTarget ?? 0;
            const accompsum = (r.accomplishments.q1 ?? 0) + (r.accomplishments.q2 ?? 0) + (r.accomplishments.q3 ?? 0) + (r.accomplishments.q4 ?? 0);
            const pct = r.pctAccomp !== null ? r.pctAccomp * 100 : (target > 0 ? (accompsum / target) * 100 : 0);
            const status = (r.pctAccomp === null && target === 0) ? 'No target set' : pct >= 100 ? 'Target achieved (met or exceeded)' : pct >= 75 ? 'Mostly achieved (>=75%)' : 'Target not achieved';
            return { pct, accompsum, target, status, isPctIndicator: r.pctAccomp !== null && target === 0, row: r };
          })();

          const centerContent = (
            <div className="w-full flex flex-col items-center gap-3">
              <label className="text-sm text-muted-foreground self-start">Strategic Measures:</label>
              <Select value={donutSelection} onValueChange={setDonutSelection}>
                <SelectTrigger className="w-full h-auto min-h-9 px-3 py-2 text-xs text-left [&>span]:whitespace-normal [&>span]:line-clamp-3">
                  <SelectValue placeholder="Select Measure" />
                </SelectTrigger>
                <SelectContent className="max-w-[calc(100vw-2rem)] sm:max-w-[400px]">
                  {selectorOptions.map((o) => (
                    <SelectItem key={o.value} value={o.value} className="whitespace-normal break-words py-2 text-xs leading-relaxed pr-6">
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {measureInsight && (
                <div className="w-full rounded-md border p-3 text-left bg-muted/30">
                  <div className="text-sm font-semibold">Measure Accomplishment</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {fmtPercentNumber(measureInsight.pct)}
                    {!measureInsight.isPctIndicator && ` — ${fmtNumber(measureInsight.accompsum)} of ${fmtNumber(measureInsight.target)}`}
                  </div>
                  <div className="text-xs mt-2 flex flex-wrap items-center justify-between gap-1.5">
                    <div className="flex items-center gap-1.5">
                      <span>Status:</span>
                      <span className={`px-2 py-0.5 rounded text-white font-medium ${measureInsight.status === 'No target set' ? 'bg-slate-500' :
                        measureInsight.pct >= 100 ? 'bg-emerald-500' : 'bg-red-500'
                        }`}>
                        {measureInsight.status}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );

          const asideContent = (
            <>
              {measureInsight?.row ? (
                <Dialog>
                  <DialogTrigger asChild>
                    <div className="cursor-pointer hover:opacity-80 transition-opacity" title="Click to view breakdown">
                      <DonutChart
                        data={donutData}
                        title=""
                        colors={donutSelection === 'AGG_PERSPECTIVE' ? ['#f1f5f9'] : undefined}
                        noCard
                        showCenterLabel
                        centerLabel={centerLabel}
                        showLegend={donutSelection !== 'AGG_PERSPECTIVE'}
                      />
                    </div>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle>Data Breakdown</DialogTitle>
                    </DialogHeader>
                    <BreakdownTable
                      targets={measureInsight.row.targets}
                      accomps={measureInsight.row.accomplishments}
                      toDateTarget={measureInsight.row.cyTarget ?? measureInsight.target}
                      toDateAccomp={measureInsight.row.accomplishments.toDate ?? measureInsight.accompsum}
                    />
                  </DialogContent>
                </Dialog>
              ) : (
                <DonutChart
                  data={donutData}
                  title=""
                  colors={donutSelection === 'AGG_PERSPECTIVE' ? ['#f1f5f9'] : undefined}
                  noCard
                  showCenterLabel
                  centerLabel={centerLabel}
                  showLegend={donutSelection !== 'AGG_PERSPECTIVE'}
                />
              )}
            </>
          );

          const measureSourceForList = selectedPerspective === 'All' ? allRowsToUse : allRowsToUse.filter((r) => (r.perspective || 'Unknown') === selectedPerspective);
          const pisWithAccomp: { oo?: string; indicator: string; type?: string }[] = [];
          measureSourceForList.forEach((r, idx) => {
            const label = r.strategicMeasure ? String(r.strategicMeasure) : `Measure ${idx + 1}`;
            const typ = '-';
            const ooName = r.perspective || 'Unknown';
            if (r.pctAccomp !== null) pisWithAccomp.push({ oo: ooName, indicator: label, type: typ });
          });

          return (
            <DataInsightsPanel
              data={{
                ...buildInsightData(monthlyAgg, quarterlyAgg, `PGS${selectedPerspective === 'All' ? '' : ` — ${selectedPerspective}`}`),
                pisWithAccomp,
              }}
              center={centerContent}
              aside={asideContent}
              controlsLeft={(
                <div className="flex items-center gap-2 w-full">
                  <label className="text-sm text-muted-foreground">Filter Perspective:</label>
                  <Select value={selectedPerspective} onValueChange={setSelectedPerspective}>
                    <SelectTrigger className="w-full sm:w-[280px] h-auto min-h-9 px-3 py-2 text-sm text-left [&>span]:whitespace-normal [&>span]:line-clamp-3">
                      <SelectValue placeholder="Filter Perspective" />
                    </SelectTrigger>
                    <SelectContent className="max-w-[calc(100vw-2rem)] sm:max-w-[400px]">
                      <SelectItem value="All" className="whitespace-normal break-words py-2 text-sm leading-relaxed pr-6">
                        All Perspectives
                      </SelectItem>
                      {perspectiveList.map((pers) => (
                        <SelectItem key={pers} value={pers} className="whitespace-normal break-words py-2 text-sm leading-relaxed pr-6">
                          {pers}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            />
          );
        })()}
      </div>

      {/* ── Shared Controls Bar (top) ── */}
      {(() => {
        const ControlsBar = () => (
          <div className="flex flex-col sm:flex-row flex-wrap gap-3 items-start sm:items-center bg-muted/30 border rounded-lg px-4 py-3">
            {/* Filter Perspective */}
            <div className="flex items-center gap-2 min-w-0 flex-1 bg-sky-50/50 p-2 rounded-md border border-sky-100/50">
              <label className="text-xs font-semibold text-sky-700 whitespace-nowrap uppercase tracking-wider">Perspective:</label>
              <Select value={selectedPerspective} onValueChange={setSelectedPerspective}>
                <SelectTrigger className="h-8 text-xs flex-1 min-w-[130px] max-w-[220px] bg-white">
                  <SelectValue placeholder="All Perspectives" />
                </SelectTrigger>
                <SelectContent className="max-w-[calc(100vw-2rem)] sm:max-w-[320px]">
                  <SelectItem value="All" className="text-xs">All Perspectives</SelectItem>
                  {perspectiveList.map((pers) => (
                    <SelectItem key={pers} value={pers} className="text-xs whitespace-normal break-words">{pers}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {/* Strategic Measure */}
            <div className="flex items-center gap-2 min-w-0 flex-1 bg-emerald-50/50 p-2 rounded-md border border-emerald-100/50">
              <label className="text-xs font-semibold text-emerald-700 whitespace-nowrap uppercase tracking-wider">Measure:</label>
              <Select value={donutSelection} onValueChange={setDonutSelection}>
                <SelectTrigger className="h-8 text-xs flex-1 min-w-[130px] max-w-[260px] bg-white">
                  <SelectValue placeholder="All Perspectives" />
                </SelectTrigger>
                <SelectContent className="max-w-[calc(100vw-2rem)] sm:max-w-[400px]">
                  <SelectItem value="AGG_PERSPECTIVE" className="text-xs">All Perspectives</SelectItem>
                  {sortedRows.filter(r => {
                    if (selectedPerspective !== 'All' && (r.perspective || 'Unknown') !== selectedPerspective) return false;
                    return r.pctAccomp !== null;
                  }).map((r, _i) => {
                    const globalIdx = sortedRows.indexOf(r);
                    const labelText = r.strategicMeasure ? String(r.strategicMeasure) : `Measure ${globalIdx + 1}`;
                    const isMain = !labelText.startsWith('\u00A0');
                    return (
                      <SelectItem key={globalIdx} value={`MEASURE|${globalIdx}`} className="text-xs whitespace-normal break-words">
                        {isMain ? `• ${labelText.trim()}` : labelText}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
            {/* Semester */}
            <div className="flex items-center gap-2 bg-amber-50/50 p-2 rounded-md border border-amber-100/50">
              <label className="text-xs font-semibold text-amber-700 whitespace-nowrap uppercase tracking-wider">Semester:</label>
              <select
                className="border bg-white rounded px-2 py-1.5 text-xs hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-300"
                value={selectedSemester}
                onChange={(e) => setSelectedSemester(e.target.value as 'All' | '1st' | '2nd')}
              >
                <option value="All">All Semesters</option>
                <option value="1st">1st Semester (Jan–Jun)</option>
                <option value="2nd">2nd Semester (Jul–Dec)</option>
              </select>
            </div>
            {/* Quarter */}
            <div className="flex items-center gap-2 bg-indigo-50/50 p-2 rounded-md border border-indigo-100/50">
              <label className="text-xs font-semibold text-indigo-700 whitespace-nowrap uppercase tracking-wider">Quarter:</label>
              <select
                className="border bg-white rounded px-2 py-1.5 text-xs hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                value={quarterlyQuarterFilter}
                onChange={(e) => setQuarterlyQuarterFilter(e.target.value)}
              >
                <option value="All">All Quarters</option>
                <option value="Q1">Q1</option>
                <option value="Q2">Q2</option>
                <option value="Q3">Q3</option>
                <option value="Q4">Q4</option>
              </select>
            </div>
          </div>
        );
        return <ControlsBar />;
      })()}

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="flex flex-col">
          {(() => {
            let monthlyChartData = monthlyAgg;
            if (donutSelection !== 'AGG_PERSPECTIVE' && donutSelection.startsWith('MEASURE|')) {
              const idx = Number(donutSelection.split('|')[1]);
              const r = sortedRows[idx];
              if (r) {
                monthlyChartData = MONTHS.map((m, idx2) => ({ month: MONTH_LABELS[idx2], target: ((r.monthly as any)[m].target ?? 0), accomp: ((r.monthly as any)[m].accomp ?? 0) }));
              }
            }
            // Filter monthly data by semester first, then by quarter if specified
            if (selectedSemester !== 'All') {
              monthlyChartData = monthlyChartData.filter((d) => allowedMonths.includes(d.month));
            }
            if (quarterlyQuarterFilter !== 'All') {
              const quarterMap: Record<string, string[]> = {
                'Q1': ['Jan', 'Feb', 'Mar'],
                'Q2': ['Apr', 'May', 'Jun'],
                'Q3': ['Jul', 'Aug', 'Sep'],
                'Q4': ['Oct', 'Nov', 'Dec']
              };
              const qMonths = quarterMap[quarterlyQuarterFilter] || [];
              monthlyChartData = monthlyChartData.filter((d) => qMonths.includes(d.month));
            }

            const totalTarget = monthlyChartData.reduce((s, m) => s + (m.target ?? 0), 0);
            const totalAccomp = monthlyChartData.reduce((s, m) => s + (m.accomp ?? 0), 0);
            const pct = totalTarget > 0 ? (totalAccomp / totalTarget) * 100 : 0;
            const active = monthlyChartData.filter((m) => m.target > 0);
            const monthPcts = active.map((m) => ({ month: m.month, pct: m.target > 0 ? (m.accomp / m.target) * 100 : 0, target: m.target, accomp: m.accomp }));
            const best = monthPcts.length ? monthPcts.reduce((a, b) => a.pct > b.pct ? a : b) : null;
            const worst = monthPcts.length ? monthPcts.reduce((a, b) => a.pct < b.pct ? a : b) : null;
            const nonZero = monthlyChartData.map((m) => m.accomp).filter((v) => v > 0);
            let trend = 'Stable';
            let first = 0;
            let second = 0;
            if (nonZero.length >= 2) {
              const half = Math.floor(nonZero.length / 2);
              first = nonZero.slice(0, half).reduce((a, b) => a + b, 0) / Math.max(1, half);
              second = nonZero.slice(half).reduce((a, b) => a + b, 0) / Math.max(1, nonZero.length - half);
              if (second > first * 1.1) trend = 'Increasing';
              else if (second < first * 0.9) trend = 'Decreasing';
            }

            const semLabel = selectedSemester === 'All' ? '' : ` (${selectedSemester} Sem)`;
            const perspLabel = selectedPerspective === 'All' ? 'All Perspectives' : selectedPerspective;
            return (
              <>
                <MonthlyChart data={monthlyChartData} title={`${perspLabel} — Monthly${semLabel}`} />
                <div className="mt-3 bg-white rounded-lg border p-4 shadow-sm">
                  <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                    <Popover>
                      <PopoverTrigger asChild>
                        <div className="flex-shrink-0 w-full sm:w-36 flex flex-col items-center cursor-pointer rounded-md p-2 hover:bg-muted/50 transition-colors">
                          <div className="text-xs text-muted-foreground">Overall</div>
                          <div className="text-2xl font-bold mt-1">{fmtPercentNumber(pct)}</div>
                          <div className="text-sm text-muted-foreground mt-1">{fmtNumber(totalAccomp)} of {fmtNumber(totalTarget)}</div>
                        </div>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto px-3 py-2 text-sm" side="top">
                        <p>Total Accomplishment ({fmtNumber(totalAccomp)}) ÷ Total Target ({fmtNumber(totalTarget)}) = {fmtPercentNumber(pct)}</p>
                      </PopoverContent>
                    </Popover>

                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium mb-2">Quick takeaways</div>
                      <MonthlyTakeaways monthPcts={monthPcts} trend={trend} first={first} second={second} />
                    </div>

                    <div className="hidden sm:flex sm:flex-col sm:items-start sm:w-32 flex-shrink-0">
                      <div className="text-sm font-medium mb-1">Details</div>
                      <div className="text-sm text-muted-foreground">Active months: <strong>{active.length}</strong></div>
                      <div className="text-sm text-muted-foreground">Months with data: <strong>{nonZero.length}</strong></div>
                    </div>
                  </div>
                </div>
              </>
            );
          })()}
        </div>

        <div className="flex flex-col">
          <QuarterlyChart data={(() => {
            let dataForChart = quarterlyAgg;
            if (donutSelection !== 'AGG_PERSPECTIVE' && donutSelection.startsWith('MEASURE|')) {
              const idx = Number(donutSelection.split('|')[1]);
              const r = sortedRows[idx];
              if (r) {
                dataForChart = [
                  { quarter: 'Q1', target: r.targets.q1 ?? 0, accomp: r.accomplishments.q1 ?? 0, pct: (r.targets.q1 ?? 0) > 0 ? ((r.accomplishments.q1 ?? 0) / (r.targets.q1 ?? 0)) * 100 : 0 },
                  { quarter: 'Q2', target: r.targets.q2 ?? 0, accomp: r.accomplishments.q2 ?? 0, pct: (r.targets.q2 ?? 0) > 0 ? ((r.accomplishments.q2 ?? 0) / (r.targets.q2 ?? 0)) * 100 : 0 },
                  { quarter: 'Q3', target: r.targets.q3 ?? 0, accomp: r.accomplishments.q3 ?? 0, pct: (r.targets.q3 ?? 0) > 0 ? ((r.accomplishments.q3 ?? 0) / (r.targets.q3 ?? 0)) * 100 : 0 },
                  { quarter: 'Q4', target: r.targets.q4 ?? 0, accomp: r.accomplishments.q4 ?? 0, pct: (r.targets.q4 ?? 0) > 0 ? ((r.accomplishments.q4 ?? 0) / (r.targets.q4 ?? 0)) * 100 : 0 },
                ];
              }
            }
            // Filter quarterly data by semester quarters
            if (selectedSemester !== 'All') {
              dataForChart = dataForChart.filter((d) => allowedQuarters.includes(d.quarter));
            }
            return dataForChart;
          })()} title={`${selectedPerspective === 'All' ? 'All Perspectives' : selectedPerspective} — Quarterly${selectedSemester !== 'All' ? ` (${selectedSemester} Sem)` : ''}`} />

          {(() => {
            let qData = quarterlyAgg;
            if (donutSelection !== 'AGG_PERSPECTIVE' && donutSelection.startsWith('MEASURE|')) {
              const idx = Number(donutSelection.split('|')[1]);
              const r = sortedRows[idx];
              if (r) {
                qData = [
                  { quarter: 'Q1', target: r.targets.q1 ?? 0, accomp: r.accomplishments.q1 ?? 0, pct: (r.targets.q1 ?? 0) > 0 ? ((r.accomplishments.q1 ?? 0) / (r.targets.q1 ?? 0)) * 100 : 0 },
                  { quarter: 'Q2', target: r.targets.q2 ?? 0, accomp: r.accomplishments.q2 ?? 0, pct: (r.targets.q2 ?? 0) > 0 ? ((r.accomplishments.q2 ?? 0) / (r.targets.q2 ?? 0)) * 100 : 0 },
                  { quarter: 'Q3', target: r.targets.q3 ?? 0, accomp: r.accomplishments.q3 ?? 0, pct: (r.targets.q3 ?? 0) > 0 ? ((r.accomplishments.q3 ?? 0) / (r.targets.q3 ?? 0)) * 100 : 0 },
                  { quarter: 'Q4', target: r.targets.q4 ?? 0, accomp: r.accomplishments.q4 ?? 0, pct: (r.targets.q4 ?? 0) > 0 ? ((r.accomplishments.q4 ?? 0) / (r.targets.q4 ?? 0)) * 100 : 0 },
                ];
              }
            }

            // Filter quarterly takeaways by semester
            if (selectedSemester !== 'All') qData = qData.filter((d) => allowedQuarters.includes(d.quarter));


            const totalT = qData.reduce((s, q) => s + (q.target ?? 0), 0);
            const totalA = qData.reduce((s, q) => s + (q.accomp ?? 0), 0);
            const totalPct = totalT > 0 ? (totalA / totalT) * 100 : 0;
            const qPcts = qData.map((q) => ({ quarter: q.quarter, pct: q.target > 0 ? (q.accomp / q.target) * 100 : 0, target: q.target, accomp: q.accomp }));
            const bestQ = qPcts.length ? qPcts.reduce((a, b) => a.pct > b.pct ? a : b) : null;
            const worstQ = qPcts.length ? qPcts.reduce((a, b) => a.pct < b.pct ? a : b) : null;

            return (
              <div className="mt-3 bg-white rounded-lg border p-4 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  <Popover>
                    <PopoverTrigger asChild>
                      <div className="flex-shrink-0 w-full sm:w-36 flex flex-col items-center cursor-pointer rounded-md p-2 hover:bg-muted/50 transition-colors">
                        <div className="text-xs text-muted-foreground">Overall</div>
                        <div className="text-2xl font-bold mt-1">{fmtPercentNumber(totalPct)}</div>
                        <div className="text-sm text-muted-foreground mt-1">{fmtNumber(totalA)} of {fmtNumber(totalT)}</div>
                      </div>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto px-3 py-2 text-sm" side="top">
                      <p>Total Accomplishment ({fmtNumber(totalA)}) ÷ Total Target ({fmtNumber(totalT)}) = {fmtPercentNumber(totalPct)}</p>
                    </PopoverContent>
                  </Popover>

                  <div className="flex-1">
                    <div className="text-sm font-medium mb-2">Quick takeaways</div>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      {quarterlyQuarterFilter === 'All' ? (
                        <>
                          {bestQ ? (
                            <li className="flex items-start gap-2">
                              <span className="text-emerald-600 mt-0.5"><CheckCircle2 className="w-4 h-4" /></span>
                              <Popover>
                                <PopoverTrigger asChild>
                                  <span className="group cursor-pointer border-b border-dotted border-muted-foreground/50 hover:text-primary hover:border-primary transition-colors">Best quarter: <strong className="text-foreground group-hover:text-primary transition-colors">{bestQ.quarter}</strong> at {fmtPercentNumber(bestQ.pct)}</span>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto px-3 py-2 text-sm" side="top">
                                  <p>{bestQ.quarter} Accomplishment ({fmtNumber(bestQ.accomp)}) ÷ Target ({fmtNumber(bestQ.target)}) = {fmtPercentNumber(bestQ.pct)}</p>
                                </PopoverContent>
                              </Popover>
                            </li>
                          ) : null}
                          {worstQ ? (
                            <li className="flex items-start gap-2">
                              <span className="text-red-600 mt-0.5"><AlertTriangle className="w-4 h-4" /></span>
                              <Popover>
                                <PopoverTrigger asChild>
                                  <span className="group cursor-pointer border-b border-dotted border-muted-foreground/50 hover:text-primary hover:border-primary transition-colors">Weakest quarter: <strong className="text-foreground group-hover:text-primary transition-colors">{worstQ.quarter}</strong> at {fmtPercentNumber(worstQ.pct)}</span>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto px-3 py-2 text-sm" side="top">
                                  <p>{worstQ.quarter} Accomplishment ({fmtNumber(worstQ.accomp)}) ÷ Target ({fmtNumber(worstQ.target)}) = {fmtPercentNumber(worstQ.pct)}</p>
                                </PopoverContent>
                              </Popover>
                            </li>
                          ) : null}
                        </>
                      ) : (
                        <SinglePeriodInsight target={totalT} accomp={totalA} />
                      )}
                    </ul>
                  </div>

                  <div className="hidden sm:flex sm:flex-col sm:items-start sm:w-40">
                    <div className="text-sm font-medium mb-1">Notes</div>
                    <div className="text-sm text-muted-foreground">Quarters shown: <strong>{qData.length}</strong></div>
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      </div>
    </div>
  );
}

interface FileUploadProps {
  label: string;
  icon: React.ReactNode;
  accept: string;
  onFileSelect: (file: File) => void;
  isLoading?: boolean;
}

function FileUploadButton({ label, icon, accept, onFileSelect, isLoading }: FileUploadProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onFileSelect(file);
    e.target.value = '';
  };
  return (
    <label className="cursor-pointer">
      <input type="file" accept={accept} onChange={handleChange} className="hidden" />
      <Button variant="outline" className="gap-2 w-full" asChild disabled={isLoading}>
        <span>{icon}{isLoading ? 'Processing...' : label}</span>
      </Button>
    </label>
  );
}

interface OORCPGSDashboardProps {
  divisionCode: string;
  divisionId?: string;
  initialTab?: 'oorc' | 'pgs' | 'both';
  hideTabs?: boolean;
}

export default function OORCPGSDashboard({ divisionCode, divisionId, initialTab, hideTabs }: OORCPGSDashboardProps) {
  const [loading, setLoading] = useState<'oorc' | 'pgs' | null>(null);
  const { toast } = useToast();
  const { isSuperAdmin } = useAuth();

  // Detect file type from filename
  const detectFileType = (fileName: string | null | undefined): 'oorc' | 'pgs' | 'unknown' => {
    if (!fileName) return 'unknown';
    const lower = fileName.toLowerCase();
    if (lower.includes('pgs')) return 'pgs';
    if (lower.includes('oorc') || lower.includes('orc')) return 'oorc';
    return 'unknown';
  };

  // Fetch all uploaded files for this division from Supabase uploads table
  const [uploadedFiles, setUploadedFiles] = useState<any[]>([]);
  const [uploadedFilesLoading, setUploadedFilesLoading] = useState(false);

  const fetchUploadedFiles = async () => {
    if (!divisionId) return;
    setUploadedFilesLoading(true);
    try {
      const realId = await resolveDivisionIdToUuid(divisionId);
      console.log('Fetching uploads for division:', divisionId, 'resolved to:', realId);

      const { data, error } = await supabase
        .from('uploads')
        .select('*')
        .eq('division_id', realId)
        .order('uploaded_at', { ascending: false });

      if (error) {
        console.error('Supabase error fetching uploads:', error);
        toast({ title: 'Error fetching files', description: error.message, variant: 'destructive' });
      } else if (data) {
        console.log(`Found ${data.length} uploads for division ${realId}. Names:`, data.map(f => f.file_name));
        setUploadedFiles(data);
      }
    } catch (e: any) {
      console.error('Failed to fetch uploaded files:', e);
      toast({ title: 'Connection error', description: 'Could not fetch uploaded files list.', variant: 'destructive' });
    } finally {
      setUploadedFilesLoading(false);
    }
  };

  useEffect(() => {
    fetchUploadedFiles();
  }, [divisionId]);

  // Auto-select the most recently uploaded file when the list loads (or refreshes)
  // so "Select a file to view" always shows the latest file's data, not the DB aggregate.
  useEffect(() => {
    if (uploadedFiles.length === 0) return;
    const latestOorc = uploadedFiles.find(f => detectFileType(f.file_name) === 'oorc' || detectFileType(f.file_name) === 'unknown');
    const latestPgs = uploadedFiles.find(f => detectFileType(f.file_name) === 'pgs' || detectFileType(f.file_name) === 'unknown');
    if (latestOorc && !selectedOorcFileId) {
      setSelectedOorcFileId(latestOorc.id);
      loadOorcFile(latestOorc.id);
    }
    if (latestPgs && !selectedPgsFileId) {
      setSelectedPgsFileId(latestPgs.id);
      loadPgsFile(latestPgs.id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uploadedFiles]);

  const oorcFiles = uploadedFiles.filter(f => detectFileType(f.file_name) === 'oorc' || detectFileType(f.file_name) === 'unknown');
  const pgsFiles = uploadedFiles.filter(f => detectFileType(f.file_name) === 'pgs' || detectFileType(f.file_name) === 'unknown');

  // Track which file the user has selected to view (by uploads table row id)
  const [selectedOorcFileId, setSelectedOorcFileId] = useState<string>('');
  const [selectedPgsFileId, setSelectedPgsFileId] = useState<string>('');

  // Parsed data from the selected file
  const [localOorcData, setLocalOorcData] = useState<OORCRow[] | null>(null);
  const [localPgsData, setLocalPgsData] = useState<PGSRow[] | null>(null);
  const [localParseLoading, setLocalParseLoading] = useState<'oorc' | 'pgs' | null>(null);

  // Download file from Supabase storage and parse it
  const loadOorcFile = async (uploadId: string) => {
    if (!uploadId) { setLocalOorcData(null); return; }
    const entry = uploadedFiles.find(f => f.id === uploadId);
    if (!entry?.file_path) return;
    setLocalParseLoading('oorc');
    try {
      const { data, error } = await supabase.storage.from('wfp-files').download(entry.file_path);
      if (error) throw error;
      const buffer = await data.arrayBuffer();
      const parsed = parseOORCExcel(buffer);
      setLocalOorcData(parsed.length > 0 ? parsed : null);
      if (parsed.length === 0) toast({ title: 'No OORC data found', description: 'This file has no valid OORC data. Check if it has a Nueva Vizcaya sheet.', variant: 'destructive' });
      else toast({ title: 'File loaded', description: `${entry.file_name}: ${parsed.length} indicators loaded.` });
    } catch (e: any) {
      toast({ title: 'Failed to load file', description: e.message, variant: 'destructive' });
      setLocalOorcData(null);
    } finally {
      setLocalParseLoading(null);
    }
  };

  const loadPgsFile = async (uploadId: string) => {
    if (!uploadId) { setLocalPgsData(null); return; }
    const entry = uploadedFiles.find(f => f.id === uploadId);
    if (!entry?.file_path) return;
    setLocalParseLoading('pgs');
    try {
      const { data, error } = await supabase.storage.from('wfp-files').download(entry.file_path);
      if (error) throw error;
      const buffer = await data.arrayBuffer();
      const parsed = parsePGSExcel(buffer);
      setLocalPgsData(parsed.length > 0 ? parsed : null);
      if (parsed.length === 0) toast({ title: 'No PGS data found', description: 'This file has no valid PGS data. Check if it has a Nueva Vizcaya sheet.', variant: 'destructive' });
      else toast({ title: 'File loaded', description: `${entry.file_name}: ${parsed.length} measures loaded.` });
    } catch (e: any) {
      toast({ title: 'Failed to load file', description: e.message, variant: 'destructive' });
      setLocalPgsData(null);
    } finally {
      setLocalParseLoading(null);
    }
  };

  // DB data as fallback when no file selected
  const { data: dbOorcRows = [], isLoading: oorcLoading } = useOORCData(divisionId);
  const { data: dbPgsRows = [], isLoading: pgsLoading } = usePGSData(divisionId);
  const saveOORC = useSaveOORCData(divisionId);
  const savePGS = useSavePGSData(divisionId);

  const dbOorcData = dbOorcRows.length > 0 ? dbToOORCRows(dbOorcRows) : null;
  const dbPgsData = dbPgsRows.length > 0 ? dbToPGSRows(dbPgsRows) : null;

  // Always use the locally-parsed file data.
  // The DB aggregate fallback is intentionally removed: when no file is selected,
  // the auto-select effect above will load the most recently uploaded file,
  // so we never show stale/cumulative DB data.
  const oorcData = localOorcData ?? null;
  const pgsData = localPgsData ?? null;


  async function fileToDataUrl(file: File) {
    return await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.onload = () => resolve(String(reader.result || ''));
      reader.readAsDataURL(file);
    });
  }

  const saveFileToHistory = async (file: File, type: 'oorc' | 'pgs') => {
    try {
      const dataUrl = await fileToDataUrl(file);
      const id = Date.now().toString();
      const payload = { id, name: file.name, type, division: divisionCode, ts: new Date().toISOString(), dataUrl };
      const raw = localStorage.getItem('upload_history');
      const arr = raw ? JSON.parse(raw) : [];
      const existingIndex = arr.findIndex((r: any) => r.name === file.name && r.type === type && r.division === divisionCode);
      if (existingIndex >= 0) { arr[existingIndex] = payload; } else { arr.unshift(payload); }
      localStorage.setItem('upload_history', JSON.stringify(arr));
      return payload;
    } catch (e) {
      console.error('history save failed', e);
      return null;
    }
  };

  const handleOORCUpload = useCallback(async (file: File) => {
    setLoading('oorc');
    try {
      const realId = await resolveDivisionIdToUuid(divisionId);


      const buffer = await file.arrayBuffer();
      const parsed = parseOORCExcel(buffer);
      if (parsed.length === 0) throw new Error("No data extracted. Check that the file has a 'Nueva Vizcaya' sheet.");
      const saved = await saveOORC.mutateAsync(parsed);
      const savedCount = typeof saved === 'number' ? saved : parsed.length;
      if (savedCount === 0) {
        toast({ title: "No OORC rows saved", description: `No indicators contained target/accomplishment data.`, variant: 'destructive' });
      } else {
        const omitted = parsed.length - savedCount;
        toast({ title: "OORC file saved", description: `Saved ${savedCount} indicators${omitted > 0 ? ` — ${omitted} omitted (no data)` : ''}.` });
        try {
          const filePath = `${realId || 'company'}/${Date.now()}_${file.name}`;
          const { error: upErr } = await supabase.storage.from('wfp-files').upload(filePath, file);
          if (upErr) throw upErr;
          await supabase.from('uploads').insert({ file_name: file.name, division_id: realId, file_path: filePath });
        } catch (e) { console.error('saving upload record failed', e); }

        setLocalOorcData(null);
        // Reset the selection so the auto-select effect will pick the new file
        setSelectedOorcFileId('');
        await fetchUploadedFiles();
      }
    } catch (err: any) {
      toast({ title: "Error parsing OORC file", description: err.message, variant: "destructive" });
    } finally { setLoading(null); }
  }, [toast, saveOORC, divisionCode, divisionId]);

  const handlePGSUpload = useCallback(async (file: File) => {
    setLoading('pgs');
    try {
      const realId = await resolveDivisionIdToUuid(divisionId);


      const buffer = await file.arrayBuffer();
      const parsed = parsePGSExcel(buffer);
      if (parsed.length === 0) throw new Error("No data extracted. Check that the file has a 'Nueva Vizcaya' sheet.");
      const saved = await savePGS.mutateAsync(parsed);
      const savedCount = typeof saved === 'number' ? saved : parsed.length;
      if (savedCount === 0) {
        toast({ title: "No PGS measures saved", description: `No strategic measures contained target/accomplishment data.`, variant: 'destructive' });
      } else {
        const omitted = parsed.length - savedCount;
        toast({ title: "PGS file saved", description: `Saved ${savedCount} measures${omitted > 0 ? ` — ${omitted} omitted (no data)` : ''}.` });
        try {
          const filePath = `${realId || 'company'}/${Date.now()}_${file.name}`;
          const { error: upErr } = await supabase.storage.from('wfp-files').upload(filePath, file);
          if (upErr) throw upErr;
          await supabase.from('uploads').insert({ file_name: file.name, division_id: realId, file_path: filePath });
        } catch (e) { console.error('saving upload record failed', e); }

        setLocalPgsData(null);
        // Reset the selection so the auto-select effect will pick the new file
        setSelectedPgsFileId('');
        await fetchUploadedFiles();
      }
    } catch (err: any) {
      toast({ title: "Error parsing PGS file", description: err.message, variant: "destructive" });
    } finally { setLoading(null); }
  }, [toast, savePGS, divisionCode, divisionId]);

  return (
    <Tabs defaultValue={initialTab ?? 'oorc'} className="space-y-6">
      {!hideTabs && (
        <TabsList>
          <TabsTrigger value="oorc">OORC Report</TabsTrigger>
          <TabsTrigger value="pgs">PGS Scorecard</TabsTrigger>
        </TabsList>
      )}

      <TabsContent value="oorc" className="space-y-6 mt-0">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              {isSuperAdmin ? <Upload className="h-5 w-5" /> : <FileSpreadsheet className="h-5 w-5" />}
              {isSuperAdmin ? 'OORC File' : 'OORC Data'}{divisionCode ? ` — ${divisionCode}` : ''}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {isSuperAdmin && (
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <FileUploadButton
                  label="Upload New OORC File"
                  icon={<FileSpreadsheet className="h-4 w-4" />}
                  accept=".xlsx,.xls"
                  onFileSelect={handleOORCUpload}
                  isLoading={loading === 'oorc'}
                />
              </div>
            )}
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 pt-2 border-t">
              <label className="text-sm font-medium text-muted-foreground whitespace-nowrap flex items-center gap-2">
                Select OORC file to view:
                {uploadedFiles.length === 0 && !uploadedFilesLoading && (
                  <span className="text-[10px] opacity-30">(No files in DB for this div)</span>
                )}
              </label>
              <select
                className="border rounded px-3 py-2 text-sm flex-1 max-w-md bg-white hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-300"
                value={selectedOorcFileId}
                onChange={(e) => {
                  setSelectedOorcFileId(e.target.value);
                  loadOorcFile(e.target.value);
                }}
                disabled={uploadedFilesLoading}
              >
                <option value="">— {uploadedFilesLoading ? 'Loading files...' : oorcFiles.length === 0 ? 'No OORC files uploaded yet' : 'Select a file to view'} —</option>
                {oorcFiles.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.file_name} {f.uploaded_at ? `(${new Date(f.uploaded_at).toLocaleDateString()})` : ''}
                  </option>
                ))}
              </select>
              {selectedOorcFileId && oorcData && (
                <Badge variant="secondary" className="text-xs whitespace-nowrap">
                  ✓ {oorcData.length} indicators loaded
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>

        {(localParseLoading === 'oorc' || oorcLoading) && <div className="text-center py-8 text-muted-foreground animate-pulse">Loading OORC data...</div>}
        {oorcData && localParseLoading !== 'oorc' && (
          <DashboardErrorBoundary>
            <OORCDashboard data={oorcData} />
          </DashboardErrorBoundary>
        )}
        {!oorcData && localParseLoading !== 'oorc' && !oorcLoading && (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <AlertCircle className="h-10 w-10 text-muted-foreground mb-3" />
              <p className="text-muted-foreground">No OORC data yet. Upload an OORC file above.</p>
            </CardContent>
          </Card>
        )}
      </TabsContent>

      <TabsContent value="pgs" className="space-y-6 mt-0">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              {isSuperAdmin ? <Upload className="h-5 w-5" /> : <FileSpreadsheet className="h-5 w-5" />}
              {isSuperAdmin ? 'PGS File' : 'PGS Data'}{divisionCode ? ` — ${divisionCode}` : ''}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {isSuperAdmin && (
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <FileUploadButton
                  label="Upload New PGS File"
                  icon={<FileSpreadsheet className="h-4 w-4" />}
                  accept=".xlsx,.xls"
                  onFileSelect={handlePGSUpload}
                  isLoading={loading === 'pgs'}
                />
              </div>
            )}
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 pt-2 border-t">
              <label className="text-sm font-medium text-muted-foreground whitespace-nowrap flex items-center gap-2">
                Select PGS file to view:
                {uploadedFiles.length === 0 && !uploadedFilesLoading && (
                  <span className="text-[10px] opacity-30">(No files in DB for this div)</span>
                )}
              </label>
              <select
                className="border rounded px-3 py-2 text-sm flex-1 max-w-md bg-white hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-300"
                value={selectedPgsFileId}
                onChange={(e) => {
                  setSelectedPgsFileId(e.target.value);
                  loadPgsFile(e.target.value);
                }}
                disabled={uploadedFilesLoading}
              >
                <option value="">— {uploadedFilesLoading ? 'Loading files...' : pgsFiles.length === 0 ? 'No PGS files uploaded yet' : 'Select a file to view'} —</option>
                {pgsFiles.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.file_name} {f.uploaded_at ? `(${new Date(f.uploaded_at).toLocaleDateString()})` : ''}
                  </option>
                ))}
              </select>
              {selectedPgsFileId && pgsData && (
                <Badge variant="secondary" className="text-xs whitespace-nowrap">
                  ✓ {pgsData.length} measures loaded
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>

        {(localParseLoading === 'pgs' || pgsLoading) && <div className="text-center py-8 text-muted-foreground animate-pulse">Loading PGS data...</div>}
        {pgsData && localParseLoading !== 'pgs' && (
          <DashboardErrorBoundary>
            <PGSDashboard data={pgsData} />
          </DashboardErrorBoundary>
        )}
        {!pgsData && localParseLoading !== 'pgs' && !pgsLoading && (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <AlertCircle className="h-10 w-10 text-muted-foreground mb-3" />
              <p className="text-muted-foreground">No PGS data yet. Upload a PGS file above.</p>
            </CardContent>
          </Card>
        )}
      </TabsContent>
    </Tabs>
  );
}

// Re-export chart builders for consolidated page
export { buildMonthlyAgg, buildQuarterlyAgg, buildInsightData, OORCDashboard, PGSDashboard, MonthlyChart, QuarterlyChart, PercentageChart };


