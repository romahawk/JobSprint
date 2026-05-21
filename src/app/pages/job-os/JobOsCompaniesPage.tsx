import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
  AlertDialogTrigger,
} from "../../components/ui/alert-dialog";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Archive,
  ArchiveRestore,
  ChevronDown,
  ChevronRight,
  Download,
  Eye,
  Link,
  Pencil,
  Plus,
  Upload,
  X,
} from "lucide-react";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../../components/ui/dialog";
import { Input } from "../../components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../components/ui/table";
import { Textarea } from "../../components/ui/textarea";
import { Checkbox } from "../../components/ui/checkbox";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../../components/ui/tooltip";
import { useApp } from "../../context";
import { useJobOsContext } from "../../context/JobOsContext";
import { usePagination } from "../../hooks/usePagination";
import { PaginationControls } from "../../components/ui/PaginationControls";
import { JobOsLayout } from "../../components/job-os/JobOsLayout";
import { JobOsTransferControls } from "../../components/job-os/JobOsTransferControls";
import { PasteLinkImportDialog } from "../../components/job-os/PasteLinkImportDialog";
import { getDefaultCvAsset } from "../../services/cvAssets";
import { buildArchiveUpdates, buildRestoreUpdates, isArchived, STRATEGIC_RESET_ARCHIVE_REASON } from "../../services/jobOsArchive";
import type { CompanyPriority, CompanyStatus, JobOsCompany } from "../../types/jobOs";

const STATUS_VALUES: CompanyStatus[] = [
  "Research",
  "Target",
  "Active",
  "Applied",
  "Interviewing",
  "Closed",
];
const ROMAN_TARGET_COMPANIES_IMPORT_URL = "/templates/roman-target-companies-jobsprint-import.csv";

function parseCsvLine(line: string): string[] {
  const values: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    const next = line[i + 1];
    if (char === '"' && inQuotes && next === '"') {
      current += '"';
      i += 1;
      continue;
    }
    if (char === '"') {
      inQuotes = !inQuotes;
      continue;
    }
    if (char === "," && !inQuotes) {
      values.push(current.trim());
      current = "";
      continue;
    }
    current += char;
  }
  values.push(current.trim());
  return values;
}

function getTierFromNotes(notes?: string): string | null {
  const tier = notes?.match(/\bTier:\s*([^|]+)/i)?.[1]?.trim();
  return tier || null;
}

function getTierExplanation(tier: string | null): string {
  const normalizedTier = tier?.toUpperCase();
  if (normalizedTier === "S") {
    return "Tier S: strongest strategic fit. Prioritize first for applications, tailoring, and networking.";
  }
  if (normalizedTier === "A") {
    return "Tier A: strong fit. Keep in the active weekly target set after Tier S companies.";
  }
  if (normalizedTier === "B") {
    return "Tier B: secondary target. Pursue when a matching role appears or capacity allows.";
  }
  if (normalizedTier === "C") {
    return "Tier C: exploratory or lower-fit target. Keep for research, not daily execution.";
  }
  return "No tier marker found. This note is general research context for the company.";
}

function normalizePriority(value: string): CompanyPriority | null {
  const cleaned = value.trim().toUpperCase();
  if (cleaned === "A" || cleaned === "B" || cleaned === "C") {
    return cleaned;
  }
  return null;
}

function normalizeStatus(value: string): CompanyStatus | null {
  const cleaned = value.trim().toLowerCase();
  const match = STATUS_VALUES.find((status) => status.toLowerCase() === cleaned);
  return match ?? null;
}

function normalizeCompanyKey(value: string): string {
  return value
    .normalize("NFKC")
    .replace(/\u00A0/g, " ")
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase();
}

function normalizeIndustryKey(value: string): string {
  return value.trim().replace(/\s+/g, " ").toLowerCase();
}

type CompanySortKey =
  | "name"
  | "industry"
  | "size"
  | "remotePolicy"
  | "priority"
  | "status"
  | "notes";

export default function JobOsCompaniesPage() {
  const {
    companies,
    roles,
    outreach,
    applications,
    assets,
    addCompany,
    updateCompany,
    addRole,
    updateRole,
    addOutreach,
    updateOutreach,
    addApplication,
    updateApplication,
    syncNotice,
    exportState,
    replaceState,
  } = useJobOsContext();

  const { session } = useApp();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const targetListAutoImportRef = useRef(false);
  const [addFormOpen, setAddFormOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [isImporting, setIsImporting] = useState(false);
  const [bulkText, setBulkText] = useState("");
  const [importNotice, setImportNotice] = useState<string | null>(null);
  const [lockAfterImport, setLockAfterImport] = useState(false);
  const [companyListLocked, setCompanyListLocked] = useState(false);
  const [sortKey, setSortKey] = useState<CompanySortKey>("name");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [showArchived, setShowArchived] = useState(false);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);
  const [detailMode, setDetailMode] = useState<"view" | "edit">("view");
  const [editDraft, setEditDraft] = useState<Partial<JobOsCompany>>({});
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [pasteLinkOpen, setPasteLinkOpen] = useState(false);
  const [customIndustries, setCustomIndustries] = useState<string[]>([]);
  const [industryDialogOpen, setIndustryDialogOpen] = useState(false);
  const [newIndustry, setNewIndustry] = useState("");
  const [editingIndustry, setEditingIndustry] = useState<string | null>(null);
  const [editingIndustryDraft, setEditingIndustryDraft] = useState("");
  const [draft, setDraft] = useState<Omit<JobOsCompany, "id" | "createdAt" | "updatedAt">>({
    name: "",
    industry: "",
    size: "",
    remotePolicy: "",
    priority: "B",
    status: "Research",
    notes: "",
  });

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return companies.filter((c) =>
      (showArchived ? isArchived(c) : !isArchived(c)) &&
      [c.name, c.industry, c.notes, c.archivedReason ?? ""].join(" ").toLowerCase().includes(q)
    );
  }, [companies, search, showArchived]);
  const defaultCv = getDefaultCvAsset(assets.cvs);
  const activeCompanies = useMemo(
    () => companies.filter((company) => !isArchived(company)),
    [companies]
  );
  const archivedCompanies = useMemo(
    () => companies.filter(isArchived),
    [companies]
  );

  const sortedCompanies = useMemo(() => {
    const priorityRank: Record<CompanyPriority, number> = { A: 0, B: 1, C: 2 };
    const statusRank: Record<CompanyStatus, number> = {
      Research: 0,
      Target: 1,
      Active: 2,
      Applied: 3,
      Interviewing: 4,
      Closed: 5,
    };
    const rows = [...filtered];
    rows.sort((a, b) => {
      let cmp = 0;
      switch (sortKey) {
        case "priority":
          cmp = priorityRank[a.priority] - priorityRank[b.priority];
          break;
        case "status":
          cmp = statusRank[a.status] - statusRank[b.status];
          break;
        default:
          cmp = (a[sortKey] || "").localeCompare(b[sortKey] || "", undefined, {
            sensitivity: "base",
          });
      }
      return sortDir === "asc" ? cmp : -cmp;
    });
    return rows;
  }, [filtered, sortDir, sortKey]);

  const COMPANIES_PAGE_SIZE = 10;
  const {
    page: companiesPage,
    totalPages: companiesTotalPages,
    pageItems: pagedCompanies,
    setPage: setCompaniesPage,
    resetPage: resetCompaniesPage,
  } = usePagination(sortedCompanies, COMPANIES_PAGE_SIZE);

  const selectedCompany = companies.find((c) => c.id === selectedCompanyId) ?? null;
  const lockStorageKey = `job_os_companies_lock_${session?.userId ?? "anon"}`;
  const industryStorageKey = `job_os_industries_${session?.userId ?? "anon"}`;
  const industryOptions = useMemo(() => {
    const byKey = new Map<string, string>();
    [...activeCompanies.map((company) => company.industry), ...customIndustries].forEach((industry) => {
      const cleaned = industry.trim().replace(/\s+/g, " ");
      if (!cleaned) return;
      byKey.set(normalizeIndustryKey(cleaned), cleaned);
    });
    return Array.from(byKey.values()).sort((a, b) =>
      a.localeCompare(b, undefined, { sensitivity: "base" })
    );
  }, [activeCompanies, customIndustries]);

  useEffect(() => {
    if (!session?.userId) return;
    try {
      const raw = localStorage.getItem(lockStorageKey);
      setCompanyListLocked(raw === "true");
    } catch {
      setCompanyListLocked(false);
    }
  }, [lockStorageKey, session?.userId]);

  useEffect(() => {
    if (!session?.userId) return;
    localStorage.setItem(lockStorageKey, companyListLocked ? "true" : "false");
  }, [companyListLocked, lockStorageKey, session?.userId]);

  useEffect(() => {
    if (!session?.userId) return;
    try {
      const raw = localStorage.getItem(industryStorageKey);
      const parsed = raw ? JSON.parse(raw) : [];
      setCustomIndustries(Array.isArray(parsed) ? parsed.filter((value) => typeof value === "string") : []);
    } catch {
      setCustomIndustries([]);
    }
  }, [industryStorageKey, session?.userId]);

  useEffect(() => {
    if (!session?.userId) return;
    localStorage.setItem(industryStorageKey, JSON.stringify(customIndustries));
  }, [customIndustries, industryStorageKey, session?.userId]);

  useEffect(() => {
    resetCompaniesPage();
  }, [resetCompaniesPage, search, showArchived, sortDir, sortKey]);

  function toggleSort(nextKey: CompanySortKey): void {
    if (sortKey === nextKey) {
      setSortDir((prev) => (prev === "asc" ? "desc" : "asc"));
      return;
    }
    setSortKey(nextKey);
    setSortDir("asc");
  }

  function SortHeader({ label, column }: { label: string; column: CompanySortKey }) {
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

  const importCompanyText = useCallback(async (text: string, sourceLabel: "CSV" | "paste"): Promise<void> => {
    const lines = text
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);
    if (lines.length < 2) {
      setImportNotice(
        `${sourceLabel} input is empty. Use the template header and include at least one data row.`
      );
      return;
    }

    const headerAliases: Record<string, string> = {
      "#": "index",
      index: "index",
      company: "name",
      name: "name",
      industry: "industry",
      size: "size",
      remote: "remotepolicy",
      remotepolicy: "remotepolicy",
      "remote policy": "remotepolicy",
      priority: "priority",
      status: "status",
      notes: "notes",
    };
    const headers = parseCsvLine(lines[0]).map((h) =>
      h.replace(/^\uFEFF/, "").trim().toLowerCase()
    );
    const headerIndex = new Map<string, number>();
    headers.forEach((header, index) => {
      const normalized = headerAliases[header];
      if (normalized) headerIndex.set(normalized, index);
    });
    const required = ["name", "industry", "size", "remotepolicy", "priority", "status", "notes"];
    if (!required.every((key) => headerIndex.has(key))) {
      setImportNotice("Invalid company header. Download the template and reuse the same columns.");
      return;
    }

    let created = 0;
    let updated = 0;
    const errors: string[] = [];
    const existingByName = new Map(
      activeCompanies.map((company) => [normalizeCompanyKey(company.name), company.id])
    );
    const seenInBatch = new Set<string>();
    const pick = (row: string[], key: string): string => {
      const index = headerIndex.get(key);
      if (typeof index !== "number") return "";
      return row[index]?.trim() ?? "";
    };

    for (let i = 1; i < lines.length; i += 1) {
      const row = parseCsvLine(lines[i]);
      if (row.length === 0) {
        errors.push(`Row ${i + 1}: missing columns`);
        continue;
      }
      const name = pick(row, "name");
      const industry = pick(row, "industry");
      const size = pick(row, "size");
      const remotePolicy = pick(row, "remotepolicy");
      const priorityRaw = pick(row, "priority");
      const statusRaw = pick(row, "status");
      const notes = pick(row, "notes");

      if (!name) {
        errors.push(`Row ${i + 1}: name is required`);
        continue;
      }

      const normalizedName = normalizeCompanyKey(name);
      if (seenInBatch.has(normalizedName)) {
        errors.push(`Row ${i + 1}: duplicate company "${name}" in this batch`);
        continue;
      }
      seenInBatch.add(normalizedName);

      const priority = normalizePriority(priorityRaw);
      const status = normalizeStatus(statusRaw);
      if (!priority) {
        errors.push(`Row ${i + 1}: invalid priority "${priorityRaw}"`);
        continue;
      }
      if (!status) {
        errors.push(`Row ${i + 1}: invalid status "${statusRaw}"`);
        continue;
      }

      const payload = { name, industry, size, remotePolicy, priority, status, notes };
      const existingId = existingByName.get(normalizedName);

      if (existingId) {
        await updateCompany(existingId, payload);
        updated += 1;
        continue;
      }

      await addCompany(payload);
      existingByName.set(normalizedName, `pending-${i}`);
      created += 1;
    }

    const actionLabel = sourceLabel === "CSV" ? "Imported" : "Extended";
    if (errors.length === 0) {
      const msg = `${actionLabel} ${created} companies and updated ${updated}.`;
      setImportNotice(msg);
      toast.success(msg);
    } else {
      const msg = `${actionLabel} ${created} companies, updated ${updated}. ${errors.length} row(s) failed.`;
      setImportNotice(msg);
      toast.error(msg, {
        description: errors.slice(0, 3).join(" | ") + (errors.length > 3 ? " ..." : ""),
      });
    }

    if (created > 0 && lockAfterImport) {
      setCompanyListLocked(true);
      setImportNotice((prev) =>
        prev ? `${prev} Company list is now locked.` : "Company list is now locked."
      );
    }
  }, [activeCompanies, addCompany, lockAfterImport, updateCompany]);

  async function handleImportCsv(file: File): Promise<void> {
    setIsImporting(true);
    setImportNotice(null);
    try {
      const text = await file.text();
      await importCompanyText(text, "CSV");
    } finally {
      setIsImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function handleBulkExtend(): Promise<void> {
    if (!bulkText.trim()) {
      setImportNotice("Paste company rows first.");
      return;
    }
    setIsImporting(true);
    setImportNotice(null);
    try {
      await importCompanyText(bulkText, "paste");
      setBulkText("");
    } finally {
      setIsImporting(false);
    }
  }

  function openEditMode(company: JobOsCompany): void {
    setEditDraft({ ...company });
    setDetailMode("edit");
  }

  function openAddIndustryDialog(): void {
    setNewIndustry("");
    setEditingIndustry(null);
    setEditingIndustryDraft("");
    setIndustryDialogOpen(true);
  }

  function addIndustry(): void {
    const industry = newIndustry.trim().replace(/\s+/g, " ");
    if (!industry) return;
    if (industryOptions.some((option) => normalizeIndustryKey(option) === normalizeIndustryKey(industry))) {
      setNewIndustry("");
      return;
    }
    setCustomIndustries((current) => [...current, industry]);
    if (detailMode === "edit" && selectedCompany) {
      setEditDraft((current) => ({ ...current, industry }));
    } else {
      setDraft((current) => ({ ...current, industry }));
    }
    setNewIndustry("");
  }

  async function saveIndustryEdit(originalIndustry: string): Promise<void> {
    const nextIndustry = editingIndustryDraft.trim().replace(/\s+/g, " ");
    if (!nextIndustry) return;
    const originalKey = normalizeIndustryKey(originalIndustry);
    const nextKey = normalizeIndustryKey(nextIndustry);

    setCustomIndustries((current) => {
      const withoutOriginal = current.filter((industry) => normalizeIndustryKey(industry) !== originalKey);
      if (withoutOriginal.some((industry) => normalizeIndustryKey(industry) === nextKey)) {
        return withoutOriginal;
      }
      return [...withoutOriginal, nextIndustry];
    });

    if (normalizeIndustryKey(draft.industry) === originalKey) {
      setDraft((current) => ({ ...current, industry: nextIndustry }));
    }
    if (normalizeIndustryKey(editDraft.industry ?? "") === originalKey) {
      setEditDraft((current) => ({ ...current, industry: nextIndustry }));
    }

    const companiesToUpdate = activeCompanies.filter(
      (company) => normalizeIndustryKey(company.industry) === originalKey
    );
    await Promise.all(
      companiesToUpdate.map((company) => updateCompany(company.id, { industry: nextIndustry }))
    );

    setEditingIndustry(null);
    setEditingIndustryDraft("");
    toast.success(`Industry updated to ${nextIndustry}`);
  }

  async function handleSaveEdit(): Promise<void> {
    if (!selectedCompanyId || !editDraft.name?.trim()) return;
    setIsSavingEdit(true);
    try {
      await updateCompany(selectedCompanyId, editDraft);
      setDetailMode("view");
      toast.success("Company updated");
    } finally {
      setIsSavingEdit(false);
    }
  }

  const [archiveAllOpen, setArchiveAllOpen] = useState(false);

  async function archiveCompanies(companyIds: string[], reason = STRATEGIC_RESET_ARCHIVE_REASON): Promise<void> {
    const archiveUpdates = buildArchiveUpdates(reason);
    const companyIdSet = new Set(companyIds);
    const linkedRoles = roles.filter((role) => companyIdSet.has(role.companyId) && !isArchived(role));
    const linkedApplications = applications.filter((application) => companyIdSet.has(application.companyId) && !isArchived(application));
    const linkedOutreach = outreach.filter((item) => companyIdSet.has(item.companyId) && !isArchived(item));

    await Promise.all([
      ...companyIds.map((id) => updateCompany(id, { ...archiveUpdates, status: "Closed" })),
      ...linkedRoles.map((role) => updateRole(role.id, { ...archiveUpdates, status: "closed" })),
      ...linkedApplications.map((application) =>
        updateApplication(application.id, { ...archiveUpdates, nextAction: "" })
      ),
      ...linkedOutreach.map((item) => updateOutreach(item.id, { ...archiveUpdates, status: "closed" })),
    ]);
  }

  const handleLoadRomanTargetCompanies = useCallback(async (): Promise<void> => {
    setIsImporting(true);
    setImportNotice(null);
    try {
      const response = await fetch(ROMAN_TARGET_COMPANIES_IMPORT_URL);
      if (!response.ok) {
        throw new Error(`Target company import failed (${response.status})`);
      }
      await importCompanyText(await response.text(), "CSV");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Target companies could not be loaded.";
      setImportNotice(message);
      toast.error(message);
    } finally {
      setIsImporting(false);
    }
  }, [importCompanyText]);

  useEffect(() => {
    if (targetListAutoImportRef.current || isImporting || activeCompanies.length > 0) {
      return;
    }

    targetListAutoImportRef.current = true;
    void handleLoadRomanTargetCompanies();
  }, [activeCompanies.length, handleLoadRomanTargetCompanies, isImporting]);

  async function restoreCompanies(companyIds: string[]): Promise<void> {
    const restoreUpdates = buildRestoreUpdates();
    const companyIdSet = new Set(companyIds);
    const linkedRoles = roles.filter((role) => companyIdSet.has(role.companyId) && isArchived(role));
    const linkedApplications = applications.filter((application) => companyIdSet.has(application.companyId) && isArchived(application));
    const linkedOutreach = outreach.filter((item) => companyIdSet.has(item.companyId) && isArchived(item));

    await Promise.all([
      ...companyIds.map((id) => updateCompany(id, restoreUpdates)),
      ...linkedRoles.map((role) => updateRole(role.id, restoreUpdates)),
      ...linkedApplications.map((application) => updateApplication(application.id, restoreUpdates)),
      ...linkedOutreach.map((item) => updateOutreach(item.id, restoreUpdates)),
    ]);
  }

  async function archiveAllCompanies(): Promise<void> {
    const count = activeCompanies.length;
    await archiveCompanies(activeCompanies.map((company) => company.id), "Strategic reset: archived historical company workspace");
    setSelectedCompanyId(null);
    setArchiveAllOpen(false);
    setImportNotice(`Archived ${count} companies and linked records.`);
    toast.success(`Archived ${count} companies`);
  }

  return (
    <JobOsLayout
      title="Companies"
      subtitle="Track companies by status — Research, Target, Active — and route them into roles"
      notice={syncNotice}
      settingsFooter={<JobOsTransferControls getExportState={exportState} onImportState={replaceState} />}
    >
      {/* ── Add Company (collapsible) ── */}
      <Card>
        <CardHeader className="pb-0">
          <div className="flex items-center justify-between gap-3">
            {/* Title + chevron toggle */}
            <button
              type="button"
              onClick={() => setAddFormOpen((v) => !v)}
              className="flex items-center gap-1.5 group"
            >
              {addFormOpen ? (
                <ChevronDown className="w-4 h-4 text-neutral-400 group-hover:text-foreground transition-colors" />
              ) : (
                <ChevronRight className="w-4 h-4 text-neutral-400 group-hover:text-foreground transition-colors" />
              )}
              <CardTitle className="text-sm select-none">Add Company</CardTitle>
            </button>

            {/* Action buttons — always visible */}
            <div className="flex items-center gap-2 flex-wrap justify-end">
              <Button
                size="sm"
                variant="outline"
                className="gap-1.5"
                onClick={() => setPasteLinkOpen(true)}
                disabled={companyListLocked}
              >
                <Link className="w-3.5 h-3.5" />
                Paste Link
              </Button>
              <a href="/templates/job-os-companies-import-template.csv" download>
                <Button size="sm" variant="outline" className="gap-1.5">
                  <Download className="w-3.5 h-3.5" />
                  Template CSV
                </Button>
              </a>
              <Button
                size="sm"
                variant="outline"
                className="gap-1.5"
                onClick={() => fileInputRef.current?.click()}
                disabled={isImporting || companyListLocked}
              >
                <Upload className="w-3.5 h-3.5" />
                {isImporting ? "Importing…" : "Import CSV"}
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="gap-1.5"
                onClick={() => void handleLoadRomanTargetCompanies()}
                disabled={isImporting || companyListLocked}
              >
                <Download className="w-3.5 h-3.5" />
                Load Target List
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setCompanyListLocked((prev) => !prev)}
              >
                {companyListLocked ? "Unlock Companies" : "Lock Companies"}
              </Button>
              <AlertDialog open={archiveAllOpen} onOpenChange={setArchiveAllOpen}>
                <AlertDialogTrigger asChild>
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-1.5"
                    disabled={companyListLocked || activeCompanies.length === 0}
                  >
                    <Archive className="h-3.5 w-3.5" />
                    Strategic Reset
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Archive active workspace?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This preserves {activeCompanies.length} active compan{activeCompanies.length === 1 ? "y" : "ies"} and all linked roles, applications, and outreach records, then moves them out of default workspace views.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => void archiveAllCompanies()}
                    >
                      Archive workspace
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,text/csv"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  void handleImportCsv(file);
                }}
              />
            </div>
          </div>
        </CardHeader>

        {addFormOpen && (
          <CardContent className="grid md:grid-cols-4 gap-3 pt-4">
            <Input
              value={draft.name}
              onChange={(e) => setDraft((p) => ({ ...p, name: e.target.value }))}
              placeholder="Company"
            />
            <div className="flex gap-2">
              <Select
                value={draft.industry || undefined}
                onValueChange={(value) => setDraft((p) => ({ ...p, industry: value }))}
              >
                <SelectTrigger className="min-w-0 flex-1">
                  <SelectValue placeholder="Industry" />
                </SelectTrigger>
                <SelectContent>
                  {industryOptions.length > 0 ? (
                    industryOptions.map((industry) => (
                      <SelectItem key={industry} value={industry}>
                        {industry}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="Unknown">Unknown</SelectItem>
                  )}
                </SelectContent>
              </Select>
              <Button
                type="button"
                variant="outline"
                className="gap-1.5 px-3"
                onClick={openAddIndustryDialog}
              >
                <Plus className="h-4 w-4" />
                Add
              </Button>
              <Button
                type="button"
                size="icon"
                variant="outline"
                onClick={() => setIndustryDialogOpen(true)}
                aria-label="Manage industries"
              >
                <Pencil className="h-4 w-4" />
              </Button>
            </div>
            <Input
              value={draft.size}
              onChange={(e) => setDraft((p) => ({ ...p, size: e.target.value }))}
              placeholder="Size"
            />
            <Input
              value={draft.remotePolicy}
              onChange={(e) => setDraft((p) => ({ ...p, remotePolicy: e.target.value }))}
              placeholder="Remote policy"
            />
            <Select
              value={draft.priority}
              onValueChange={(v) => setDraft((p) => ({ ...p, priority: v as CompanyPriority }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="A">A</SelectItem>
                <SelectItem value="B">B</SelectItem>
                <SelectItem value="C">C</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={draft.status}
              onValueChange={(v) => setDraft((p) => ({ ...p, status: v as CompanyStatus }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUS_VALUES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="md:col-span-2">
              <Button
                className="w-full"
                disabled={companyListLocked || !draft.name.trim() || !draft.industry.trim()}
                onClick={() => {
                  if (!draft.name.trim() || !draft.industry.trim()) return;
                  void addCompany(draft).then(() => toast.success("Company added"));
                  setDraft({
                    name: "",
                    industry: "",
                    size: "",
                    remotePolicy: "",
                    priority: "B",
                    status: "Research",
                    notes: "",
                  });
                }}
              >
                Add Company
              </Button>
            </div>
            <div className="md:col-span-4">
              <Textarea
                value={draft.notes}
                onChange={(e) => setDraft((p) => ({ ...p, notes: e.target.value }))}
                rows={2}
                placeholder="Research notes"
              />
            </div>

            {/* Extend Companies List */}
            <div className="md:col-span-4 rounded border border-dashed px-3 py-3">
              <div className="mb-2 flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-medium">Extend Companies List</p>
                  <p className="text-xs text-neutral-500">
                    Paste the same CSV header and rows from the template. Existing companies are
                    updated in place, so saved roles keep their links.
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={isImporting || companyListLocked}
                  onClick={() => void handleBulkExtend()}
                >
                  {isImporting ? "Processing…" : "Extend List"}
                </Button>
              </div>
              <Textarea
                value={bulkText}
                onChange={(e) => setBulkText(e.target.value)}
                rows={5}
                placeholder={
                  "Company,Industry,Size,Remote Policy,Priority,Status,Notes\nExample Corp,SaaS,201-500,Hybrid,A,Target,Strong PM hiring signal"
                }
                disabled={companyListLocked}
              />
            </div>

            <div className="md:col-span-4 flex items-center gap-2 text-sm text-neutral-600 dark:text-neutral-300">
              <Checkbox
                id="lock-after-import"
                checked={lockAfterImport}
                onCheckedChange={(checked) => setLockAfterImport(Boolean(checked))}
              />
              <label htmlFor="lock-after-import" className="cursor-pointer">
                Lock company list automatically after CSV import
              </label>
            </div>

            {importNotice && (
              <div className="md:col-span-4 rounded border border-blue-200 dark:border-blue-900/50 bg-blue-50 dark:bg-blue-950/30 px-3 py-2 text-sm text-blue-700 dark:text-blue-400">
                {importNotice}
              </div>
            )}
          </CardContent>
        )}
      </Card>

      {/* ── Target Companies (full-width) ── */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-3">
            <CardTitle className="text-sm">
              {showArchived ? "Archived Companies" : "Target Companies"}{" "}
              {sortedCompanies.length > 0 && (
                <span className="text-neutral-400 font-normal">({sortedCompanies.length})</span>
              )}
            </CardTitle>
            <div className="flex flex-wrap items-center justify-end gap-2">
              <Button
                type="button"
                size="sm"
                variant={showArchived ? "secondary" : "outline"}
                className="gap-1.5"
                onClick={() => setShowArchived((value) => !value)}
              >
                {showArchived ? (
                  <ArchiveRestore className="h-3.5 w-3.5" />
                ) : (
                  <Archive className="h-3.5 w-3.5" />
                )}
                {showArchived ? "Show Active" : `Archived (${archivedCompanies.length})`}
              </Button>
              <Input
                className="max-w-xs"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Filter company..."
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <TooltipProvider delayDuration={150}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10 text-center">#</TableHead>
                <TableHead>
                  <SortHeader label="Company" column="name" />
                </TableHead>
                <TableHead>
                  <SortHeader label="Industry" column="industry" />
                </TableHead>
                <TableHead>
                  <SortHeader label="Size" column="size" />
                </TableHead>
                <TableHead>
                  <SortHeader label="Remote" column="remotePolicy" />
                </TableHead>
                <TableHead>
                  <SortHeader label="Priority" column="priority" />
                </TableHead>
                <TableHead>
                  <SortHeader label="Status" column="status" />
                </TableHead>
                <TableHead>
                  <SortHeader label="Notes" column="notes" />
                </TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pagedCompanies.map((company, index) => (
                <TableRow key={company.id}>
                  <TableCell className="text-center text-xs text-neutral-500">
                    {(companiesPage - 1) * COMPANIES_PAGE_SIZE + index + 1}
                  </TableCell>
                  <TableCell className="font-medium">{company.name}</TableCell>
                    <TableCell>{company.industry}</TableCell>
                    <TableCell>{company.size}</TableCell>
                    <TableCell>{company.remotePolicy}</TableCell>
                    <TableCell>{company.priority}</TableCell>
                    <TableCell>{company.status}</TableCell>
                    <TableCell className="max-w-[260px]">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="block cursor-help truncate underline decoration-dotted underline-offset-4">
                            {company.notes || "-"}
                          </span>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="max-w-sm">
                          <div className="space-y-1 text-xs">
                            <p className="font-medium">{getTierExplanation(getTierFromNotes(company.notes))}</p>
                            {company.notes && (
                              <p className="text-muted-foreground">{company.notes}</p>
                            )}
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="inline-flex">
                            <Button
                              size="icon"
                              variant="outline"
                              onClick={() => setSelectedCompanyId(company.id)}
                              aria-label="View company"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </span>
                        </TooltipTrigger>
                        <TooltipContent side="top">View</TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="inline-flex">
                            <Button
                              size="icon"
                              variant="outline"
                              disabled={companyListLocked}
                              onClick={() => {
                                setSelectedCompanyId(company.id);
                                openEditMode(company);
                              }}
                              aria-label="Edit company"
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                          </span>
                        </TooltipTrigger>
                        <TooltipContent side="top">Edit</TooltipContent>
                      </Tooltip>
                      {isArchived(company) ? (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="inline-flex">
                              <Button
                                size="icon"
                                variant="outline"
                                disabled={companyListLocked}
                                onClick={() =>
                                  void restoreCompanies([company.id]).then(() => toast.success("Company restored"))
                                }
                                aria-label="Restore company"
                              >
                                <ArchiveRestore className="h-4 w-4" />
                              </Button>
                            </span>
                          </TooltipTrigger>
                          <TooltipContent side="top">Restore linked records</TooltipContent>
                        </Tooltip>
                      ) : (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="inline-flex">
                              <Button
                                size="icon"
                                variant="ghost"
                                disabled={companyListLocked}
                                onClick={() =>
                                  void archiveCompanies([company.id], "Archived from Companies page").then(() =>
                                    toast.success("Company archived")
                                  )
                                }
                                aria-label="Archive company"
                              >
                                <Archive className="h-4 w-4" />
                              </Button>
                            </span>
                          </TooltipTrigger>
                          <TooltipContent side="top">Archive linked records</TooltipContent>
                        </Tooltip>
                      )}
                      </div>
                    </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <PaginationControls
            page={companiesPage}
            totalPages={companiesTotalPages}
            totalItems={sortedCompanies.length}
            pageSize={COMPANIES_PAGE_SIZE}
            onPageChange={setCompaniesPage}
          />
          </TooltipProvider>
        </CardContent>
      </Card>

      {/* ── Company Detail / Edit Modal ── */}
      <Dialog
        open={!!selectedCompany}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedCompanyId(null);
            setDetailMode("view");
          }
        }}
      >
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between gap-2 pr-6">
              <DialogTitle>
                {detailMode === "edit" ? "Edit Company" : selectedCompany?.name}
              </DialogTitle>
              {detailMode === "view" && selectedCompany && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => openEditMode(selectedCompany)}
                >
                  Edit
                </Button>
              )}
            </div>
          </DialogHeader>

          {selectedCompany && detailMode === "view" && (
            <div className="space-y-4">
              <p className="text-xs text-neutral-500">
                {selectedCompany.industry}
                {selectedCompany.size ? ` · ${selectedCompany.size}` : ""}
              </p>

              <div className="text-sm space-y-1.5">
                <p>
                  <span className="text-neutral-500">Status:</span>{" "}
                  {selectedCompany.status}
                </p>
                <p>
                  <span className="text-neutral-500">Priority:</span>{" "}
                  {selectedCompany.priority}
                </p>
                <p>
                  <span className="text-neutral-500">Remote:</span>{" "}
                  {selectedCompany.remotePolicy || "—"}
                </p>
                {selectedCompany.location && (
                  <p>
                    <span className="text-neutral-500">Location:</span>{" "}
                    {selectedCompany.location}
                  </p>
                )}
                {selectedCompany.website && (
                  <p>
                    <span className="text-neutral-500">Website:</span>{" "}
                    <a
                      href={selectedCompany.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      {selectedCompany.website}
                    </a>
                  </p>
                )}
                {selectedCompany.careersUrl && (
                  <p>
                    <span className="text-neutral-500">Careers:</span>{" "}
                    <a
                      href={selectedCompany.careersUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      {selectedCompany.careersUrl}
                    </a>
                  </p>
                )}
                {selectedCompany.notes && (
                  <p>
                    <span className="text-neutral-500">Notes:</span>{" "}
                    {selectedCompany.notes}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-3 gap-2 text-xs">
                <div className="rounded border p-2 text-center">
                  <div className="font-semibold text-base">
                    {roles.filter((r) => r.companyId === selectedCompany.id && !isArchived(r)).length}
                  </div>
                  <div className="text-neutral-500">Roles</div>
                </div>
                <div className="rounded border p-2 text-center">
                  <div className="font-semibold text-base">
                    {outreach.filter((o) => o.companyId === selectedCompany.id && !isArchived(o)).length}
                  </div>
                  <div className="text-neutral-500">Outreach</div>
                </div>
                <div className="rounded border p-2 text-center">
                  <div className="font-semibold text-base">
                    {applications.filter((a) => a.companyId === selectedCompany.id && !isArchived(a)).length}
                  </div>
                  <div className="text-neutral-500">Applications</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    void addRole({
                      companyId: selectedCompany.id,
                      title: "New Role",
                      url: "",
                      location: "",
                      seniority: "",
                      track: "TPM",
                      fitScore: 3,
                      status: "to_apply",
                    })
                  }
                >
                  Add Role
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    void addOutreach({
                      companyId: selectedCompany.id,
                      roleId: null,
                      contactName: "",
                      contactRole: "",
                      linkedinURL: "",
                      scriptUsed: "",
                      sentDate: new Date().toISOString().slice(0, 10),
                      status: "sent",
                      followUpCount: 0,
                      nextFollowUpDate: null,
                      notes: "",
                    })
                  }
                >
                  Add Outreach
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="col-span-2"
                  onClick={() =>
                    void addApplication({
                      companyId: selectedCompany.id,
                      roleId: "",
                      dateApplied: new Date().toISOString().slice(0, 10),
                      channel: "LinkedIn",
                      cvAssetId: defaultCv?.id,
                      cvVersion: defaultCv?.name ?? "",
                      status: "sent",
                      nextAction: "Follow up in 5 days",
                      notes: "",
                    })
                  }
                >
                  Log Application
                </Button>
              </div>
            </div>
          )}

          {selectedCompany && detailMode === "edit" && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2 space-y-1">
                  <label className="text-xs text-neutral-500">Company Name</label>
                  <Input
                    value={editDraft.name ?? ""}
                    onChange={(e) => setEditDraft((p) => ({ ...p, name: e.target.value }))}
                    disabled={isSavingEdit}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-neutral-500">Industry</label>
                  <div className="flex gap-2">
                    <Select
                      value={editDraft.industry || undefined}
                      onValueChange={(value) => setEditDraft((p) => ({ ...p, industry: value }))}
                      disabled={isSavingEdit}
                    >
                      <SelectTrigger className="min-w-0 flex-1">
                        <SelectValue placeholder="Industry" />
                      </SelectTrigger>
                      <SelectContent>
                        {industryOptions.length > 0 ? (
                          industryOptions.map((industry) => (
                            <SelectItem key={industry} value={industry}>
                              {industry}
                            </SelectItem>
                          ))
                        ) : (
                          <SelectItem value="Unknown">Unknown</SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={openAddIndustryDialog}
                      disabled={isSavingEdit}
                      className="gap-1.5 px-3"
                    >
                      <Plus className="h-4 w-4" />
                      Add
                    </Button>
                    <Button
                      type="button"
                      size="icon"
                      variant="outline"
                      onClick={() => setIndustryDialogOpen(true)}
                      disabled={isSavingEdit}
                      aria-label="Manage industries"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-neutral-500">Size</label>
                  <Input
                    value={editDraft.size ?? ""}
                    onChange={(e) => setEditDraft((p) => ({ ...p, size: e.target.value }))}
                    disabled={isSavingEdit}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-neutral-500">Remote Policy</label>
                  <Input
                    value={editDraft.remotePolicy ?? ""}
                    onChange={(e) => setEditDraft((p) => ({ ...p, remotePolicy: e.target.value }))}
                    disabled={isSavingEdit}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-neutral-500">Location</label>
                  <Input
                    value={editDraft.location ?? ""}
                    onChange={(e) => setEditDraft((p) => ({ ...p, location: e.target.value || undefined }))}
                    disabled={isSavingEdit}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-neutral-500">Priority</label>
                  <Select
                    value={editDraft.priority ?? "B"}
                    onValueChange={(v) => setEditDraft((p) => ({ ...p, priority: v as CompanyPriority }))}
                    disabled={isSavingEdit}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="A">A</SelectItem>
                      <SelectItem value="B">B</SelectItem>
                      <SelectItem value="C">C</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-neutral-500">Status</label>
                  <Select
                    value={editDraft.status ?? "Research"}
                    onValueChange={(v) => setEditDraft((p) => ({ ...p, status: v as CompanyStatus }))}
                    disabled={isSavingEdit}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {STATUS_VALUES.map((s) => (
                        <SelectItem key={s} value={s}>{s}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-2 space-y-1">
                  <label className="text-xs text-neutral-500">Website</label>
                  <Input
                    value={editDraft.website ?? ""}
                    onChange={(e) => setEditDraft((p) => ({ ...p, website: e.target.value || undefined }))}
                    placeholder="https://example.com"
                    disabled={isSavingEdit}
                  />
                </div>
                <div className="col-span-2 space-y-1">
                  <label className="text-xs text-neutral-500">Careers URL</label>
                  <Input
                    value={editDraft.careersUrl ?? ""}
                    onChange={(e) => setEditDraft((p) => ({ ...p, careersUrl: e.target.value || undefined }))}
                    placeholder="https://example.com/careers"
                    disabled={isSavingEdit}
                  />
                </div>
                <div className="col-span-2 space-y-1">
                  <label className="text-xs text-neutral-500">Notes</label>
                  <Textarea
                    value={editDraft.notes ?? ""}
                    onChange={(e) => setEditDraft((p) => ({ ...p, notes: e.target.value }))}
                    rows={3}
                    disabled={isSavingEdit}
                  />
                </div>
              </div>

              <div className="flex gap-2 justify-end pt-1 border-t">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setDetailMode("view")}
                  disabled={isSavingEdit}
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={() => void handleSaveEdit()}
                  disabled={!editDraft.name?.trim() || !editDraft.industry?.trim() || isSavingEdit}
                >
                  {isSavingEdit ? "Saving…" : "Save Changes"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={industryDialogOpen} onOpenChange={setIndustryDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Manage Industries</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="flex gap-2">
              <Input
                value={newIndustry}
                onChange={(event) => setNewIndustry(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    addIndustry();
                  }
                }}
                placeholder="Add industry"
              />
              <Button type="button" onClick={addIndustry} disabled={!newIndustry.trim()}>
                <Plus className="h-4 w-4" />
                Add
              </Button>
            </div>

            <div className="max-h-72 space-y-2 overflow-y-auto rounded-md border border-border p-2">
              {industryOptions.length > 0 ? (
                industryOptions.map((industry) => {
                  const usageCount = activeCompanies.filter(
                    (company) => normalizeIndustryKey(company.industry) === normalizeIndustryKey(industry)
                  ).length;
                  const isEditing = editingIndustry === industry;

                  return (
                    <div
                      key={industry}
                      className="flex items-center justify-between gap-2 rounded-md px-2 py-1.5"
                    >
                      {isEditing ? (
                        <Input
                          value={editingIndustryDraft}
                          onChange={(event) => setEditingIndustryDraft(event.target.value)}
                          onKeyDown={(event) => {
                            if (event.key === "Enter") {
                              event.preventDefault();
                              void saveIndustryEdit(industry);
                            }
                          }}
                          autoFocus
                        />
                      ) : (
                        <div className="min-w-0">
                          <div className="truncate text-sm font-medium">{industry}</div>
                          <div className="text-xs text-muted-foreground">
                            {usageCount} compan{usageCount === 1 ? "y" : "ies"}
                          </div>
                        </div>
                      )}

                      <div className="flex shrink-0 items-center gap-1">
                        {isEditing ? (
                          <>
                            <Button
                              type="button"
                              size="sm"
                              onClick={() => void saveIndustryEdit(industry)}
                              disabled={!editingIndustryDraft.trim()}
                            >
                              Save
                            </Button>
                            <Button
                              type="button"
                              size="icon"
                              variant="ghost"
                              onClick={() => {
                                setEditingIndustry(null);
                                setEditingIndustryDraft("");
                              }}
                              aria-label="Cancel industry edit"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </>
                        ) : (
                          <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            onClick={() => {
                              setEditingIndustry(industry);
                              setEditingIndustryDraft(industry);
                            }}
                            aria-label={`Edit ${industry}`}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="px-2 py-6 text-center text-sm text-muted-foreground">
                  Add your first industry to use the dropdown.
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Paste Link Dialog ── */}
      <PasteLinkImportDialog
        open={pasteLinkOpen}
        onClose={() => setPasteLinkOpen(false)}
        existingCompanies={activeCompanies}
        addCompany={addCompany}
        updateCompany={updateCompany}
        addRole={addRole}
        addApplication={addApplication}
      />
    </JobOsLayout>
  );
}
