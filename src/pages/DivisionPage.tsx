import { useParams, Link } from "react-router-dom";
import { Activity, DollarSign, TrendingUp, Target } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import DashboardLayout from "@/components/DashboardLayout";
import KPICard from "@/components/KPICard";
import InsightsPanel from "@/components/InsightsPanel";
import UnmetActivities from "@/components/UnmetActivities";
import { useProgramsByDivision } from "@/hooks/useProgramsData";
import { useDivisions } from "@/hooks/useDivisions";
import OORCPGSDashboard from "@/components/OORCPGSDashboard";
import DonutChart from "@/components/DonutChart";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, Legend, PieChart, Pie, Cell,
  RadialBarChart, RadialBar,
} from "recharts";
import { fmtNumber, fmtCurrency } from "@/lib/format";

const COLORS = ["hsl(217,91%,50%)", "hsl(160,60%,45%)", "hsl(35,92%,55%)", "hsl(280,65%,55%)", "hsl(0,72%,51%)"];

const DIVISION_NAMES: Record<string, string> = {
  BDD: "Business Development Division",
  CPD: "Consumer Protection Division",
};



export default function DivisionPage() {
  const { code } = useParams<{ code: string }>();
  const { data: programs = [], isLoading } = useProgramsByDivision(code);
  const { data: divisions = [] } = useDivisions();
  const division = divisions.find((d) => d.code === code);

  const divisionName = DIVISION_NAMES[code || ""] || code;

  // KPIs
  const totalActivities = programs.length;
  const totalBudget = programs.reduce((s, p) => s + ((p as any).budgets?.[0]?.grand_total ?? 0), 0);
  const totalTargets = programs.reduce((s, p) => s + ((p as any).targets?.[0]?.total ?? 0), 0);
  const totalActuals = programs.reduce((s, p) => s + ((p as any).targets?.[0]?.total_actual ?? 0), 0);
  const completion = totalTargets > 0 ? Math.round((totalActuals / totalTargets) * 100) : 0;

  const completed = programs.filter((p) => {
    const t = (p as any).targets?.[0];
    return t && t.total > 0 && t.total_actual >= t.total;
  }).length;
  const pending = programs.filter((p) => {
    const t = (p as any).targets?.[0];
    return t && (t.total_actual === null || t.total_actual === 0) && t.total > 0;
  }).length;
  const backlog = totalActivities - completed - pending;

  // OO breakdown
  const ooMap = new Map<string, { count: number; budget: number; targets: number; actuals: number }>();
  programs.forEach((p) => {
    const oo = p.organizational_outcome || "Unknown";
    const e = ooMap.get(oo) || { count: 0, budget: 0, targets: 0, actuals: 0 };
    e.count++;
    e.budget += (p as any).budgets?.[0]?.grand_total ?? 0;
    e.targets += (p as any).targets?.[0]?.total ?? 0;
    e.actuals += (p as any).targets?.[0]?.total_actual ?? 0;
    ooMap.set(oo, e);
  });
  const ooData = Array.from(ooMap.entries()).map(([name, d]) => ({ name, ...d }));

  // Quarterly
  const qData = [
    { quarter: "Q1", target: 0, actual: 0, budget: 0 },
    { quarter: "Q2", target: 0, actual: 0, budget: 0 },
    { quarter: "Q3", target: 0, actual: 0, budget: 0 },
    { quarter: "Q4", target: 0, actual: 0, budget: 0 },
  ];
  programs.forEach((p) => {
    const t = (p as any).targets?.[0];
    const b = (p as any).budgets?.[0];
    if (t) {
      qData[0].target += t.q1 ?? 0; qData[0].actual += t.q1_actual ?? 0;
      qData[1].target += t.q2 ?? 0; qData[1].actual += t.q2_actual ?? 0;
      qData[2].target += t.q3 ?? 0; qData[2].actual += t.q3_actual ?? 0;
      qData[3].target += t.q4 ?? 0; qData[3].actual += t.q4_actual ?? 0;
    }
    if (b) {
      qData[0].budget += b.q1 ?? 0; qData[1].budget += b.q2 ?? 0;
      qData[2].budget += b.q3 ?? 0; qData[3].budget += b.q4 ?? 0;
    }
  });

  if (isLoading) {
    return <DashboardLayout><div className="flex items-center justify-center h-64 animate-pulse text-muted-foreground">Loading...</div></DashboardLayout>;
  }

  const isCompanyWideView = code === 'BDD' || code === 'CPD';

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          {!isCompanyWideView && (
            <>
              <h1 className="text-3xl font-heading font-bold">{divisionName}</h1>
              <p className="text-muted-foreground mt-1">Division performance tracker — {code}</p>
            </>
          )}
        </div>

        {/* Responsible Persons removed per request */}

        {/* OORC / PGS Upload & Visualization */}
        {isCompanyWideView && (
          // Show company-level upload/dashboard for these divisions (no division suffix)
          <OORCPGSDashboard divisionCode={''} divisionId={division?.id} hideTabs initialTab="pgs" />
        )}

        {programs.length > 0 && (
          <>
            {/* KPIs */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <KPICard title="Activities" value={totalActivities} icon={Activity} />
              <KPICard title="Total Budget" value={`₱${(totalBudget / 1000).toFixed(0)}K`} icon={DollarSign} />
              <KPICard title="Physical Targets" value={totalTargets} icon={Target} />
              <KPICard title="Completion" value={`${completion}%`} icon={TrendingUp} trend={completion > 50 ? "up" : "neutral"} />
            </div>

            {/* Insights */}
            <InsightsPanel
              totalActivities={totalActivities}
              completed={completed}
              pending={pending}
              backlog={backlog > 0 ? backlog : 0}
              totalTargets={totalTargets}
              totalActuals={totalActuals}
              totalBudget={totalBudget}
              quarterlyData={qData}
            />

            {/* Charts */}
            <Tabs defaultValue="overview">
              <TabsList>
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="quarterly">Quarterly</TabsTrigger>
                <TabsTrigger value="unmet">Unmet Activities</TabsTrigger>
                <TabsTrigger value="activities">All Activities</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-6 mt-4">
                <div className="grid gap-6 lg:grid-cols-2">
                  <Card>
                    <CardHeader><CardTitle className="text-lg">Budget by Organizational Outcome</CardTitle></CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={280}>
                        <BarChart data={ooData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(220,13%,91%)" />
                          <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                          <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `₱${(v / 1000).toFixed(0)}K`} />
                          <Tooltip formatter={(v: any) => fmtCurrency(Number(v))} />
                          <Bar dataKey="budget" fill="hsl(217,91%,50%)" radius={[6, 6, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  <div className="space-y-6">
                    <DonutChart data={ooData.map(d => ({ name: d.name, value: d.budget }))} title="Budget Share (donut)" />

                    <Card>
                      <CardHeader><CardTitle className="text-lg">Targets vs Actuals by OO</CardTitle></CardHeader>
                      <CardContent>
                        <ResponsiveContainer width="100%" height={280}>
                          <BarChart data={ooData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="hsl(220,13%,91%)" />
                            <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                            <YAxis tick={{ fontSize: 12 }} />
                            <Tooltip formatter={(v: any) => fmtNumber(Number(v))} /><Legend />
                            <Bar dataKey="targets" name="Target" fill="hsl(217,91%,50%)" radius={[6, 6, 0, 0]} />
                            <Bar dataKey="actuals" name="Actual" fill="hsl(160,60%,45%)" radius={[6, 6, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="quarterly" className="space-y-6 mt-4">
                <div className="grid gap-6 lg:grid-cols-2">
                  <Card>
                    <CardHeader><CardTitle className="text-lg">Quarterly Target vs Actual</CardTitle></CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={280}>
                        <BarChart data={qData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(220,13%,91%)" />
                          <XAxis dataKey="quarter" /><YAxis />
                          <Tooltip formatter={(v: any) => fmtNumber(Number(v))} /><Legend />
                          <Bar dataKey="target" name="Target" fill="hsl(217,91%,50%)" radius={[6, 6, 0, 0]} />
                          <Bar dataKey="actual" name="Actual" fill="hsl(160,60%,45%)" radius={[6, 6, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader><CardTitle className="text-lg">Division Completion</CardTitle></CardHeader>
                    <CardContent className="flex justify-center">
                      <ResponsiveContainer width={300} height={200}>
                        <RadialBarChart cx="50%" cy="100%" innerRadius="70%" outerRadius="100%" barSize={16}
                          data={[{ value: completion, fill: "hsl(160,60%,45%)" }]} startAngle={180} endAngle={0}>
                          <RadialBar dataKey="value" cornerRadius={10} />
                          <text x="50%" y="85%" textAnchor="middle" className="fill-foreground text-2xl font-bold font-heading">
                            {completion}%
                          </text>
                        </RadialBarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="unmet" className="mt-4">
                <UnmetActivities programs={programs as any} />
              </TabsContent>

              <TabsContent value="activities" className="mt-4">
                <Card>
                  <CardContent className="p-0">
                    <div className="max-h-[600px] overflow-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>OO</TableHead>
                            <TableHead className="min-w-[200px]">Activity</TableHead>
                            <TableHead>Indicator</TableHead>
                            <TableHead className="text-right">Q1</TableHead>
                            <TableHead className="text-right">Q2</TableHead>
                            <TableHead className="text-right">Q3</TableHead>
                            <TableHead className="text-right">Q4</TableHead>
                            <TableHead className="text-right">Total</TableHead>
                            <TableHead className="text-right">Budget</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {programs.map((p) => {
                            const t = (p as any).targets?.[0];
                            const b = (p as any).budgets?.[0];
                            return (
                              <TableRow key={p.id}>
                                <TableCell><Badge variant="secondary" className="text-xs">{p.organizational_outcome || 'Unknown'}</Badge></TableCell>
                                <TableCell className="text-xs max-w-[250px]">{p.activity}</TableCell>
                                <TableCell className="text-xs max-w-[180px] truncate">{p.indicator || "-"}</TableCell>
                                <TableCell className="text-right text-xs">{t?.q1 ?? "-"}</TableCell>
                                <TableCell className="text-right text-xs">{t?.q2 ?? "-"}</TableCell>
                                <TableCell className="text-right text-xs">{t?.q3 ?? "-"}</TableCell>
                                <TableCell className="text-right text-xs">{t?.q4 ?? "-"}</TableCell>
                                <TableCell className="text-right text-xs font-medium">{t?.total ?? "-"}</TableCell>
                                <TableCell className="text-right text-xs">{b?.grand_total > 0 ? fmtCurrency(b.grand_total) : "-"}</TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
