import { Link } from "react-router";
import { useMemo, useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
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

type RoleOrigin = "self_sourced" | "recruiter";

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
  const { roles, companies, applications, addRole, updateRole, addApplication, removeRole, syncNotice } = useJobOs(
    session?.userId ?? null
  );

  const [filterTrack, setFilterTrack] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [addFormOpen, setAddFormOpen] = useState(false);
  const [editingRoleId, setEditingRoleId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<Omit<JobOsRole, "id" | "createdAt" | "updatedAt"> | null>(null);
  const [formNotice, setFormNotice] = useState<string | null>(null);
  const [actionNotice, setActionNotice] = useState<{ tone: "success" | "error"; message: string } | null>(null);
  const [draft, setDraft] = useState<Omit<JobOsRole, "id" | "createdAt" | "updatedAt">>({
    companyId: "",
    title: "",
    url: "",
    location: "",
    seniority: "",
    track: "TPM",
    fitScore: 3,
    status: "to_apply",
    origin: "self_sourced",
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

  const applicationRoleIds = useMemo(
    () => new Set(applications.map((application) => application.roleId).filter(Boolean)),
    [applications]
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
      origin: role.origin ?? "self_sourced",
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

  async function handleAddRole(): Promise<void> {
    const missingFields: string[] = [];
    if (!draft.companyId) missingFields.push("company");
    if (!draft.title.trim()) missingFields.push("role title");

    if (missingFields.length > 0) {
      setFormNotice(`Add a ${missingFields.join(" and ")} before creating the role.`);
      return;
    }

    try {
      setFormNotice("Saving role...");
      const createdId = await addRole({
        ...draft,
        title: draft.title.trim(),
        seniority: normalizeSeniority(draft.seniority),
        jobDescriptionUpdatedAt: draft.jobDescription?.trim() ? new Date().toISOString() : undefined,
      });

      if (!createdId) {
        setFormNotice("Role could not be created.");
        return;
      }

      setDraft({
        companyId: "",
        title: "",
        url: "",
        location: "",
        seniority: "",
        track: "TPM",
        fitScore: 3,
        status: "to_apply",
        origin: "self_sourced",
        jobDescription: "",
        jobDescriptionUpdatedAt: undefined,
      });
      setFormNotice("Role added.");
    } catch (error) {
      setFormNotice(error instanceof Error ? error.message : "Role could not be created.");
    }
  }

  async function handleAddApplication(role: JobOsRole): Promise<void> {
    if (applicationRoleIds.has(role.id)) {
      setActionNotice({
        tone: "error",
        message: `An application for ${role.title} already exists.`,
      });
      return;
    }

    try {
      await addApplication({
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
      });
      setActionNotice({
        tone: "success",
        message: `Application created for ${role.title}.`,
      });
    } catch (error) {
      setActionNotice({
        tone: "error",
        message: error instanceof Error ? error.message : "Application could not be created.",
      });
    }
  }

  return (
    <JobOsLayout title="Roles" subtitle="Track discovered opportunities and route into applications" notice={syncNotice}>
      <Card>
        <CardHeader className="pb-0">
          <button
            type="button"
            onClick={() => setAddFormOpen((value) => !value)}
            className="flex items-center gap-1.5 group"
          >
            {addFormOpen ? (
              <ChevronDown className="h-4 w-4 text-neutral-400 transition-colors group-hover:text-foreground" />
            ) : (
              <ChevronRight className="h-4 w-4 text-neutral-400 transition-colors group-hover:text-foreground" />
            )}
            <CardTitle className="text-sm select-none">Add Role</CardTitle>
          </button>
        </CardHeader>
        {addFormOpen ? (
          <CardContent className="grid gap-3 pt-4 md:grid-cols-4">
            <Select value={draft.companyId} onValueChange={(value) => setDraft((current) => ({ ...current, companyId: value }))}>
              <SelectTrigger><SelectValue placeholder="Company" /></SelectTrigger>
              <SelectContent>
                {companies.map((company) => <SelectItem key={company.id} value={company.id}>{company.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <Input value={draft.title} onChange={(event) => setDraft((current) => ({ ...current, title: event.target.value }))} placeholder="Role title" />
            <Select value={draft.origin ?? "self_sourced"} onValueChange={(value) => setDraft((current) => ({ ...current, origin: value as RoleOrigin }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="self_sourced">Self-sourced</SelectItem>
                <SelectItem value="recruiter">Recruiter contacted me</SelectItem>
              </SelectContent>
            </Select>
            <Input
              value={draft.url}
              onChange={(event) => setDraft((current) => ({ ...current, url: event.target.value }))}
              placeholder={draft.origin === "recruiter" ? "Posting URL (optional)" : "Role URL"}
            />
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
            <Button onClick={() => void handleAddRole()} disabled={!draft.companyId || !draft.title.trim()}>
              Add Role
            </Button>
            <div className="text-xs text-muted-foreground md:col-span-4">
              Company and role title are required before adding a role.
            </div>
            {formNotice ? (
              <div className="rounded-md border border-border bg-muted/20 px-3 py-2 text-sm text-muted-foreground md:col-span-4">
                {formNotice}
              </div>
            ) : null}
            <div className="md:col-span-4">
              <Textarea
                value={draft.jobDescription ?? ""}
                onChange={(event) => setDraft((current) => ({ ...current, jobDescription: event.target.value }))}
                rows={4}
                placeholder="Optional: store the job description here so CV tailoring can sync directly from the role."
              />
            </div>
          </CardContent>
        ) : null}
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
          {actionNotice ? (
            <div
              className={`mb-4 rounded-md border px-3 py-2 text-sm ${
                actionNotice.tone === "success"
                  ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-400"
                  : "border-red-200 bg-red-50 text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-400"
              }`}
            >
              {actionNotice.message}
            </div>
          ) : null}
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
                      <div className="flex flex-col gap-1">
                        <Input
                          value={editDraft.title}
                          onChange={(event) => setEditDraft((current) => (current ? { ...current, title: event.target.value } : current))}
                          className="w-52"
                        />
                        <Select
                          value={editDraft.origin ?? "self_sourced"}
                          onValueChange={(value) => setEditDraft((current) => (current ? { ...current, origin: value as RoleOrigin } : current))}
                        >
                          <SelectTrigger className="w-52"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="self_sourced">Self-sourced</SelectItem>
                            <SelectItem value="recruiter">Recruiter contacted me</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5">
                        {role.title}
                        {role.origin === "recruiter" && (
                          <span className="inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-medium bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300">
                            Recruiter
                          </span>
                        )}
                      </div>
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
                      disabled={applicationRoleIds.has(role.id)}
                      onClick={() => void handleAddApplication(role)}
                    >
                      {applicationRoleIds.has(role.id) ? "Application logged" : "Add application"}
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
