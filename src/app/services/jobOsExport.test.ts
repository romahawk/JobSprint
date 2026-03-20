import { describe, expect, it } from "vitest";
import {
  EXPORT_SCHEMA_VERSION,
  parseJobOsExport,
  serializeJobOs,
  type JobOsExportFile,
} from "./jobOsExport";
import type { JobOsCompany, JobOsRole, JobOsApplication, JobOsOutreach } from "../types/jobOs";

const EMPTY_DATA = {
  companies: [] as JobOsCompany[],
  roles: [] as JobOsRole[],
  applications: [] as JobOsApplication[],
  outreach: [] as JobOsOutreach[],
};

describe("serializeJobOs", () => {
  it("produces valid JSON with the correct schema version", () => {
    const json = serializeJobOs(EMPTY_DATA);
    const parsed = JSON.parse(json) as JobOsExportFile;
    expect(parsed.schemaVersion).toBe(EXPORT_SCHEMA_VERSION);
  });

  it("includes an exportedAt ISO timestamp", () => {
    const json = serializeJobOs(EMPTY_DATA);
    const parsed = JSON.parse(json) as JobOsExportFile;
    expect(new Date(parsed.exportedAt).getTime()).toBeGreaterThan(0);
  });

  it("preserves all four collections", () => {
    const company: JobOsCompany = {
      id: "c1",
      name: "Acme",
      website: "",
      priority: "A",
      status: "active",
      notes: "",
      createdAt: new Date(0).toISOString(),
      updatedAt: new Date(0).toISOString(),
    };
    const json = serializeJobOs({ ...EMPTY_DATA, companies: [company] });
    const parsed = JSON.parse(json) as JobOsExportFile;
    expect(parsed.companies).toHaveLength(1);
    expect(parsed.companies[0].id).toBe("c1");
    expect(parsed.roles).toEqual([]);
    expect(parsed.applications).toEqual([]);
    expect(parsed.outreach).toEqual([]);
  });
});

describe("parseJobOsExport", () => {
  it("round-trips a serialized export", () => {
    const json = serializeJobOs(EMPTY_DATA);
    const result = parseJobOsExport(json);
    expect(result.schemaVersion).toBe(EXPORT_SCHEMA_VERSION);
    expect(result.companies).toEqual([]);
  });

  it("throws on invalid JSON", () => {
    expect(() => parseJobOsExport("not json {{")).toThrow("Invalid JSON");
  });

  it("throws when schemaVersion is missing", () => {
    const bad = JSON.stringify({ companies: [], roles: [], applications: [], outreach: [] });
    expect(() => parseJobOsExport(bad)).toThrow("Unsupported schema version");
  });

  it("throws when schemaVersion is unknown", () => {
    const bad = JSON.stringify({
      schemaVersion: "99",
      exportedAt: new Date().toISOString(),
      companies: [],
      roles: [],
      applications: [],
      outreach: [],
    });
    expect(() => parseJobOsExport(bad)).toThrow("Unsupported schema version");
  });

  it("throws when a required collection is not an array", () => {
    const bad = JSON.stringify({
      schemaVersion: EXPORT_SCHEMA_VERSION,
      exportedAt: new Date().toISOString(),
      companies: null,
      roles: [],
      applications: [],
      outreach: [],
    });
    expect(() => parseJobOsExport(bad)).toThrow('"companies" must be an array');
  });

  it("throws when the top-level value is an array", () => {
    expect(() => parseJobOsExport("[]")).toThrow("expected a JSON object");
  });
});
