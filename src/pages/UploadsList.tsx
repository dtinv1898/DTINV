import { useEffect, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export default function UploadsList() {
  const [uploads, setUploads] = useState<any[]>([]);
  const [divisions, setDivisions] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(false);

  async function fetchAll() {
    setLoading(true);
    try {
      const { data: ups, error: upErr } = await supabase.from('uploads').select('*').order('uploaded_at', { ascending: false });
      if (upErr) throw upErr;
      const { data: divs, error: dErr } = await supabase.from('divisions').select('id,name,code');
      if (dErr) throw dErr;
      const map: Record<string, any> = {};
      (divs || []).forEach((d: any) => { map[d.id] = d; });
      setDivisions(map);
      setUploads(ups || []);
    } catch (e: any) {
      console.error('fetchAll uploads error', e);
      const msg = e?.message || e?.error || (typeof e === 'string' ? e : JSON.stringify(e));
      toast({ title: 'Error loading uploads', description: String(msg), variant: 'destructive' });
    } finally { setLoading(false); }
  }

  useEffect(() => { fetchAll(); }, []);

  async function handleDownload(path: string) {
    try {
      const { data, error } = await supabase.storage.from('wfp-files').createSignedUrl(path, 60);
      if (error) throw error;
      window.open(data.signedUrl, '_blank');
    } catch (e: any) {
      console.error('download failed', e);
      const msg = e?.message || e?.error || (typeof e === 'string' ? e : JSON.stringify(e));
      toast({ title: 'Download failed', description: String(msg), variant: 'destructive' });
    }
  }

  async function handleDelete(u: any) {
    if (!window.confirm(`Delete ${u.file_name}? This will remove the DB record and storage object.`)) return;
    try {
      if (u.file_path) await supabase.storage.from('wfp-files').remove([u.file_path]);
      const { error } = await supabase.from('uploads').delete().eq('id', u.id);
      if (error) throw error;
      toast({ title: 'Deleted', description: `${u.file_name} removed.` });
      fetchAll();
    } catch (e: any) {
      console.error('delete failed', e);
      const msg = e?.message || e?.error || (typeof e === 'string' ? e : JSON.stringify(e));
      toast({ title: 'Delete failed', description: String(msg), variant: 'destructive' });
    }
  }

  async function handleEdit(u: any) {
    const newName = window.prompt('Edit file name', u.file_name);
    if (!newName || newName === u.file_name) return;
    try {
      const { error } = await supabase.from('uploads').update({ file_name: newName }).eq('id', u.id);
      if (error) throw error;
      toast({ title: 'Updated', description: 'File name updated.' });
      fetchAll();
    } catch (e: any) {
      console.error('update failed', e);
      const msg = e?.message || e?.error || (typeof e === 'string' ? e : JSON.stringify(e));
      toast({ title: 'Update failed', description: String(msg), variant: 'destructive' });
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-heading font-bold">Uploaded Files</h1>
          <p className="text-muted-foreground mt-1">List of files uploaded to storage with basic actions.</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Uploads</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="max-h-[600px] overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>File</TableHead>
                    <TableHead>Division</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Uploaded</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {uploads.map((u) => (
                    <TableRow key={u.id}>
                      <TableCell className="text-xs">{u.file_name}</TableCell>
                      <TableCell className="text-xs">{u.division_id ? (divisions[u.division_id]?.name || divisions[u.division_id]?.code || u.division_id) : '—'}</TableCell>
                      <TableCell className="text-xs">{u.file_type}</TableCell>
                      <TableCell className="text-xs">{new Date(u.uploaded_at).toLocaleString()}</TableCell>
                      <TableCell className="text-xs">
                        <div className="flex gap-2">
                          <Button size="sm" onClick={() => handleDownload(u.file_path)}>Download</Button>
                          <Button variant="ghost" size="sm" onClick={() => handleEdit(u)}>Edit</Button>
                          <Button variant="destructive" size="sm" onClick={() => handleDelete(u)}>Delete</Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
