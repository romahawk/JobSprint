import { Link } from "react-router";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../../components/ui/alert-dialog";
import { usePagination } from "../../hooks/usePagination";
import { PaginationControls } from "../../components/ui/PaginationControls";
import { ArrowDown, ArrowUp, ArrowUpDown, CircleHelp, KanbanSquare, List, Plus, Search } from "lucide-react";
import { Button } from "../../components/ui/button";
import { Card, CardContent } from "../../components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "../../components/ui/dialog";
import { Input } from "../../components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "../../components/ui/tabs";
import { Textarea } from "../../components/ui/textarea";
import { Badge } from "../../components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "../../components/ui/tooltip";
import { useJobOsContext } from "../../context/JobOsContext";
import { JobOsTransferControls } from "../../components/job-os/JobOsTransferControls";
import { JobOsLayout } from "../../components/job-os/JobOsLayout";
import { AppPageShell } from "../../components/layout/AppPageShell";
import {
  APPLICATION_STAGE_GROUPS,
  APPLICATION_STATUS_LABELS,
  JobOsPipelineBoard,
} from "../../components/job-os/JobOsPipelineBoard";
import { getApplicationCvLabel, getDefaultCvAsset } from "../../services/cvAssets";
import { ApplicationQualityBadge } from "../../components/job-os/ApplicationQualityBadge";
import type { ApplicationStatus, JobOsApplication, JobOsCompany, JobOsRole } from "../../types/jobOs";

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

type PipelineViewMode = "board" | "list";
type ApplicationStageGroup = keyof typeof APPLICATION_STAGE_GROUPS;
type SortField = "company" | "role" | "status" | "date" | "nextAction";
type SortDirection = "asc" | "desc";

const EMPTY_APPLICATION_DRAFT = {
  dateApplied: new Date().toISOString().slice(0, 10),
  companyId: "",
  roleId: "",
  channel: "LinkedIn",
  cvAssetId: undefined,
  cvVersion: "",
  status: "sent" as ApplicationStatus,
  nextAction: "",
  notes: "",
  latestJobDescriptionId: undefined,
  latestCvTailoringRunId: undefined,
  tailoredCvHeadline: "",
  tailoredCvSummary: "",
  tailoredCvText: "",
  tailoredCvUpdatedAt: undefined,
};

function createDraft(defaultCv?: { id: string; name: string }): Omit<JobOsApplication, "id" | "createdAt" | "updatedAt"> {
  return {
    ...EMPTY_APPLICATION_DRAFT,
    cvAssetId: defaultCv?.id,
    cvVersion: defaultCv?.name ?? "",
  };
}

export default function JobOsApplicationsPage() {
  const {
    applications,
    companies,
    roles,
    assets,
    cvTailoringRuns,
    outreach,
    addApplication,
    updateApplication,
    updateOutreach,
    removeApplication,
    syncNotice,
    exportState,
    replaceState,
  } = useJobOsContext();

  async function handleApplicationStatusChange(
    applicationId: string,
    roleId: string,
    newStatus: ApplicationStatus
  ): Promise<void> {
    await updateApplication(applicationId, { status: newStatus });

    const closingStatuses: ApplicationStatus[] = ["interview", "final", "offer", "rejected", "ghosted"];
    if (closingStatuses.includes(newStatus)) {
      const linked = outreach.filter(
        (o) => o.roleId === roleId && o.status !== "closed"
      );
      await Promise.all(linked.map((o) => updateOutreach(o.id, { status: "closed" })));
      if (linked.length > 0) {
        toast(`${linked.length} linked outreach record${linked.length > 1 ? "s" : ""} closed`);
      }
    }
  }

  const defaultCv = getDefaultCvAsset(assets.cvs);
  const [viewMode, setViewMode] = useState<PipelineViewMode>("list");
  const [stageGroup, setStageGroup] = useState<ApplicationStageGroup>("active");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [createOpen, setCreateOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [detailDraft, setDetailDraft] = useState<Pick<JobOsApplication, "status" | "nextAction" | "notes"> | null>(null);
  const [sortField, setSortField] = useState<SortField>("date");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [draft, setDraft] = useState<Omit<JobOsApplication, "id" | "createdAt" | "updatedAt">>(createDraft(defaultCv ? { id: defaultCv.id, name: defaultCv.name } : undefined));

  const companiesById = useMemo(() => new Map(companies.map((company) => [company.id, company])), [companies]);
  const rolesById = useMemo(() => new Map(roles.map((role) => [role.id, role])), [roles]);
  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds]);
  const detailApplication = detailId ? applications.find((application) => application.id === detailId) ?? null : null;

  const groupStatuses = APPLICATION_STAGE_GROUPS[stageGroup].statuses;
  const filteredApplications = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    const visibleApplications = applications.filter((application) => {
      if (!groupStatuses.includes(application.status)) return false;
      if (!query) return true;

      const companyName = companiesById.get(application.companyId)?.name ?? "";
      const roleTitle = rolesById.get(application.roleId)?.title ?? "";
      const haystack = [
        companyName,
        roleTitle,
        application.channel,
        application.nextAction,
        application.notes,
      ]
        .join(" ")
        .toLowerCase();

      return haystack.includes(query);
    });

    return [...visibleApplications].sort((left, right) => {
      const leftCompany = companiesById.get(left.companyId)?.name ?? "";
      const rightCompany = companiesById.get(right.companyId)?.name ?? "";
      const leftRole = rolesById.get(left.roleId)?.title ?? "";
      const rightRole = rolesById.get(right.roleId)?.title ?? "";

      const comparison = (() => {
        switch (sortField) {
          case "company":
            return leftCompany.localeCompare(rightCompany);
          case "role":
            return leftRole.localeCompare(rightRole);
          case "status":
            return APPLICATION_STATUS_LABELS[left.status].localeCompare(APPLICATION_STATUS_LABELS[right.status]);
          case "nextAction":
            return (left.nextAction || "").localeCompare(right.nextAction || "");
          case "date":
          default:
            return left.dateApplied.localeCompare(right.dateApplied);
        }
      })();

      return sortDirection === "asc" ? comparison : -comparison;
    });
  }, [applications, companiesById, groupStatuses, rolesById, searchTerm, sortDirection, sortField]);

  const PAGE_SIZE = 10;
  const {
    page: appPage,
    totalPages: appTotalPages,
    pageItems: pagedApplications,
    setPage: setAppPage,
    resetPage: resetAppPage,
  } = usePagination(filteredApplications, PAGE_SIZE);

  useEffect(() => {
    resetAppPage();
  }, [resetAppPage, searchTerm, stageGroup, sortField, sortDirection]);

  function resetDraft(): void {
    setDraft(createDraft(defaultCv ? { id: defaultCv.id, name: defaultCv.name } : undefined));
  }

  function toggleSelection(id: string): void {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((value) => value !== id) : [...prev, id]));
  }

  function openCreateDialog(): void {
    resetDraft();
    setCreateOpen(true);
  }

  function openDetails(application: JobOsApplication): void {
    setDetailId(application.id);
    setDetailDraft({
      status: application.status,
      nextAction: application.nextAction,
      notes: application.notes,
    });
  }

  function closeDetails(): void {
    setDetailId(null);
    setDetailDraft(null);
  }

  function toggleSort(field: SortField): void {
    if (sortField === field) {
      setSortDirection((current) => (current === "asc" ? "desc" : "asc"));
      return;
    }

    setSortField(field);
    setSortDirection(field === "date" ? "desc" : "asc");
  }

  function renderSortHeader(label: string, field: SortField): React.ReactNode {
    const active = sortField === field;
    return (
      <button
        type="button"
        onClick={() => toggleSort(field)}
        className="inline-flex items-center gap-1 font-medium text-foreground transition-colors hover:text-primary"
      >
        <span>{label}</span>
        {!active && <ArrowUpDown className="h-3.5 w-3.5 opacity-60" />}
        {active && sortDirection === "asc" && <ArrowUp className="h-3.5 w-3.5 text-primary" />}
        {active && sortDirection === "desc" && <ArrowDown className="h-3.5 w-3.5 text-primary" />}
      </button>
    );
  }

  async function applyBulkStatus(status: ApplicationStatus): Promise<void> {
    await Promise.all(selectedIds.map((id) => updateApplication(id, { status })));
    setSelectedIds([]);
  }

  async function bulkFollowUp(): Promise<void> {
    await Promise.all(selectedIds.map((id) => updateApplication(id, { nextAction: "Follow up" })));
    setSelectedIds([]);
  }

  async function handleCreateApplication(): Promise<void> {
    if (!draft.companyId || !draft.roleId) return;
    await addApplication(draft);
    toast.success("Application added");
    resetDraft();
    setCreateOpen(false);
  }

  async function handleSaveDetails(): Promise<void> {
    if (!detailApplication || !detailDraft) return;
    await updateApplication(detailApplication.id, detailDraft);
    closeDetails();
  }

  function handleCreateDialogKeyDown(
    event: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>
  ): void {
    const isModifierEnter =
      event.key === "Enter" &&
      ((event.metaKey || event.ctrlKey) || event.currentTarget instanceof HTMLInputElement);

    if (isModifierEnter && draft.companyId && draft.roleId) {
      event.preventDefault();
      void handleCreateApplication();
    }
  }

  function handleDetailDialogKeyDown(
    event: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>
  ): void {
    const isModifierEnter =
      event.key === "Enter" &&
      ((event.metaKey || event.ctrlKey) || event.currentTarget instanceof HTMLInputElement);

    if (isModifierEnter && detailApplication && detailDraft) {
      event.preventDefault();
      void handleSaveDetails();
    }
  }

  const shellActions = (
    <>
      <div className="flex items-center gap-1 rounded-xl border border-border/70 bg-background/70 p-1">
        <Button
          type="button"
          size="sm"
          variant={viewMode === "board" ? "default" : "ghost"}
          className="rounded-lg"
          onClick={() => setViewMode("board")}
        >
          <KanbanSquare className="h-4 w-4" />
          Board
        </Button>
        <Button
          type="button"
          size="sm"
          variant={viewMode === "list" ? "default" : "ghost"}
          className="rounded-lg"
          onClick={() => setViewMode("list")}
        >
          <List className="h-4 w-4" />
          List
        </Button>
      </div>
      <Button onClick={openCreateDialog} className="gap-2">
        <Plus className="h-4 w-4" />
        Add Application
      </Button>
    </>
  );

  const shellToolbar = (
    <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
      <Tabs
        value={stageGroup}
        onValueChange={(value) => setStageGroup(value as ApplicationStageGroup)}
        className="gap-3"
      >
        <TabsList className="h-auto w-full flex-wrap justify-start rounded-2xl bg-muted/70 p-1 sm:w-fit">
          {(Object.keys(APPLICATION_STAGE_GROUPS) as ApplicationStageGroup[]).map((group) => (
            <TabsTrigger key={group} value={group} className="rounded-xl px-3 py-2 text-sm">
              {APPLICATION_STAGE_GROUPS[group].label}
              <Badge
                variant="outline"
                className="ml-1 rounded-full bg-background/70 px-1.5 py-0 text-[10px]"
              >
                {
                  applications.filter((application) =>
                    APPLICATION_STAGE_GROUPS[group].statuses.includes(application.status)
                  ).length
                }
              </Badge>
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <div className="relative w-full xl:max-w-sm">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
          placeholder="Search company, role, next action, notes"
          className="pl-9"
        />
      </div>
    </div>
  );

  return (
    <JobOsLayout
      title="Applications"
      subtitle="Pipeline control surface for submitted applications"
      notice={syncNotice}
      settingsFooter={
        <JobOsTransferControls getExportState={exportState} onImportState={replaceState} />
      }
    >
      <AppPageShell
        title="Pipeline"
        subtitle="Start with the readable execution list, then switch to board view when you need stage-level triage."
        actions={shellActions}
        toolbar={shellToolbar}
      >
        <div className="space-y-4">
          {selectedIds.length > 0 ? (
            <Card>
              <CardContent className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="text-sm text-muted-foreground">
                  {selectedIds.length} application{selectedIds.length === 1 ? "" : "s"} selected.
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" variant="outline" onClick={() => void bulkFollowUp()}>
                    Set Follow-up
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => void applyBulkStatus("screen")}>
                    Move to Screen
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => void applyBulkStatus("rejected")}>
                    Mark Rejected
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setSelectedIds([])}>
                    Clear
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : null}

          {viewMode === "board" ? (
            <Card>
              <CardContent className="pt-6">
                <JobOsPipelineBoard
                  applications={filteredApplications}
                  companiesById={companiesById as Map<string, JobOsCompany>}
                  rolesById={rolesById as Map<string, JobOsRole>}
                  group={stageGroup}
                  onSelectApplication={openDetails}
                />
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="pt-6">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead />
                      <TableHead>{renderSortHeader("Company", "company")}</TableHead>
                      <TableHead>{renderSortHeader("Role", "role")}</TableHead>
                      <TableHead>Quality</TableHead>
                      <TableHead>{renderSortHeader("Status", "status")}</TableHead>
                      <TableHead>{renderSortHeader("Date", "date")}</TableHead>
                      <TableHead>{renderSortHeader("Next Action", "nextAction")}</TableHead>
                      <TableHead />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pagedApplications.map((application) => (
                      <TableRow
                        key={application.id}
                        className="cursor-pointer"
                        onClick={() => openDetails(application)}
                      >
                        <TableCell>
                          <input
                            type="checkbox"
                            checked={selectedSet.has(application.id)}
                            onClick={(event) => event.stopPropagation()}
                            onChange={() => toggleSelection(application.id)}
                          />
                        </TableCell>
                        <TableCell>
                          {companiesById.get(application.companyId)?.name ?? "-"}
                        </TableCell>
                        <TableCell>{rolesById.get(application.roleId)?.title ?? "-"}</TableCell>
                        <TableCell>
                          {!["rejected", "ghosted"].includes(application.status) && (
                            <ApplicationQualityBadge
                              application={application}
                              cvTailoringRuns={cvTailoringRuns}
                            />
                          )}
                        </TableCell>
                        <TableCell>
                          <Select
                            value={application.status}
                            onValueChange={(value) =>
                              void handleApplicationStatusChange(
                                application.id,
                                application.roleId,
                                value as ApplicationStatus
                              )
                            }
                          >
                            <SelectTrigger className="w-36">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {STATUS_VALUES.map((status) => (
                                <SelectItem key={status} value={status}>
                                  {APPLICATION_STATUS_LABELS[status]}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>{application.dateApplied}</TableCell>
                        <TableCell className="max-w-[220px] truncate">
                          {application.nextAction || "-"}
                        </TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={(event) => {
                              event.stopPropagation();
                              openDetails(application);
                            }}
                          >
                            Open
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                    {filteredApplications.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={8}
                          className="py-10 text-center text-sm text-muted-foreground"
                        >
                          <div className="mx-auto flex max-w-md flex-col items-center gap-3">
                            <p>No applications match this stage group and search.</p>
                            <div className="flex flex-wrap justify-center gap-2">
                              {searchTerm ? (
                                <Button size="sm" variant="outline" onClick={() => setSearchTerm("")}>
                                  Clear search
                                </Button>
                              ) : null}
                              <Button size="sm" variant="outline" onClick={() => setStageGroup("active")}>
                                Switch to Active
                              </Button>
                              <Button size="sm" onClick={openCreateDialog}>
                                Add application
                              </Button>
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : null}
                  </TableBody>
                </Table>
                <PaginationControls
                  page={appPage}
                  totalPages={appTotalPages}
                  totalItems={filteredApplications.length}
                  pageSize={PAGE_SIZE}
                  onPageChange={setAppPage}
                />
              </CardContent>
            </Card>
          )}
        </div>
      </AppPageShell>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add Application</DialogTitle>
            <DialogDescription>
              Capture a new application without leaving the pipeline surface.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-3 md:grid-cols-2">
              <Input
                type="date"
                value={draft.dateApplied}
                onChange={(event) => setDraft((current) => ({ ...current, dateApplied: event.target.value }))}
                onKeyDown={handleCreateDialogKeyDown}
              />
              <Input
                value={draft.channel}
                onChange={(event) => setDraft((current) => ({ ...current, channel: event.target.value }))}
                onKeyDown={handleCreateDialogKeyDown}
                placeholder="Application source"
              />
            <Select value={draft.companyId} onValueChange={(value) => setDraft((current) => ({ ...current, companyId: value, roleId: "" }))}>
              <SelectTrigger>
                <SelectValue placeholder="Company" />
              </SelectTrigger>
              <SelectContent>
                {companies.map((company) => (
                  <SelectItem key={company.id} value={company.id}>
                    {company.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={draft.roleId} onValueChange={(value) => setDraft((current) => ({ ...current, roleId: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Role" />
              </SelectTrigger>
              <SelectContent>
                {roles
                  .filter((role) => !draft.companyId || role.companyId === draft.companyId)
                  .map((role) => (
                    <SelectItem key={role.id} value={role.id}>
                      {role.title}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
            <Select
              value={draft.cvAssetId ?? ""}
              onValueChange={(value) => {
                const selectedCv = assets.cvs.find((cv) => cv.id === value);
                setDraft((current) => ({
                  ...current,
                  cvAssetId: selectedCv?.id,
                  cvVersion: selectedCv?.name ?? "",
                }));
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="CV asset" />
              </SelectTrigger>
              <SelectContent>
                {assets.cvs.map((cv) => (
                  <SelectItem key={cv.id} value={cv.id}>
                    {cv.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={draft.status} onValueChange={(value) => setDraft((current) => ({ ...current, status: value as ApplicationStatus }))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUS_VALUES.map((status) => (
                  <SelectItem key={status} value={status}>
                    {APPLICATION_STATUS_LABELS[status]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="md:col-span-2">
              <Input
                value={draft.nextAction}
                onChange={(event) => setDraft((current) => ({ ...current, nextAction: event.target.value }))}
                onKeyDown={handleCreateDialogKeyDown}
                placeholder="e.g. Follow up next Tuesday"
              />
            </div>
            <div className="md:col-span-2">
              <Textarea
                value={draft.notes}
                onChange={(event) => setDraft((current) => ({ ...current, notes: event.target.value }))}
                onKeyDown={handleCreateDialogKeyDown}
                rows={4}
                placeholder="Context, recruiter notes, or submission details"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="inline-flex">
                    <CircleHelp className="h-3.5 w-3.5" />
                  </span>
                </TooltipTrigger>
                <TooltipContent side="top">
                  Press Enter in a field, or Cmd/Ctrl + Enter in notes, to save quickly.
                </TooltipContent>
              </Tooltip>
              Keyboard shortcut available
            </div>
            <Button variant="ghost" onClick={() => setCreateOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => void handleCreateApplication()} disabled={!draft.companyId || !draft.roleId}>
              Save Application
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(detailApplication)} onOpenChange={(open) => !open && closeDetails()}>
        <DialogContent className="max-w-2xl">
          {detailApplication && detailDraft ? (
            <>
              <DialogHeader>
                <DialogTitle>
                  {companiesById.get(detailApplication.companyId)?.name ?? "Unknown company"}
                </DialogTitle>
                <DialogDescription>
                  {rolesById.get(detailApplication.roleId)?.title ?? "Unknown role"}
                </DialogDescription>
              </DialogHeader>

              <div className="grid gap-3 md:grid-cols-2">
                <div className="space-y-1">
                  <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Applied
                  </div>
                  <div className="text-sm text-foreground">{detailApplication.dateApplied}</div>
                </div>
                <div className="space-y-1">
                  <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Channel
                  </div>
                  <div className="text-sm text-foreground">{detailApplication.channel}</div>
                </div>
                <div className="space-y-1">
                  <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    CV
                  </div>
                  <div className="text-sm text-foreground">
                    {getApplicationCvLabel(detailApplication, assets.cvs)}
                  </div>
                </div>
                <div className="md:col-span-2">
                  <Select value={detailDraft.status} onValueChange={(value) => setDetailDraft((current) => current ? { ...current, status: value as ApplicationStatus } : current)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {STATUS_VALUES.map((status) => (
                        <SelectItem key={status} value={status}>
                          {APPLICATION_STATUS_LABELS[status]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="md:col-span-2">
                  <Input
                    value={detailDraft.nextAction}
                    onChange={(event) => setDetailDraft((current) => current ? { ...current, nextAction: event.target.value } : current)}
                    onKeyDown={handleDetailDialogKeyDown}
                    placeholder="What should happen next?"
                  />
                </div>
                <div className="md:col-span-2">
                  <Textarea
                    value={detailDraft.notes}
                    onChange={(event) => setDetailDraft((current) => current ? { ...current, notes: event.target.value } : current)}
                    onKeyDown={handleDetailDialogKeyDown}
                    rows={5}
                    placeholder="Add context, response notes, or follow-up details"
                  />
                </div>
              </div>

              <div className="flex flex-wrap justify-between gap-2">
                <div className="flex gap-2">
                  <Button asChild variant="outline">
                    <Link to={`/cv-optimizer?applicationId=${detailApplication.id}`}>Tailor CV</Link>
                  </Button>
                  <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
                    <Button
                      variant="ghost"
                      className="text-red-500"
                      onClick={() => setDeleteConfirmOpen(true)}
                    >
                      Delete
                    </Button>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete this application?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This record will be permanently removed.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
                          onClick={() => {
                            void removeApplication(detailApplication.id).then(() =>
                              toast.success("Application deleted")
                            );
                            closeDetails();
                          }}
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">Cmd/Ctrl + Enter saves</span>
                  <Button onClick={() => void handleSaveDetails()}>
                  Save Changes
                  </Button>
                </div>
              </div>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </JobOsLayout>
  );
}
