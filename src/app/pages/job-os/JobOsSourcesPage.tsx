import { Link } from "react-router";
import { useMemo, useState } from "react";
import { Archive, CheckCheck, ExternalLink, HelpCircle, Plus, Search, WandSparkles } from "lucide-react";
import { toast } from "sonner";
import { AppPageShell } from "../../components/layout/AppPageShell";
import { JobOsLayout } from "../../components/job-os/JobOsLayout";
import { JobOsTransferControls } from "../../components/job-os/JobOsTransferControls";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardHeader } from "../../components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "../../components/ui/dialog";
import { Input } from "../../components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "../../components/ui/sheet";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs";
import { Tooltip, TooltipContent, TooltipTrigger } from "../../components/ui/tooltip";
import { Textarea } from "../../components/ui/textarea";
import { useJobOsContext } from "../../context/JobOsContext";
import { appPath } from "../../routing";
import type {
  DiscoveryStatus,
  ExtendedJobTrack,
  JobOsRole,
  JobSource,
  JobSourceCategory,
  JobSourcePriority,
  JobTrack,
  SavedSearch,
  SourceCadence,
} from "../../types/jobOs";

const SOURCE_CATEGORY_LABELS: Record<JobSourceCategory, string> = {
  general: "General",
  remote: "Remote",
  startup: "Startup",
  ats: "ATS",
  company_career: "Career Site",
  community: "Community",
  recruiter: "Recruiter",
  research: "Research",
};

const CADENCE_LABELS: Record<SourceCadence, string> = {
  daily: "Daily",
  twice_weekly: "2x weekly",
  weekly: "Weekly",
  manual: "Manual",
};

const DISCOVERY_STATUS_LABELS: Record<DiscoveryStatus, string> = {
  discovered: "Discovered",
  qualified: "Qualified",
  to_apply: "To Apply",
  applied: "Applied",
  rejected: "Rejected",
  archived: "Archived",
};

const PRIORITY_ORDER: Record<JobSourcePriority, number> = { A: 0, B: 1, C: 2 };
const CADENCE_ORDER: Record<SourceCadence, number> = {
  daily: 0,
  twice_weekly: 1,
  weekly: 2,
  manual: 3,
};

const TRACK_OPTIONS: JobTrack[] = ["TPM", "Product Engineer", "Systems PM"];
const EXTENDED_TRACK_OPTIONS: ExtendedJobTrack[] = [
  "TPM",
  "Product Engineer",
  "Systems PM",
  "Implementation",
  "AI Product",
  "MedTech Product",
  "Other",
];
const SOURCE_CATEGORIES = Object.keys(SOURCE_CATEGORY_LABELS) as JobSourceCategory[];
const SOURCE_PRIORITIES: JobSourcePriority[] = ["A", "B", "C"];
const SOURCE_CADENCES = Object.keys(CADENCE_LABELS) as SourceCadence[];
const DISCOVERY_QUEUE_STATUSES: DiscoveryStatus[] = ["discovered", "qualified", "to_apply"];

type ScanItem =
  | { kind: "source"; item: JobSource }
  | { kind: "savedSearch"; item: SavedSearch };

type CaptureContext = {
  sourceId?: string;
  savedSearchId?: string;
  sourceUrl?: string;
};

interface CaptureDraft {
  jobUrl: string;
  sourceId: string;
  savedSearchId: string;
  existingCompanyId: string;
  newCompanyName: string;
  roleTitle: string;
  location: string;
  seniority: string;
  track: JobTrack;
  fitScore: 1 | 2 | 3 | 4 | 5;
  discoveryStatus: DiscoveryStatus;
  qualificationNotes: string;
  qualificationRisks: string;
  nextStep: string;
  jobDescription: string;
}

interface SourceEditDraft {
  name: string;
  url: string;
  category: JobSourceCategory;
  priority: JobSourcePriority;
  bestFor: string;
  cadence: SourceCadence;
  notes: string;
  active: boolean;
}

interface SavedSearchEditDraft {
  sourceId: string;
  name: string;
  query: string;
  url: string;
  targetTrack: ExtendedJobTrack;
  priority: JobSourcePriority;
  cadence: SourceCadence;
  notes: string;
  active: boolean;
}

const EMPTY_SOURCE_DRAFT: SourceEditDraft = {
  name: "",
  url: "",
  category: "general",
  priority: "B",
  bestFor: "",
  cadence: "weekly",
  notes: "",
  active: true,
};

const EMPTY_CAPTURE_DRAFT: CaptureDraft = {
  jobUrl: "",
  sourceId: "",
  savedSearchId: "",
  existingCompanyId: "",
  newCompanyName: "",
  roleTitle: "",
  location: "",
  seniority: "",
  track: "TPM",
  fitScore: 3,
  discoveryStatus: "discovered",
  qualificationNotes: "",
  qualificationRisks: "",
  nextStep: "",
  jobDescription: "",
};

function formatDateLabel(value?: string): string {
  if (!value) return "Never";
  const parsed = Date.parse(value);
  if (Number.isNaN(parsed)) return "Never";
  return new Date(parsed).toLocaleDateString();
}

function getCadenceDays(cadence: SourceCadence): number {
  switch (cadence) {
    case "daily":
      return 1;
    case "twice_weekly":
      return 3;
    case "weekly":
      return 7;
    case "manual":
    default:
      return 3650;
  }
}

function isDue(lastCheckedAt: string | undefined, cadence: SourceCadence): boolean {
  if (!lastCheckedAt) return true;
  const parsed = Date.parse(lastCheckedAt);
  if (Number.isNaN(parsed)) return true;
  const dueAt = parsed + getCadenceDays(cadence) * 24 * 60 * 60 * 1000;
  return Date.now() >= dueAt;
}

function getDueSortValue(lastCheckedAt: string | undefined, cadence: SourceCadence): number {
  if (!lastCheckedAt) return Number.POSITIVE_INFINITY;
  const parsed = Date.parse(lastCheckedAt);
  if (Number.isNaN(parsed)) return Number.POSITIVE_INFINITY;
  const dueAt = parsed + getCadenceDays(cadence) * 24 * 60 * 60 * 1000;
  return Date.now() - dueAt;
}

function mapExtendedTrackToRoleTrack(track: ExtendedJobTrack): JobTrack {
  switch (track) {
    case "Implementation":
      return "Systems PM";
    case "Product Engineer":
      return "Product Engineer";
    case "TPM":
    case "AI Product":
    case "MedTech Product":
    case "Other":
    case "Systems PM":
    default:
      return track === "Systems PM" ? "Systems PM" : "TPM";
  }
}

function isQualificationQueueRole(role: JobOsRole): boolean {
  if (role.discoveryStatus === "archived" || role.discoveryStatus === "rejected") {
    return false;
  }

  if (role.discoveryStatus && DISCOVERY_QUEUE_STATUSES.includes(role.discoveryStatus)) {
    return true;
  }

  return role.status === "to_apply";
}

function getPriorityBadgeClass(priority: JobSourcePriority): string {
  if (priority === "A") return "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-300";
  if (priority === "B") return "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-300";
  return "border-neutral-200 bg-neutral-100 text-neutral-700 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-300";
}

export default function JobOsSourcesPage() {
  const {
    sources,
    savedSearches,
    companies,
    roles,
    syncNotice,
    addCompany,
    addRole,
    addJobDescription,
    addSource,
    updateRole,
    updateSource,
    updateSavedSearch,
    exportState,
    replaceState,
  } = useJobOsContext();

  const [captureOpen, setCaptureOpen] = useState(false);
  const [addSourceOpen, setAddSourceOpen] = useState(false);
  const [captureContext, setCaptureContext] = useState<CaptureContext | null>(null);
  const [captureDraft, setCaptureDraft] = useState<CaptureDraft>(EMPTY_CAPTURE_DRAFT);
  const [newSourceDraft, setNewSourceDraft] = useState<SourceEditDraft>(EMPTY_SOURCE_DRAFT);
  const [editingSource, setEditingSource] = useState<JobSource | null>(null);
  const [sourceEditDraft, setSourceEditDraft] = useState<SourceEditDraft | null>(null);
  const [editingSavedSearch, setEditingSavedSearch] = useState<SavedSearch | null>(null);
  const [savedSearchEditDraft, setSavedSearchEditDraft] = useState<SavedSearchEditDraft | null>(null);
  const [activeTab, setActiveTab] = useState("due-today");
  const [showAllDue, setShowAllDue] = useState(false);
  const [sourcesSearch, setSourcesSearch] = useState("");
  const [sourcesPriorityFilter, setSourcesPriorityFilter] = useState<JobSourcePriority | "all">("all");
  const [sourcesCategoryFilter, setSourcesCategoryFilter] = useState<JobSourceCategory | "all">("all");
  const [sourcesActiveFilter, setSourcesActiveFilter] = useState<"all" | "active" | "inactive">("all");
  const [searchesSearch, setSearchesSearch] = useState("");
  const [searchesPriorityFilter, setSearchesPriorityFilter] = useState<JobSourcePriority | "all">("all");
  const [searchesSourceFilter, setSearchesSourceFilter] = useState("all");
  const [searchesActiveFilter, setSearchesActiveFilter] = useState<"all" | "active" | "inactive">("all");
  const [queueSearch, setQueueSearch] = useState("");
  const [queueFitFilter, setQueueFitFilter] = useState("all");
  const [queueStatusFilter, setQueueStatusFilter] = useState<DiscoveryStatus | "all">("all");
  const [dueSearch, setDueSearch] = useState("");
  const [duePriorityFilter, setDuePriorityFilter] = useState<JobSourcePriority | "all">("all");
  const [dueTypeFilter, setDueTypeFilter] = useState<"all" | "source" | "savedSearch">("all");

  const companiesById = useMemo(
    () => new Map(companies.map((company) => [company.id, company])),
    [companies]
  );
  const sourcesById = useMemo(() => new Map(sources.map((source) => [source.id, source])), [sources]);
  const savedSearchesById = useMemo(
    () => new Map(savedSearches.map((savedSearch) => [savedSearch.id, savedSearch])),
    [savedSearches]
  );

  const activeSources = useMemo(() => sources.filter((source) => source.active), [sources]);
  const activeSavedSearches = useMemo(
    () => savedSearches.filter((savedSearch) => savedSearch.active),
    [savedSearches]
  );

  const scanItems = useMemo(() => {
    const items: ScanItem[] = [
      ...activeSources.map((item) => ({ kind: "source" as const, item })),
      ...activeSavedSearches.map((item) => ({ kind: "savedSearch" as const, item })),
    ];

    return items.sort((left, right) => {
      const leftPriority = PRIORITY_ORDER[left.item.priority];
      const rightPriority = PRIORITY_ORDER[right.item.priority];
      if (leftPriority !== rightPriority) return leftPriority - rightPriority;

      const leftDue = isDue(left.item.lastCheckedAt, left.item.cadence);
      const rightDue = isDue(right.item.lastCheckedAt, right.item.cadence);
      if (leftDue !== rightDue) return leftDue ? -1 : 1;

      const leftDueSort = getDueSortValue(left.item.lastCheckedAt, left.item.cadence);
      const rightDueSort = getDueSortValue(right.item.lastCheckedAt, right.item.cadence);
      if (leftDueSort !== rightDueSort) return rightDueSort - leftDueSort;

      const leftCadence = CADENCE_ORDER[left.item.cadence];
      const rightCadence = CADENCE_ORDER[right.item.cadence];
      if (leftCadence !== rightCadence) return leftCadence - rightCadence;

      return left.item.name.localeCompare(right.item.name, undefined, { sensitivity: "base" });
    });
  }, [activeSavedSearches, activeSources]);

  const qualificationQueue = useMemo(
    () => roles.filter((role) => isQualificationQueueRole(role)),
    [roles]
  );

  const capturedRolesCount = useMemo(
    () =>
      roles.filter(
        (role) =>
          Boolean(role.sourceId) || Boolean(role.savedSearchId) || Boolean(role.sourceUrl)
      ).length,
    [roles]
  );

  const dueScanItems = useMemo(
    () => scanItems.filter((entry) => isDue(entry.item.lastCheckedAt, entry.item.cadence)),
    [scanItems]
  );

  const filteredDueItems = useMemo(() => {
    const base = showAllDue ? scanItems : dueScanItems;
    return base.filter((entry) => {
      if (dueSearch && !entry.item.name.toLowerCase().includes(dueSearch.toLowerCase())) return false;
      if (duePriorityFilter !== "all" && entry.item.priority !== duePriorityFilter) return false;
      if (dueTypeFilter !== "all" && entry.kind !== dueTypeFilter) return false;
      return true;
    });
  }, [showAllDue, scanItems, dueScanItems, dueSearch, duePriorityFilter, dueTypeFilter]);

  const filteredSavedSearchOptions = useMemo(() => {
    if (!captureDraft.sourceId) return activeSavedSearches;
    return activeSavedSearches.filter((savedSearch) => savedSearch.sourceId === captureDraft.sourceId);
  }, [activeSavedSearches, captureDraft.sourceId]);

  const filteredSources = useMemo(() => {
    return sources.filter((source) => {
      if (
        sourcesSearch &&
        !source.name.toLowerCase().includes(sourcesSearch.toLowerCase()) &&
        !source.bestFor.toLowerCase().includes(sourcesSearch.toLowerCase())
      ) return false;
      if (sourcesPriorityFilter !== "all" && source.priority !== sourcesPriorityFilter) return false;
      if (sourcesCategoryFilter !== "all" && source.category !== sourcesCategoryFilter) return false;
      if (sourcesActiveFilter === "active" && !source.active) return false;
      if (sourcesActiveFilter === "inactive" && source.active) return false;
      return true;
    });
  }, [sources, sourcesSearch, sourcesPriorityFilter, sourcesCategoryFilter, sourcesActiveFilter]);

  const filteredSavedSearches = useMemo(() => {
    return savedSearches.filter((savedSearch) => {
      if (
        searchesSearch &&
        !savedSearch.name.toLowerCase().includes(searchesSearch.toLowerCase()) &&
        !savedSearch.query.toLowerCase().includes(searchesSearch.toLowerCase())
      ) return false;
      if (searchesPriorityFilter !== "all" && savedSearch.priority !== searchesPriorityFilter) return false;
      if (searchesSourceFilter !== "all" && savedSearch.sourceId !== searchesSourceFilter) return false;
      if (searchesActiveFilter === "active" && !savedSearch.active) return false;
      if (searchesActiveFilter === "inactive" && savedSearch.active) return false;
      return true;
    });
  }, [savedSearches, searchesSearch, searchesPriorityFilter, searchesSourceFilter, searchesActiveFilter]);

  const filteredQueue = useMemo(() => {
    return qualificationQueue.filter((role) => {
      if (queueSearch) {
        const company = companiesById.get(role.companyId);
        const searchText = `${role.title} ${company?.name ?? ""}`.toLowerCase();
        if (!searchText.includes(queueSearch.toLowerCase())) return false;
      }
      if (queueFitFilter !== "all" && String(role.fitScore) !== queueFitFilter) return false;
      if (queueStatusFilter !== "all" && role.discoveryStatus !== queueStatusFilter) return false;
      return true;
    });
  }, [qualificationQueue, queueSearch, queueFitFilter, queueStatusFilter, companiesById]);

  function openUrl(url?: string): void {
    if (!url) return;
    window.open(url, "_blank", "noopener,noreferrer");
  }

  function openCapture(context?: CaptureContext): void {
    const source = context?.sourceId ? sourcesById.get(context.sourceId) : undefined;
    const savedSearch = context?.savedSearchId ? savedSearchesById.get(context.savedSearchId) : undefined;

    setCaptureContext(context ?? null);
    setCaptureDraft({
      ...EMPTY_CAPTURE_DRAFT,
      sourceId: savedSearch?.sourceId ?? source?.id ?? activeSources[0]?.id ?? "",
      savedSearchId: savedSearch?.id ?? "",
      track: savedSearch ? mapExtendedTrackToRoleTrack(savedSearch.targetTrack) : "TPM",
      jobUrl: context?.sourceUrl ?? savedSearch?.url ?? source?.url ?? "",
    });
    setCaptureOpen(true);
  }

  async function handleMarkSourceChecked(source: JobSource): Promise<void> {
    await updateSource(source.id, { lastCheckedAt: new Date().toISOString() });
    toast.success(`${source.name} marked checked`);
  }

  async function handleMarkSavedSearchChecked(savedSearch: SavedSearch): Promise<void> {
    await updateSavedSearch(savedSearch.id, { lastCheckedAt: new Date().toISOString() });
    toast.success(`${savedSearch.name} marked checked`);
  }

  async function handleToggleSource(source: JobSource): Promise<void> {
    await updateSource(source.id, { active: !source.active });
    toast.success(`${source.name} ${source.active ? "disabled" : "enabled"}`);
  }

  async function handleToggleSavedSearch(savedSearch: SavedSearch): Promise<void> {
    await updateSavedSearch(savedSearch.id, { active: !savedSearch.active });
    toast.success(`${savedSearch.name} ${savedSearch.active ? "disabled" : "enabled"}`);
  }

  async function handleSaveCapture(): Promise<void> {
    const title = captureDraft.roleTitle.trim();
    if (!title) {
      toast.error("Add a role title before capturing.");
      return;
    }

    let companyId = captureDraft.existingCompanyId;
    let companyName = companiesById.get(companyId)?.name ?? "";
    const newCompanyName = captureDraft.newCompanyName.trim();

    if (newCompanyName) {
      const createdCompanyId = await addCompany({
        name: newCompanyName,
        industry: "",
        size: "",
        remotePolicy: "",
        priority: "B",
        status: "Research",
        notes: "Created from Source Hub quick capture.",
      });
      if (!createdCompanyId) {
        toast.error("Company could not be created.");
        return;
      }
      companyId = createdCompanyId;
      companyName = newCompanyName;
    }

    if (!companyId) {
      toast.error("Select an existing company or enter a new company name.");
      return;
    }

    const selectedSource = captureDraft.sourceId ? sourcesById.get(captureDraft.sourceId) : undefined;
    const selectedSavedSearch = captureDraft.savedSearchId
      ? savedSearchesById.get(captureDraft.savedSearchId)
      : undefined;
    const resolvedSourceUrl =
      captureDraft.jobUrl.trim() ||
      selectedSavedSearch?.url ||
      captureContext?.sourceUrl ||
      selectedSource?.url ||
      "";
    const jobDescription = captureDraft.jobDescription.trim();

    const roleId = await addRole({
      companyId,
      title,
      url: resolvedSourceUrl,
      location: captureDraft.location.trim(),
      seniority: captureDraft.seniority.trim(),
      track: captureDraft.track,
      fitScore: captureDraft.fitScore,
      status: "to_apply",
      nextAction: undefined,
      origin: "self_sourced",
      jobDescription: jobDescription || undefined,
      jobDescriptionUpdatedAt: jobDescription ? new Date().toISOString() : undefined,
      sourceId: captureDraft.sourceId || selectedSavedSearch?.sourceId,
      savedSearchId: captureDraft.savedSearchId || undefined,
      sourceUrl: selectedSavedSearch?.url ?? selectedSource?.url ?? captureContext?.sourceUrl,
      discoveryStatus: captureDraft.discoveryStatus,
      qualificationNotes: captureDraft.qualificationNotes.trim() || undefined,
      qualificationRisks: captureDraft.qualificationRisks.trim() || undefined,
      nextStep: captureDraft.nextStep.trim() || undefined,
    });

    if (!roleId) {
      toast.error("Role could not be captured.");
      return;
    }

    if (jobDescription) {
      await addJobDescription({
        roleId,
        company: companyName,
        title,
        rawText: jobDescription,
        sourceUrl: resolvedSourceUrl || undefined,
      });
    }

    setCaptureOpen(false);
    setCaptureContext(null);
    setCaptureDraft(EMPTY_CAPTURE_DRAFT);
    toast.success("Role captured into the qualification queue");
  }

  async function handleAddSource(): Promise<void> {
    const name = newSourceDraft.name.trim();
    const url = newSourceDraft.url.trim();
    const bestFor = newSourceDraft.bestFor.trim();

    if (!name || !url || !bestFor) {
      toast.error("Add a source name, URL, and best-for description.");
      return;
    }

    const createdId = await addSource({
      name,
      url,
      category: newSourceDraft.category,
      priority: newSourceDraft.priority,
      bestFor,
      cadence: newSourceDraft.cadence,
      notes: newSourceDraft.notes.trim() || undefined,
      active: newSourceDraft.active,
      lastCheckedAt: undefined,
    });

    if (!createdId) {
      toast.error("Source could not be added.");
      return;
    }

    setNewSourceDraft(EMPTY_SOURCE_DRAFT);
    setAddSourceOpen(false);
    toast.success("Source added");
  }

  function openSourceEditor(source: JobSource): void {
    setEditingSource(source);
    setSourceEditDraft({
      name: source.name,
      url: source.url,
      category: source.category,
      priority: source.priority,
      bestFor: source.bestFor,
      cadence: source.cadence,
      notes: source.notes ?? "",
      active: source.active,
    });
  }

  async function saveSourceEditor(): Promise<void> {
    if (!editingSource || !sourceEditDraft) return;
    await updateSource(editingSource.id, {
      ...sourceEditDraft,
      notes: sourceEditDraft.notes.trim() || undefined,
    });
    setEditingSource(null);
    setSourceEditDraft(null);
    toast.success("Source updated");
  }

  function openSavedSearchEditor(savedSearch: SavedSearch): void {
    setEditingSavedSearch(savedSearch);
    setSavedSearchEditDraft({
      sourceId: savedSearch.sourceId,
      name: savedSearch.name,
      query: savedSearch.query,
      url: savedSearch.url,
      targetTrack: savedSearch.targetTrack,
      priority: savedSearch.priority,
      cadence: savedSearch.cadence,
      notes: savedSearch.notes ?? "",
      active: savedSearch.active,
    });
  }

  async function saveSavedSearchEditor(): Promise<void> {
    if (!editingSavedSearch || !savedSearchEditDraft) return;
    await updateSavedSearch(editingSavedSearch.id, {
      ...savedSearchEditDraft,
      notes: savedSearchEditDraft.notes.trim() || undefined,
    });
    setEditingSavedSearch(null);
    setSavedSearchEditDraft(null);
    toast.success("Saved search updated");
  }

  async function handleQueueAction(
    role: JobOsRole,
    updates: Partial<JobOsRole>,
    successMessage: string
  ): Promise<void> {
    await updateRole(role.id, updates);
    toast.success(successMessage);
  }

  const pageActions = (
    <>
      <Button variant="outline" onClick={() => setAddSourceOpen(true)} className="gap-2">
        <Plus className="h-4 w-4" />
        Add Source
      </Button>
      <Button onClick={() => openCapture()} className="gap-2">
        <Plus className="h-4 w-4" />
        Capture Role
      </Button>
    </>
  );

  return (
    <JobOsLayout
      notice={syncNotice}
      settingsFooter={
        <JobOsTransferControls getExportState={exportState} onImportState={replaceState} />
      }
      actions={pageActions}
    >
      <AppPageShell
        title="Source Hub"
        subtitle="Work through today's due scans, then capture only the roles worth qualifying."
      >
        <div className="space-y-5">
          <div className="flex flex-wrap items-center gap-x-5 gap-y-1 rounded-xl border border-border bg-background/80 px-4 py-2.5 text-sm">
            <span className="text-muted-foreground">
              <span className="font-semibold text-foreground">{activeSources.length}</span> active sources
            </span>
            <span className="hidden text-muted-foreground/40 sm:inline">·</span>
            <span className="text-muted-foreground">
              <span className="font-semibold text-foreground">{dueScanItems.length}</span> due today
            </span>
            <span className="hidden text-muted-foreground/40 sm:inline">·</span>
            <span className="text-muted-foreground">
              <span className="font-semibold text-foreground">{capturedRolesCount}</span> captured roles
            </span>
            <span className="hidden text-muted-foreground/40 sm:inline">·</span>
            <span className="text-muted-foreground">
              <span className="font-semibold text-foreground">{qualificationQueue.length}</span> in queue
            </span>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <div className="flex items-center gap-2">
              <TabsList className="h-auto flex-wrap gap-1 p-1">
                <TabsTrigger value="due-today">
                  Due Today{dueScanItems.length > 0 ? ` (${dueScanItems.length})` : ""}
                </TabsTrigger>
                <TabsTrigger value="sources">
                  Sources ({activeSources.length}/{sources.length})
                </TabsTrigger>
                <TabsTrigger value="saved-searches">
                  Saved Searches ({activeSavedSearches.length}/{savedSearches.length})
                </TabsTrigger>
                <TabsTrigger value="queue">
                  Queue{qualificationQueue.length > 0 ? ` (${qualificationQueue.length})` : ""}
                </TabsTrigger>
              </TabsList>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-600 dark:hover:bg-neutral-800 dark:hover:text-neutral-300"
                    aria-label="Tab guide"
                  >
                    <HelpCircle className="h-4 w-4" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="max-w-xs">
                  <div className="space-y-1.5">
                    <div><span className="font-semibold">Due Today</span> — sources and saved searches overdue for their scan cadence, sorted by priority. Filter by type or priority.</div>
                    <div><span className="font-semibold">Sources</span> — your full discovery stack. Add, edit, enable or disable sources.</div>
                    <div><span className="font-semibold">Saved Searches</span> — keyword searches tied to specific sources. Filter by source or track.</div>
                    <div><span className="font-semibold">Queue</span> — roles captured from sources awaiting qualification before applying.</div>
                  </div>
                </TooltipContent>
              </Tooltip>
            </div>

            <TabsContent value="due-today" className="mt-4">
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="relative min-w-[180px] flex-1">
                      <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                      <Input
                        className="h-9 pl-8 text-sm"
                        placeholder="Search items…"
                        value={dueSearch}
                        onChange={(e) => setDueSearch(e.target.value)}
                      />
                    </div>
                    <Select
                      value={duePriorityFilter}
                      onValueChange={(v) => setDuePriorityFilter(v as JobSourcePriority | "all")}
                    >
                      <SelectTrigger className="h-9 w-[120px] text-sm">
                        <SelectValue placeholder="Priority" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All priorities</SelectItem>
                        {SOURCE_PRIORITIES.map((p) => (
                          <SelectItem key={p} value={p}>Priority {p}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select
                      value={dueTypeFilter}
                      onValueChange={(v) => setDueTypeFilter(v as "all" | "source" | "savedSearch")}
                    >
                      <SelectTrigger className="h-9 w-[150px] text-sm">
                        <SelectValue placeholder="Type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All types</SelectItem>
                        <SelectItem value="source">Sources only</SelectItem>
                        <SelectItem value="savedSearch">Saved searches only</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowAllDue((v) => !v)}
                      className="text-xs text-muted-foreground"
                    >
                      {showAllDue ? "Due only" : `All (${scanItems.length})`}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {scanItems.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-border px-4 py-10 text-center text-sm text-muted-foreground">
                      Source Hub is ready. Your default source stack should appear here as soon as sync finishes.
                    </div>
                  ) : filteredDueItems.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-border px-4 py-10 text-center text-sm text-muted-foreground">
                      {dueScanItems.length === 0 && !showAllDue
                        ? "Nothing is due right now."
                        : "No items match the current filters."}
                    </div>
                  ) : (
                    <>
                      {filteredDueItems.map((entry) => {
                        const isSource = entry.kind === "source";
                        const sourceName = isSource
                          ? entry.item.name
                          : sourcesById.get(entry.item.sourceId)?.name ?? "Unknown source";

                        return (
                          <div
                            key={`${entry.kind}-${entry.item.id}`}
                            className="rounded-xl border border-border bg-background/80 p-4"
                          >
                            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                              <div className="space-y-2">
                                <div className="flex flex-wrap items-center gap-2">
                                  <div className="font-medium text-foreground">{entry.item.name}</div>
                                  <Badge variant="outline" className={getPriorityBadgeClass(entry.item.priority)}>
                                    {entry.item.priority}
                                  </Badge>
                                  <Badge variant="outline">
                                    {isSource ? "Source" : "Saved Search"}
                                  </Badge>
                                  {isDue(entry.item.lastCheckedAt, entry.item.cadence) ? (
                                    <Badge variant="outline" className="border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-300">
                                      Due
                                    </Badge>
                                  ) : null}
                                </div>
                                <div className="text-sm text-muted-foreground">
                                  {isSource ? (entry.item as JobSource).bestFor : sourceName}
                                </div>
                                <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                                  <span>Cadence: {CADENCE_LABELS[entry.item.cadence]}</span>
                                  <span>Last checked: {formatDateLabel(entry.item.lastCheckedAt)}</span>
                                </div>
                              </div>
                              <div className="flex flex-wrap items-center gap-2">
                                <Button
                                  size="sm"
                                  onClick={() =>
                                    openCapture(
                                      isSource
                                        ? { sourceId: entry.item.id, sourceUrl: entry.item.url }
                                        : {
                                            sourceId: (entry.item as SavedSearch).sourceId,
                                            savedSearchId: entry.item.id,
                                            sourceUrl: entry.item.url,
                                          }
                                    )
                                  }
                                >
                                  <Plus className="mr-1 h-3.5 w-3.5" />
                                  Capture role
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() =>
                                    isSource
                                      ? void handleMarkSourceChecked(entry.item as JobSource)
                                      : void handleMarkSavedSearchChecked(entry.item as SavedSearch)
                                  }
                                >
                                  <CheckCheck className="mr-1 h-3.5 w-3.5" />
                                  Mark checked
                                </Button>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button size="icon" variant="ghost" onClick={() => openUrl(entry.item.url)} aria-label="Open in browser">
                                      <ExternalLink className="h-3.5 w-3.5" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent side="top">Open in browser</TooltipContent>
                                </Tooltip>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                      <div className="pt-1 text-xs text-muted-foreground">
                        {showAllDue
                          ? `All ${scanItems.length} scan items`
                          : `${dueScanItems.length} item${dueScanItems.length !== 1 ? "s" : ""} due`}
                        {filteredDueItems.length !== (showAllDue ? scanItems : dueScanItems).length
                          ? ` · ${filteredDueItems.length} shown after filtering`
                          : ""}
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="sources" className="mt-4">
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="relative min-w-[180px] flex-1">
                      <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                      <Input
                        className="h-9 pl-8 text-sm"
                        placeholder="Search sources…"
                        value={sourcesSearch}
                        onChange={(e) => setSourcesSearch(e.target.value)}
                      />
                    </div>
                    <Select
                      value={sourcesPriorityFilter}
                      onValueChange={(v) => setSourcesPriorityFilter(v as JobSourcePriority | "all")}
                    >
                      <SelectTrigger className="h-9 w-[120px] text-sm">
                        <SelectValue placeholder="Priority" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All priorities</SelectItem>
                        {SOURCE_PRIORITIES.map((p) => (
                          <SelectItem key={p} value={p}>Priority {p}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select
                      value={sourcesCategoryFilter}
                      onValueChange={(v) => setSourcesCategoryFilter(v as JobSourceCategory | "all")}
                    >
                      <SelectTrigger className="h-9 w-[140px] text-sm">
                        <SelectValue placeholder="Category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All categories</SelectItem>
                        {SOURCE_CATEGORIES.map((c) => (
                          <SelectItem key={c} value={c}>{SOURCE_CATEGORY_LABELS[c]}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select
                      value={sourcesActiveFilter}
                      onValueChange={(v) => setSourcesActiveFilter(v as "all" | "active" | "inactive")}
                    >
                      <SelectTrigger className="h-9 w-[110px] text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All</SelectItem>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="hidden md:block">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Source</TableHead>
                          <TableHead>Category</TableHead>
                          <TableHead>Best for</TableHead>
                          <TableHead>Priority</TableHead>
                          <TableHead>Cadence</TableHead>
                          <TableHead>Last checked</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredSources.map((source) => (
                          <TableRow key={source.id} className={source.active ? "" : "opacity-50"}>
                            <TableCell className="font-medium">{source.name}</TableCell>
                            <TableCell>{SOURCE_CATEGORY_LABELS[source.category]}</TableCell>
                            <TableCell className="max-w-[340px] text-muted-foreground">{source.bestFor}</TableCell>
                            <TableCell>
                              <Badge variant="outline" className={getPriorityBadgeClass(source.priority)}>
                                {source.priority}
                              </Badge>
                            </TableCell>
                            <TableCell>{CADENCE_LABELS[source.cadence]}</TableCell>
                            <TableCell>{formatDateLabel(source.lastCheckedAt)}</TableCell>
                            <TableCell>
                              <div className="flex items-center justify-end gap-1">
                                <Button size="sm" variant="outline" onClick={() => openSourceEditor(source)}>Edit</Button>
                                <Button size="sm" variant="ghost" onClick={() => void handleMarkSourceChecked(source)}>Mark checked</Button>
                                <Button size="sm" variant="ghost" onClick={() => void handleToggleSource(source)}>
                                  {source.active ? "Disable" : "Enable"}
                                </Button>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button size="icon" variant="ghost" onClick={() => openUrl(source.url)} aria-label="Open source">
                                      <ExternalLink className="h-3.5 w-3.5" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent side="top">Open source</TooltipContent>
                                </Tooltip>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                        {filteredSources.length === 0 && (
                          <TableRow>
                            <TableCell colSpan={7} className="py-8 text-center text-sm text-muted-foreground">
                              No sources match the current filters.
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                  <div className="grid gap-3 md:hidden">
                    {filteredSources.map((source) => (
                      <div key={source.id} className={`rounded-xl border border-border p-4 ${source.active ? "" : "opacity-50"}`}>
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="font-medium">{source.name}</div>
                            <div className="text-sm text-muted-foreground">{source.bestFor}</div>
                          </div>
                          <Badge variant="outline" className={getPriorityBadgeClass(source.priority)}>{source.priority}</Badge>
                        </div>
                        <div className="mt-3 flex flex-wrap gap-3 text-xs text-muted-foreground">
                          <span>{SOURCE_CATEGORY_LABELS[source.category]}</span>
                          <span>{CADENCE_LABELS[source.cadence]}</span>
                          <span>{formatDateLabel(source.lastCheckedAt)}</span>
                        </div>
                        <div className="mt-4 flex flex-wrap gap-2">
                          <Button size="sm" variant="outline" onClick={() => openSourceEditor(source)}>Edit</Button>
                          <Button size="sm" variant="ghost" onClick={() => void handleMarkSourceChecked(source)}>Mark checked</Button>
                          <Button size="sm" variant="ghost" onClick={() => void handleToggleSource(source)}>
                            {source.active ? "Disable" : "Enable"}
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => openUrl(source.url)}>
                            <ExternalLink className="mr-1 h-3.5 w-3.5" />
                            Open
                          </Button>
                        </div>
                      </div>
                    ))}
                    {filteredSources.length === 0 && (
                      <div className="rounded-xl border border-dashed border-border px-4 py-10 text-center text-sm text-muted-foreground">
                        No sources match the current filters.
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="saved-searches" className="mt-4">
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="relative min-w-[180px] flex-1">
                      <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                      <Input
                        className="h-9 pl-8 text-sm"
                        placeholder="Search saved searches…"
                        value={searchesSearch}
                        onChange={(e) => setSearchesSearch(e.target.value)}
                      />
                    </div>
                    <Select
                      value={searchesPriorityFilter}
                      onValueChange={(v) => setSearchesPriorityFilter(v as JobSourcePriority | "all")}
                    >
                      <SelectTrigger className="h-9 w-[120px] text-sm">
                        <SelectValue placeholder="Priority" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All priorities</SelectItem>
                        {SOURCE_PRIORITIES.map((p) => (
                          <SelectItem key={p} value={p}>Priority {p}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select value={searchesSourceFilter} onValueChange={setSearchesSourceFilter}>
                      <SelectTrigger className="h-9 w-[150px] text-sm">
                        <SelectValue placeholder="Source" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All sources</SelectItem>
                        {sources.map((s) => (
                          <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select
                      value={searchesActiveFilter}
                      onValueChange={(v) => setSearchesActiveFilter(v as "all" | "active" | "inactive")}
                    >
                      <SelectTrigger className="h-9 w-[110px] text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All</SelectItem>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="hidden md:block">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Search name</TableHead>
                          <TableHead>Source</TableHead>
                          <TableHead>Target track</TableHead>
                          <TableHead>Priority</TableHead>
                          <TableHead>Cadence</TableHead>
                          <TableHead>Last checked</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredSavedSearches.map((savedSearch) => (
                          <TableRow key={savedSearch.id} className={savedSearch.active ? "" : "opacity-50"}>
                            <TableCell className="font-medium">{savedSearch.name}</TableCell>
                            <TableCell>{sourcesById.get(savedSearch.sourceId)?.name ?? "Unknown source"}</TableCell>
                            <TableCell>{savedSearch.targetTrack}</TableCell>
                            <TableCell>
                              <Badge variant="outline" className={getPriorityBadgeClass(savedSearch.priority)}>
                                {savedSearch.priority}
                              </Badge>
                            </TableCell>
                            <TableCell>{CADENCE_LABELS[savedSearch.cadence]}</TableCell>
                            <TableCell>{formatDateLabel(savedSearch.lastCheckedAt)}</TableCell>
                            <TableCell>
                              <div className="flex items-center justify-end gap-1">
                                <Button size="sm" onClick={() => openCapture({ sourceId: savedSearch.sourceId, savedSearchId: savedSearch.id, sourceUrl: savedSearch.url })}>Capture role</Button>
                                <Button size="sm" variant="outline" onClick={() => openSavedSearchEditor(savedSearch)}>Edit</Button>
                                <Button size="sm" variant="ghost" onClick={() => void handleMarkSavedSearchChecked(savedSearch)}>Mark checked</Button>
                                <Button size="sm" variant="ghost" onClick={() => void handleToggleSavedSearch(savedSearch)}>
                                  {savedSearch.active ? "Disable" : "Enable"}
                                </Button>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button size="icon" variant="ghost" onClick={() => openUrl(savedSearch.url)} aria-label="Open search">
                                      <ExternalLink className="h-3.5 w-3.5" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent side="top">Open search</TooltipContent>
                                </Tooltip>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                        {filteredSavedSearches.length === 0 && (
                          <TableRow>
                            <TableCell colSpan={7} className="py-8 text-center text-sm text-muted-foreground">
                              No saved searches match the current filters.
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                  <div className="grid gap-3 md:hidden">
                    {filteredSavedSearches.map((savedSearch) => (
                      <div key={savedSearch.id} className={`rounded-xl border border-border p-4 ${savedSearch.active ? "" : "opacity-50"}`}>
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="font-medium">{savedSearch.name}</div>
                            <div className="text-sm text-muted-foreground">
                              {sourcesById.get(savedSearch.sourceId)?.name ?? "Unknown source"} · {savedSearch.targetTrack}
                            </div>
                          </div>
                          <Badge variant="outline" className={getPriorityBadgeClass(savedSearch.priority)}>{savedSearch.priority}</Badge>
                        </div>
                        <div className="mt-3 flex flex-wrap gap-3 text-xs text-muted-foreground">
                          <span>{CADENCE_LABELS[savedSearch.cadence]}</span>
                          <span>{formatDateLabel(savedSearch.lastCheckedAt)}</span>
                        </div>
                        <div className="mt-4 flex flex-wrap gap-2">
                          <Button size="sm" onClick={() => openCapture({ sourceId: savedSearch.sourceId, savedSearchId: savedSearch.id, sourceUrl: savedSearch.url })}>Capture role</Button>
                          <Button size="sm" variant="outline" onClick={() => openSavedSearchEditor(savedSearch)}>Edit</Button>
                          <Button size="sm" variant="ghost" onClick={() => void handleMarkSavedSearchChecked(savedSearch)}>Mark checked</Button>
                          <Button size="sm" variant="ghost" onClick={() => void handleToggleSavedSearch(savedSearch)}>
                            {savedSearch.active ? "Disable" : "Enable"}
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => openUrl(savedSearch.url)}>
                            <ExternalLink className="mr-1 h-3.5 w-3.5" />
                            Open
                          </Button>
                        </div>
                      </div>
                    ))}
                    {filteredSavedSearches.length === 0 && (
                      <div className="rounded-xl border border-dashed border-border px-4 py-10 text-center text-sm text-muted-foreground">
                        No saved searches match the current filters.
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="queue" className="mt-4">
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="relative min-w-[180px] flex-1">
                      <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                      <Input
                        className="h-9 pl-8 text-sm"
                        placeholder="Search roles…"
                        value={queueSearch}
                        onChange={(e) => setQueueSearch(e.target.value)}
                      />
                    </div>
                    <Select value={queueFitFilter} onValueChange={setQueueFitFilter}>
                      <SelectTrigger className="h-9 w-[120px] text-sm">
                        <SelectValue placeholder="Fit score" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All fit scores</SelectItem>
                        {[1, 2, 3, 4, 5].map((n) => (
                          <SelectItem key={n} value={String(n)}>Fit {n}/5</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select
                      value={queueStatusFilter}
                      onValueChange={(v) => setQueueStatusFilter(v as DiscoveryStatus | "all")}
                    >
                      <SelectTrigger className="h-9 w-[140px] text-sm">
                        <SelectValue placeholder="Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All statuses</SelectItem>
                        {DISCOVERY_QUEUE_STATUSES.map((s) => (
                          <SelectItem key={s} value={s}>{DISCOVERY_STATUS_LABELS[s]}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {filteredQueue.length > 0 ? (
                    filteredQueue.map((role) => {
                      const company = companiesById.get(role.companyId);
                      const sourceName =
                        (role.savedSearchId
                          ? sourcesById.get(savedSearchesById.get(role.savedSearchId)?.sourceId ?? "")
                          : undefined)?.name ??
                        (role.sourceId ? sourcesById.get(role.sourceId)?.name : undefined) ??
                        "Manual capture";

                      return (
                        <div
                          key={role.id}
                          className={`rounded-xl border p-4 ${
                            role.fitScore >= 4
                              ? "border-foreground/20 bg-neutral-100/70 dark:bg-neutral-900/60"
                              : "border-border bg-background/80"
                          }`}
                        >
                          <div className="flex flex-col gap-3">
                            <div className="flex flex-wrap items-start justify-between gap-3">
                              <div>
                                <div className="font-medium text-foreground">{role.title}</div>
                                <div className="text-sm text-muted-foreground">
                                  {company?.name ?? "Unknown company"} · {sourceName}
                                </div>
                              </div>
                              <div className="flex flex-wrap gap-2">
                                <Badge variant="outline">Fit {role.fitScore}/5</Badge>
                                <Badge
                                  variant="outline"
                                  className={
                                    role.discoveryStatus === "to_apply"
                                      ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-300"
                                      : undefined
                                  }
                                >
                                  {DISCOVERY_STATUS_LABELS[role.discoveryStatus ?? "discovered"]}
                                </Badge>
                                <Badge variant="outline">{role.track}</Badge>
                              </div>
                            </div>
                            <div className="grid gap-2 text-sm text-muted-foreground md:grid-cols-2">
                              <div>
                                <span className="font-medium text-foreground">Notes:</span>{" "}
                                {role.qualificationNotes || "No qualification notes yet."}
                              </div>
                              <div>
                                <span className="font-medium text-foreground">Next step:</span>{" "}
                                {role.nextStep || "Clarify next move."}
                              </div>
                            </div>
                            <div className="flex flex-wrap items-center gap-2">
                              <Button
                                size="sm"
                                onClick={() =>
                                  void handleQueueAction(
                                    role,
                                    { discoveryStatus: "to_apply", status: "to_apply" },
                                    `${role.title} moved to apply queue`
                                  )
                                }
                              >
                                Move to apply queue
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                  void handleQueueAction(
                                    role,
                                    { discoveryStatus: "qualified" },
                                    `${role.title} marked qualified`
                                  )
                                }
                              >
                                Qualify
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="text-muted-foreground"
                                onClick={() =>
                                  void handleQueueAction(
                                    role,
                                    { discoveryStatus: "archived", status: "closed" },
                                    `${role.title} archived`
                                  )
                                }
                              >
                                <Archive className="mr-1 h-3.5 w-3.5" />
                                Archive
                              </Button>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button size="icon" variant="ghost" disabled={!role.url} onClick={() => openUrl(role.url)} aria-label="Open role URL">
                                    <ExternalLink className="h-3.5 w-3.5" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent side="top">Open role URL</TooltipContent>
                              </Tooltip>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button asChild size="icon" variant="ghost" aria-label="Open CV Optimizer">
                                    <Link to={appPath("/cv-optimizer")}>
                                      <WandSparkles className="h-3.5 w-3.5" />
                                    </Link>
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent side="top">Open CV Optimizer</TooltipContent>
                              </Tooltip>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="rounded-xl border border-dashed border-border px-4 py-10 text-center text-sm text-muted-foreground">
                      {qualificationQueue.length === 0
                        ? "Captured roles that are still worth qualifying will show up here."
                        : "No roles match the current filters."}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </AppPageShell>

      <Sheet open={captureOpen} onOpenChange={setCaptureOpen}>
        <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-2xl">
          <SheetHeader>
            <SheetTitle>Quick Capture</SheetTitle>
            <SheetDescription>
              Capture a role now, then decide later if it deserves a full application pass.
            </SheetDescription>
          </SheetHeader>
          <div className="grid gap-4 px-4 pb-4 md:grid-cols-2">
            <div className="md:col-span-2">
              <Input
                value={captureDraft.jobUrl}
                onChange={(event) =>
                  setCaptureDraft((current) => ({ ...current, jobUrl: event.target.value }))
                }
                placeholder="Job URL or source URL"
              />
            </div>
            <Select
              value={captureDraft.sourceId || "none"}
              onValueChange={(value) =>
                setCaptureDraft((current) => {
                  const nextSourceId = value === "none" ? "" : value;
                  const selectedSavedSearch = current.savedSearchId
                    ? savedSearchesById.get(current.savedSearchId)
                    : undefined;

                  return {
                    ...current,
                    sourceId: nextSourceId,
                    savedSearchId:
                      selectedSavedSearch && selectedSavedSearch.sourceId !== nextSourceId
                        ? ""
                        : current.savedSearchId,
                  };
                })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Source" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No source selected</SelectItem>
                {sources.map((source) => (
                  <SelectItem key={source.id} value={source.id}>
                    {source.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={captureDraft.savedSearchId || "none"}
              onValueChange={(value) =>
                setCaptureDraft((current) => {
                  if (value === "none") {
                    return { ...current, savedSearchId: "" };
                  }

                  const selectedSavedSearch = savedSearchesById.get(value);
                  if (!selectedSavedSearch) {
                    return { ...current, savedSearchId: "" };
                  }

                  return {
                    ...current,
                    savedSearchId: value,
                    sourceId: selectedSavedSearch.sourceId,
                    track: mapExtendedTrackToRoleTrack(selectedSavedSearch.targetTrack),
                    jobUrl: current.jobUrl || selectedSavedSearch.url,
                  };
                })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Saved search" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No saved search</SelectItem>
                {filteredSavedSearchOptions.map((savedSearch) => (
                  <SelectItem key={savedSearch.id} value={savedSearch.id}>
                    {savedSearch.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={captureDraft.existingCompanyId || "none"}
              onValueChange={(value) =>
                setCaptureDraft((current) => ({
                  ...current,
                  existingCompanyId: value === "none" ? "" : value,
                }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Existing company" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Select existing company</SelectItem>
                {companies.map((company) => (
                  <SelectItem key={company.id} value={company.id}>
                    {company.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              value={captureDraft.newCompanyName}
              onChange={(event) =>
                setCaptureDraft((current) => ({ ...current, newCompanyName: event.target.value }))
              }
              placeholder="Or enter new company name"
            />
            <Input
              value={captureDraft.roleTitle}
              onChange={(event) =>
                setCaptureDraft((current) => ({ ...current, roleTitle: event.target.value }))
              }
              placeholder="Role title"
            />
            <Input
              value={captureDraft.location}
              onChange={(event) =>
                setCaptureDraft((current) => ({ ...current, location: event.target.value }))
              }
              placeholder="Location"
            />
            <Input
              value={captureDraft.seniority}
              onChange={(event) =>
                setCaptureDraft((current) => ({ ...current, seniority: event.target.value }))
              }
              placeholder="Seniority"
            />
            <Select
              value={captureDraft.track}
              onValueChange={(value) =>
                setCaptureDraft((current) => ({ ...current, track: value as JobTrack }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TRACK_OPTIONS.map((track) => (
                  <SelectItem key={track} value={track}>
                    {track}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={String(captureDraft.fitScore)}
              onValueChange={(value) =>
                setCaptureDraft((current) => ({
                  ...current,
                  fitScore: Number(value) as CaptureDraft["fitScore"],
                }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[1, 2, 3, 4, 5].map((score) => (
                  <SelectItem key={score} value={String(score)}>
                    Fit {score}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={captureDraft.discoveryStatus}
              onValueChange={(value) =>
                setCaptureDraft((current) => ({
                  ...current,
                  discoveryStatus: value as DiscoveryStatus,
                }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DISCOVERY_QUEUE_STATUSES.map((status) => (
                  <SelectItem key={status} value={status}>
                    {DISCOVERY_STATUS_LABELS[status]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              value={captureDraft.nextStep}
              onChange={(event) =>
                setCaptureDraft((current) => ({ ...current, nextStep: event.target.value }))
              }
              placeholder="Next step"
              className="md:col-span-2"
            />
            <Textarea
              value={captureDraft.qualificationNotes}
              onChange={(event) =>
                setCaptureDraft((current) => ({
                  ...current,
                  qualificationNotes: event.target.value,
                }))
              }
              placeholder="Qualification notes"
              rows={4}
              className="md:col-span-2"
            />
            <Textarea
              value={captureDraft.qualificationRisks}
              onChange={(event) =>
                setCaptureDraft((current) => ({
                  ...current,
                  qualificationRisks: event.target.value,
                }))
              }
              placeholder="Qualification risks"
              rows={3}
              className="md:col-span-2"
            />
            <Textarea
              value={captureDraft.jobDescription}
              onChange={(event) =>
                setCaptureDraft((current) => ({
                  ...current,
                  jobDescription: event.target.value,
                }))
              }
              placeholder="Optional job description"
              rows={8}
              className="md:col-span-2"
            />
          </div>
          <SheetFooter className="border-t">
            <div className="flex w-full flex-wrap items-center justify-between gap-2">
              <div className="text-xs text-muted-foreground">
                Roles captured here land in Roles immediately and stay visible in the qualification queue until processed.
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" onClick={() => setCaptureOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={() => void handleSaveCapture()}>Save capture</Button>
              </div>
            </div>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      <Dialog
        open={addSourceOpen}
        onOpenChange={(open) => {
          setAddSourceOpen(open);
          if (!open) {
            setNewSourceDraft(EMPTY_SOURCE_DRAFT);
          }
        }}
      >
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Add Source</DialogTitle>
            <DialogDescription>
              Add a new discovery source to your scan stack.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 md:grid-cols-2">
            <Input
              value={newSourceDraft.name}
              onChange={(event) =>
                setNewSourceDraft((current) => ({ ...current, name: event.target.value }))
              }
              placeholder="Source name"
              className="md:col-span-2"
            />
            <Input
              value={newSourceDraft.url}
              onChange={(event) =>
                setNewSourceDraft((current) => ({ ...current, url: event.target.value }))
              }
              placeholder="URL"
              className="md:col-span-2"
            />
            <Select
              value={newSourceDraft.category}
              onValueChange={(value) =>
                setNewSourceDraft((current) => ({
                  ...current,
                  category: value as JobSourceCategory,
                }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SOURCE_CATEGORIES.map((category) => (
                  <SelectItem key={category} value={category}>
                    {SOURCE_CATEGORY_LABELS[category]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={newSourceDraft.priority}
              onValueChange={(value) =>
                setNewSourceDraft((current) => ({
                  ...current,
                  priority: value as JobSourcePriority,
                }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SOURCE_PRIORITIES.map((priority) => (
                  <SelectItem key={priority} value={priority}>
                    Priority {priority}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={newSourceDraft.cadence}
              onValueChange={(value) =>
                setNewSourceDraft((current) => ({
                  ...current,
                  cadence: value as SourceCadence,
                }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SOURCE_CADENCES.map((cadence) => (
                  <SelectItem key={cadence} value={cadence}>
                    {CADENCE_LABELS[cadence]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              value={newSourceDraft.bestFor}
              onChange={(event) =>
                setNewSourceDraft((current) => ({ ...current, bestFor: event.target.value }))
              }
              placeholder="Best for"
              className="md:col-span-2"
            />
            <Textarea
              value={newSourceDraft.notes}
              onChange={(event) =>
                setNewSourceDraft((current) => ({ ...current, notes: event.target.value }))
              }
              placeholder="Notes"
              rows={4}
              className="md:col-span-2"
            />
            <div className="md:col-span-2 flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setAddSourceOpen(false)}>
                Cancel
              </Button>
              <Button onClick={() => void handleAddSource()}>Add source</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(editingSource)} onOpenChange={(open) => !open && setEditingSource(null)}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Edit Source</DialogTitle>
            <DialogDescription>Refine how this source behaves in your daily scan loop.</DialogDescription>
          </DialogHeader>
          {sourceEditDraft ? (
            <div className="grid gap-3 md:grid-cols-2">
              <Input
                value={sourceEditDraft.name}
                onChange={(event) =>
                  setSourceEditDraft((current) =>
                    current ? { ...current, name: event.target.value } : current
                  )
                }
                placeholder="Source name"
                className="md:col-span-2"
              />
              <Input
                value={sourceEditDraft.url}
                onChange={(event) =>
                  setSourceEditDraft((current) =>
                    current ? { ...current, url: event.target.value } : current
                  )
                }
                placeholder="URL"
                className="md:col-span-2"
              />
              <Select
                value={sourceEditDraft.category}
                onValueChange={(value) =>
                  setSourceEditDraft((current) =>
                    current ? { ...current, category: value as JobSourceCategory } : current
                  )
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SOURCE_CATEGORIES.map((category) => (
                    <SelectItem key={category} value={category}>
                      {SOURCE_CATEGORY_LABELS[category]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={sourceEditDraft.priority}
                onValueChange={(value) =>
                  setSourceEditDraft((current) =>
                    current ? { ...current, priority: value as JobSourcePriority } : current
                  )
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SOURCE_PRIORITIES.map((priority) => (
                    <SelectItem key={priority} value={priority}>
                      Priority {priority}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={sourceEditDraft.cadence}
                onValueChange={(value) =>
                  setSourceEditDraft((current) =>
                    current ? { ...current, cadence: value as SourceCadence } : current
                  )
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SOURCE_CADENCES.map((cadence) => (
                    <SelectItem key={cadence} value={cadence}>
                      {CADENCE_LABELS[cadence]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                value={sourceEditDraft.bestFor}
                onChange={(event) =>
                  setSourceEditDraft((current) =>
                    current ? { ...current, bestFor: event.target.value } : current
                  )
                }
                placeholder="Best for"
                className="md:col-span-2"
              />
              <Textarea
                value={sourceEditDraft.notes}
                onChange={(event) =>
                  setSourceEditDraft((current) =>
                    current ? { ...current, notes: event.target.value } : current
                  )
                }
                placeholder="Notes"
                rows={4}
                className="md:col-span-2"
              />
              <div className="md:col-span-2 flex justify-end gap-2">
                <Button variant="ghost" onClick={() => setEditingSource(null)}>
                  Cancel
                </Button>
                <Button onClick={() => void saveSourceEditor()}>Save source</Button>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(editingSavedSearch)}
        onOpenChange={(open) => !open && setEditingSavedSearch(null)}
      >
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Edit Saved Search</DialogTitle>
            <DialogDescription>Keep the search query and cadence aligned with your current hunt.</DialogDescription>
          </DialogHeader>
          {savedSearchEditDraft ? (
            <div className="grid gap-3 md:grid-cols-2">
              <Select
                value={savedSearchEditDraft.sourceId}
                onValueChange={(value) =>
                  setSavedSearchEditDraft((current) =>
                    current ? { ...current, sourceId: value } : current
                  )
                }
              >
                <SelectTrigger className="md:col-span-2">
                  <SelectValue placeholder="Source" />
                </SelectTrigger>
                <SelectContent>
                  {sources.map((source) => (
                    <SelectItem key={source.id} value={source.id}>
                      {source.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                value={savedSearchEditDraft.name}
                onChange={(event) =>
                  setSavedSearchEditDraft((current) =>
                    current ? { ...current, name: event.target.value } : current
                  )
                }
                placeholder="Search name"
                className="md:col-span-2"
              />
              <Input
                value={savedSearchEditDraft.query}
                onChange={(event) =>
                  setSavedSearchEditDraft((current) =>
                    current ? { ...current, query: event.target.value } : current
                  )
                }
                placeholder="Query"
                className="md:col-span-2"
              />
              <Input
                value={savedSearchEditDraft.url}
                onChange={(event) =>
                  setSavedSearchEditDraft((current) =>
                    current ? { ...current, url: event.target.value } : current
                  )
                }
                placeholder="URL"
                className="md:col-span-2"
              />
              <Select
                value={savedSearchEditDraft.targetTrack}
                onValueChange={(value) =>
                  setSavedSearchEditDraft((current) =>
                    current ? { ...current, targetTrack: value as ExtendedJobTrack } : current
                  )
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {EXTENDED_TRACK_OPTIONS.map((track) => (
                    <SelectItem key={track} value={track}>
                      {track}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={savedSearchEditDraft.priority}
                onValueChange={(value) =>
                  setSavedSearchEditDraft((current) =>
                    current ? { ...current, priority: value as JobSourcePriority } : current
                  )
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SOURCE_PRIORITIES.map((priority) => (
                    <SelectItem key={priority} value={priority}>
                      Priority {priority}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={savedSearchEditDraft.cadence}
                onValueChange={(value) =>
                  setSavedSearchEditDraft((current) =>
                    current ? { ...current, cadence: value as SourceCadence } : current
                  )
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SOURCE_CADENCES.map((cadence) => (
                    <SelectItem key={cadence} value={cadence}>
                      {CADENCE_LABELS[cadence]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Textarea
                value={savedSearchEditDraft.notes}
                onChange={(event) =>
                  setSavedSearchEditDraft((current) =>
                    current ? { ...current, notes: event.target.value } : current
                  )
                }
                placeholder="Notes"
                rows={4}
                className="md:col-span-2"
              />
              <div className="md:col-span-2 flex justify-end gap-2">
                <Button variant="ghost" onClick={() => setEditingSavedSearch(null)}>
                  Cancel
                </Button>
                <Button onClick={() => void saveSavedSearchEditor()}>Save search</Button>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </JobOsLayout>
  );
}
