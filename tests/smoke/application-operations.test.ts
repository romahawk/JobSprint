import { describe, expect, it } from "vitest";
import {
  addApplicationRecord,
  deleteApplicationRecord,
  moveApplicationStatus,
  updateApplicationRecord,
} from "../../src/app/state/applicationOperations";
import type { Application } from "../../src/app/types";

function buildApplication(overrides: Partial<Application> = {}): Application {
  return {
    id: "app-1",
    company: "ACME",
    role: "Product Manager",
    location: "Remote",
    type: "product",
    salary: "$100k - $120k",
    jobLink: "https://example.com/job",
    dateApplied: "2026-03-01",
    referral: false,
    notes: "",
    status: "applied",
    priority: "medium",
    ...overrides,
  };
}

describe("application operations smoke tests", () => {
  it("supports create and update flow", () => {
    const before: Application[] = [];
    const afterCreate = addApplicationRecord(before, {
      company: "ACME",
      role: "PM",
      location: "Remote",
      type: "product",
      salary: "",
      jobLink: "",
      dateApplied: "2026-03-02",
      referral: false,
      notes: "",
      status: "targeted",
      priority: "medium",
    });
    expect(afterCreate).toHaveLength(1);
    expect(afterCreate[0].id).toContain("app-");

    const createdId = afterCreate[0].id;
    const afterUpdate = updateApplicationRecord(afterCreate, createdId, {
      company: "Updated Co",
      status: "interview",
    });
    expect(afterUpdate[0].company).toBe("Updated Co");
    expect(afterUpdate[0].status).toBe("interview");
  });

  it("supports delete flow", () => {
    const apps = [buildApplication(), buildApplication({ id: "app-2" })];
    const afterDelete = deleteApplicationRecord(apps, "app-1");
    expect(afterDelete).toHaveLength(1);
    expect(afterDelete[0].id).toBe("app-2");
  });

  it("supports pipeline status movement", () => {
    const apps = [buildApplication({ status: "applied" })];
    const moved = moveApplicationStatus(apps, "app-1", "final_round");
    expect(moved[0].status).toBe("final_round");
  });
});

