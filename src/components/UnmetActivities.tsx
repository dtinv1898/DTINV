import { AlertTriangle, XCircle } from "lucide-react";
import { fmtPercentNumber } from "@/lib/format";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";

interface Program {
  id: string;
  activity: string;
  organizational_outcome: string;
  indicator?: string | null;
  targets?: Array<{ total?: number | null; total_actual?: number | null; q1?: number | null; q2?: number | null; q3?: number | null; q4?: number | null; q1_actual?: number | null; q2_actual?: number | null; q3_actual?: number | null; q4_actual?: number | null }>;
  budgets?: Array<{ grand_total?: number | null }>;
}

interface UnmetActivitiesProps {
  programs: Program[];
}

export default function UnmetActivities({ programs }: UnmetActivitiesProps) {
  const unmetActivities = programs
    .map((p) => {
      const t = (p as any).targets?.[0];
      const target = t?.total ?? 0;
      const actual = t?.total_actual ?? 0;
      const completionRate = target > 0 ? (actual / target) * 100 : 0;
      const isMissing = actual === 0 && target > 0;
      const isUnmet = target > 0 && actual < target;
      return { ...p, target, actual, completionRate, isMissing, isUnmet };
    })
    .filter((p) => p.isUnmet)
    .sort((a, b) => a.completionRate - b.completionRate);

  if (unmetActivities.length === 0) return null;

  const missing = unmetActivities.filter(a => a.isMissing).length;
  const partial = unmetActivities.length - missing;

  return (
    <Card className="border-amber-200/50">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-amber-500" />
          Unmet & Missing Activities ({unmetActivities.length})
        </CardTitle>
        <CardDescription>
          {missing > 0 && <Badge variant="destructive" className="mr-2">{missing} no accomplishment</Badge>}
          {partial > 0 && <Badge variant="secondary">{partial} partially met</Badge>}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="max-h-[400px] overflow-auto rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>OO</TableHead>
                <TableHead className="min-w-[200px]">Activity</TableHead>
                <TableHead className="text-right">Target</TableHead>
                <TableHead className="text-right">Actual</TableHead>
                <TableHead className="min-w-[120px]">Progress</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {unmetActivities.map((a) => (
                <TableRow key={a.id} className={a.isMissing ? "bg-red-50/50" : ""}>
                  <TableCell>
                    <Badge variant="secondary" className="text-xs">
                      {a.organizational_outcome?.split(":")[0]}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs max-w-[250px]">{a.activity}</TableCell>
                  <TableCell className="text-right text-xs font-medium">{a.target}</TableCell>
                  <TableCell className="text-right text-xs font-medium">{a.actual}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Progress value={a.completionRate} className="h-1.5 flex-1" />
                      <span className="text-xs text-muted-foreground w-10 text-right">{fmtPercentNumber(a.completionRate)}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {a.isMissing ? (
                      <Badge variant="destructive" className="text-xs gap-1"><XCircle className="h-3 w-3" />Missing</Badge>
                    ) : (
                      <Badge variant="outline" className="text-xs text-amber-600 border-amber-300">Partial</Badge>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
