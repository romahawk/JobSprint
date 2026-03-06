import { useMemo, useState } from "react";
import { FileDown, Printer } from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import type { AfaVorschlag } from "../../types/afa";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const ACTION_STATUS_LABELS: Record<string, string> = {
  received: "Received",
  reviewing: "Under Review",
  applied: "Application Submitted",
  feedback_submitted: "Portal Feedback Submitted",
  closed: "Closed",
  justified_non_application: "Not Applied (Justified)",
};

const EMPLOYER_RESPONSE_LABELS: Record<string, string> = {
  pending: "Pending",
  rejected: "Rejected",
  interview: "Interview",
  offer: "Offer",
  hired: "Hired",
  no_response: "No Response",
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function fmtDate(d: string | null | undefined): string {
  if (!d) return "—";
  const parts = d.slice(0, 10).split("-");
  if (parts.length !== 3) return d;
  return `${parts[2]}.${parts[1]}.${parts[0]}`;
}

function rfbLabel(v: string): string {
  if (v === "yes") return "Yes";
  if (v === "no") return "No";
  return "Unknown";
}

function defaultRange(): { from: string; to: string } {
  const to = new Date();
  const from = new Date();
  from.setDate(from.getDate() - 30);
  return {
    from: from.toISOString().slice(0, 10),
    to: to.toISOString().slice(0, 10),
  };
}

// ---------------------------------------------------------------------------
// Report row type — only AfA-relevant fields, no internal data
// ---------------------------------------------------------------------------

interface ReportRow {
  case_id: string;
  received_date: string;
  employer_name: string;
  position_title: string;
  location: string;
  rfb_present: string;
  action_status: string;
  applied_date: string | null;
  portal_feedback_date: string | null;
  employer_response: string;
  deadline_date: string | null;
}

function toReportRow(c: AfaVorschlag): ReportRow {
  return {
    case_id: c.case_id,
    received_date: c.received_date,
    employer_name: c.employer_name,
    position_title: c.position_title,
    location: c.location || "—",
    rfb_present: rfbLabel(c.rfb_present),
    action_status: ACTION_STATUS_LABELS[c.action_status] ?? c.action_status,
    applied_date: c.applied_date,
    portal_feedback_date: c.portal_feedback_date,
    employer_response:
      EMPLOYER_RESPONSE_LABELS[c.employer_response] ?? c.employer_response,
    deadline_date: c.deadline_date,
  };
}

// ---------------------------------------------------------------------------
// PDF print HTML builder
// ---------------------------------------------------------------------------

function buildPrintHtml(
  rows: ReportRow[],
  dateFrom: string,
  dateTo: string,
  summary: ReportSummary
): string {
  const tableRows = rows
    .map(
      (r) => `
      <tr>
        <td>${r.case_id}</td>
        <td>${fmtDate(r.received_date)}</td>
        <td>${r.employer_name}</td>
        <td>${r.position_title}</td>
        <td>${r.location}</td>
        <td>${r.rfb_present}</td>
        <td>${r.action_status}</td>
        <td>${fmtDate(r.applied_date)}</td>
        <td>${fmtDate(r.portal_feedback_date)}</td>
        <td>${r.employer_response}</td>
        <td>${fmtDate(r.deadline_date)}</td>
      </tr>`
    )
    .join("");

  const emptyRow = `<tr><td colspan="11" style="text-align:center;padding:16px;color:#888;">
    No cases found in the selected date range.</td></tr>`;

  return `<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8" />
  <title>AfA_Compliance_Report_${dateFrom}_to_${dateTo}</title>
  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    body{font-family:Arial,Helvetica,sans-serif;font-size:10pt;color:#000;padding:18mm 20mm}
    h1{font-size:15pt;font-weight:bold;margin-bottom:3px;letter-spacing:-0.02em}
    .meta{font-size:9pt;color:#555;margin-bottom:14px;border-bottom:1px solid #ddd;padding-bottom:10px}
    .summary{display:grid;grid-template-columns:repeat(3,1fr);gap:6px;margin-bottom:14px;
             border:1px solid #ccc;padding:10px 12px;background:#f9f9f9}
    .s-item .s-label{font-size:7.5pt;color:#666;text-transform:uppercase;letter-spacing:.06em}
    .s-item .s-value{font-size:14pt;font-weight:bold;color:#000;line-height:1.2}
    table{width:100%;border-collapse:collapse;font-size:7.5pt}
    thead tr{background:#eee}
    th{border:1px solid #bbb;padding:5px 5px;text-align:left;font-weight:bold;
       text-transform:uppercase;font-size:7pt;letter-spacing:.04em}
    td{border:1px solid #d0d0d0;padding:4px 5px;vertical-align:top}
    tr:nth-child(even) td{background:#fafafa}
    .footer{margin-top:14px;font-size:7.5pt;color:#777;border-top:1px solid #e0e0e0;
            padding-top:8px}
    @page{margin:15mm}
    @media print{body{padding:0}}
  </style>
</head>
<body>
  <h1>AfA Compliance Report</h1>
  <div class="meta">
    Date Range: ${fmtDate(dateFrom)} – ${fmtDate(dateTo)}
    &nbsp;&nbsp;|&nbsp;&nbsp;
    Generated: ${fmtDate(new Date().toISOString().slice(0, 10))}
  </div>

  <div class="summary">
    <div class="s-item">
      <div class="s-label">Total Vermittlungsvorschläge</div>
      <div class="s-value">${summary.total}</div>
    </div>
    <div class="s-item">
      <div class="s-label">Applications Submitted</div>
      <div class="s-value">${summary.applied}</div>
    </div>
    <div class="s-item">
      <div class="s-label">Portal Feedback Submitted</div>
      <div class="s-value">${summary.feedbackSubmitted}</div>
    </div>
    <div class="s-item">
      <div class="s-label">Rejections Received</div>
      <div class="s-value">${summary.rejections}</div>
    </div>
    <div class="s-item">
      <div class="s-label">Interviews</div>
      <div class="s-value">${summary.interviews}</div>
    </div>
    <div class="s-item">
      <div class="s-label">Open Cases</div>
      <div class="s-value">${summary.open}</div>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th>Case ID</th><th>Received</th><th>Employer</th><th>Position</th>
        <th>Location</th><th>RFB</th><th>Status</th><th>Applied</th>
        <th>Portal Feedback</th><th>Employer Response</th><th>Deadline</th>
      </tr>
    </thead>
    <tbody>${rows.length > 0 ? tableRows : emptyRow}</tbody>
  </table>

  <div class="footer">
    This report was generated automatically from the AfA Compliance Module.
    It contains only information relevant to Agentur für Arbeit compliance submission.
    Internal notes, risk scores, and strategy data are excluded.
  </div>
  <script>window.onload=function(){window.print()}</script>
</body>
</html>`;
}

// ---------------------------------------------------------------------------
// Summary type
// ---------------------------------------------------------------------------

interface ReportSummary {
  total: number;
  applied: number;
  feedbackSubmitted: number;
  rejections: number;
  interviews: number;
  open: number;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface AfaReportGeneratorProps {
  cases: AfaVorschlag[];
}

export function AfaReportGenerator({ cases }: AfaReportGeneratorProps) {
  const { from: defaultFrom, to: defaultTo } = defaultRange();
  const [dateFrom, setDateFrom] = useState(defaultFrom);
  const [dateTo, setDateTo] = useState(defaultTo);

  const filtered = useMemo<ReportRow[]>(() => {
    return cases
      .filter(
        (c) =>
          c.received_date >= dateFrom && c.received_date <= dateTo
      )
      .sort((a, b) => a.received_date.localeCompare(b.received_date))
      .map(toReportRow);
  }, [cases, dateFrom, dateTo]);

  const summary = useMemo<ReportSummary>(() => {
    const src = cases.filter(
      (c) => c.received_date >= dateFrom && c.received_date <= dateTo
    );
    return {
      total: src.length,
      applied: src.filter((c) =>
        ["applied", "feedback_submitted"].includes(c.action_status)
      ).length,
      feedbackSubmitted: src.filter(
        (c) => c.action_status === "feedback_submitted"
      ).length,
      rejections: src.filter((c) => c.employer_response === "rejected").length,
      interviews: src.filter((c) => c.employer_response === "interview").length,
      open: src.filter(
        (c) =>
          !["closed", "justified_non_application"].includes(c.action_status)
      ).length,
    };
  }, [cases, dateFrom, dateTo]);

  function handleExportCSV() {
    const headers = [
      "Case ID",
      "Received Date",
      "Employer",
      "Position",
      "Location",
      "RFB",
      "Application Status",
      "Applied Date",
      "Portal Feedback Date",
      "Employer Response",
      "Deadline",
    ];

    const csvRows = filtered.map((r) => [
      r.case_id,
      fmtDate(r.received_date),
      r.employer_name,
      r.position_title,
      r.location,
      r.rfb_present,
      r.action_status,
      fmtDate(r.applied_date),
      fmtDate(r.portal_feedback_date),
      r.employer_response,
      fmtDate(r.deadline_date),
    ]);

    const csv = [headers, ...csvRows]
      .map((row) =>
        row
          .map((cell) => `"${String(cell ?? "").replace(/"/g, '""')}"`)
          .join(",")
      )
      .join("\r\n");

    const blob = new Blob(["\uFEFF" + csv], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `AfA_Compliance_Report_${dateFrom}_to_${dateTo}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function handlePrint() {
    const html = buildPrintHtml(filtered, dateFrom, dateTo, summary);
    const win = window.open("", "_blank", "width=1000,height=750");
    if (!win) {
      alert(
        "Pop-up blocked. Please allow pop-ups for this site to export the PDF."
      );
      return;
    }
    win.document.write(html);
    win.document.close();
  }

  const SUMMARY_ITEMS = [
    { label: "Total Proposals", value: summary.total },
    { label: "Applications Submitted", value: summary.applied },
    { label: "Portal Feedback Submitted", value: summary.feedbackSubmitted },
    { label: "Rejections Received", value: summary.rejections },
    { label: "Interviews", value: summary.interviews },
    { label: "Open Cases", value: summary.open },
  ] as const;

  const TABLE_HEADERS = [
    "Case ID",
    "Received",
    "Employer",
    "Position",
    "Location",
    "RFB",
    "Status",
    "Applied",
    "Portal Feedback",
    "Employer Response",
    "Deadline",
  ] as const;

  return (
    <div className="bg-card border border-border rounded-lg p-5">
      {/* Header row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
        <div>
          <h3 className="text-sm font-semibold text-foreground">
            Export AfA Compliance Report
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Printable report for submission to Agentur für Arbeit
          </p>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5"
            onClick={handleExportCSV}
            disabled={filtered.length === 0}
          >
            <FileDown className="w-3.5 h-3.5" />
            Export CSV
          </Button>
          <Button
            size="sm"
            className="gap-1.5"
            onClick={handlePrint}
            disabled={filtered.length === 0}
          >
            <Printer className="w-3.5 h-3.5" />
            Export PDF / Print
          </Button>
        </div>
      </div>

      {/* Date range */}
      <div className="flex flex-wrap items-end gap-4 mb-5">
        <div>
          <Label htmlFor="report-date-from" className="text-xs mb-1 block">
            From
          </Label>
          <Input
            id="report-date-from"
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="w-40"
          />
        </div>
        <div>
          <Label htmlFor="report-date-to" className="text-xs mb-1 block">
            To
          </Label>
          <Input
            id="report-date-to"
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="w-40"
          />
        </div>
        <span className="text-xs text-muted-foreground pb-2">
          {filtered.length} case{filtered.length !== 1 ? "s" : ""} in range
        </span>
      </div>

      {/* Summary metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-5">
        {SUMMARY_ITEMS.map(({ label, value }) => (
          <div
            key={label}
            className="bg-muted/40 rounded-md px-3 py-3 border border-border/50"
          >
            <div className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground leading-tight mb-1">
              {label}
            </div>
            <div className="text-2xl font-bold text-foreground leading-none">
              {value}
            </div>
          </div>
        ))}
      </div>

      {/* Preview table */}
      {filtered.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground text-sm border border-dashed border-border rounded-lg">
          No cases found in the selected date range.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-md border border-border">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                {TABLE_HEADERS.map((h) => (
                  <th
                    key={h}
                    className="px-3 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground whitespace-nowrap"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((r, i) => (
                <tr
                  key={r.case_id}
                  className={`border-b border-border last:border-0 ${
                    i % 2 === 0 ? "" : "bg-muted/20"
                  }`}
                >
                  <td className="px-3 py-2 font-mono text-[10px] text-muted-foreground whitespace-nowrap">
                    {r.case_id}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    {fmtDate(r.received_date)}
                  </td>
                  <td className="px-3 py-2 font-medium whitespace-nowrap">
                    {r.employer_name}
                  </td>
                  <td className="px-3 py-2">{r.position_title}</td>
                  <td className="px-3 py-2 text-muted-foreground">
                    {r.location}
                  </td>
                  <td className="px-3 py-2">{r.rfb_present}</td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    {r.action_status}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    {fmtDate(r.applied_date)}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    {fmtDate(r.portal_feedback_date)}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    {r.employer_response}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    {fmtDate(r.deadline_date)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
