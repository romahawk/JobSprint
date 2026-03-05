import { useState } from "react";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";
import { Textarea } from "../../components/ui/textarea";
import { useApp } from "../../context";
import { useJobOs } from "../../hooks/useJobOs";
import { JobOsLayout } from "../../components/job-os/JobOsLayout";
import type { JobOsOutreach, OutreachStatus } from "../../types/jobOs";

const OUTREACH_STATUSES: OutreachStatus[] = ["sent", "replied", "meeting", "no_reply", "closed"];

export default function JobOsOutreachPage() {
  const { session } = useApp();
  const { outreach, companies, roles, assets, addOutreach, updateOutreach, removeOutreach, syncNotice } = useJobOs(
    session?.userId ?? null
  );
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
    <JobOsLayout title="Outreach" subtitle="Networking and follow-up execution" notice={syncNotice}>
      <Card>
        <CardHeader><CardTitle className="text-sm">Log Outreach</CardTitle></CardHeader>
        <CardContent className="grid md:grid-cols-4 gap-3">
          <Select value={draft.companyId} onValueChange={(v) => setDraft((p) => ({ ...p, companyId: v }))}>
            <SelectTrigger><SelectValue placeholder="Company" /></SelectTrigger>
            <SelectContent>{companies.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
          </Select>
          <Select value={draft.roleId ?? "none"} onValueChange={(v) => setDraft((p) => ({ ...p, roleId: v === "none" ? null : v }))}>
            <SelectTrigger><SelectValue placeholder="Role (optional)" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="none">No role linked</SelectItem>
              {roles.filter((r) => !draft.companyId || r.companyId === draft.companyId).map((r) => <SelectItem key={r.id} value={r.id}>{r.title}</SelectItem>)}
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
              void addOutreach(draft);
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
        <CardHeader><CardTitle className="text-sm">Outreach Log</CardTitle></CardHeader>
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
              {outreach.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>{companies.find((c) => c.id === item.companyId)?.name ?? "-"}</TableCell>
                  <TableCell>{roles.find((r) => r.id === item.roleId)?.title ?? "-"}</TableCell>
                  <TableCell>{item.contactName || "-"}</TableCell>
                  <TableCell className="max-w-[220px] truncate">{item.scriptUsed}</TableCell>
                  <TableCell>{item.sentDate}</TableCell>
                  <TableCell>
                    <Select value={item.status} onValueChange={(v) => void updateOutreach(item.id, { status: v as OutreachStatus })}>
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
                    <Button size="sm" variant="ghost" className="text-red-500" onClick={() => void removeOutreach(item.id)}>
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
