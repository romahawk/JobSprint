import { useMemo, useState } from "react";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";
import { Textarea } from "../../components/ui/textarea";
import { useApp } from "../../context";
import { useJobOs } from "../../hooks/useJobOs";
import { JobOsLayout } from "../../components/job-os/JobOsLayout";
import type { ApplicationStatus, JobOsApplication } from "../../types/jobOs";

const STATUS_VALUES: ApplicationStatus[] = [
  "sent",
  "screen",
  "case",
  "interview",
  "final",
  "offer",
  "rejected",
  "ghosted",
];

export default function JobOsApplicationsPage() {
  const { session } = useApp();
  const { applications, companies, roles, assets, addApplication, updateApplication, removeApplication, syncNotice } = useJobOs(
    session?.userId ?? null
  );
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [draft, setDraft] = useState<Omit<JobOsApplication, "id" | "createdAt" | "updatedAt">>({
    dateApplied: new Date().toISOString().slice(0, 10),
    companyId: "",
    roleId: "",
    channel: "LinkedIn",
    cvVersion: assets.cvs[0]?.name ?? "CV - Technical Product Manager",
    status: "sent",
    nextAction: "",
    notes: "",
  });

  const byId = useMemo(() => new Set(selectedIds), [selectedIds]);

  function toggle(id: string): void {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id]));
  }

  async function applyBulkStatus(status: ApplicationStatus): Promise<void> {
    await Promise.all(selectedIds.map((id) => updateApplication(id, { status })));
    setSelectedIds([]);
  }

  async function bulkFollowUp(): Promise<void> {
    await Promise.all(
      selectedIds.map((id) =>
        updateApplication(id, {
          nextAction: "Follow up",
        })
      )
    );
    setSelectedIds([]);
  }

  return (
    <JobOsLayout title="Applications" subtitle="Master tracking sheet for all submitted applications" notice={syncNotice}>
      <Card>
        <CardHeader><CardTitle className="text-sm">Log Application</CardTitle></CardHeader>
        <CardContent className="grid md:grid-cols-4 gap-3">
          <Input type="date" value={draft.dateApplied} onChange={(e) => setDraft((p) => ({ ...p, dateApplied: e.target.value }))} />
          <Select value={draft.companyId} onValueChange={(v) => setDraft((p) => ({ ...p, companyId: v }))}>
            <SelectTrigger><SelectValue placeholder="Company" /></SelectTrigger>
            <SelectContent>{companies.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
          </Select>
          <Select value={draft.roleId} onValueChange={(v) => setDraft((p) => ({ ...p, roleId: v }))}>
            <SelectTrigger><SelectValue placeholder="Role" /></SelectTrigger>
            <SelectContent>{roles.filter((r) => !draft.companyId || r.companyId === draft.companyId).map((r) => <SelectItem key={r.id} value={r.id}>{r.title}</SelectItem>)}</SelectContent>
          </Select>
          <Input value={draft.channel} onChange={(e) => setDraft((p) => ({ ...p, channel: e.target.value }))} placeholder="Channel" />
          <Select value={draft.cvVersion} onValueChange={(v) => setDraft((p) => ({ ...p, cvVersion: v }))}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{assets.cvs.map((cv) => <SelectItem key={cv.id} value={cv.name}>{cv.name}</SelectItem>)}</SelectContent>
          </Select>
          <Select value={draft.status} onValueChange={(v) => setDraft((p) => ({ ...p, status: v as ApplicationStatus }))}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{STATUS_VALUES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
          </Select>
          <Input value={draft.nextAction} onChange={(e) => setDraft((p) => ({ ...p, nextAction: e.target.value }))} placeholder="Next action" />
          <Button
            onClick={() => {
              if (!draft.companyId) return;
              void addApplication(draft);
              setDraft((p) => ({ ...p, nextAction: "", notes: "" }));
            }}
          >
            Save
          </Button>
          <div className="md:col-span-4">
            <Textarea value={draft.notes} onChange={(e) => setDraft((p) => ({ ...p, notes: e.target.value }))} rows={2} placeholder="Notes" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Bulk Actions</CardTitle>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="outline" disabled={selectedIds.length === 0} onClick={() => void bulkFollowUp()}>
              Set Follow-up
            </Button>
            <Button size="sm" variant="outline" disabled={selectedIds.length === 0} onClick={() => void applyBulkStatus("rejected")}>
              Mark Rejected
            </Button>
            <Button size="sm" variant="outline" disabled={selectedIds.length === 0} onClick={() => void applyBulkStatus("screen")}>
              Update Status
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead />
                <TableHead>Date Applied</TableHead>
                <TableHead>Company</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Channel</TableHead>
                <TableHead>CV Version</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Next Action</TableHead>
                <TableHead>Notes</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {applications.map((app) => (
                <TableRow key={app.id}>
                  <TableCell>
                    <input
                      type="checkbox"
                      checked={byId.has(app.id)}
                      onChange={() => toggle(app.id)}
                    />
                  </TableCell>
                  <TableCell>{app.dateApplied}</TableCell>
                  <TableCell>{companies.find((c) => c.id === app.companyId)?.name ?? "-"}</TableCell>
                  <TableCell>{roles.find((r) => r.id === app.roleId)?.title ?? "-"}</TableCell>
                  <TableCell>{app.channel}</TableCell>
                  <TableCell>{app.cvVersion}</TableCell>
                  <TableCell>
                    <Select value={app.status} onValueChange={(v) => void updateApplication(app.id, { status: v as ApplicationStatus })}>
                      <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
                      <SelectContent>{STATUS_VALUES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>{app.nextAction || "-"}</TableCell>
                  <TableCell className="max-w-[260px] truncate">{app.notes || "-"}</TableCell>
                  <TableCell>
                    <Button size="sm" variant="ghost" className="text-red-500" onClick={() => void removeApplication(app.id)}>
                      Delete
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </JobOsLayout>
  );
}
