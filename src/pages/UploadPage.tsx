import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Upload, FileSpreadsheet, Check, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useDivisions } from "@/hooks/useDivisions";
import { parseWFPExcel, ParsedProgram } from "@/lib/excelParser";
import { useSaveOORCData } from "@/hooks/useOORCPGSData";
import { OORCRow } from "@/lib/oorcParser";
import DashboardLayout from "@/components/DashboardLayout";

export default function UploadPage() {
  const navigate = useNavigate();
  const { data: divisions } = useDivisions();
  const [divisionId, setDivisionId] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<ParsedProgram[]>([]);
  const [saving, setSaving] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const saveOORC = useSaveOORCData(divisionId);

  const handleFile = useCallback(async (f: File) => {
    setFile(f);
    const buffer = await f.arrayBuffer();
    try {
      const data = parseWFPExcel(buffer);
      setParsedData(data);
      toast({ title: `Parsed ${data.length} activities`, description: "Review below and save to database." });
    } catch (e) {
      toast({ title: "Error parsing file", description: String(e), variant: "destructive" });
    }
  }, []);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f && f.name.endsWith(".xlsx")) handleFile(f);
  }, [handleFile]);

  const handleSave = async () => {
    if (!divisionId || !file || !parsedData.length) return;
    setSaving(true);

    try {
      // Compute file hash to detect duplicates
      const buffer = await file.arrayBuffer();
      const hashBuf = await crypto.subtle.digest('SHA-256', buffer);
      const hashArray = Array.from(new Uint8Array(hashBuf));
      const hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');

      // Check for existing upload by file hash or same name in this division
      const { data: existingUploads } = await supabase
        .from('uploads')
        .select('*')
        .eq('division_id', divisionId)
        .eq('file_name', file.name);

      if (existingUploads && existingUploads.length > 0) {
        const overwrite = window.confirm('File already exists. Overwrite or cancel? Click OK to overwrite.');
        if (!overwrite) {
          setSaving(false);
          return;
        }
        // delete existing records and storage object (cascade will remove programs/targets)
        for (const e of existingUploads) {
          if (e.file_path) {
            await supabase.storage.from('wfp-files').remove([e.file_path]);
          }
          await supabase.from('uploads').delete().eq('id', e.id);
        }
      }

      // Upload file to storage
      const filePath = `${divisionId}/${Date.now()}_${file.name}`;
      await supabase.storage.from('wfp-files').upload(filePath, file);

      // Create upload record (store hash and file_type=WFP)
      const { data: upload, error: uploadErr } = await supabase
        .from('uploads')
        .insert({ file_name: file.name, division_id: divisionId, file_path: filePath, file_hash: hashHex, file_type: 'WFP' })
        .select()
        .single();
      if (uploadErr) throw uploadErr;

      // Insert programs with targets (store monthly targets if available)
      for (const p of parsedData) {
        const { data: prog, error: progErr } = await supabase
          .from('programs')
          .insert({
            upload_id: upload.id,
            organizational_outcome: p.organizational_outcome,
            program_name: p.program_name,
            activity: p.activity,
            date_of_implementation: p.date_of_implementation,
            indicator: p.indicator,
            sub_industry: p.sub_industry,
          })
          .select()
          .single();
        if (progErr) throw progErr;

        // Build target record, include months when present
        const targetRec: any = {
          program_id: prog.id,
          q1: (p.targets as any).q1 ?? null,
          q2: (p.targets as any).q2 ?? null,
          q3: (p.targets as any).q3 ?? null,
          q4: (p.targets as any).q4 ?? null,
          total: (p.targets as any).total ?? null,
        };
        // add months
        const months = ['jan','feb','mar','apr','may','jun','jul','aug','sep','oct','nov','dec'];
        months.forEach((m) => { if ((p.targets as any)[m] !== undefined) targetRec[m] = (p.targets as any)[m]; });

        await supabase.from('targets').insert(targetRec);
      }

      // Also create equivalent OORC rows so dashboard components that read `oorc_data` pick up these PIs
      try {
        const oorcRows: OORCRow[] = parsedData.map((p) => {
          const q1 = p.targets.q1 ?? 0;
          const q2 = p.targets.q2 ?? 0;
          const q3 = p.targets.q3 ?? 0;
          const q4 = p.targets.q4 ?? 0;
          const computedTotal = (p.targets.total ?? null) ?? (q1 || q2 || q3 || q4 ? (q1 + q2 + q3 + q4) : null);
          return ({
            category: 'Output',
            oo: p.organizational_outcome || '',
            program: p.program_name || '',
            indicator: p.indicator || '',
            annualTarget: computedTotal,
            targets: { q1: p.targets.q1 ?? null, q2: p.targets.q2 ?? null, q3: p.targets.q3 ?? null, q4: p.targets.q4 ?? null, sem1: null, sem2: null },
            accomplishments: { q1: null, q2: null, q3: null, q4: null, sem1: null, sem2: null },
            monthly: {
              jan: { target: null, accomp: null }, feb: { target: null, accomp: null }, mar: { target: null, accomp: null },
              apr: { target: null, accomp: null }, may: { target: null, accomp: null }, jun: { target: null, accomp: null },
              jul: { target: null, accomp: null }, aug: { target: null, accomp: null }, sep: { target: null, accomp: null },
              oct: { target: null, accomp: null }, nov: { target: null, accomp: null }, dec: { target: null, accomp: null },
            },
            pctAccomp: null,
          });
        });

        await saveOORC.mutateAsync(oorcRows);
      } catch (e) {
        console.error('saving to oorc_data failed', e);
      }

      toast({ title: 'Upload successful!', description: `${parsedData.length} activities saved.` });
      navigate('/oorc');
    } catch (e) {
      toast({ title: "Error saving data", description: String(e), variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const selectedDivision = divisions?.find((d) => d.id === divisionId);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-heading font-bold">Upload Work & Financial Plan</h1>
          <p className="text-muted-foreground mt-1">Upload your division's WFP Excel file for automatic parsing and tracking.</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Division Selector */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Select Division</CardTitle>
              <CardDescription>Choose which division this WFP belongs to</CardDescription>
            </CardHeader>
            <CardContent>
              <Select value={divisionId} onValueChange={setDivisionId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a division..." />
                </SelectTrigger>
                <SelectContent>
                  {divisions?.map((d) => (
                    <SelectItem key={d.id} value={d.id}>
                      {d.name} ({d.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {/* File Upload */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Upload Excel File</CardTitle>
              <CardDescription>Drag & drop or click to browse (.xlsx)</CardDescription>
            </CardHeader>
            <CardContent>
              <label
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={onDrop}
                className={`flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 cursor-pointer transition-colors ${
                  dragOver ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
                }`}
              >
                {file ? (
                  <div className="flex items-center gap-2 text-accent">
                    <FileSpreadsheet className="h-6 w-6" />
                    <span className="font-medium">{file.name}</span>
                  </div>
                ) : (
                  <>
                    <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                    <span className="text-sm text-muted-foreground">Drop your .xlsx file here</span>
                  </>
                )}
                <input
                  type="file"
                  accept=".xlsx"
                  className="hidden"
                  onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
                />
              </label>
            </CardContent>
          </Card>
        </div>

        {/* Preview Table */}
        {parsedData.length > 0 && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg">
                  <Check className="inline h-5 w-5 text-accent mr-1" />
                  Parsed {parsedData.length} Activities
                </CardTitle>
                <CardDescription>Review the data before saving</CardDescription>
              </div>
              <Button onClick={handleSave} disabled={!divisionId || saving} size="lg">
                {saving ? "Saving..." : "Save to Database"}
              </Button>
            </CardHeader>
            <CardContent>
              <div className="max-h-[500px] overflow-auto rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="min-w-[120px]">OO</TableHead>
                      <TableHead className="min-w-[200px]">Activity</TableHead>
                      <TableHead>Indicator</TableHead>
                      <TableHead className="text-right">Q1</TableHead>
                      <TableHead className="text-right">Q2</TableHead>
                      <TableHead className="text-right">Q3</TableHead>
                      <TableHead className="text-right">Q4</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                      <TableHead className="text-right">Budget (₱)</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {parsedData.slice(0, 100).map((p, i) => (
                      <TableRow key={i}>
                        <TableCell className="font-medium text-xs">
                          {p.organizational_outcome.split(':')[0] || '-'}
                        </TableCell>
                        <TableCell className="text-xs max-w-[250px] truncate">{p.activity}</TableCell>
                        <TableCell className="text-xs max-w-[200px] truncate">{p.indicator || '-'}</TableCell>
                        <TableCell className="text-right text-xs">{p.targets.q1 ?? '-'}</TableCell>
                        <TableCell className="text-right text-xs">{p.targets.q2 ?? '-'}</TableCell>
                        <TableCell className="text-right text-xs">{p.targets.q3 ?? '-'}</TableCell>
                        <TableCell className="text-right text-xs">{p.targets.q4 ?? '-'}</TableCell>
                        <TableCell className="text-right text-xs font-medium">{p.targets.total ?? '-'}</TableCell>
                        <TableCell className="text-right text-xs">
                          {p.budget.grand_total > 0 ? `₱${p.budget.grand_total.toLocaleString()}` : '-'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              {parsedData.length > 100 && (
                <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" /> Showing first 100 of {parsedData.length} rows
                </p>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
