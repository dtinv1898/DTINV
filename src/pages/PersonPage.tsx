import { useState, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { Upload, FileSpreadsheet, Activity, DollarSign, CheckCircle2, Clock, AlertTriangle, Printer } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { useResponsiblePerson, useProgramsByPerson } from "@/hooks/useResponsiblePersons";
import { parseWFPExcel } from "@/lib/excelParser";
import DashboardLayout from "@/components/DashboardLayout";
import KPICard from "@/components/KPICard";
import InsightsPanel from "@/components/InsightsPanel";
import UnmetActivities from "@/components/UnmetActivities";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, Legend, PieChart, Pie, Cell,
  RadialBarChart, RadialBar,
} from "recharts";
import { fmtPercentNumber, fmtNumber, fmtCurrency } from "@/lib/format";

const MONTH_KEYS = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"] as const;
const MONTH_LABELS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export default function PersonPage() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const { data: person, isLoading: personLoading } = useResponsiblePerson(id);
  const { data: programs = [], isLoading: progsLoading } = useProgramsByPerson(id);
  const [file, setFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const handleUpload = useCallback(async (f: File) => {
    if (!person) return;
    setFile(f);
    setSaving(true);
    try {
      const buffer = await f.arrayBuffer();
      const parsed = parseWFPExcel(buffer);
      if (!parsed.length) {
        toast({ title: "No data found", description: "Could not parse activities from this file.", variant: "destructive" });
        setSaving(false);
        return;
      }
      const divisionId = person.division_id;

      // Delete old data (overwrite)
      const { data: oldUploads } = await supabase.from("uploads").select("id").eq("responsible_person_id", person.id);
      if (oldUploads?.length) {
        const oldUploadIds = oldUploads.map((u) => u.id);
        const { data: oldPrograms } = await supabase.from("programs").select("id").in("upload_id", oldUploadIds);
        if (oldPrograms?.length) {
          const oldProgIds = oldPrograms.map((p) => p.id);
          await supabase.from("budgets").delete().in("program_id", oldProgIds);
          await supabase.from("targets").delete().in("program_id", oldProgIds);
          await supabase.from("programs").delete().in("upload_id", oldUploadIds);
        }
        await supabase.from("uploads").delete().eq("responsible_person_id", person.id);
      }

      const filePath = `${divisionId}/${person.id}/${Date.now()}_${f.name}`;
      await supabase.storage.from("wfp-files").upload(filePath, f);

      const { data: upload, error: uploadErr } = await supabase
        .from("uploads")
        .insert({ file_name: f.name, division_id: divisionId, file_path: filePath, responsible_person_id: person.id })
        .select().single();
      if (uploadErr) throw uploadErr;

      for (const p of parsed) {
        const { data: prog, error: progErr } = await supabase
          .from("programs")
          .insert({
            upload_id: upload.id, organizational_outcome: p.organizational_outcome,
            program_name: p.program_name, activity: p.activity,
            date_of_implementation: p.date_of_implementation, indicator: p.indicator, sub_industry: p.sub_industry,
          })
          .select().single();
        if (progErr) throw progErr;
        await supabase.from("targets").insert({ program_id: prog.id, q1: p.targets.q1, q2: p.targets.q2, q3: p.targets.q3, q4: p.targets.q4, total: p.targets.total });
        await supabase.from("budgets").insert({ program_id: prog.id, ...p.budget });
      }

      toast({ title: "Upload successful!", description: `${parsed.length} activities saved for ${person.name}.` });
      queryClient.invalidateQueries({ queryKey: ["programs-by-person", id] });
    } catch (e) {
      toast({ title: "Error", description: String(e), variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }, [person, id, queryClient]);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f && f.name.endsWith(".xlsx")) handleUpload(f);
  }, [handleUpload]);

  if (personLoading || progsLoading) {
    return <DashboardLayout><div className="flex items-center justify-center h-64 animate-pulse text-muted-foreground">Loading...</div></DashboardLayout>;
  }
  if (!person) {
    return <DashboardLayout><div className="text-center py-20 text-muted-foreground">Person not found.</div></DashboardLayout>;
  }

  const totalActivities = programs.length;
  const totalBudget = programs.reduce((s, p) => s + ((p as any).budgets?.[0]?.grand_total ?? 0), 0);
  const totalTargets = programs.reduce((s, p) => s + ((p as any).targets?.[0]?.total ?? 0), 0);
  const totalActuals = programs.reduce((s, p) => s + ((p as any).targets?.[0]?.total_actual ?? 0), 0);
  const completion = totalTargets > 0 ? Math.round((totalActuals / totalTargets) * 100) : 0;

  const completed = programs.filter((p) => {
    const t = (p as any).targets?.[0];
    return t && t.total_actual !== null && t.total !== null && t.total > 0 && t.total_actual >= t.total;
  }).length;
  const pending = programs.filter((p) => {
    const t = (p as any).targets?.[0];
    return t && (t.total_actual === null || t.total_actual === 0) && t.total && t.total > 0;
  }).length;
  const backlog = totalActivities - completed - pending;

  // Monthly chart data
  const monthlyData = MONTH_LABELS.map((label, idx) => {
    const key = MONTH_KEYS[idx];
    const actualKey = `${key}_actual`;
    let target = 0, actual = 0;
    programs.forEach((p) => {
      const t = (p as any).targets?.[0];
      if (t) {
        target += t[key] ?? 0;
        actual += t[actualKey] ?? 0;
      }
    });
    return { month: label, target, actual };
  });

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

  const taskStatusData = [
    { name: "Completed", value: completed, fill: "hsl(160,60%,45%)" },
    { name: "Pending", value: pending, fill: "hsl(35,92%,55%)" },
    { name: "Backlog", value: backlog > 0 ? backlog : 0, fill: "hsl(0,72%,51%)" },
  ].filter((d) => d.value > 0);

  const ooMap = new Map<string, { count: number; budget: number }>();
  programs.forEach((p) => {
    const oo = p.organizational_outcome?.split(":")[0] || "Unknown";
    const e = ooMap.get(oo) || { count: 0, budget: 0 };
    e.count++; e.budget += (p as any).budgets?.[0]?.grand_total ?? 0;
    ooMap.set(oo, e);
  });
  const ooData = Array.from(ooMap.entries()).map(([name, d]) => ({ name, ...d }));
  const divInfo = (person as any).divisions;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-heading font-bold">{person.name}</h1>
            <p className="text-muted-foreground mt-1">{divInfo?.name || "Unknown Division"} ({divInfo?.code})</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {/* Form links */}
            {programs.length > 0 && (
              <div className="flex gap-1">
                <Link to={`/person/${id}/form/Z`}><Button variant="outline" size="sm" className="gap-1"><Printer className="h-3.5 w-3.5" />Form Z</Button></Link>
                <Link to={`/person/${id}/form/X6`}><Button variant="outline" size="sm">X6</Button></Link>
                <Link to={`/person/${id}/form/X12`}><Button variant="outline" size="sm">X12</Button></Link>
              </div>
            )}
            <label
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={onDrop}
              className={`flex items-center gap-3 rounded-xl border-2 border-dashed px-6 py-4 cursor-pointer transition-colors ${
                dragOver ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
              }`}
            >
              {saving ? (
                <span className="text-sm text-muted-foreground animate-pulse">Uploading...</span>
              ) : file && programs.length > 0 ? (
                <div className="flex items-center gap-2 text-primary">
                  <FileSpreadsheet className="h-5 w-5" />
                  <span className="text-sm font-medium">{file.name}</span>
                </div>
              ) : (
                <>
                  <Upload className="h-5 w-5 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Upload WFP (.xlsx)</span>
                </>
              )}
              <input type="file" accept=".xlsx" className="hidden" onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0])} />
            </label>
          </div>
        </div>

        {!programs.length ? (
          <Card className="p-12 text-center">
            <Upload className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-heading font-semibold mb-2">No Data Yet</h2>
            <p className="text-muted-foreground mb-4">Upload a WFP Excel file or use the Mother Plan upload to populate {person.name}'s data.</p>
            <p className="text-xs text-muted-foreground">Re-uploading will replace all previous data.</p>
          </Card>
        ) : (
          <>
            {/* KPI Cards */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
              <KPICard title="Activities" value={totalActivities} icon={Activity} />
              <KPICard title="Budget" value={`₱${(totalBudget / 1000).toFixed(0)}K`} icon={DollarSign} />
              <KPICard title="Completed" value={completed} icon={CheckCircle2} subtitle={`${fmtPercentNumber(totalActivities > 0 ? (completed / totalActivities) * 100 : 0)}`} trend="up" />
              <KPICard title="Pending" value={pending} icon={Clock} />
              <KPICard title="Backlog" value={backlog > 0 ? backlog : 0} icon={AlertTriangle} trend={backlog > 0 ? "down" : "neutral"} />
            </div>

            {/* Insights Panel */}
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
            <Tabs defaultValue="monthly">
              <TabsList>
                <TabsTrigger value="monthly">Monthly</TabsTrigger>
                <TabsTrigger value="performance">Performance</TabsTrigger>
                <TabsTrigger value="quarterly">Quarterly</TabsTrigger>
                <TabsTrigger value="unmet">Unmet Activities</TabsTrigger>
                <TabsTrigger value="activities">All Activities</TabsTrigger>
              </TabsList>

              <TabsContent value="monthly" className="space-y-6 mt-4">
                <Card>
                  <CardHeader><CardTitle className="text-lg">Monthly Targets vs Accomplishments</CardTitle></CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={320}>
                      <BarChart data={monthlyData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(220,13%,91%)" />
                        <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                        <YAxis tick={{ fontSize: 11 }} />
                        <Tooltip formatter={(v: any) => fmtNumber(Number(v))} /><Legend />
                        <Bar dataKey="target" name="Target" fill="hsl(217,91%,50%)" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="actual" name="Accomplishment" fill="hsl(160,60%,45%)" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* Monthly detail table */}
                <Card>
                  <CardHeader><CardTitle className="text-lg">Monthly Breakdown by Activity</CardTitle></CardHeader>
                  <CardContent className="p-0">
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="min-w-[200px] sticky left-0 bg-card z-10">Activity</TableHead>
                            {MONTH_LABELS.map((m) => (
                              <TableHead key={m} className="text-center min-w-[40px] text-xs">{m}</TableHead>
                            ))}
                            <TableHead className="text-center min-w-[50px]">Total</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {programs.map((p) => {
                            const t = (p as any).targets?.[0];
                            return (
                              <TableRow key={p.id}>
                                <TableCell className="text-xs max-w-[250px] truncate sticky left-0 bg-card z-10">{p.activity}</TableCell>
                                {MONTH_KEYS.map((k) => (
                                  <TableCell key={k} className="text-center text-xs">{t?.[k] > 0 ? t[k] : ""}</TableCell>
                                ))}
                                <TableCell className="text-center text-xs font-semibold">{t?.total || "-"}</TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="performance" className="space-y-6 mt-4">
                <div className="grid gap-6 lg:grid-cols-3">
                  <Card>
                    <CardHeader><CardTitle className="text-lg">Task Status</CardTitle></CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={250}>
                        <PieChart>
                          <Pie data={taskStatusData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value"
                            label={({ name, percent }) => `${name} ${fmtPercentNumber(percent)}`}>
                            {taskStatusData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                          </Pie>
                          <Tooltip formatter={(v: any) => fmtNumber(Number(v))} /><Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader><CardTitle className="text-lg">Completion Rate</CardTitle></CardHeader>
                    <CardContent className="flex justify-center">
                      <ResponsiveContainer width={250} height={250}>
                        <RadialBarChart cx="50%" cy="50%" innerRadius="60%" outerRadius="90%" barSize={18}
                          data={[{ value: completion, fill: "hsl(160,60%,45%)" }]} startAngle={180} endAngle={0}>
                          <RadialBar dataKey="value" cornerRadius={10} />
                          <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle" className="fill-foreground text-3xl font-bold font-heading">
                            {fmtPercentNumber(completion)}
                          </text>
                        </RadialBarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader><CardTitle className="text-lg">Budget by OO</CardTitle></CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={250}>
                        <BarChart data={ooData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(220,13%,91%)" />
                          <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                          <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `₱${(v / 1000).toFixed(0)}K`} />
                          <Tooltip formatter={(v: any) => fmtCurrency(Number(v))} />
                          <Bar dataKey="budget" fill="hsl(217,91%,50%)" radius={[6, 6, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="quarterly" className="space-y-6 mt-4">
                <div className="grid gap-6 lg:grid-cols-2">
                  <Card>
                    <CardHeader><CardTitle className="text-lg">Target vs Actual</CardTitle></CardHeader>
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
                    <CardHeader><CardTitle className="text-lg">Monthly Trend</CardTitle></CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={280}>
                        <LineChart data={monthlyData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(220,13%,91%)" />
                          <XAxis dataKey="month" tick={{ fontSize: 10 }} /><YAxis />
                          <Tooltip formatter={(v: any) => fmtNumber(Number(v))} /><Legend />
                          <Line type="monotone" dataKey="target" stroke="hsl(217,91%,50%)" strokeWidth={2} dot={{ r: 3 }} />
                          <Line type="monotone" dataKey="actual" stroke="hsl(160,60%,45%)" strokeWidth={2} dot={{ r: 3 }} name="Accomplishment" />
                        </LineChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="unmet" className="mt-4">
                <UnmetActivities programs={programs as any} />
                {programs.filter(p => {
                  const t = (p as any).targets?.[0];
                  return !(t && t.total > 0 && t.total_actual < t.total);
                }).length === programs.length && (
                  <Card className="p-8 text-center">
                    <CheckCircle2 className="h-10 w-10 text-emerald-500 mx-auto mb-3" />
                    <p className="text-muted-foreground">All activities are on track or no actuals data yet.</p>
                  </Card>
                )}
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
                            <TableHead>Date</TableHead>
                            <TableHead className="text-right">Target</TableHead>
                            <TableHead className="text-right">Actual</TableHead>
                            <TableHead>Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {programs.map((p) => {
                            const t = (p as any).targets?.[0];
                            const target = t?.total ?? 0;
                            const actual = t?.total_actual ?? 0;
                            const status = target > 0 && actual >= target ? "completed" : actual > 0 ? "in-progress" : "pending";
                            return (
                              <TableRow key={p.id}>
                                <TableCell><Badge variant="secondary" className="text-xs">{p.organizational_outcome?.split(":")[0]}</Badge></TableCell>
                                <TableCell className="text-xs max-w-[250px]">{p.activity}</TableCell>
                                <TableCell className="text-xs max-w-[180px] truncate">{p.indicator || "-"}</TableCell>
                                <TableCell className="text-xs">{p.date_of_implementation || "-"}</TableCell>
                                <TableCell className="text-right text-xs font-medium">{target || "-"}</TableCell>
                                <TableCell className="text-right text-xs font-medium">{actual || "-"}</TableCell>
                                <TableCell>
                                  <Badge variant={status === "completed" ? "default" : status === "in-progress" ? "secondary" : "outline"} className="text-xs">
                                    {status === "completed" ? "Done" : status === "in-progress" ? "In Progress" : "Pending"}
                                  </Badge>
                                </TableCell>
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
