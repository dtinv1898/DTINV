import { Activity, DollarSign, TrendingUp, Building2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import DashboardLayout from "@/components/DashboardLayout";
import KPICard from "@/components/KPICard";
import DataInsightsPanel from "@/components/DataInsightsPanel";
import { MonthlyChart, QuarterlyChart, PercentageChart, buildMonthlyAgg, buildQuarterlyAgg, buildInsightData } from "@/components/OORCPGSDashboard";
import { useAllPrograms } from "@/hooks/useProgramsData";
import { useDivisions } from "@/hooks/useDivisions";
import { useOORCData, usePGSData, dbToOORCRows, dbToPGSRows } from "@/hooks/useOORCPGSData";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
  AreaChart, Area, RadarChart, PolarGrid, PolarAngleAxis, Radar,
} from "recharts";
import { fmtPercentNumber, fmtNumber, fmtCurrency } from "@/lib/format";

const COLORS = [
  "hsl(217, 91%, 50%)",
  "hsl(160, 60%, 45%)",
  "hsl(35, 92%, 55%)",
];

export default function ConsolidatedPage() {
  const { data: programs = [], isLoading } = useAllPrograms();
  const { data: divisions = [] } = useDivisions();

  const bdd = divisions.find((d) => d.code === "BDD");
  const cpd = divisions.find((d) => d.code === "CPD");

  const { data: bddOorcDb = [] } = useOORCData(bdd?.id);
  const { data: cpdOorcDb = [] } = useOORCData(cpd?.id);
  const { data: bddPgsDb = [] } = usePGSData(bdd?.id);
  const { data: cpdPgsDb = [] } = usePGSData(cpd?.id);

  const bddOorc = dbToOORCRows(bddOorcDb);
  const cpdOorc = dbToOORCRows(cpdOorcDb);
  const bddPgs = dbToPGSRows(bddPgsDb);
  const cpdPgs = dbToPGSRows(cpdPgsDb);

  const allOorc = [...bddOorc, ...cpdOorc];
  const allPgs = [...bddPgs, ...cpdPgs];

  // Per-division stats from WFP programs
  const divStats = new Map<string, { name: string; activities: number; budget: number; targets: number; actuals: number }>();
  divisions.forEach((d) => divStats.set(d.code, { name: d.code, activities: 0, budget: 0, targets: 0, actuals: 0 }));

  programs.forEach((p) => {
    const code = (p as any).uploads?.divisions?.code;
    if (!code || !divStats.has(code)) return;
    const s = divStats.get(code)!;
    s.activities++;
    s.budget += (p as any).budgets?.[0]?.grand_total ?? 0;
    s.targets += (p as any).targets?.[0]?.total ?? 0;
    s.actuals += (p as any).targets?.[0]?.total_actual ?? 0;
  });
  const divData = Array.from(divStats.values());

  const totalAct = divData.reduce((s, d) => s + d.activities, 0);
  const totalBudget = divData.reduce((s, d) => s + d.budget, 0);
  const totalTargets = divData.reduce((s, d) => s + d.targets, 0);
  const totalActuals = divData.reduce((s, d) => s + d.actuals, 0);
  const completion = totalTargets > 0 ? Math.round((totalActuals / totalTargets) * 100) : 0;

  // OORC/PGS aggregations
  const oorcMonthly = allOorc.length > 0 ? buildMonthlyAgg(allOorc) : null;
  const oorcQuarterly = allOorc.length > 0 ? buildQuarterlyAgg(allOorc) : null;
  const pgsMonthly = allPgs.length > 0 ? buildMonthlyAgg(allPgs) : null;
  const pgsQuarterly = allPgs.length > 0 ? buildQuarterlyAgg(allPgs) : null;

  // Per-division OORC comparison
  const bddOorcMonthly = bddOorc.length > 0 ? buildMonthlyAgg(bddOorc) : null;
  const cpdOorcMonthly = cpdOorc.length > 0 ? buildMonthlyAgg(cpdOorc) : null;

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64 animate-pulse text-muted-foreground">Loading...</div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-heading font-bold">Consolidated DTI Performance</h1>
          <p className="text-muted-foreground mt-1">Combined BDD & CPD performance overview</p>
        </div>

        {/* KPIs */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <KPICard title="Total Activities" value={totalAct} icon={Activity} />
          <KPICard title="Total Budget" value={`₱${(totalBudget / 1000).toFixed(0)}K`} icon={DollarSign} />
          <KPICard title="Divisions Active" value={divData.filter(d => d.activities > 0).length} icon={Building2} />
          <KPICard title="Completion" value={`${fmtPercentNumber(completion)}`} icon={TrendingUp} trend={completion > 50 ? "up" : "neutral"} />
        </div>

        {/* Division Comparison */}
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader><CardTitle className="text-lg">Division Comparison</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={divData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(220,13%,91%)" />
                  <XAxis dataKey="name" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" tickFormatter={(v) => `₱${(v / 1000).toFixed(0)}K`} />
                  <Tooltip formatter={(v: any) => fmtNumber(Number(v))} />
                  <Legend />
                  <Bar yAxisId="left" dataKey="activities" name="Activities" fill="hsl(217,91%,50%)" radius={[6, 6, 0, 0]} />
                  <Bar yAxisId="right" dataKey="budget" name="Budget (₱)" fill="hsl(160,60%,45%)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-lg">Budget Share by Division</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={divData.filter(d => d.budget > 0)}
                    cx="50%" cy="50%" innerRadius={60} outerRadius={100}
                    dataKey="budget"
                    label={({ name, percent }) => `${name} ${fmtPercentNumber(percent)}`}
                  >
                    {divData.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v: any) => fmtCurrency(Number(v))} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* OORC/PGS Consolidated */}
        {(allOorc.length > 0 || allPgs.length > 0) && (
          <Tabs defaultValue="oorc-consolidated">
            <TabsList>
              {allOorc.length > 0 && <TabsTrigger value="oorc-consolidated">OORC Combined</TabsTrigger>}
              {allPgs.length > 0 && <TabsTrigger value="pgs-consolidated">PGS Combined</TabsTrigger>}
            </TabsList>

            {allOorc.length > 0 && oorcMonthly && oorcQuarterly && (
              <TabsContent value="oorc-consolidated" className="space-y-6 mt-4">
                <DataInsightsPanel data={buildInsightData(oorcMonthly, oorcQuarterly, "Consolidated OORC")} />

                {/* Per-division comparison */}
                {bddOorcMonthly && cpdOorcMonthly && (
                  <Card>
                    <CardHeader><CardTitle className="text-lg">OORC: BDD vs CPD Monthly Targets</CardTitle></CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={bddOorcMonthly.map((b, i) => ({
                          month: b.month,
                          "BDD Target": b.target,
                          "BDD Accomp": b.accomp,
                          "CPD Target": cpdOorcMonthly[i]?.target ?? 0,
                          "CPD Accomp": cpdOorcMonthly[i]?.accomp ?? 0,
                        }))}>
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(220,13%,91%)" />
                          <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                          <YAxis tick={{ fontSize: 11 }} />
                          <Tooltip formatter={(v: any) => fmtNumber(Number(v))} />
                          <Legend />
                          <Bar dataKey="BDD Target" fill="hsl(217,91%,50%)" radius={[4, 4, 0, 0]} />
                          <Bar dataKey="BDD Accomp" fill="hsl(217,91%,70%)" radius={[4, 4, 0, 0]} />
                          <Bar dataKey="CPD Target" fill="hsl(35,92%,55%)" radius={[4, 4, 0, 0]} />
                          <Bar dataKey="CPD Accomp" fill="hsl(35,92%,75%)" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                )}

                <div className="grid gap-6 lg:grid-cols-2">
                  <MonthlyChart data={oorcMonthly} title="Combined OORC: Monthly" />
                  <QuarterlyChart data={oorcQuarterly} title="Combined OORC: Quarterly" />
                </div>
                <PercentageChart data={oorcMonthly.map((m) => ({ label: m.month, pct: m.target > 0 ? (m.accomp / m.target) * 100 : 0 }))} title="Combined OORC: Monthly %" />
              </TabsContent>
            )}

            {allPgs.length > 0 && pgsMonthly && pgsQuarterly && (
              <TabsContent value="pgs-consolidated" className="space-y-6 mt-4">
                <DataInsightsPanel data={buildInsightData(pgsMonthly, pgsQuarterly, "Consolidated PGS")} />
                <div className="grid gap-6 lg:grid-cols-2">
                  <MonthlyChart data={pgsMonthly} title="Combined PGS: Monthly" />
                  <QuarterlyChart data={pgsQuarterly} title="Combined PGS: Quarterly" />
                </div>
                <PercentageChart data={pgsMonthly.map((m) => ({ label: m.month, pct: m.target > 0 ? (m.accomp / m.target) * 100 : 0 }))} title="Combined PGS: Monthly %" />
              </TabsContent>
            )}
          </Tabs>
        )}

        {/* Radar */}
        <Card>
          <CardHeader><CardTitle className="text-lg">Division Performance Radar</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <RadarChart cx="50%" cy="50%" outerRadius="80%" data={divData.map((d) => ({
                division: d.name, Activities: d.activities,
                Budget: d.budget > 0 ? Math.round(d.budget / 1000) : 0, Targets: d.targets,
              }))}>
                <PolarGrid stroke="hsl(220,13%,91%)" />
                <PolarAngleAxis dataKey="division" tick={{ fontSize: 12 }} />
                <Radar name="Activities" dataKey="Activities" stroke="hsl(217,91%,50%)" fill="hsl(217,91%,50%)" fillOpacity={0.3} />
                <Radar name="Budget (₱K)" dataKey="Budget" stroke="hsl(160,60%,45%)" fill="hsl(160,60%,45%)" fillOpacity={0.3} />
                <Radar name="Targets" dataKey="Targets" stroke="hsl(35,92%,55%)" fill="hsl(35,92%,55%)" fillOpacity={0.3} />
                <Legend />
                <Tooltip />
              </RadarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
