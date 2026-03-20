import { describe, expect, it } from "vitest";
import {
  JOB_OS_EXPORT_KIND,
  JOB_OS_EXPORT_VERSION,
  parseJobOsImport,
  serializeJobOsExport,
} from "../../src/app/services/jobOsTransfer";
import { EMPTY_JOB_OS_STATE } from "../../src/app/services/jobOsState";
import type { JobOsState } from "../../src/app/types/jobOs";

function buildState(): JobOsState {
  return {
    ...EMPTY_JOB_OS_STATE,
    companies: [
      {
        id: "company-1",
        name: "Apheris",
        industry: "Health Tech",
        size: "201-500",
        remotePolicy: "Remote",
        priority: "A",
        status: "Active",
        notes: "Priority target",
        createdAt: "2026-03-10T10:00:00.000Z",
        updatedAt: "2026-03-10T10:00:00.000Z",
      },
    ],
    roles: [
      {
        id: "role-1",
        companyId: "company-1",
        title: "Technical Chief of Staff",
        url: "https://example.com/roles/1",
        location: "Remote",
        seniority: "Senior",
        track: "Systems PM",
        fitScore: 4,
        status: "applied",
        origin: "self_sourced",
        jobDescription: "Lead cross-functional CTO office operations.",
        jobDescriptionUpdatedAt: "2026-03-10T10:05:00.000Z",
        createdAt: "2026-03-10T10:00:00.000Z",
        updatedAt: "2026-03-10T10:05:00.000Z",
      },
    ],
    applications: [
      {
        id: "application-1",
        companyId: "company-1",
        roleId: "role-1",
        dateApplied: "2026-03-12",
        channel: "Company Site",
        cvVersion: "CV - Systems / Platform PM",
        status: "sent",
        nextAction: "Follow up next week",
        notes: "",
        latestJobDescriptionId: undefined,
        latestCvTailoringRunId: undefined,
        tailoredCvHeadline: "",
        tailoredCvSummary: "",
        tailoredCvText: "",
        tailoredCvUpdatedAt: undefined,
        createdAt: "2026-03-12T08:00:00.000Z",
        updatedAt: "2026-03-12T08:00:00.000Z",
      },
    ],
  };
}

describe("job os transfer", () => {
  it("serializes a versioned export envelope", () => {
    const parsed = JSON.parse(serializeJobOsExport(buildState()));

    expect(parsed.kind).toBe(JOB_OS_EXPORT_KIND);
    expect(parsed.version).toBe(JOB_OS_EXPORT_VERSION);
    expect(typeof parsed.exportedAt).toBe("string");
    expect(parsed.state.companies).toHaveLength(1);
    expect(parsed.state.roles[0].title).toBe("Technical Chief of Staff");
  });

  it("parses a valid export and normalizes missing sections", () => {
    const imported = parseJobOsImport(
      JSON.stringify({
        kind: JOB_OS_EXPORT_KIND,
        version: JOB_OS_EXPORT_VERSION,
        exportedAt: "2026-03-19T08:00:00.000Z",
        state: {
          companies: buildState().companies,
          roles: buildState().roles,
          applications: buildState().applications,
        },
      })
    );

    expect(imported.companies[0].name).toBe("Apheris");
    expect(imported.roles[0].status).toBe("applied");
    expect(imported.assets.cvs).toHaveLength(0);
    expect(imported.cvProfiles.length).toBeGreaterThanOrEqual(3);
  });

  it("rejects invalid json", () => {
    expect(() => parseJobOsImport("{not-json}")).toThrow("Import file is not valid JSON.");
  });

  it("rejects unsupported export kinds", () => {
    expect(() =>
      parseJobOsImport(
        JSON.stringify({
          kind: "not-job-os",
          version: JOB_OS_EXPORT_VERSION,
          exportedAt: "2026-03-19T08:00:00.000Z",
          state: {},
        })
      )
    ).toThrow("Import file is not a JobSprint Job OS export.");
  });
});
