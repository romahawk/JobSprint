import { useMemo, useState } from "react";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";
import { useApp } from "../../context";
import { useJobOs } from "../../hooks/useJobOs";
import { JobOsLayout } from "../../components/job-os/JobOsLayout";
import type { JobOsRole, JobTrack, RoleStatus } from "../../types/jobOs";

const ROLE_STATUSES: RoleStatus[] = ["to_apply", "applied", "interview", "rejected", "offer", "closed"];

export default function JobOsRolesPage() {
  const { session } = useApp();
  const { roles, companies, addRole, updateRole, addApplication, removeRole, syncNotice } = useJobOs(
    session?.userId ?? null
  );

  const [filterTrack, setFilterTrack] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [draft, setDraft] = useState<Omit<JobOsRole, "id" | "createdAt" | "updatedAt">>({
    companyId: "",
    title: "",
    url: "",
    location: "",
    seniority: "",
    track: "TPM",
    fitScore: 3,
    status: "to_apply",
  });

  const filtered = useMemo(
    () =>
      roles.filter((r) => {
        if (filterTrack !== "all" && r.track !== filterTrack) return false;
        if (filterStatus !== "all" && r.status !== filterStatus) return false;
        return true;
      }),
    [roles, filterStatus, filterTrack]
  );

  return (
    <JobOsLayout title="Roles" subtitle="Track discovered opportunities and route into applications" notice={syncNotice}>
      <Card>
        <CardHeader><CardTitle className="text-sm">Add Role</CardTitle></CardHeader>
        <CardContent className="grid md:grid-cols-4 gap-3">
          <Select value={draft.companyId} onValueChange={(v) => setDraft((p) => ({ ...p, companyId: v }))}>
            <SelectTrigger><SelectValue placeholder="Company" /></SelectTrigger>
            <SelectContent>
              {companies.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <Input value={draft.title} onChange={(e) => setDraft((p) => ({ ...p, title: e.target.value }))} placeholder="Role title" />
          <Input value={draft.url} onChange={(e) => setDraft((p) => ({ ...p, url: e.target.value }))} placeholder="Role URL" />
          <Input value={draft.location} onChange={(e) => setDraft((p) => ({ ...p, location: e.target.value }))} placeholder="Location" />
          <Input value={draft.seniority} onChange={(e) => setDraft((p) => ({ ...p, seniority: e.target.value }))} placeholder="Seniority" />
          <Select value={draft.track} onValueChange={(v) => setDraft((p) => ({ ...p, track: v as JobTrack }))}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="TPM">TPM</SelectItem>
              <SelectItem value="Product Engineer">Product Engineer</SelectItem>
              <SelectItem value="Systems PM">Systems PM</SelectItem>
            </SelectContent>
          </Select>
          <Select value={String(draft.fitScore)} onValueChange={(v) => setDraft((p) => ({ ...p, fitScore: Number(v) as 1 | 2 | 3 | 4 | 5 }))}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{[1, 2, 3, 4, 5].map((n) => <SelectItem key={n} value={String(n)}>{n}</SelectItem>)}</SelectContent>
          </Select>
          <Button
            onClick={() => {
              if (!draft.companyId || !draft.title) return;
              void addRole(draft);
              setDraft({
                companyId: "",
                title: "",
                url: "",
                location: "",
                seniority: "",
                track: "TPM",
                fitScore: 3,
                status: "to_apply",
              });
            }}
          >
            Add Role
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Roles Pipeline</CardTitle>
          <div className="flex gap-2">
            <Select value={filterTrack} onValueChange={setFilterTrack}>
              <SelectTrigger className="w-52"><SelectValue placeholder="Track" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Tracks</SelectItem>
                <SelectItem value="TPM">TPM</SelectItem>
                <SelectItem value="Product Engineer">Product Engineer</SelectItem>
                <SelectItem value="Systems PM">Systems PM</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-52"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                {ROLE_STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Company</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Seniority</TableHead>
                <TableHead>Track</TableHead>
                <TableHead>Fit</TableHead>
                <TableHead>Status</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((role) => (
                <TableRow key={role.id}>
                  <TableCell>{companies.find((c) => c.id === role.companyId)?.name ?? "-"}</TableCell>
                  <TableCell className="font-medium">{role.title}</TableCell>
                  <TableCell>{role.location}</TableCell>
                  <TableCell>{role.seniority}</TableCell>
                  <TableCell>{role.track}</TableCell>
                  <TableCell>{role.fitScore}/5</TableCell>
                  <TableCell>
                    <Select value={role.status} onValueChange={(v) => void updateRole(role.id, { status: v as RoleStatus })}>
                      <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
                      <SelectContent>{ROLE_STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        void addApplication({
                          companyId: role.companyId,
                          roleId: role.id,
                          dateApplied: new Date().toISOString().slice(0, 10),
                          channel: "Company Site",
                          cvVersion: role.track === "TPM" ? "CV - Technical Product Manager" : role.track === "Product Engineer" ? "CV - Product Engineer" : "CV - Systems / Platform PM",
                          status: "sent",
                          nextAction: "Send follow-up in 5 days",
                          notes: "",
                        })
                      }
                    >
                      Add application
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => window.open(role.url, "_blank", "noopener,noreferrer")}>Quick apply</Button>
                    <Button size="sm" variant="ghost" className="text-red-500" onClick={() => void removeRole(role.id)}>Delete</Button>
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
