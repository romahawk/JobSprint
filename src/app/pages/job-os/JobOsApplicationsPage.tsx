import { Link } from "react-router";
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
    latestJobDescriptionId: undefined,
    latestCvTailoringRunId: undefined,
    tailoredCvHeadline: "",
    tailoredCvSummary: "",
    tailoredCvText: "",
    tailoredCvUpdatedAt: undefined,
  });

  const byId = useMemo(() => new Set(selectedIds), [selectedIds]);

  function toggle(id: string): void {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((value) => value !== id) : [...prev, id]));
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
          <Input type="date" value={draft.dateApplied} onChange={(event) => setDraft((current) => ({ ...current, dateApplied: event.target.value }))} />
          <Select value={draft.companyId} onValueChange={(value) => setDraft((current) => ({ ...current, companyId: value }))}>
            <SelectTrigger><SelectValue placeholder="Company" /></SelectTrigger>
            <SelectContent>{companies.map((company) => <SelectItem key={company.id} value={company.id}>{company.name}</SelectItem>)}</SelectContent>
          </Select>
          <Select value={draft.roleId} onValueChange={(value) => setDraft((current) => ({ ...current, roleId: value }))}>
            <SelectTrigger><SelectValue placeholder="Role" /></SelectTrigger>
            <SelectContent>{roles.filter((role) => !draft.companyId || role.companyId === draft.companyId).map((role) => <SelectItem key={role.id} value={role.id}>{role.title}</SelectItem>)}</SelectContent>
          </Select>
          <Input value={draft.channel} onChange={(event) => setDraft((current) => ({ ...current, channel: event.target.value }))} placeholder="Channel" />
          <Select value={draft.cvVersion} onValueChange={(value) => setDraft((current) => ({ ...current, cvVersion: value }))}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{assets.cvs.map((cv) => <SelectItem key={cv.id} value={cv.name}>{cv.name}</SelectItem>)}</SelectContent>
          </Select>
          <Select value={draft.status} onValueChange={(value) => setDraft((current) => ({ ...current, status: value as ApplicationStatus }))}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{STATUS_VALUES.map((status) => <SelectItem key={status} value={status}>{status}</SelectItem>)}</SelectContent>
          </Select>
          <Input value={draft.nextAction} onChange={(event) => setDraft((current) => ({ ...current, nextAction: event.target.value }))} placeholder="Next action" />
          <Button
            onClick={() => {
              if (!draft.companyId) return;
              void addApplication(draft);
              setDraft((current) => ({ ...current, nextAction: "", notes: "" }));
            }}
          >
            Save
          </Button>
          <div className="md:col-span-4">
            <Textarea value={draft.notes} onChange={(event) => setDraft((current) => ({ ...current, notes: event.target.value }))} rows={2} placeholder="Notes" />
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
                <TableHead>Tailored CV</TableHead>
                <TableHead>Next Action</TableHead>
                <TableHead>Notes</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {applications.map((application) => (
                <TableRow key={application.id}>
                  <TableCell>
                    <input
                      type="checkbox"
                      checked={byId.has(application.id)}
                      onChange={() => toggle(application.id)}
                    />
                  </TableCell>
                  <TableCell>{application.dateApplied}</TableCell>
                  <TableCell>{companies.find((company) => company.id === application.companyId)?.name ?? "-"}</TableCell>
                  <TableCell>{roles.find((role) => role.id === application.roleId)?.title ?? "-"}</TableCell>
                  <TableCell>{application.channel}</TableCell>
                  <TableCell>{application.cvVersion}</TableCell>
                  <TableCell>
                    <Select value={application.status} onValueChange={(value) => void updateApplication(application.id, { status: value as ApplicationStatus })}>
                      <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
                      <SelectContent>{STATUS_VALUES.map((status) => <SelectItem key={status} value={status}>{status}</SelectItem>)}</SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    {application.tailoredCvUpdatedAt ? new Date(application.tailoredCvUpdatedAt).toLocaleDateString() : "Not saved"}
                  </TableCell>
                  <TableCell>{application.nextAction || "-"}</TableCell>
                  <TableCell className="max-w-[260px] truncate">{application.notes || "-"}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button asChild size="sm" variant="outline">
                        <Link to={`/cv-optimizer?applicationId=${application.id}`}>Tailor CV</Link>
                      </Button>
                      <Button size="sm" variant="ghost" className="text-red-500" onClick={() => void removeApplication(application.id)}>
                        Delete
                      </Button>
                    </div>
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
