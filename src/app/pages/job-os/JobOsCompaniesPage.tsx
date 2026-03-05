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
import type { CompanyPriority, CompanyStatus, JobOsCompany } from "../../types/jobOs";

const STATUS_VALUES: CompanyStatus[] = [
  "Research",
  "Target",
  "Active",
  "Applied",
  "Interviewing",
  "Closed",
];

export default function JobOsCompaniesPage() {
  const { session } = useApp();
  const { companies, roles, outreach, applications, addCompany, addRole, addOutreach, addApplication, removeCompany, syncNotice } =
    useJobOs(session?.userId ?? null);

  const [search, setSearch] = useState("");
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

  const selectedCompany = companies.find((c) => c.id === selectedCompanyId) ?? null;

  return (
    <JobOsLayout title="Company Engine" subtitle="Account-based target company tracking" notice={syncNotice}>
      <Card>
        <CardHeader><CardTitle className="text-sm">Add Company</CardTitle></CardHeader>
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
                  <TableHead>Company</TableHead>
                  <TableHead>Industry</TableHead>
                  <TableHead>Size</TableHead>
                  <TableHead>Remote</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Notes</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((company) => (
                  <TableRow key={company.id}>
                    <TableCell className="font-medium">{company.name}</TableCell>
                    <TableCell>{company.industry}</TableCell>
                    <TableCell>{company.size}</TableCell>
                    <TableCell>{company.remotePolicy}</TableCell>
                    <TableCell>{company.priority}</TableCell>
                    <TableCell>{company.status}</TableCell>
                    <TableCell className="max-w-[240px] truncate">{company.notes || "-"}</TableCell>
                    <TableCell className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => setSelectedCompanyId(company.id)}>View</Button>
                      <Button size="sm" variant="ghost" className="text-red-500" onClick={() => void removeCompany(company.id)}>Delete</Button>
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
