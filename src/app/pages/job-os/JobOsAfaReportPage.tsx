import { useMemo, useState } from "react";
import { ArrowDown, ArrowUp, ArrowUpDown, Download } from "lucide-react";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Card, CardContent } from "../../components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";
import { useJobOsContext } from "../../context/JobOsContext";
import {
  APPLICATION_STATUS_LABELS,
  CLOSED_APPLICATION_STATUSES,
  applicationHasActiveInterview,
  applicationReachedInterview,
  getApplicationInterviewMetrics,
  getApplicationVisibleNextAction,
  sortJobOsApplications,
  type ApplicationSortField,
  type SortDirection,
} from "../../services/jobOsApplications";
import type { ApplicationStatus, JobOsCompany, JobOsRole } from "../../types/jobOs";

type ReportLanguage = "en" | "de";

const DE_STATUS_LABELS: Record<ApplicationStatus, string> = {
  sent: "Eingereicht",
  screen: "Screening",
  case: "Case Study",
  interview: "Interview",
  final: "Finalrunde",
  offer: "Angebot",
  rejected: "Abgelehnt",
  ghosted: "Keine Rückmeldung",
};

const COPY = {
  en: {
    eyebrow: "AfA advisor report",
    title: "JobSprint Application Pipeline",
    generated: "Generated",
    source: "Based on the same application records used in Job OS.",
    employee: "Arbeitnehmer:",
    developedBy: "Entwickelt von:",
    downloadPdf: "Download PDF",
    number: "#",
    company: "Company",
    role: "Role",
    status: "Status",
    applied: "Applied",
    channel: "Channel",
    nextAction: "Next Action",
    notes: "Notes",
    interviewed: "Interviewed",
    empty: "No application records available.",
    loading: "Loading application records...",
    nextActions: "Next Actions",
    numberOfInterviews: "Number of interviews:",
    activeInterviews: "Active interviews:",
  },
  de: {
    eyebrow: "AfA-Bericht",
    title: "JobSprint Bewerbungspipeline",
    generated: "Erstellt am",
    source: "Basierend auf denselben Bewerbungsdaten wie in Job OS.",
    employee: "Employee:",
    developedBy: "Developed by:",
    downloadPdf: "PDF herunterladen",
    number: "#",
    company: "Unternehmen",
    role: "Position",
    status: "Status",
    applied: "Beworben am",
    channel: "Kanal",
    nextAction: "Nächster Schritt",
    notes: "Notizen",
    interviewed: "Interview geführt",
    empty: "Keine Bewerbungsdaten verfügbar.",
    loading: "Bewerbungsdaten werden geladen...",
    nextActions: "Nächste Schritte",
    numberOfInterviews: "Anzahl Interviews:",
    activeInterviews: "Aktive Interviews:",
  },
} as const;

export default function JobOsAfaReportPage() {
  const { applications, companies, roles, loading } = useJobOsContext();
  const [language, setLanguage] = useState<ReportLanguage>("en");
  const [sortField, setSortField] = useState<ApplicationSortField>("date");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const copy = COPY[language];
  const statusLabels = language === "de" ? DE_STATUS_LABELS : APPLICATION_STATUS_LABELS;

  const companiesById = useMemo(
    () => new Map(companies.map((company) => [company.id, company])),
    [companies]
  );
  const rolesById = useMemo(
    () => new Map(roles.map((role) => [role.id, role])),
    [roles]
  );
  const visibleApplications = useMemo(
    () =>
      sortJobOsApplications(
        applications,
        companiesById as Map<string, JobOsCompany>,
        rolesById as Map<string, JobOsRole>,
        sortField,
        sortDirection
      ),
    [applications, companiesById, rolesById, sortDirection, sortField]
  );
  const interviewMetrics = useMemo(
    () => getApplicationInterviewMetrics(applications),
    [applications]
  );
  const generatedAt = new Date().toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  function toggleSort(field: ApplicationSortField): void {
    if (sortField === field) {
      setSortDirection((current) => (current === "asc" ? "desc" : "asc"));
      return;
    }

    setSortField(field);
    setSortDirection(field === "date" ? "desc" : "asc");
  }

  function renderSortHeader(label: string, field: ApplicationSortField): React.ReactNode {
    const active = sortField === field;

    return (
      <button
        type="button"
        onClick={() => toggleSort(field)}
        className="inline-flex items-center gap-1 font-medium text-neutral-800 transition-colors hover:text-neutral-950 print:text-neutral-950"
      >
        <span>{label}</span>
        {!active ? <ArrowUpDown className="h-3.5 w-3.5 opacity-50" /> : null}
        {active && sortDirection === "asc" ? <ArrowUp className="h-3.5 w-3.5" /> : null}
        {active && sortDirection === "desc" ? <ArrowDown className="h-3.5 w-3.5" /> : null}
      </button>
    );
  }

  return (
    <main className="min-h-screen bg-white px-6 py-8 text-neutral-950 print:px-0 print:py-0">
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="flex flex-col gap-4 border-b border-neutral-200 pb-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
              {copy.eyebrow}
            </p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight">
              {copy.title}
            </h1>
            <div className="mt-3 space-y-1 text-sm text-neutral-700">
              <p>
                <span className="font-medium">{copy.employee}</span> Roman Mazuryk
              </p>
              <p>
                <span className="font-medium">{copy.developedBy}</span>{" "}
                <a
                  href="https://mazuryk.dev"
                  target="_blank"
                  rel="noreferrer"
                  className="font-medium text-blue-700 underline underline-offset-2 print:text-neutral-950"
                >
                  mazuryk.dev
                </a>
              </p>
            </div>
            <p className="mt-2 text-sm text-neutral-600">
              {copy.generated} {generatedAt}. {copy.source}
            </p>
          </div>

          <div className="flex shrink-0 flex-wrap items-center gap-2 print:hidden">
            <div className="flex rounded-md border border-neutral-200 bg-white p-1">
              <Button
                type="button"
                size="sm"
                variant={language === "en" ? "secondary" : "ghost"}
                onClick={() => setLanguage("en")}
              >
                ENG
              </Button>
              <Button
                type="button"
                size="sm"
                variant={language === "de" ? "secondary" : "ghost"}
                onClick={() => setLanguage("de")}
              >
                DEU
              </Button>
            </div>
            <Button type="button" size="sm" variant="outline" onClick={() => window.print()}>
              <Download className="h-4 w-4" />
              {copy.downloadPdf}
            </Button>
          </div>
        </header>

        <Card className="rounded-md border-neutral-200 shadow-none print:border-0">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">{copy.number}</TableHead>
                  <TableHead>{renderSortHeader(copy.company, "company")}</TableHead>
                  <TableHead>{renderSortHeader(copy.role, "role")}</TableHead>
                  <TableHead>{renderSortHeader(copy.status, "status")}</TableHead>
                  <TableHead>{renderSortHeader(copy.applied, "date")}</TableHead>
                  <TableHead>{renderSortHeader(copy.channel, "channel")}</TableHead>
                  <TableHead>{renderSortHeader(copy.nextAction, "nextAction")}</TableHead>
                  <TableHead>{renderSortHeader(copy.notes, "notes")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visibleApplications.map((application, index) => {
                  const isClosed = CLOSED_APPLICATION_STATUSES.has(application.status);
                  const isActiveInterview = applicationHasActiveInterview(application);
                  const reachedInterview = applicationReachedInterview(application);
                  const visibleNextAction = getApplicationVisibleNextAction(application);
                  const shouldShowInterviewedBlurb =
                    isClosed && reachedInterview;
                  const rowClassName = isActiveInterview
                    ? "bg-emerald-50/70 font-semibold print:bg-emerald-50"
                    : isClosed
                      ? `bg-red-50/60 print:bg-red-50 ${reachedInterview ? "font-semibold" : ""}`
                      : reachedInterview
                        ? "font-semibold"
                        : undefined;

                  return (
                    <TableRow key={application.id} className={rowClassName}>
                      <TableCell className="font-medium">{index + 1}</TableCell>
                      <TableCell>
                        {companiesById.get(application.companyId)?.name ?? "-"}
                      </TableCell>
                      <TableCell>
                        <div>{rolesById.get(application.roleId)?.title ?? "-"}</div>
                        {shouldShowInterviewedBlurb ? (
                          <div className="mt-1 text-xs font-medium text-neutral-600">
                            {copy.interviewed}
                          </div>
                        ) : null}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="rounded-full bg-white/70">
                          {statusLabels[application.status]}
                        </Badge>
                      </TableCell>
                      <TableCell>{application.dateApplied || "-"}</TableCell>
                      <TableCell>{application.channel || "-"}</TableCell>
                      <TableCell className="max-w-[220px] whitespace-normal">
                        {visibleNextAction || "-"}
                      </TableCell>
                      <TableCell className="max-w-[260px] whitespace-normal">
                        {application.notes || "-"}
                      </TableCell>
                    </TableRow>
                  );
                })}
                {!loading && visibleApplications.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="py-10 text-center text-sm text-neutral-500">
                      {copy.empty}
                    </TableCell>
                  </TableRow>
                ) : null}
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="py-10 text-center text-sm text-neutral-500">
                      {copy.loading}
                    </TableCell>
                  </TableRow>
                ) : null}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <section className="rounded-md border border-neutral-200 bg-neutral-50 p-4 print:bg-white">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-500">
            {copy.nextActions}
          </h2>
          <div className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
            <div>
              <span className="font-medium">{copy.numberOfInterviews}</span>{" "}
              {interviewMetrics.interviewCount}
            </div>
            <div>
              <span className="font-medium">{copy.activeInterviews}</span>{" "}
              {interviewMetrics.activeInterviewCount}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
