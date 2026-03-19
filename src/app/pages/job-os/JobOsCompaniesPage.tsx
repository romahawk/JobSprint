import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  ChevronDown,
  ChevronRight,
  Download,
  Link,
  Upload,
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
import { useApp } from "../../context";
import { useJobOs } from "../../hooks/useJobOs";
import { JobOsLayout } from "../../components/job-os/JobOsLayout";
import { PasteLinkImportDialog } from "../../components/job-os/PasteLinkImportDialog";
import type { CompanyPriority, CompanyStatus, JobOsCompany } from "../../types/jobOs";

const STATUS_VALUES: CompanyStatus[] = [
  "Research",
  "Target",
  "Active",
  "Applied",
  "Interviewing",
  "Closed",
];

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

type CompanySortKey =
  | "name"
  | "industry"
  | "size"
  | "remotePolicy"
  | "priority"
  | "status"
  | "notes";

export default function JobOsCompaniesPage() {
  const { session } = useApp();
  const {
    companies,
    roles,
    outreach,
    applications,
    addCompany,
    updateCompany,
    addRole,
    addOutreach,
    addApplication,
    removeCompany,
    syncNotice,
  } = useJobOs(session?.userId ?? null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [addFormOpen, setAddFormOpen] = useState(true);
  const [search, setSearch] = useState("");
  const [isImporting, setIsImporting] = useState(false);
  const [bulkText, setBulkText] = useState("");
  const [importNotice, setImportNotice] = useState<string | null>(null);
  const [lockAfterImport, setLockAfterImport] = useState(false);
  const [companyListLocked, setCompanyListLocked] = useState(false);
  const [sortKey, setSortKey] = useState<CompanySortKey>("name");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);
  const [detailMode, setDetailMode] = useState<"view" | "edit">("view");
  const [editDraft, setEditDraft] = useState<Partial<JobOsCompany>>({});
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [pasteLinkOpen, setPasteLinkOpen] = useState(false);
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
      [c.name, c.industry, c.notes].join(" ").toLowerCase().includes(q)
    );
  }, [companies, search]);

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

  const selectedCompany = companies.find((c) => c.id === selectedCompanyId) ?? null;
  const lockStorageKey = `job_os_companies_lock_${session?.userId ?? "anon"}`;

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

  async function importCompanyText(text: string, sourceLabel: "CSV" | "paste"): Promise<void> {
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
      companies.map((company) => [normalizeCompanyKey(company.name), company.id])
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
      setImportNotice(
        `${actionLabel} ${created} companies and updated ${updated}. Existing roles stay linked to their company IDs.`
      );
    } else {
      setImportNotice(
        `${actionLabel} ${created} companies, updated ${updated}. ${errors.length} row(s) failed: ${errors
          .slice(0, 3)
          .join(" | ")}${errors.length > 3 ? " ..." : ""}`
      );
    }

    if (created > 0 && lockAfterImport) {
      setCompanyListLocked(true);
      setImportNotice((prev) =>
        prev ? `${prev} Company list is now locked.` : "Company list is now locked."
      );
    }
  }

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

  async function handleSaveEdit(): Promise<void> {
    if (!selectedCompanyId || !editDraft.name?.trim()) return;
    setIsSavingEdit(true);
    try {
      await updateCompany(selectedCompanyId, editDraft);
      setDetailMode("view");
    } finally {
      setIsSavingEdit(false);
    }
  }

  async function clearAllCompanies(): Promise<void> {
    if (companyListLocked) {
      setImportNotice("Unlock the company list before clearing.");
      return;
    }
    if (companies.length === 0) {
      setImportNotice("There are no companies to clear.");
      return;
    }
    const confirmed = window.confirm(
      `Delete all ${companies.length} companies? This action cannot be undone.`
    );
    if (!confirmed) return;
    await Promise.all(companies.map((company) => removeCompany(company.id)));
    setSelectedCompanyId(null);
    setImportNotice(`Deleted ${companies.length} companies.`);
  }

  return (
    <JobOsLayout
      title="Company Engine"
      subtitle="Account-based target company tracking"
      notice={syncNotice}
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
                onClick={() => setCompanyListLocked((prev) => !prev)}
              >
                {companyListLocked ? "Unlock Companies" : "Lock Companies"}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="text-red-500"
                onClick={() => void clearAllCompanies()}
                disabled={companyListLocked || companies.length === 0}
              >
                Clear All
              </Button>
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
            <Input
              value={draft.industry}
              onChange={(e) => setDraft((p) => ({ ...p, industry: e.target.value }))}
              placeholder="Industry"
            />
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
                disabled={companyListLocked}
                onClick={() => {
                  if (!draft.name) return;
                  void addCompany(draft);
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
              Target Companies{" "}
              {companies.length > 0 && (
                <span className="text-neutral-400 font-normal">({companies.length})</span>
              )}
            </CardTitle>
            <Input
              className="max-w-xs"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Filter company…"
            />
          </div>
        </CardHeader>
        <CardContent>
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
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedCompanies.map((company, index) => (
                <TableRow key={company.id}>
                  <TableCell className="text-center text-xs text-neutral-500">
                    {index + 1}
                  </TableCell>
                  <TableCell className="font-medium">{company.name}</TableCell>
                  <TableCell>{company.industry}</TableCell>
                  <TableCell>{company.size}</TableCell>
                  <TableCell>{company.remotePolicy}</TableCell>
                  <TableCell>{company.priority}</TableCell>
                  <TableCell>{company.status}</TableCell>
                  <TableCell className="max-w-[260px] truncate">
                    {company.notes || "-"}
                  </TableCell>
                  <TableCell className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setSelectedCompanyId(company.id)}
                    >
                      View
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-red-500"
                      disabled={companyListLocked}
                      onClick={() => void removeCompany(company.id)}
                    >
                      Delete
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
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
                    {roles.filter((r) => r.companyId === selectedCompany.id).length}
                  </div>
                  <div className="text-neutral-500">Roles</div>
                </div>
                <div className="rounded border p-2 text-center">
                  <div className="font-semibold text-base">
                    {outreach.filter((o) => o.companyId === selectedCompany.id).length}
                  </div>
                  <div className="text-neutral-500">Outreach</div>
                </div>
                <div className="rounded border p-2 text-center">
                  <div className="font-semibold text-base">
                    {applications.filter((a) => a.companyId === selectedCompany.id).length}
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
                      cvVersion: "CV - Technical Product Manager",
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
                  <Input
                    value={editDraft.industry ?? ""}
                    onChange={(e) => setEditDraft((p) => ({ ...p, industry: e.target.value }))}
                    disabled={isSavingEdit}
                  />
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
                  disabled={!editDraft.name?.trim() || isSavingEdit}
                >
                  {isSavingEdit ? "Saving…" : "Save Changes"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ── Paste Link Dialog ── */}
      <PasteLinkImportDialog
        open={pasteLinkOpen}
        onClose={() => setPasteLinkOpen(false)}
        existingCompanies={companies}
        addCompany={addCompany}
        updateCompany={updateCompany}
        addRole={addRole}
      />
    </JobOsLayout>
  );
}
