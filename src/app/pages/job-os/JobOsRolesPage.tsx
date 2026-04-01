import { Link } from "react-router";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  BriefcaseBusiness,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Pencil,
  Rocket,
  Trash2,
  WandSparkles,
  X,
} from "lucide-react";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../../components/ui/dialog";
import { Input } from "../../components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";
import { Textarea } from "../../components/ui/textarea";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../../components/ui/tooltip";
import { useJobOsContext } from "../../context/JobOsContext";
import { usePagination } from "../../hooks/usePagination";
import { PaginationControls } from "../../components/ui/PaginationControls";
import { JobOsLayout } from "../../components/job-os/JobOsLayout";
import { JobOsTransferControls } from "../../components/job-os/JobOsTransferControls";
import { getRecommendedCvForTrack } from "../../services/cvAssets";
import type { JobOsRole, JobTrack, RoleStatus } from "../../types/jobOs";

type RoleOrigin = "self_sourced" | "recruiter";
type RoleSortKey =
  | "company"
  | "title"
  | "location"
  | "seniority"
  | "track"
  | "fitScore"
  | "status";

const ROLE_STATUSES: RoleStatus[] = ["to_apply", "applied", "interview", "rejected", "offer", "closed"];
const SENIORITY_OPTIONS = ["Senior", "Middle", "Junior"] as const;
const LOCATION_SUGGESTIONS = ["Remote", "Hybrid"] as const;
const FIT_FILTER_VALUES = ["all", "2", "3", "4", "5"] as const;

interface RoleTableFilters {
  company: string;
  title: string;
  location: string;
  seniority: string;
  track: string;
  fitMin: string;
  status: string;
}

function normalizeSeniority(value: string): string {
  const trimmed = value.trim().toLowerCase();
  if (trimmed === "mid") return "Middle";
  if (trimmed === "middle") return "Middle";
  if (trimmed === "senior") return "Senior";
  if (trimmed === "junior") return "Junior";
  return value;
}

export default function JobOsRolesPage() {
  const {
    roles,
    companies,
    applications,
    assets,
    cvProfiles,
    addRole,
    updateRole,
    addApplication,
    removeRole,
    syncNotice,
    exportState,
    replaceState,
  } = useJobOsContext();

  const [addFormOpen, setAddFormOpen] = useState(false);
  const [editingRoleId, setEditingRoleId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<Omit<JobOsRole, "id" | "createdAt" | "updatedAt"> | null>(null);
  const [formNotice, setFormNotice] = useState<string | null>(null);
  const [actionNotice, setActionNotice] = useState<{ tone: "success" | "error"; message: string } | null>(null);
  const [sortKey, setSortKey] = useState<RoleSortKey>("title");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [tableFilters, setTableFilters] = useState<RoleTableFilters>({
    company: "",
    title: "",
    location: "",
    seniority: "all",
    track: "all",
    fitMin: "all",
    status: "all",
  });
  const [selectedJdRoleId, setSelectedJdRoleId] = useState<string | null>(null);
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

  const companiesById = useMemo(
    () => new Map(companies.map((company) => [company.id, company])),
    [companies]
  );

  const filtered = useMemo(() => {
    const companyQuery = tableFilters.company.trim().toLowerCase();
    const titleQuery = tableFilters.title.trim().toLowerCase();
    const locationQuery = tableFilters.location.trim().toLowerCase();

    return roles.filter((role) => {
      const companyName = companiesById.get(role.companyId)?.name ?? "";

      if (companyQuery && !companyName.toLowerCase().includes(companyQuery)) return false;
      if (titleQuery && !role.title.toLowerCase().includes(titleQuery)) return false;
      if (locationQuery && !role.location.toLowerCase().includes(locationQuery)) return false;
      if (
        tableFilters.seniority !== "all" &&
        normalizeSeniority(role.seniority) !== tableFilters.seniority
      ) {
        return false;
      }
      if (tableFilters.track !== "all" && role.track !== tableFilters.track) return false;
      if (tableFilters.status !== "all" && role.status !== tableFilters.status) return false;
      if (tableFilters.fitMin !== "all" && role.fitScore < Number(tableFilters.fitMin)) {
        return false;
      }

      return true;
    });
  }, [companiesById, roles, tableFilters]);

  const sortedRoles = useMemo(() => {
    const statusRank: Record<RoleStatus, number> = {
      to_apply: 0,
      applied: 1,
      interview: 2,
      offer: 3,
      rejected: 4,
      closed: 5,
    };
    const seniorityRank: Record<string, number> = {
      Junior: 0,
      Middle: 1,
      Senior: 2,
    };

    return [...filtered].sort((a, b) => {
      const companyA = companiesById.get(a.companyId)?.name ?? "";
      const companyB = companiesById.get(b.companyId)?.name ?? "";

      let cmp = 0;
      switch (sortKey) {
        case "company":
          cmp = companyA.localeCompare(companyB, undefined, { sensitivity: "base" });
          break;
        case "fitScore":
          cmp = a.fitScore - b.fitScore;
          break;
        case "status":
          cmp = statusRank[a.status] - statusRank[b.status];
          break;
        case "seniority":
          cmp =
            (seniorityRank[normalizeSeniority(a.seniority)] ?? 999) -
            (seniorityRank[normalizeSeniority(b.seniority)] ?? 999);
          break;
        case "location":
        case "title":
        case "track":
        default:
          cmp = String(a[sortKey] ?? "").localeCompare(String(b[sortKey] ?? ""), undefined, {
            sensitivity: "base",
          });
      }

      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [companiesById, filtered, sortDir, sortKey]);

  const ROLES_PAGE_SIZE = 10;
  const {
    page: rolesPage,
    totalPages: rolesTotalPages,
    pageItems: pagedRoles,
    setPage: setRolesPage,
    resetPage: resetRolesPage,
  } = usePagination(sortedRoles, ROLES_PAGE_SIZE);

  useEffect(() => {
    resetRolesPage();
  }, [resetRolesPage, sortDir, sortKey, tableFilters]);

  const applicationRoleIds = useMemo(
    () => new Set(applications.map((application) => application.roleId).filter(Boolean)),
    [applications]
  );
  const selectedJdRole =
    selectedJdRoleId ? roles.find((role) => role.id === selectedJdRoleId) ?? null : null;
  const selectedJdDraft =
    selectedJdRole && editingRoleId === selectedJdRole.id && editDraft ? editDraft : null;

  function toggleSort(nextKey: RoleSortKey): void {
    if (sortKey === nextKey) {
      setSortDir((prev) => (prev === "asc" ? "desc" : "asc"));
      return;
    }
    setSortKey(nextKey);
    setSortDir("asc");
  }

  function renderSortHeader(label: string, column: RoleSortKey): React.ReactNode {
    const active = sortKey === column;
    return (
      <button
        type="button"
        onClick={() => toggleSort(column)}
        className="inline-flex items-center gap-1 font-medium text-foreground hover:text-primary transition-colors"
      >
        {label}
        {!active && <ArrowUpDown className="w-3.5 h-3.5 opacity-60" />}
        {active && sortDir === "asc" && <ArrowUp className="w-3.5 h-3.5 text-primary" />}
        {active && sortDir === "desc" && <ArrowDown className="w-3.5 h-3.5 text-primary" />}
      </button>
    );
  }

  function updateTableFilter<K extends keyof RoleTableFilters>(
    key: K,
    value: RoleTableFilters[K]
  ): void {
    setTableFilters((current) => ({ ...current, [key]: value }));
  }

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
      const recommendedCv = getRecommendedCvForTrack(assets.cvs, cvProfiles, role.track);
      await addApplication({
        companyId: role.companyId,
        roleId: role.id,
        dateApplied: new Date().toISOString().slice(0, 10),
        channel: "Company Site",
        cvAssetId: recommendedCv?.id,
        cvVersion: recommendedCv?.name ?? "",
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
    <JobOsLayout
      title="Roles"
      subtitle="Track discovered opportunities and route into applications"
      notice={syncNotice}
      settingsFooter={<JobOsTransferControls getExportState={exportState} onImportState={replaceState} />}
    >
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
          <TooltipProvider delayDuration={150}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{renderSortHeader("Company", "company")}</TableHead>
                <TableHead>{renderSortHeader("Title", "title")}</TableHead>
                <TableHead>{renderSortHeader("Location", "location")}</TableHead>
                <TableHead>{renderSortHeader("Seniority", "seniority")}</TableHead>
                <TableHead>{renderSortHeader("Track", "track")}</TableHead>
                <TableHead>{renderSortHeader("Fit", "fitScore")}</TableHead>
                <TableHead>{renderSortHeader("Status", "status")}</TableHead>
                <TableHead>JD</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
              <TableRow className="bg-muted/20 hover:bg-muted/20">
                <TableHead>
                  <Input
                    value={tableFilters.company}
                    onChange={(event) => updateTableFilter("company", event.target.value)}
                    placeholder="Filter company"
                    className="h-8 min-w-[140px]"
                  />
                </TableHead>
                <TableHead>
                  <Input
                    value={tableFilters.title}
                    onChange={(event) => updateTableFilter("title", event.target.value)}
                    placeholder="Filter title"
                    className="h-8 min-w-[160px]"
                  />
                </TableHead>
                <TableHead>
                  <Input
                    value={tableFilters.location}
                    onChange={(event) => updateTableFilter("location", event.target.value)}
                    placeholder="Filter location"
                    className="h-8 min-w-[130px]"
                  />
                </TableHead>
                <TableHead>
                  <Select
                    value={tableFilters.seniority}
                    onValueChange={(value) => updateTableFilter("seniority", value)}
                  >
                    <SelectTrigger className="h-8 min-w-[120px]">
                      <SelectValue placeholder="All" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      {SENIORITY_OPTIONS.map((option) => (
                        <SelectItem key={option} value={option}>
                          {option}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </TableHead>
                <TableHead>
                  <Select
                    value={tableFilters.track}
                    onValueChange={(value) => updateTableFilter("track", value)}
                  >
                    <SelectTrigger className="h-8 min-w-[140px]">
                      <SelectValue placeholder="All tracks" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All tracks</SelectItem>
                      <SelectItem value="TPM">TPM</SelectItem>
                      <SelectItem value="Product Engineer">Product Engineer</SelectItem>
                      <SelectItem value="Systems PM">Systems PM</SelectItem>
                    </SelectContent>
                  </Select>
                </TableHead>
                <TableHead>
                  <Select
                    value={tableFilters.fitMin}
                    onValueChange={(value) => updateTableFilter("fitMin", value)}
                  >
                    <SelectTrigger className="h-8 min-w-[96px]">
                      <SelectValue placeholder="All" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      {FIT_FILTER_VALUES.filter((value) => value !== "all").map((value) => (
                        <SelectItem key={value} value={value}>
                          {value}+
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </TableHead>
                <TableHead>
                  <Select
                    value={tableFilters.status}
                    onValueChange={(value) => updateTableFilter("status", value)}
                  >
                    <SelectTrigger className="h-8 min-w-[130px]">
                      <SelectValue placeholder="All statuses" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All statuses</SelectItem>
                      {ROLE_STATUSES.map((status) => (
                        <SelectItem key={status} value={status}>
                          {status}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </TableHead>
                <TableHead />
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {pagedRoles.map((role) => (
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
                      companiesById.get(role.companyId)?.name ?? "-"
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
                  <TableCell className="whitespace-nowrap">
                    {role.jobDescription || (editingRoleId === role.id && editDraft?.jobDescription) ? (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setSelectedJdRoleId(role.id)}
                      >
                        {editingRoleId === role.id ? "Edit JD" : "View JD"}
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setSelectedJdRoleId(role.id)}
                      >
                        Add JD
                      </Button>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                    {editingRoleId === role.id ? (
                      <>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="inline-flex">
                              <Button
                                size="icon"
                                variant="default"
                                onClick={() => void saveEdit(role.id)}
                                aria-label="Save role"
                              >
                                <Check className="h-4 w-4" />
                              </Button>
                            </span>
                          </TooltipTrigger>
                          <TooltipContent side="top">Save</TooltipContent>
                        </Tooltip>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="inline-flex">
                              <Button
                                size="icon"
                                variant="outline"
                                onClick={cancelEdit}
                                aria-label="Cancel editing"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </span>
                          </TooltipTrigger>
                          <TooltipContent side="top">Cancel</TooltipContent>
                        </Tooltip>
                      </>
                    ) : (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="inline-flex">
                            <Button
                              size="icon"
                              variant="outline"
                              onClick={() => startEdit(role)}
                              aria-label="Edit role"
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                          </span>
                        </TooltipTrigger>
                        <TooltipContent side="top">Edit</TooltipContent>
                      </Tooltip>
                    )}
                    {applicationRoleIds.has(role.id) ? (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="inline-flex">
                            <Button
                              size="icon"
                              variant="ghost"
                              className="text-emerald-600 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
                              aria-label="Application already logged"
                            >
                              <CheckCircle2 className="h-4 w-4" />
                            </Button>
                          </span>
                        </TooltipTrigger>
                        <TooltipContent side="top">Application logged</TooltipContent>
                      </Tooltip>
                    ) : (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="inline-flex">
                            <Button
                              size="icon"
                              variant="outline"
                              onClick={() => void handleAddApplication(role)}
                              aria-label="Add application"
                            >
                              <BriefcaseBusiness className="h-4 w-4" />
                            </Button>
                          </span>
                        </TooltipTrigger>
                        <TooltipContent side="top">Add application</TooltipContent>
                      </Tooltip>
                    )}
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="inline-flex">
                          <Button asChild size="icon" variant="secondary" aria-label="Tailor CV">
                            <Link to={`/cv-optimizer?roleId=${role.id}`}>
                              <WandSparkles className="h-4 w-4" />
                            </Link>
                          </Button>
                        </span>
                      </TooltipTrigger>
                      <TooltipContent side="top">Tailor CV</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="inline-flex">
                          <Button
                            size="icon"
                            variant="ghost"
                            disabled={!role.url}
                            onClick={() => window.open(role.url, "_blank", "noopener,noreferrer")}
                            aria-label="Quick apply"
                          >
                            <Rocket className="h-4 w-4" />
                          </Button>
                        </span>
                      </TooltipTrigger>
                      <TooltipContent side="top">Quick apply</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="inline-flex">
                          <Button
                            size="icon"
                            variant="ghost"
                            className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20"
                            onClick={() => void removeRole(role.id)}
                            aria-label="Delete role"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </span>
                      </TooltipTrigger>
                      <TooltipContent side="top">Delete</TooltipContent>
                    </Tooltip>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          </TooltipProvider>
          <PaginationControls
            page={rolesPage}
            totalPages={rolesTotalPages}
            totalItems={sortedRoles.length}
            pageSize={ROLES_PAGE_SIZE}
            onPageChange={setRolesPage}
          />
        </CardContent>
      </Card>

      <Dialog
        open={!!selectedJdRole}
        onOpenChange={(open) => {
          if (!open) setSelectedJdRoleId(null);
        }}
      >
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>{selectedJdRole?.title ?? "Job Description"}</DialogTitle>
          </DialogHeader>
          {selectedJdRole ? (
            <div className="space-y-4">
              <div className="grid gap-2 text-sm text-muted-foreground md:grid-cols-2">
                <div>
                  <span className="font-medium text-foreground">Company:</span>{" "}
                  {companiesById.get(selectedJdRole.companyId)?.name ?? "-"}
                </div>
                <div>
                  <span className="font-medium text-foreground">Location:</span>{" "}
                  {(selectedJdDraft?.location ?? selectedJdRole.location) || "-"}
                </div>
                <div>
                  <span className="font-medium text-foreground">Seniority:</span>{" "}
                  {normalizeSeniority(selectedJdDraft?.seniority ?? selectedJdRole.seniority) || "-"}
                </div>
                <div>
                  <span className="font-medium text-foreground">Track:</span>{" "}
                  {selectedJdDraft?.track ?? selectedJdRole.track}
                </div>
                <div>
                  <span className="font-medium text-foreground">Fit:</span>{" "}
                  {selectedJdDraft?.fitScore ?? selectedJdRole.fitScore}/5
                </div>
              </div>
              {selectedJdDraft ? (
                <Textarea
                  value={selectedJdDraft.jobDescription ?? ""}
                  onChange={(event) =>
                    setEditDraft((current) =>
                      current ? { ...current, jobDescription: event.target.value } : current
                    )
                  }
                  rows={18}
                  className="min-h-[26rem]"
                  placeholder="Paste or refine the full job description here."
                />
              ) : (
                <div className="max-h-[60vh] overflow-y-auto rounded-md border bg-muted/10 p-4 text-sm leading-6 whitespace-pre-wrap">
                  {selectedJdRole.jobDescription || "No job description stored."}
                </div>
              )}
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </JobOsLayout>
  );
}
