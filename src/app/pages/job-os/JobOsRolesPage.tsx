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
const SENIORITY_OPTIONS = ["Senior", "Middle", "Junior"] as const;
const LOCATION_SUGGESTIONS = ["Remote", "Hybrid"] as const;

function normalizeSeniority(value: string): string {
  const trimmed = value.trim().toLowerCase();
  if (trimmed === "mid") return "Middle";
  if (trimmed === "middle") return "Middle";
  if (trimmed === "senior") return "Senior";
  if (trimmed === "junior") return "Junior";
  return value;
}

export default function JobOsRolesPage() {
  const { session } = useApp();
  const { roles, companies, addRole, updateRole, addApplication, removeRole, syncNotice } = useJobOs(
    session?.userId ?? null
  );

  const [filterTrack, setFilterTrack] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [editingRoleId, setEditingRoleId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<Omit<JobOsRole, "id" | "createdAt" | "updatedAt"> | null>(null);
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

  function startEdit(role: JobOsRole): void {
    setEditingRoleId(role.id);
    setEditDraft({
      companyId: role.companyId,
      title: role.title,
      url: role.url,
      location: role.location,
      seniority: normalizeSeniority(role.seniority),
      track: role.track,
      fitScore: role.fitScore,
      status: role.status,
    });
  }

  function cancelEdit(): void {
    setEditingRoleId(null);
    setEditDraft(null);
  }

  async function saveEdit(roleId: string): Promise<void> {
    if (!editDraft) return;
    await updateRole(roleId, {
      ...editDraft,
      seniority: normalizeSeniority(editDraft.seniority),
    });
    cancelEdit();
  }

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
          <Input
            list="role-location-suggestions"
            value={draft.location}
            onChange={(e) => setDraft((p) => ({ ...p, location: e.target.value }))}
            placeholder="Location"
          />
          <datalist id="role-location-suggestions">
            {LOCATION_SUGGESTIONS.map((option) => (
              <option key={option} value={option} />
            ))}
          </datalist>
          <Select
            value={draft.seniority}
            onValueChange={(v) => setDraft((p) => ({ ...p, seniority: v }))}
          >
            <SelectTrigger><SelectValue placeholder="Seniority" /></SelectTrigger>
            <SelectContent>
              {SENIORITY_OPTIONS.map((option) => <SelectItem key={option} value={option}>{option}</SelectItem>)}
            </SelectContent>
          </Select>
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
              void addRole({
                ...draft,
                seniority: normalizeSeniority(draft.seniority),
              });
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
                  <TableCell>
                    {editingRoleId === role.id && editDraft ? (
                      <Select
                        value={editDraft.companyId}
                        onValueChange={(v) => setEditDraft((p) => (p ? { ...p, companyId: v } : p))}
                      >
                        <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {companies.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    ) : (
                      companies.find((c) => c.id === role.companyId)?.name ?? "-"
                    )}
                  </TableCell>
                  <TableCell className="font-medium">
                    {editingRoleId === role.id && editDraft ? (
                      <Input
                        value={editDraft.title}
                        onChange={(e) => setEditDraft((p) => (p ? { ...p, title: e.target.value } : p))}
                        className="w-52"
                      />
                    ) : (
                      role.title
                    )}
                  </TableCell>
                  <TableCell>
                    {editingRoleId === role.id && editDraft ? (
                      <Input
                        list={`role-location-suggestions-${role.id}`}
                        value={editDraft.location}
                        onChange={(e) => setEditDraft((p) => (p ? { ...p, location: e.target.value } : p))}
                        className="w-40"
                      />
                    ) : (
                      role.location
                    )}
                    {editingRoleId === role.id && editDraft ? (
                      <datalist id={`role-location-suggestions-${role.id}`}>
                        {LOCATION_SUGGESTIONS.map((option) => (
                          <option key={option} value={option} />
                        ))}
                      </datalist>
                    ) : null}
                  </TableCell>
                  <TableCell>
                    {editingRoleId === role.id && editDraft ? (
                      <Select
                        value={editDraft.seniority}
                        onValueChange={(v) => setEditDraft((p) => (p ? { ...p, seniority: v } : p))}
                      >
                        <SelectTrigger className="w-36"><SelectValue placeholder="Seniority" /></SelectTrigger>
                        <SelectContent>
                          {SENIORITY_OPTIONS.map((option) => <SelectItem key={option} value={option}>{option}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    ) : (
                      normalizeSeniority(role.seniority)
                    )}
                  </TableCell>
                  <TableCell>
                    {editingRoleId === role.id && editDraft ? (
                      <Select
                        value={editDraft.track}
                        onValueChange={(v) => setEditDraft((p) => (p ? { ...p, track: v as JobTrack } : p))}
                      >
                        <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="TPM">TPM</SelectItem>
                          <SelectItem value="Product Engineer">Product Engineer</SelectItem>
                          <SelectItem value="Systems PM">Systems PM</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      role.track
                    )}
                  </TableCell>
                  <TableCell>
                    {editingRoleId === role.id && editDraft ? (
                      <Select
                        value={String(editDraft.fitScore)}
                        onValueChange={(v) =>
                          setEditDraft((p) => (p ? { ...p, fitScore: Number(v) as 1 | 2 | 3 | 4 | 5 } : p))
                        }
                      >
                        <SelectTrigger className="w-24"><SelectValue /></SelectTrigger>
                        <SelectContent>{[1, 2, 3, 4, 5].map((n) => <SelectItem key={n} value={String(n)}>{n}</SelectItem>)}</SelectContent>
                      </Select>
                    ) : (
                      `${role.fitScore}/5`
                    )}
                  </TableCell>
                  <TableCell>
                    {editingRoleId === role.id && editDraft ? (
                      <Select
                        value={editDraft.status}
                        onValueChange={(v) => setEditDraft((p) => (p ? { ...p, status: v as RoleStatus } : p))}
                      >
                        <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
                        <SelectContent>{ROLE_STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                      </Select>
                    ) : (
                      <Select value={role.status} onValueChange={(v) => void updateRole(role.id, { status: v as RoleStatus })}>
                        <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
                        <SelectContent>{ROLE_STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                      </Select>
                    )}
                  </TableCell>
                  <TableCell className="flex gap-2">
                    {editingRoleId === role.id ? (
                      <>
                        <Button size="sm" variant="default" onClick={() => void saveEdit(role.id)}>Save</Button>
                        <Button size="sm" variant="outline" onClick={cancelEdit}>Cancel</Button>
                      </>
                    ) : (
                      <Button size="sm" variant="outline" onClick={() => startEdit(role)}>
                        Edit
                      </Button>
                    )}
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
                    <Button
                      size="sm"
                      variant="ghost"
                      disabled={!role.url}
                      onClick={() => window.open(role.url, "_blank", "noopener,noreferrer")}
                    >
                      Quick apply
                    </Button>
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
