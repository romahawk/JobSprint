import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Archive, ArchiveRestore } from "lucide-react";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";
import { Textarea } from "../../components/ui/textarea";
import { useJobOsContext } from "../../context/JobOsContext";
import { JobOsTransferControls } from "../../components/job-os/JobOsTransferControls";
import { JobOsLayout } from "../../components/job-os/JobOsLayout";
import { buildArchiveUpdates, buildRestoreUpdates, isArchived } from "../../services/jobOsArchive";
import type { ApplicationStatus, JobOsOutreach, OutreachStatus } from "../../types/jobOs";

const OUTREACH_STATUSES: OutreachStatus[] = ["sent", "replied", "meeting", "no_reply", "closed"];

export default function JobOsOutreachPage() {
  const { outreach, applications, companies, roles, assets, addOutreach, updateOutreach, updateApplication, syncNotice, exportState, replaceState } = useJobOsContext();
  const [showArchived, setShowArchived] = useState(false);

  const activeCompanies = useMemo(() => companies.filter((company) => !isArchived(company)), [companies]);
  const activeCompanyIds = useMemo(() => new Set(activeCompanies.map((company) => company.id)), [activeCompanies]);
  const activeRoles = useMemo(
    () => roles.filter((role) => !isArchived(role) && activeCompanyIds.has(role.companyId)),
    [activeCompanyIds, roles]
  );
  const visibleOutreach = useMemo(
    () =>
      outreach.filter((item) =>
        showArchived
          ? isArchived(item)
          : !isArchived(item) && activeCompanyIds.has(item.companyId) && (!item.roleId || activeRoles.some((role) => role.id === item.roleId))
      ),
    [activeCompanyIds, activeRoles, outreach, showArchived]
  );
  const archivedOutreachCount = useMemo(() => outreach.filter(isArchived).length, [outreach]);

  async function handleOutreachStatusChange(item: JobOsOutreach, newStatus: OutreachStatus): Promise<void> {
    await updateOutreach(item.id, { status: newStatus });

    if ((newStatus === "replied" || newStatus === "meeting") && item.roleId) {
      const targetAppStatus: ApplicationStatus = newStatus === "meeting" ? "interview" : "screen";
      const linkedApp = applications.find(
        (a) => !isArchived(a) && a.roleId === item.roleId && a.status !== "rejected" && a.status !== "ghosted" && a.status !== "offer"
      );

      if (linkedApp) {
        const companyName = companies.find((c) => c.id === item.companyId)?.name ?? "this company";
        toast(`Advance application at ${companyName}?`, {
          description: `Outreach marked "${newStatus}" — move application to ${targetAppStatus === "interview" ? "Interview" : "Screen"}?`,
          action: {
            label: "Yes, advance",
            onClick: () => void updateApplication(linkedApp.id, { status: targetAppStatus }),
          },
          duration: 8000,
        });
      }
    }
  }
  const [draft, setDraft] = useState<Omit<JobOsOutreach, "id" | "createdAt" | "updatedAt">>({
    companyId: "",
    roleId: null,
    contactName: "",
    contactRole: "",
    linkedinURL: "",
    scriptUsed: assets.scripts[0]?.title ?? "Hiring Manager Outreach",
    sentDate: new Date().toISOString().slice(0, 10),
    status: "sent",
    followUpCount: 0,
    nextFollowUpDate: null,
    notes: "",
  });

  return (
    <JobOsLayout
      title="Outreach"
      subtitle="Networking and follow-up execution"
      notice={syncNotice}
      settingsFooter={
        <JobOsTransferControls getExportState={exportState} onImportState={replaceState} />
      }
    >
      <Card>
        <CardHeader><CardTitle className="text-sm">Log Outreach</CardTitle></CardHeader>
        <CardContent className="grid md:grid-cols-4 gap-3">
          <Select value={draft.companyId} onValueChange={(v) => setDraft((p) => ({ ...p, companyId: v }))}>
            <SelectTrigger><SelectValue placeholder="Company" /></SelectTrigger>
            <SelectContent>{activeCompanies.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
          </Select>
          <Select value={draft.roleId ?? "none"} onValueChange={(v) => setDraft((p) => ({ ...p, roleId: v === "none" ? null : v }))}>
            <SelectTrigger><SelectValue placeholder="Role (optional)" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="none">No role linked</SelectItem>
              {activeRoles.filter((r) => !draft.companyId || r.companyId === draft.companyId).map((r) => <SelectItem key={r.id} value={r.id}>{r.title}</SelectItem>)}
            </SelectContent>
          </Select>
          <Input value={draft.contactName} onChange={(e) => setDraft((p) => ({ ...p, contactName: e.target.value }))} placeholder="Contact name" />
          <Input value={draft.contactRole} onChange={(e) => setDraft((p) => ({ ...p, contactRole: e.target.value }))} placeholder="Contact role" />
          <Input value={draft.linkedinURL} onChange={(e) => setDraft((p) => ({ ...p, linkedinURL: e.target.value }))} placeholder="LinkedIn URL" />
          <Select value={draft.scriptUsed} onValueChange={(v) => setDraft((p) => ({ ...p, scriptUsed: v }))}>
            <SelectTrigger><SelectValue placeholder="Script used" /></SelectTrigger>
            <SelectContent>
              {assets.scripts.length === 0 ? (
                <SelectItem value="Hiring Manager Outreach">Hiring Manager Outreach</SelectItem>
              ) : (
                assets.scripts.map((s) => <SelectItem key={s.id} value={s.title}>{s.title}</SelectItem>)
              )}
            </SelectContent>
          </Select>
          <Input type="date" value={draft.sentDate} onChange={(e) => setDraft((p) => ({ ...p, sentDate: e.target.value }))} />
          <Select value={draft.status} onValueChange={(v) => setDraft((p) => ({ ...p, status: v as OutreachStatus }))}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{OUTREACH_STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
          </Select>
          <Input type="date" value={draft.nextFollowUpDate ?? ""} onChange={(e) => setDraft((p) => ({ ...p, nextFollowUpDate: e.target.value || null }))} />
          <Button
            onClick={() => {
              if (!draft.companyId) return;
              void addOutreach(draft).then(() => toast.success("Outreach logged"));
              setDraft((p) => ({
                ...p,
                contactName: "",
                contactRole: "",
                linkedinURL: "",
                notes: "",
                followUpCount: 0,
              }));
            }}
          >
            Save Outreach
          </Button>
          <div className="md:col-span-4">
            <Textarea value={draft.notes} onChange={(e) => setDraft((p) => ({ ...p, notes: e.target.value }))} rows={2} placeholder="Notes" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-3">
            <CardTitle className="text-sm">Outreach Log</CardTitle>
            <Button
              type="button"
              size="sm"
              variant={showArchived ? "secondary" : "outline"}
              className="gap-1.5"
              onClick={() => setShowArchived((value) => !value)}
            >
              {showArchived ? <ArchiveRestore className="h-3.5 w-3.5" /> : <Archive className="h-3.5 w-3.5" />}
              {showArchived ? "Show Active" : `Archived (${archivedOutreachCount})`}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Company</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Script</TableHead>
                <TableHead>Sent</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Follow-ups</TableHead>
                <TableHead>Next Follow-up</TableHead>
                <TableHead>Notes</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {visibleOutreach.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>{companies.find((c) => c.id === item.companyId)?.name ?? "-"}</TableCell>
                  <TableCell>{roles.find((r) => r.id === item.roleId)?.title ?? "-"}</TableCell>
                  <TableCell>{item.contactName || "-"}</TableCell>
                  <TableCell className="max-w-[220px] truncate">{item.scriptUsed}</TableCell>
                  <TableCell>{item.sentDate}</TableCell>
                  <TableCell>
                    <Select value={item.status} onValueChange={(v) => void handleOutreachStatusChange(item, v as OutreachStatus)}>
                      <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                      <SelectContent>{OUTREACH_STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>{item.followUpCount}</TableCell>
                  <TableCell>{item.nextFollowUpDate || "-"}</TableCell>
                  <TableCell className="max-w-[220px] truncate">{item.notes || "-"}</TableCell>
                  <TableCell className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => void navigator.clipboard.writeText(item.scriptUsed)}>
                      Copy script
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        void updateOutreach(item.id, {
                          followUpCount: item.followUpCount + 1,
                          nextFollowUpDate: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000)
                            .toISOString()
                            .slice(0, 10),
                        })
                      }
                    >
                      Schedule follow-up
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="gap-1.5"
                      onClick={() =>
                        void updateOutreach(
                          item.id,
                          isArchived(item)
                            ? buildRestoreUpdates()
                            : { ...buildArchiveUpdates("Archived from Outreach page"), status: "closed" }
                        ).then(() => toast.success(isArchived(item) ? "Outreach restored" : "Outreach archived"))
                      }
                    >
                      {isArchived(item) ? <ArchiveRestore className="h-3.5 w-3.5" /> : <Archive className="h-3.5 w-3.5" />}
                      {isArchived(item) ? "Restore" : "Archive"}
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
