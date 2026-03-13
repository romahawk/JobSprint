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
    jobDescription: "",
    jobDescriptionUpdatedAt: undefined,
  });

  const filtered = useMemo(
    () =>
      roles.filter((role) => {
        if (filterTrack !== "all" && role.track !== filterTrack) return false;
        if (filterStatus !== "all" && role.status !== filterStatus) return false;
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
      jobDescription: role.jobDescription ?? "",
      jobDescriptionUpdatedAt: role.jobDescriptionUpdatedAt,
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
      jobDescriptionUpdatedAt: editDraft.jobDescription?.trim() ? new Date().toISOString() : undefined,
    });
    cancelEdit();
  }

  return (
    <JobOsLayout title="Roles" subtitle="Track discovered opportunities and route into applications" notice={syncNotice}>
      <Card>
        <CardHeader><CardTitle className="text-sm">Add Role</CardTitle></CardHeader>
        <CardContent className="grid md:grid-cols-4 gap-3">
          <Select value={draft.companyId} onValueChange={(value) => setDraft((current) => ({ ...current, companyId: value }))}>
            <SelectTrigger><SelectValue placeholder="Company" /></SelectTrigger>
            <SelectContent>
              {companies.map((company) => <SelectItem key={company.id} value={company.id}>{company.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <Input value={draft.title} onChange={(event) => setDraft((current) => ({ ...current, title: event.target.value }))} placeholder="Role title" />
          <Input value={draft.url} onChange={(event) => setDraft((current) => ({ ...current, url: event.target.value }))} placeholder="Role URL" />
          <Input
            list="role-location-suggestions"
            value={draft.location}
            onChange={(event) => setDraft((current) => ({ ...current, location: event.target.value }))}
            placeholder="Location"
          />
          <datalist id="role-location-suggestions">
            {LOCATION_SUGGESTIONS.map((option) => (
              <option key={option} value={option} />
            ))}
          </datalist>
          <Select
            value={draft.seniority}
            onValueChange={(value) => setDraft((current) => ({ ...current, seniority: value }))}
          >
            <SelectTrigger><SelectValue placeholder="Seniority" /></SelectTrigger>
            <SelectContent>
              {SENIORITY_OPTIONS.map((option) => <SelectItem key={option} value={option}>{option}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={draft.track} onValueChange={(value) => setDraft((current) => ({ ...current, track: value as JobTrack }))}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="TPM">TPM</SelectItem>
              <SelectItem value="Product Engineer">Product Engineer</SelectItem>
              <SelectItem value="Systems PM">Systems PM</SelectItem>
            </SelectContent>
          </Select>
          <Select value={String(draft.fitScore)} onValueChange={(value) => setDraft((current) => ({ ...current, fitScore: Number(value) as 1 | 2 | 3 | 4 | 5 }))}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{[1, 2, 3, 4, 5].map((value) => <SelectItem key={value} value={String(value)}>{value}</SelectItem>)}</SelectContent>
          </Select>
          <Button
            onClick={() => {
              if (!draft.companyId || !draft.title) return;
              void addRole({
                ...draft,
                seniority: normalizeSeniority(draft.seniority),
                jobDescriptionUpdatedAt: draft.jobDescription?.trim() ? new Date().toISOString() : undefined,
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
                jobDescription: "",
                jobDescriptionUpdatedAt: undefined,
              });
            }}
          >
            Add Role
          </Button>
          <div className="md:col-span-4">
            <Textarea
              value={draft.jobDescription ?? ""}
              onChange={(event) => setDraft((current) => ({ ...current, jobDescription: event.target.value }))}
              rows={4}
              placeholder="Optional: store the job description here so CV tailoring can sync directly from the role."
            />
          </div>
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
                {ROLE_STATUSES.map((status) => <SelectItem key={status} value={status}>{status}</SelectItem>)}
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
                <TableHead>JD</TableHead>
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
                        onValueChange={(value) => setEditDraft((current) => (current ? { ...current, companyId: value } : current))}
                      >
                        <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {companies.map((company) => <SelectItem key={company.id} value={company.id}>{company.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    ) : (
                      companies.find((company) => company.id === role.companyId)?.name ?? "-"
                    )}
                  </TableCell>
                  <TableCell className="font-medium">
                    {editingRoleId === role.id && editDraft ? (
                      <Input
                        value={editDraft.title}
                        onChange={(event) => setEditDraft((current) => (current ? { ...current, title: event.target.value } : current))}
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
                        onChange={(event) => setEditDraft((current) => (current ? { ...current, location: event.target.value } : current))}
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
                        onValueChange={(value) => setEditDraft((current) => (current ? { ...current, seniority: value } : current))}
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
                        onValueChange={(value) => setEditDraft((current) => (current ? { ...current, track: value as JobTrack } : current))}
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
                        onValueChange={(value) =>
                          setEditDraft((current) => (current ? { ...current, fitScore: Number(value) as 1 | 2 | 3 | 4 | 5 } : current))
                        }
                      >
                        <SelectTrigger className="w-24"><SelectValue /></SelectTrigger>
                        <SelectContent>{[1, 2, 3, 4, 5].map((value) => <SelectItem key={value} value={String(value)}>{value}</SelectItem>)}</SelectContent>
                      </Select>
                    ) : (
                      `${role.fitScore}/5`
                    )}
                  </TableCell>
                  <TableCell>
                    {editingRoleId === role.id && editDraft ? (
                      <Select
                        value={editDraft.status}
                        onValueChange={(value) => setEditDraft((current) => (current ? { ...current, status: value as RoleStatus } : current))}
                      >
                        <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
                        <SelectContent>{ROLE_STATUSES.map((status) => <SelectItem key={status} value={status}>{status}</SelectItem>)}</SelectContent>
                      </Select>
                    ) : (
                      <Select value={role.status} onValueChange={(value) => void updateRole(role.id, { status: value as RoleStatus })}>
                        <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
                        <SelectContent>{ROLE_STATUSES.map((status) => <SelectItem key={status} value={status}>{status}</SelectItem>)}</SelectContent>
                      </Select>
                    )}
                  </TableCell>
                  <TableCell className="max-w-[260px] align-top">
                    {editingRoleId === role.id && editDraft ? (
                      <Textarea
                        value={editDraft.jobDescription ?? ""}
                        onChange={(event) => setEditDraft((current) => (current ? { ...current, jobDescription: event.target.value } : current))}
                        rows={5}
                        className="min-w-[240px]"
                      />
                    ) : role.jobDescription ? (
                      <div className="line-clamp-4 text-sm text-muted-foreground">{role.jobDescription}</div>
                    ) : (
                      <span className="text-sm text-muted-foreground">No stored JD</span>
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
                          latestJobDescriptionId: undefined,
                          latestCvTailoringRunId: undefined,
                          tailoredCvHeadline: "",
                          tailoredCvSummary: "",
                          tailoredCvText: "",
                          tailoredCvUpdatedAt: undefined,
                        })
                      }
                    >
                      Add application
                    </Button>
                    <Button asChild size="sm" variant="secondary">
                      <Link to={`/cv-optimizer?roleId=${role.id}`}>Tailor CV</Link>
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
