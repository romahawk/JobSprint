import { Link } from "react-router";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";
import { useApp } from "../../context";
import { useJobOs } from "../../hooks/useJobOs";
import { JobOsLayout } from "../../components/job-os/JobOsLayout";

function daysAgo(dateValue: string): number {
  const date = new Date(dateValue).getTime();
  const now = Date.now();
  return Math.floor((now - date) / (24 * 60 * 60 * 1000));
}

export default function JobOsDashboardPage() {
  const { session } = useApp();
  const { applications, outreach, companies, roles, syncNotice } = useJobOs(
    session?.userId ?? null
  );

  const appsLast7Days = applications.filter((a) => daysAgo(a.dateApplied) <= 7).length;
  const outreachLast7Days = outreach.filter((o) => daysAgo(o.sentDate) <= 7).length;
  const activeInterviews = applications.filter((a) =>
    a.status === "interview" || a.status === "final" || a.status === "case"
  ).length;

  const today = new Date().toISOString().slice(0, 10);
  const followUpsDueToday = outreach.filter(
    (o) => o.nextFollowUpDate && o.nextFollowUpDate <= today && o.status !== "closed"
  );

  const pipeline = {
    applied: applications.filter((a) => a.status === "sent").length,
    screen: applications.filter((a) => a.status === "screen").length,
    interview: applications.filter((a) => a.status === "interview").length,
    final: applications.filter((a) => a.status === "final").length,
    offer: applications.filter((a) => a.status === "offer").length,
    rejected: applications.filter((a) => a.status === "rejected").length,
  };

  const followUpRows = followUpsDueToday.map((o) => {
    const company = companies.find((c) => c.id === o.companyId)?.name ?? "Unknown";
    const role = roles.find((r) => r.id === o.roleId)?.title ?? "-";
    return {
      id: o.id,
      company,
      role,
      nextAction: o.followUpCount > 0 ? `Follow-up #${o.followUpCount + 1}` : "First follow-up",
      date: o.nextFollowUpDate ?? today,
    };
  });

  return (
    <JobOsLayout
      title="Job OS Dashboard"
      subtitle="Weekly execution overview for high-volume applications"
      notice={syncNotice}
      actions={
        <div className="flex items-center gap-2">
          <Link to="/job-os/companies"><Button size="sm">Add Company</Button></Link>
          <Link to="/job-os/roles"><Button size="sm" variant="outline">Add Role</Button></Link>
          <Link to="/job-os/applications"><Button size="sm" variant="outline">Log Application</Button></Link>
          <Link to="/job-os/outreach"><Button size="sm" variant="outline">Add Outreach</Button></Link>
        </div>
      }
    >
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card><CardHeader><CardTitle className="text-xs">Applications (7d)</CardTitle></CardHeader><CardContent className="text-3xl font-semibold">{appsLast7Days}</CardContent></Card>
        <Card><CardHeader><CardTitle className="text-xs">Outreach Sent (7d)</CardTitle></CardHeader><CardContent className="text-3xl font-semibold">{outreachLast7Days}</CardContent></Card>
        <Card><CardHeader><CardTitle className="text-xs">Active Interviews</CardTitle></CardHeader><CardContent className="text-3xl font-semibold">{activeInterviews}</CardContent></Card>
        <Card><CardHeader><CardTitle className="text-xs">Follow-ups Due Today</CardTitle></CardHeader><CardContent className="text-3xl font-semibold">{followUpsDueToday.length}</CardContent></Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Pipeline Summary</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 md:grid-cols-6 gap-3 text-sm">
          <div className="rounded border border-blue-200 bg-blue-50 px-3 py-2 text-blue-700">Applied: {pipeline.applied}</div>
          <div className="rounded border border-sky-200 bg-sky-50 px-3 py-2 text-sky-700">Screen: {pipeline.screen}</div>
          <div className="rounded border border-purple-200 bg-purple-50 px-3 py-2 text-purple-700">Interview: {pipeline.interview}</div>
          <div className="rounded border border-violet-200 bg-violet-50 px-3 py-2 text-violet-700">Final: {pipeline.final}</div>
          <div className="rounded border border-green-200 bg-green-50 px-3 py-2 text-green-700">Offer: {pipeline.offer}</div>
          <div className="rounded border border-red-200 bg-red-50 px-3 py-2 text-red-700">Rejected: {pipeline.rejected}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Follow-ups Due</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Company</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Next Action</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {followUpRows.length === 0 && (
                <TableRow><TableCell colSpan={4} className="text-center text-neutral-500">No follow-ups due today.</TableCell></TableRow>
              )}
              {followUpRows.map((row) => (
                <TableRow key={row.id}>
                  <TableCell>{row.company}</TableCell>
                  <TableCell>{row.role}</TableCell>
                  <TableCell>{row.nextAction}</TableCell>
                  <TableCell>{row.date}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </JobOsLayout>
  );
}
