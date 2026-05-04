import { Link } from "react-router-dom";
import { BarChart3, Upload, TrendingUp, DollarSign, Activity, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import DashboardLayout from "@/components/DashboardLayout";
import KPICard from "@/components/KPICard";
import { useAllPrograms } from "@/hooks/useProgramsData";
import { useDivisions } from "@/hooks/useDivisions";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, RadialBarChart, RadialBar,
} from "recharts";
import { fmtPercentNumber, fmtNumber, fmtCurrency } from "@/lib/format";

const COLORS = [
  "hsl(217, 91%, 50%)",
  "hsl(160, 60%, 45%)",
  "hsl(35, 92%, 55%)",
  "hsl(280, 65%, 55%)",
  "hsl(0, 72%, 51%)",
];

export default function Index() {
  const { data: programs = [], isLoading } = useAllPrograms();
  const { data: divisions = [] } = useDivisions();

  // Compute KPIs
  const totalActivities = programs.length;
  const totalBudget = programs.reduce((sum, p) => {
    const b = (p as any).budgets?.[0];
    return sum + (b?.grand_total ?? 0);
  }, 0);
  const totalTargets = programs.reduce((sum, p) => {
    const t = (p as any).targets?.[0];
    return sum + (t?.total ?? 0);
  }, 0);
  const totalActuals = programs.reduce((sum, p) => {
    const t = (p as any).targets?.[0];
    return sum + (t?.total_actual ?? 0);
  }, 0);
  const completionRate = totalTargets > 0 ? Math.round((totalActuals / totalTargets) * 100) : 0;

  // OO breakdown
  const ooMap = new Map<string, { count: number; budget: number; targets: number }>();
  programs.forEach((p) => {
    const oo = p.organizational_outcome?.split(':')[0] || 'Unknown';
    const existing = ooMap.get(oo) || { count: 0, budget: 0, targets: 0 };
    existing.count++;
    existing.budget += (p as any).budgets?.[0]?.grand_total ?? 0;
    existing.targets += (p as any).targets?.[0]?.total ?? 0;
    ooMap.set(oo, existing);
  });
  const ooChartData = Array.from(ooMap.entries()).map(([name, d]) => ({
    name, activities: d.count, budget: d.budget / 1000, targets: d.targets,
  }));

  // Division breakdown for pie chart
  const divMap = new Map<string, number>();
  programs.forEach((p) => {
    const divCode = (p as any).uploads?.divisions?.code || 'Unknown';
    divMap.set(divCode, (divMap.get(divCode) || 0) + ((p as any).budgets?.[0]?.grand_total ?? 0));
  });
  const divPieData = Array.from(divMap.entries()).map(([name, value]) => ({ name, value }));

  // Quarterly budget trends
  const quarterlyData = [
    { quarter: "Q1", budget: 0 },
    { quarter: "Q2", budget: 0 },
    { quarter: "Q3", budget: 0 },
    { quarter: "Q4", budget: 0 },
  ];
  programs.forEach((p) => {
    const b = (p as any).budgets?.[0];
    if (b) {
      quarterlyData[0].budget += b.q1 ?? 0;
      quarterlyData[1].budget += b.q2 ?? 0;
      quarterlyData[2].budget += b.q3 ?? 0;
      quarterlyData[3].budget += b.q4 ?? 0;
    }
  });

  // Radial completion
  const radialData = [
    { name: "Completion", value: completionRate, fill: "hsl(160, 60%, 45%)" },
  ];

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-pulse text-muted-foreground">Loading dashboard...</div>
        </div>
      </DashboardLayout>
    );
  }

  if (!programs.length) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center h-[60vh] text-center space-y-4">
          <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-primary/10">
            <BarChart3 className="h-10 w-10 text-primary" />
          </div>
          <h1 className="text-3xl font-heading font-bold">DTI Performance Dashboard</h1>
          <p className="text-muted-foreground max-w-md">
            Upload a Work & Financial Plan (WFP) Excel file to get started with tracking your division's performance.
          </p>
          {/* Upload WFP removed */}
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-heading font-bold">DTI Performance Overview</h1>
            <p className="text-muted-foreground mt-1">Consolidated view across all divisions</p>
          </div>
          {/* Upload More button removed */}
        </div>

        {/* KPI Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <KPICard title="Total Activities" value={totalActivities} icon={Activity} subtitle="Across all divisions" />
          <KPICard title="Total Budget" value={`₱${(totalBudget / 1000).toFixed(0)}K`} icon={DollarSign} subtitle="Grand total allocation" />
          <KPICard title="Physical Targets" value={totalTargets} icon={TrendingUp} subtitle="Cumulative annual" />
          <KPICard title="Completion Rate" value={`${fmtPercentNumber(completionRate)}`} icon={Users} trend={completionRate > 50 ? "up" : "neutral"} subtitle="Actual vs target" />
        </div>

        {/* Charts Row 1 */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* OO Bar Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-heading">Activities by Organizational Outcome</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={ooChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(220,13%,91%)" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip formatter={(v: any) => fmtNumber(Number(v))} />
                  <Bar dataKey="activities" fill="hsl(217,91%,50%)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Budget Pie */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-heading">Budget Distribution by Division</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={divPieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${fmtPercentNumber(percent)}`}
                  >
                    {divPieData.map((_, i) => (
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

        {/* Charts Row 2 */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Quarterly Budget */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-heading">Quarterly Budget Allocation</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={quarterlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(220,13%,91%)" />
                  <XAxis dataKey="quarter" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `₱${(v / 1000).toFixed(0)}K`} />
                  <Tooltip formatter={(v: any) => fmtCurrency(Number(v))} />
                  <Bar dataKey="budget" fill="hsl(160,60%,45%)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Completion Gauge */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-heading">Overall Completion</CardTitle>
            </CardHeader>
            <CardContent className="flex items-center justify-center">
              <ResponsiveContainer width="100%" height={280}>
                <RadialBarChart
                  cx="50%" cy="50%"
                  innerRadius="60%"
                  outerRadius="90%"
                  barSize={20}
                  data={radialData}
                  startAngle={180}
                  endAngle={0}
                >
                  <RadialBar dataKey="value" cornerRadius={10} />
                  <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle" className="fill-foreground text-3xl font-bold font-heading">
                    {fmtPercentNumber(completionRate)}
                  </text>
                </RadialBarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
