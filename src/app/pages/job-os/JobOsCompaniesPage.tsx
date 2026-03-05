import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowDown, ArrowUp, ArrowUpDown, Download, Upload } from "lucide-react";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";
import { Textarea } from "../../components/ui/textarea";
import { Checkbox } from "../../components/ui/checkbox";
import { useApp } from "../../context";
import { useJobOs } from "../../hooks/useJobOs";
import { JobOsLayout } from "../../components/job-os/JobOsLayout";
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
  } =
    useJobOs(session?.userId ?? null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [search, setSearch] = useState("");
  const [isImporting, setIsImporting] = useState(false);
  const [importNotice, setImportNotice] = useState<string | null>(null);
  const [lockAfterImport, setLockAfterImport] = useState(false);
  const [companyListLocked, setCompanyListLocked] = useState(false);
  const [sortKey, setSortKey] = useState<CompanySortKey>("name");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);
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

  function SortHeader({
    label,
    column,
  }: {
    label: string;
    column: CompanySortKey;
  }) {
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

  async function handleImportCsv(file: File): Promise<void> {
    setIsImporting(true);
    setImportNotice(null);
    try {
      const text = await file.text();
      const lines = text
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean);
      if (lines.length < 2) {
        setImportNotice("CSV is empty. Use the template and include at least one data row.");
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
        if (normalized) {
          headerIndex.set(normalized, index);
        }
      });
      const required = ["name", "industry", "size", "remotepolicy", "priority", "status", "notes"];
      const isHeaderValid = required.every((key) => headerIndex.has(key));
      if (!isHeaderValid) {
        setImportNotice("Invalid CSV header. Download and use the template format.");
        return;
      }

      let created = 0;
      let updated = 0;
      const errors: string[] = [];
      const existingByName = new Map(
        companies.map((company) => [company.name.trim().toLowerCase(), company.id])
      );
      const seenInCsv = new Set<string>();
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
        const normalizedName = name.toLowerCase();
        if (seenInCsv.has(normalizedName)) {
          errors.push(`Row ${i + 1}: duplicate company "${name}" in CSV`);
          continue;
        }
        seenInCsv.add(normalizedName);
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
        const payload = {
          name,
          industry,
          size,
          remotePolicy,
          priority,
          status,
          notes,
        };

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

      if (errors.length === 0) {
        setImportNotice(`Imported ${created} companies and updated ${updated}.`);
      } else {
        setImportNotice(
          `Imported ${created} companies, updated ${updated}. ${errors.length} row(s) failed: ${errors
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
    } finally {
      setIsImporting(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
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
    <JobOsLayout title="Company Engine" subtitle="Account-based target company tracking" notice={syncNotice}>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-3">
            <CardTitle className="text-sm">Add Company</CardTitle>
            <div className="flex items-center gap-2">
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
                {isImporting ? "Importing..." : "Import CSV"}
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
        <CardContent className="grid md:grid-cols-4 gap-3">
          <Input value={draft.name} onChange={(e) => setDraft((p) => ({ ...p, name: e.target.value }))} placeholder="Company" />
          <Input value={draft.industry} onChange={(e) => setDraft((p) => ({ ...p, industry: e.target.value }))} placeholder="Industry" />
          <Input value={draft.size} onChange={(e) => setDraft((p) => ({ ...p, size: e.target.value }))} placeholder="Size" />
          <Input value={draft.remotePolicy} onChange={(e) => setDraft((p) => ({ ...p, remotePolicy: e.target.value }))} placeholder="Remote policy" />
          <Select value={draft.priority} onValueChange={(v) => setDraft((p) => ({ ...p, priority: v as CompanyPriority }))}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="A">A</SelectItem>
              <SelectItem value="B">B</SelectItem>
              <SelectItem value="C">C</SelectItem>
            </SelectContent>
          </Select>
          <Select value={draft.status} onValueChange={(v) => setDraft((p) => ({ ...p, status: v as CompanyStatus }))}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{STATUS_VALUES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
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
            <Textarea value={draft.notes} onChange={(e) => setDraft((p) => ({ ...p, notes: e.target.value }))} rows={2} placeholder="Research notes" />
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
      </Card>

      <div className="grid lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-sm">Target Companies</CardTitle>
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Filter company..." />
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12 text-center">#</TableHead>
                  <TableHead><SortHeader label="Company" column="name" /></TableHead>
                  <TableHead><SortHeader label="Industry" column="industry" /></TableHead>
                  <TableHead><SortHeader label="Size" column="size" /></TableHead>
                  <TableHead><SortHeader label="Remote" column="remotePolicy" /></TableHead>
                  <TableHead><SortHeader label="Priority" column="priority" /></TableHead>
                  <TableHead><SortHeader label="Status" column="status" /></TableHead>
                  <TableHead><SortHeader label="Notes" column="notes" /></TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedCompanies.map((company, index) => (
                  <TableRow key={company.id}>
                    <TableCell className="text-center text-xs text-neutral-500">{index + 1}</TableCell>
                    <TableCell className="font-medium">{company.name}</TableCell>
                    <TableCell>{company.industry}</TableCell>
                    <TableCell>{company.size}</TableCell>
                    <TableCell>{company.remotePolicy}</TableCell>
                    <TableCell>{company.priority}</TableCell>
                    <TableCell>{company.status}</TableCell>
                    <TableCell className="max-w-[240px] truncate">{company.notes || "-"}</TableCell>
                    <TableCell className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => setSelectedCompanyId(company.id)}>View</Button>
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

        <Card>
          <CardHeader><CardTitle className="text-sm">Company Detail</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {!selectedCompany && <p className="text-sm text-neutral-500">Select a company to view detail.</p>}
            {selectedCompany && (
              <>
                <div>
                  <p className="font-medium">{selectedCompany.name}</p>
                  <p className="text-xs text-neutral-500">{selectedCompany.industry} · {selectedCompany.size}</p>
                </div>
                <div className="text-sm space-y-1">
                  <p><span className="text-neutral-500">Status:</span> {selectedCompany.status}</p>
                  <p><span className="text-neutral-500">Priority:</span> {selectedCompany.priority}</p>
                  <p><span className="text-neutral-500">Notes:</span> {selectedCompany.notes || "-"}</p>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="rounded border p-2">Roles: {roles.filter((r) => r.companyId === selectedCompany.id).length}</div>
                  <div className="rounded border p-2">Outreach: {outreach.filter((o) => o.companyId === selectedCompany.id).length}</div>
                  <div className="rounded border p-2">Applications: {applications.filter((a) => a.companyId === selectedCompany.id).length}</div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Button size="sm" variant="outline" onClick={() => void addRole({ companyId: selectedCompany.id, title: "New Role", url: "", location: "", seniority: "", track: "TPM", fitScore: 3, status: "to_apply" })}>Add Role</Button>
                  <Button size="sm" variant="outline" onClick={() => void addOutreach({ companyId: selectedCompany.id, roleId: null, contactName: "", contactRole: "", linkedinURL: "", scriptUsed: "", sentDate: new Date().toISOString().slice(0, 10), status: "sent", followUpCount: 0, nextFollowUpDate: null, notes: "" })}>Add Outreach</Button>
                  <Button size="sm" variant="outline" className="col-span-2" onClick={() => void addApplication({ companyId: selectedCompany.id, roleId: "", dateApplied: new Date().toISOString().slice(0, 10), channel: "LinkedIn", cvVersion: "CV - Technical Product Manager", status: "sent", nextAction: "Follow up in 5 days", notes: "" })}>Log Application</Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </JobOsLayout>
  );
}
