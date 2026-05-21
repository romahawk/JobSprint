import { Link } from "react-router";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Archive,
  ArchiveRestore,
  BriefcaseBusiness,
  Check,
  CheckCircle2,
  Pencil,
  Rocket,
  Search,
  SlidersHorizontal,
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
import { appPath } from "../../routing";
import { getRecommendedCvForTrack } from "../../services/cvAssets";
import { buildArchiveUpdates, buildRestoreUpdates, isArchived } from "../../services/jobOsArchive";
import type { JobOsRole, JobTrack, RoleStatus } from "../../types/jobOs";

type RoleOrigin = "self_sourced" | "recruiter";
type RoleSortKey =
  | "company"
  | "title"
  | "location"
  | "seniority"
  | "track"
  | "fitScore"
  | "status"
  | "createdAt";

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
    updateRole,
    addApplication,
    syncNotice,
    exportState,
    replaceState,
  } = useJobOsContext();

  const [editingRoleId, setEditingRoleId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<Omit<JobOsRole, "id" | "updatedAt"> | null>(null);
  const [actionNotice, setActionNotice] = useState<{ tone: "success" | "error"; message: string } | null>(null);
  const [sortKey, setSortKey] = useState<RoleSortKey>("createdAt");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [tableFilters, setTableFilters] = useState<RoleTableFilters>({
    company: "",
    title: "",
    location: "",
    seniority: "all",
    track: "all",
    fitMin: "all",
    status: "all",
  });
  const [unifiedSearch, setUnifiedSearch] = useState("");
  const [showMoreFilters, setShowMoreFilters] = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  const [selectedJdRoleId, setSelectedJdRoleId] = useState<string | null>(null);

  const companiesById = useMemo(
    () => new Map(companies.map((company) => [company.id, company])),
    [companies]
  );
  const activeCompanyIds = useMemo(
    () => new Set(companies.filter((company) => !isArchived(company)).map((company) => company.id)),
    [companies]
  );
  const archivedRolesCount = useMemo(
    () => roles.filter(isArchived).length,
    [roles]
  );

  const filtered = useMemo(() => {
    const searchQuery = unifiedSearch.trim().toLowerCase();
    const locationQuery = tableFilters.location.trim().toLowerCase();

    return roles.filter((role) => {
      const companyName = companiesById.get(role.companyId)?.name ?? "";
      if (showArchived) {
        if (!isArchived(role)) return false;
      } else if (isArchived(role) || !activeCompanyIds.has(role.companyId)) {
        return false;
      }

      if (searchQuery) {
        const haystack = `${companyName} ${role.title}`.toLowerCase();
        if (!haystack.includes(searchQuery)) return false;
      }
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
  }, [activeCompanyIds, companiesById, roles, showArchived, tableFilters, unifiedSearch]);

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
        case "createdAt": {
          const ta = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const tb = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          cmp = (Number.isFinite(ta) ? ta : 0) - (Number.isFinite(tb) ? tb : 0);
          break;
        }
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
  }, [resetRolesPage, sortDir, sortKey, tableFilters, unifiedSearch]);

  const applicationRoleIds = useMemo(
    () => new Set(applications.filter((application) => !isArchived(application)).map((application) => application.roleId).filter(Boolean)),
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
      createdAt: role.createdAt,
    });
  }

  function openJdEditor(role: JobOsRole): void {
    if (editingRoleId !== role.id) {
      startEdit(role);
    }
    setSelectedJdRoleId(role.id);
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
    toast.success("Role updated");
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

  async function archiveRole(role: JobOsRole): Promise<void> {
    await updateRole(role.id, {
      ...buildArchiveUpdates("Archived from Roles page"),
      status: "closed",
    });
    toast.success("Role archived");
  }

  async function restoreRole(role: JobOsRole): Promise<void> {
    await updateRole(role.id, buildRestoreUpdates());
    toast.success("Role restored");
  }

  return (
    <JobOsLayout
      title="Roles"
      subtitle="Track discovered opportunities and route into applications"
      notice={syncNotice}
      settingsFooter={<JobOsTransferControls getExportState={exportState} onImportState={replaceState} />}
    >
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-[200px] flex-1">
          <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            className="h-9 pl-8 text-sm"
            placeholder="Search company or title…"
            value={unifiedSearch}
            onChange={(e) => setUnifiedSearch(e.target.value)}
          />
        </div>
        <Select value={tableFilters.status} onValueChange={(value) => updateTableFilter("status", value)}>
          <SelectTrigger className="h-9 w-[150px] text-sm">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {ROLE_STATUSES.map((status) => (
              <SelectItem key={status} value={status}>{status}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowMoreFilters((v) => !v)}
          className={`gap-1.5 text-xs ${showMoreFilters ? "text-foreground" : "text-muted-foreground"}`}
        >
          <SlidersHorizontal className="h-3.5 w-3.5" />
          {showMoreFilters ? "Fewer filters" : "More filters"}
        </Button>
        <Button
          variant={showArchived ? "secondary" : "outline"}
          size="sm"
          onClick={() => setShowArchived((value) => !value)}
          className="gap-1.5 text-xs"
        >
          {showArchived ? <ArchiveRestore className="h-3.5 w-3.5" /> : <Archive className="h-3.5 w-3.5" />}
          {showArchived ? "Show Active" : `Archived (${archivedRolesCount})`}
        </Button>
        {(unifiedSearch || tableFilters.status !== "all" || tableFilters.location || tableFilters.seniority !== "all" || tableFilters.track !== "all" || tableFilters.fitMin !== "all") && (
          <Button
            variant="ghost"
            size="sm"
            className="text-xs text-muted-foreground"
            onClick={() => {
              setUnifiedSearch("");
              setTableFilters({ company: "", title: "", location: "", seniority: "all", track: "all", fitMin: "all", status: "all" });
            }}
          >
            Clear
          </Button>
        )}
      </div>
      {showMoreFilters && (
        <div className="flex flex-wrap gap-2">
          <Input
            value={tableFilters.location}
            onChange={(event) => updateTableFilter("location", event.target.value)}
            placeholder="Location"
            className="h-9 w-[150px] text-sm"
          />
          <Select value={tableFilters.seniority} onValueChange={(value) => updateTableFilter("seniority", value)}>
            <SelectTrigger className="h-9 w-[130px] text-sm">
              <SelectValue placeholder="Seniority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All seniority</SelectItem>
              {SENIORITY_OPTIONS.map((option) => (
                <SelectItem key={option} value={option}>{option}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={tableFilters.track} onValueChange={(value) => updateTableFilter("track", value)}>
            <SelectTrigger className="h-9 w-[160px] text-sm">
              <SelectValue placeholder="All tracks" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All tracks</SelectItem>
              <SelectItem value="TPM">TPM</SelectItem>
              <SelectItem value="Product Engineer">Product Engineer</SelectItem>
              <SelectItem value="Systems PM">Systems PM</SelectItem>
            </SelectContent>
          </Select>
          <Select value={tableFilters.fitMin} onValueChange={(value) => updateTableFilter("fitMin", value)}>
            <SelectTrigger className="h-9 w-[110px] text-sm">
              <SelectValue placeholder="Fit score" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All fit</SelectItem>
              {FIT_FILTER_VALUES.filter((value) => value !== "all").map((value) => (
                <SelectItem key={value} value={value}>{value}+ fit</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

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
                <TableHead>{renderSortHeader("Added", "createdAt")}</TableHead>
                <TableHead>JD</TableHead>
                <TableHead className="text-right">Actions</TableHead>
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
                  <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                    {editingRoleId === role.id && editDraft ? (
                      <Input
                        type="date"
                        className="h-8 w-36 text-xs"
                        value={editDraft.createdAt ? editDraft.createdAt.slice(0, 10) : ""}
                        onChange={(e) =>
                          setEditDraft((current) =>
                            current
                              ? { ...current, createdAt: e.target.value ? `${e.target.value}T00:00:00.000Z` : current.createdAt }
                              : current
                          )
                        }
                      />
                    ) : (
                      role.createdAt ? role.createdAt.slice(0, 10) : "—"
                    )}
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    {role.jobDescription || (editingRoleId === role.id && editDraft?.jobDescription) ? (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openJdEditor(role)}
                      >
                        {editingRoleId === role.id ? "Edit JD" : "View JD"}
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openJdEditor(role)}
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
                            <Link to={`${appPath("/cv-optimizer")}?roleId=${role.id}`}>
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
                            onClick={() => void (isArchived(role) ? restoreRole(role) : archiveRole(role))}
                            aria-label={isArchived(role) ? "Restore role" : "Archive role"}
                          >
                            {isArchived(role) ? (
                              <ArchiveRestore className="h-4 w-4" />
                            ) : (
                              <Archive className="h-4 w-4" />
                            )}
                          </Button>
                        </span>
                      </TooltipTrigger>
                      <TooltipContent side="top">{isArchived(role) ? "Restore" : "Archive"}</TooltipContent>
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
        <DialogContent className="flex max-h-[calc(100vh-4rem)] w-[min(960px,calc(100vw-2rem))] max-w-none flex-col gap-0 overflow-hidden p-0 sm:max-w-none">
          <DialogHeader className="border-b border-border px-6 py-5 pr-12">
            <DialogTitle className="truncate">{selectedJdRole?.title ?? "Job Description"}</DialogTitle>
          </DialogHeader>
          {selectedJdRole ? (
            <div className="flex min-h-0 flex-1 flex-col">
              <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-6 py-5">
                <div className="grid gap-3 text-sm text-muted-foreground sm:grid-cols-2 lg:grid-cols-5">
                  <div className="min-w-0">
                    <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Company</div>
                    <div className="truncate font-medium text-foreground">
                      {companiesById.get(selectedJdRole.companyId)?.name ?? "-"}
                    </div>
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Location</div>
                    <div className="truncate text-foreground">
                      {(selectedJdDraft?.location ?? selectedJdRole.location) || "-"}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Seniority</div>
                    <div className="text-foreground">
                      {normalizeSeniority(selectedJdDraft?.seniority ?? selectedJdRole.seniority) || "-"}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Track</div>
                    <div className="text-foreground">{selectedJdDraft?.track ?? selectedJdRole.track}</div>
                  </div>
                  <div>
                    <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Fit</div>
                    <div className="text-foreground">
                      {selectedJdDraft?.fitScore ?? selectedJdRole.fitScore}/5
                    </div>
                  </div>
                </div>

                {selectedJdDraft ? (
                  <div className="space-y-5">
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium" htmlFor="role-jd-url">
                        Job link
                      </label>
                      <Input
                        id="role-jd-url"
                        className="w-full"
                        value={selectedJdDraft.url ?? ""}
                        onChange={(event) =>
                          setEditDraft((current) =>
                            current ? { ...current, url: event.target.value } : current
                          )
                        }
                        placeholder="https://company.com/careers/role"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium" htmlFor="role-jd-description">
                        Full job description
                      </label>
                      <Textarea
                        id="role-jd-description"
                        value={selectedJdDraft.jobDescription ?? ""}
                        onChange={(event) =>
                          setEditDraft((current) =>
                            current ? { ...current, jobDescription: event.target.value } : current
                          )
                        }
                        rows={20}
                        className="max-h-[52vh] min-h-[24rem] w-full resize-y font-mono text-sm leading-6"
                        placeholder="Paste the full job description here, including responsibilities, requirements, benefits, and hiring process notes."
                      />
                    </div>
                  </div>
                ) : (
                  <div className="max-h-[60vh] overflow-y-auto rounded-md border bg-muted/10 p-4 text-sm leading-6 whitespace-pre-wrap">
                    {selectedJdRole.jobDescription || "No job description stored."}
                  </div>
                )}
              </div>

              {selectedJdDraft ? (
                <div className="flex flex-col gap-3 border-t border-border bg-background px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="text-xs text-muted-foreground">
                    Saves to the role record and keeps the link available for Quick Apply.
                  </div>
                  <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center">
                    <Button
                      variant="outline"
                      onClick={() => setSelectedJdRoleId(null)}
                    >
                      Continue editing row
                    </Button>
                    <Button
                      onClick={() =>
                        void saveEdit(selectedJdRole.id).then(() => setSelectedJdRoleId(null))
                      }
                    >
                      Save JD
                    </Button>
                  </div>
                </div>
              ) : null}
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </JobOsLayout>
  );
}
