import { useState, useMemo } from "react";
import { ArrowUpDown, ExternalLink } from "lucide-react";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Input } from "../ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import type {
  AfaVorschlag,
  AfaRiskStatus,
  AfaDeadlineStatus,
  AfaActionStatus,
} from "../../types/afa";

// ---------------------------------------------------------------------------
// Badge helpers
// ---------------------------------------------------------------------------

function riskBadgeClass(risk: AfaRiskStatus): string {
  switch (risk) {
    case "HIGH":
      return "bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800";
    case "MEDIUM":
      return "bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-400 dark:border-orange-800";
    case "SAFE":
      return "bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800";
    case "LOW":
      return "bg-neutral-100 text-neutral-600 border-neutral-200 dark:bg-neutral-800 dark:text-neutral-400 dark:border-neutral-700";
    default:
      return "bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-800";
  }
}

function deadlineBadgeClass(status: AfaDeadlineStatus): string {
  switch (status) {
    case "OVERDUE":
      return "bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800";
    case "URGENT":
      return "bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-400 dark:border-orange-800";
    case "UPCOMING":
      return "bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-800";
    case "SAFE":
      return "bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800";
    default:
      return "bg-neutral-100 text-neutral-600 border-neutral-200 dark:bg-neutral-800 dark:text-neutral-400 dark:border-neutral-700";
  }
}

function deadlineLabel(v: AfaVorschlag): string {
  const { deadline_status, days_left } = v.computed;
  if (deadline_status === "NO_DEADLINE") return "—";
  if (deadline_status === "OVERDUE")
    return `OVERDUE ${Math.abs(days_left ?? 0)}d`;
  if (days_left !== null) return `${deadline_status} (${days_left}d)`;
  return deadline_status;
}

function actionStatusLabel(s: AfaActionStatus): string {
  const labels: Record<AfaActionStatus, string> = {
    received: "Received",
    reviewing: "Reviewing",
    applied: "Applied",
    feedback_submitted: "Feedback Sent",
    closed: "Closed",
    justified_non_application: "Justified N/A",
  };
  return labels[s] ?? s;
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface AfaTableProps {
  cases: AfaVorschlag[];
  onOpenDetails: (v: AfaVorschlag) => void;
  onMarkApplied: (id: string) => void;
  onMarkFeedback: (id: string) => void;
  onCloseCase: (id: string) => void;
  onDeleteCase: (id: string) => void;
}

const PAGE_SIZE = 10;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function AfaTable({
  cases,
  onOpenDetails,
  onMarkApplied,
  onMarkFeedback,
  onCloseCase,
  onDeleteCase,
}: AfaTableProps) {
  const [search, setSearch] = useState("");
  const [filterRisk, setFilterRisk] = useState<string>("all");
  const [filterDeadline, setFilterDeadline] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [sortDeadlineAsc, setSortDeadlineAsc] = useState(true);
  const [page, setPage] = useState(0);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return cases
      .filter((c) => {
        if (filterRisk !== "all" && c.computed.risk_status !== filterRisk)
          return false;
        if (
          filterDeadline !== "all" &&
          c.computed.deadline_status !== filterDeadline
        )
          return false;
        if (filterStatus !== "all" && c.action_status !== filterStatus)
          return false;
        if (
          q &&
          !c.employer_name.toLowerCase().includes(q) &&
          !c.position_title.toLowerCase().includes(q) &&
          !c.case_id.toLowerCase().includes(q)
        )
          return false;
        return true;
      })
      .sort((a, b) => {
        const aDays = a.computed.days_left ?? (sortDeadlineAsc ? Infinity : -Infinity);
        const bDays = b.computed.days_left ?? (sortDeadlineAsc ? Infinity : -Infinity);
        return sortDeadlineAsc ? aDays - bDays : bDays - aDays;
      });
  }, [cases, search, filterRisk, filterDeadline, filterStatus, sortDeadlineAsc]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages - 1);
  const paginated = filtered.slice(
    currentPage * PAGE_SIZE,
    currentPage * PAGE_SIZE + PAGE_SIZE
  );

  function resetPage() {
    setPage(0);
  }

  return (
    <div className="space-y-4">
      {/* Filter bar */}
      <div className="flex flex-wrap gap-3 items-center">
        <Input
          placeholder="Search employer or title…"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            resetPage();
          }}
          className="w-56"
        />

        <Select
          value={filterRisk}
          onValueChange={(v) => {
            setFilterRisk(v);
            resetPage();
          }}
        >
          <SelectTrigger className="w-36">
            <SelectValue placeholder="Risk" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Risk</SelectItem>
            <SelectItem value="HIGH">HIGH</SelectItem>
            <SelectItem value="MEDIUM">MEDIUM</SelectItem>
            <SelectItem value="SAFE">SAFE</SelectItem>
            <SelectItem value="LOW">LOW</SelectItem>
            <SelectItem value="CHECK">CHECK</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={filterDeadline}
          onValueChange={(v) => {
            setFilterDeadline(v);
            resetPage();
          }}
        >
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Deadline" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Deadlines</SelectItem>
            <SelectItem value="OVERDUE">OVERDUE</SelectItem>
            <SelectItem value="URGENT">URGENT</SelectItem>
            <SelectItem value="UPCOMING">UPCOMING</SelectItem>
            <SelectItem value="SAFE">SAFE</SelectItem>
            <SelectItem value="NO_DEADLINE">NO DEADLINE</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={filterStatus}
          onValueChange={(v) => {
            setFilterStatus(v);
            resetPage();
          }}
        >
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="received">Received</SelectItem>
            <SelectItem value="reviewing">Reviewing</SelectItem>
            <SelectItem value="applied">Applied</SelectItem>
            <SelectItem value="feedback_submitted">Feedback Sent</SelectItem>
            <SelectItem value="closed">Closed</SelectItem>
            <SelectItem value="justified_non_application">Justified N/A</SelectItem>
          </SelectContent>
        </Select>

        <span className="text-xs text-neutral-500 dark:text-neutral-400 ml-auto">
          {filtered.length} case{filtered.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Table */}
      <div className="border border-neutral-200 dark:border-neutral-800 rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-neutral-50 dark:bg-neutral-900/50">
              <TableHead className="w-36">Case ID</TableHead>
              <TableHead>Employer</TableHead>
              <TableHead>Position</TableHead>
              <TableHead>
                <button
                  onClick={() => setSortDeadlineAsc((p) => !p)}
                  className="flex items-center gap-1 font-medium text-foreground hover:text-primary transition-colors"
                >
                  Deadline
                  <ArrowUpDown className="w-3 h-3" />
                </button>
              </TableHead>
              <TableHead>Risk</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Match</TableHead>
              <TableHead>Response</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginated.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={9}
                  className="text-center py-10 text-neutral-400 dark:text-neutral-600"
                >
                  No cases match the current filters.
                </TableCell>
              </TableRow>
            )}
            {paginated.map((v) => (
              <TableRow key={v.id}>
                <TableCell className="font-mono text-xs text-neutral-500 dark:text-neutral-400">
                  {v.case_id}
                </TableCell>
                <TableCell className="font-medium max-w-[160px] truncate">
                  {v.employer_name || "—"}
                </TableCell>
                <TableCell className="max-w-[160px] truncate text-neutral-600 dark:text-neutral-300">
                  {v.position_title || "—"}
                </TableCell>
                <TableCell>
                  <Badge
                    className={deadlineBadgeClass(v.computed.deadline_status)}
                    variant="outline"
                  >
                    {deadlineLabel(v)}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge
                    className={riskBadgeClass(v.computed.risk_status)}
                    variant="outline"
                  >
                    {v.computed.risk_status}
                  </Badge>
                </TableCell>
                <TableCell className="text-sm text-neutral-600 dark:text-neutral-300">
                  {actionStatusLabel(v.action_status)}
                </TableCell>
                <TableCell className="capitalize text-sm text-neutral-600 dark:text-neutral-300">
                  {v.match_level}
                </TableCell>
                <TableCell className="capitalize text-sm text-neutral-600 dark:text-neutral-300">
                  {v.employer_response === "no_response" ? "No response" : v.employer_response}
                </TableCell>
                <TableCell>
                  <div className="flex items-center justify-end gap-1">
                    {v.action_status !== "applied" &&
                      v.action_status !== "feedback_submitted" &&
                      v.action_status !== "closed" && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs px-2"
                          onClick={() => onMarkApplied(v.id)}
                        >
                          Applied
                        </Button>
                      )}
                    {v.applied_date &&
                      v.action_status !== "feedback_submitted" &&
                      v.action_status !== "closed" && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs px-2"
                          onClick={() => onMarkFeedback(v.id)}
                        >
                          Feedback
                        </Button>
                      )}
                    {v.action_status !== "closed" && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs px-2 text-neutral-500"
                        onClick={() => onCloseCase(v.id)}
                      >
                        Close
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 text-xs px-2"
                      onClick={() => onOpenDetails(v)}
                    >
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 text-xs px-2 text-red-500 hover:text-red-600"
                      onClick={() => onDeleteCase(v.id)}
                    >
                      Delete
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 w-7 p-0"
                      onClick={() => onOpenDetails(v)}
                      aria-label="Open details"
                    >
                      <ExternalLink className="w-3 h-3" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-neutral-500 dark:text-neutral-400">
          <span>
            Page {currentPage + 1} of {totalPages}
          </span>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              disabled={currentPage === 0}
              onClick={() => setPage((p) => Math.max(0, p - 1))}
            >
              Previous
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={currentPage >= totalPages - 1}
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
