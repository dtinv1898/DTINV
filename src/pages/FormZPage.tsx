import { useParams } from "react-router-dom";
import { Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import DashboardLayout from "@/components/DashboardLayout";
import { useResponsiblePerson, useProgramsByPerson } from "@/hooks/useResponsiblePersons";

const MONTHS = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
const MONTH_KEYS = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"] as const;
const MONTH_ACTUAL_KEYS = ["jan_actual", "feb_actual", "mar_actual", "apr_actual", "may_actual", "jun_actual", "jul_actual", "aug_actual", "sep_actual", "oct_actual", "nov_actual", "dec_actual"] as const;

type FormType = "Z" | "X6" | "X12";

function getFormMonths(formType: FormType) {
  if (formType === "X6") return { months: MONTHS.slice(0, 6), keys: MONTH_KEYS.slice(0, 6), actualKeys: MONTH_ACTUAL_KEYS.slice(0, 6), label: "1st Semester" };
  if (formType === "X12") return { months: MONTHS, keys: MONTH_KEYS, actualKeys: MONTH_ACTUAL_KEYS, label: "Full Year" };
  return { months: MONTHS, keys: MONTH_KEYS, actualKeys: MONTH_ACTUAL_KEYS, label: "Full Year (Form Z)" };
}

export default function FormZPage() {
  const { id, form } = useParams<{ id: string; form: string }>();
  const formType = (form?.toUpperCase() || "Z") as FormType;
  const { data: person, isLoading: personLoading } = useResponsiblePerson(id);
  const { data: programs = [], isLoading: progsLoading } = useProgramsByPerson(id);

  if (personLoading || progsLoading) {
    return <DashboardLayout><div className="flex items-center justify-center h-64 animate-pulse text-muted-foreground">Loading...</div></DashboardLayout>;
  }
  if (!person) {
    return <DashboardLayout><div className="text-center py-20 text-muted-foreground">Person not found.</div></DashboardLayout>;
  }

  const { months, keys, actualKeys, label } = getFormMonths(formType);
  const divInfo = (person as any).divisions;

  // Group programs by OO (Personal Objectives)
  const ooGroups = new Map<string, typeof programs>();
  programs.forEach((p) => {
    const oo = p.organizational_outcome || "Other";
    if (!ooGroups.has(oo)) ooGroups.set(oo, []);
    ooGroups.get(oo)!.push(p);
  });

  const handlePrint = () => window.print();

  return (
    <DashboardLayout>
      <div className="space-y-4">
        {/* Screen-only controls */}
        <div className="flex items-center justify-between print:hidden">
          <div>
            <h1 className="text-2xl font-heading font-bold">PGS Form {formType}</h1>
            <p className="text-muted-foreground text-sm">{label} — {person.name}</p>
          </div>
          <Button onClick={handlePrint} variant="outline" className="gap-2">
            <Printer className="h-4 w-4" /> Print
          </Button>
        </div>

        {/* Printable Form */}
        <div className="bg-card border rounded-lg print:border-none print:shadow-none print:rounded-none">
          {/* Header */}
          <div className="p-4 border-b print:p-2">
            <div className="text-center space-y-1">
              <p className="text-xs text-muted-foreground">DTI PERFORMANCE GOVERNANCE SYSTEM</p>
              <p className="text-sm font-bold">PGS Form {formType}</p>
              <p className="text-sm font-semibold">Individual Dashboard</p>
              <p className="text-xs">Year: 2026</p>
            </div>
            <div className="grid grid-cols-2 gap-x-8 mt-3 text-xs">
              <div className="flex gap-2"><span className="text-muted-foreground">of:</span><span className="font-semibold">{person.name}</span></div>
              <div className="flex gap-2"><span className="text-muted-foreground">Bureau/Office:</span><span>DTI - Nueva Vizcaya</span></div>
              <div className="flex gap-2"><span className="text-muted-foreground">Position:</span><span>—</span></div>
              <div className="flex gap-2"><span className="text-muted-foreground">Division:</span><span>{divInfo?.name || divInfo?.code || "—"}</span></div>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-[10px] border-collapse">
              <thead>
                <tr className="bg-muted/50">
                  <th className="border px-1 py-1.5 text-left min-w-[140px] sticky left-0 bg-muted/50 z-10">Personal Objectives</th>
                  <th className="border px-1 py-1.5 text-center w-6">#</th>
                  <th className="border px-1 py-1.5 text-left min-w-[120px]">Success Measures</th>
                  <th className="border px-1 py-1.5 text-center min-w-[50px]">2026 TARGETS</th>
                  {months.map((m) => (
                    <th key={m} className="border px-0.5 py-1.5 text-center min-w-[28px]">{m}</th>
                  ))}
                  {formType === "Z" && (
                    <>
                      <th className="border px-1 py-1.5 text-center min-w-[40px]">1st Sem<br/>TARGET</th>
                      <th className="border px-1 py-1.5 text-center min-w-[40px]">1st Sem<br/>ACCOMP</th>
                    </>
                  )}
                  {(formType === "Z" || formType === "X12") && (
                    <>
                      <th className="border px-1 py-1.5 text-center min-w-[40px]">2026<br/>ACCOMP</th>
                      <th className="border px-1 py-1.5 text-center min-w-[40px]">ASSESS</th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody>
                {Array.from(ooGroups.entries()).map(([oo, progs], ooIdx) => (
                  progs.map((p, pIdx) => {
                    const t = (p as any).targets?.[0];
                    const monthlyValues = keys.map((k) => t?.[k] ?? 0);
                    const monthlyActuals = actualKeys.map((k) => t?.[k] ?? 0);
                    const yearTarget = t?.total ?? monthlyValues.reduce((a: number, b: number) => a + b, 0);
                    const firstSemTarget = keys.slice(0, 6).reduce((s, k) => s + (t?.[k] ?? 0), 0);
                    const firstSemActual = actualKeys.slice(0, 6).reduce((s, k) => s + (t?.[k] ?? 0), 0);
                    const yearActual = t?.total_actual ?? monthlyActuals.reduce((a: number, b: number) => a + b, 0);
                    const passed = yearTarget > 0 && yearActual >= yearTarget;

                    return (
                      <tr key={p.id} className="hover:bg-muted/30">
                        {pIdx === 0 && (
                          <td rowSpan={progs.length} className="border px-1 py-1 align-top font-medium sticky left-0 bg-card z-10">
                            {oo}
                          </td>
                        )}
                        <td className="border px-0.5 py-1 text-center text-muted-foreground">{ooIdx * 100 + pIdx + 1}</td>
                        <td className="border px-1 py-1">
                          <div className="font-medium">{p.activity}</div>
                          {p.indicator && <div className="text-muted-foreground italic mt-0.5">{p.indicator}</div>}
                        </td>
                        <td className="border px-1 py-1 text-center font-semibold">{yearTarget || "-"}</td>
                        {monthlyValues.map((v: number, mi: number) => (
                          <td key={mi} className="border px-0.5 py-1 text-center">
                            {v > 0 ? v : ""}
                          </td>
                        ))}
                        {formType === "Z" && (
                          <>
                            <td className="border px-1 py-1 text-center font-medium">{firstSemTarget || "-"}</td>
                            <td className="border px-1 py-1 text-center font-medium">{firstSemActual || "-"}</td>
                          </>
                        )}
                        {(formType === "Z" || formType === "X12") && (
                          <>
                            <td className="border px-1 py-1 text-center font-medium">{yearActual || "-"}</td>
                            <td className="border px-1 py-1 text-center">
                              {yearTarget > 0 ? (
                                <Badge variant={passed ? "default" : "destructive"} className="text-[9px] px-1">
                                  {passed ? "Pass" : "Fail"}
                                </Badge>
                              ) : "—"}
                            </td>
                          </>
                        )}
                      </tr>
                    );
                  })
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
