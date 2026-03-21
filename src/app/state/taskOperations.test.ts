import { describe, it, expect } from "vitest";
import {
  addTasksRecord,
  toggleTaskRecord,
  dismissTaskRecord,
  replaceTasksForApplication,
} from "./taskOperations";
import type { NextActionTask } from "../types";

function makeTask(overrides: Partial<NextActionTask> = {}): NextActionTask {
  return {
    id: "t1",
    applicationId: "app-1",
    action: "apply",
    priority: "high",
    status: "open",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

describe("addTasksRecord", () => {
  it("adds a task when none exist", () => {
    const result = addTasksRecord([], [
      { applicationId: "app-1", action: "apply", priority: "high", status: "open" },
    ]);
    expect(result).toHaveLength(1);
    expect(result[0].action).toBe("apply");
    expect(result[0].id).toMatch(/^task-/);
  });

  it("skips duplicate open action for same applicationId", () => {
    const existing = [makeTask()];
    const result = addTasksRecord(existing, [
      { applicationId: "app-1", action: "apply", priority: "urgent", status: "open" },
    ]);
    expect(result).toHaveLength(1);
  });

  it("allows same action when existing is dismissed", () => {
    const existing = [makeTask({ status: "dismissed" })];
    const result = addTasksRecord(existing, [
      { applicationId: "app-1", action: "apply", priority: "urgent", status: "open" },
    ]);
    expect(result).toHaveLength(2);
  });

  it("does not mutate input array", () => {
    const existing: NextActionTask[] = [];
    addTasksRecord(existing, [
      { applicationId: "app-1", action: "apply", priority: "high", status: "open" },
    ]);
    expect(existing).toHaveLength(0);
  });
});

describe("toggleTaskRecord", () => {
  it("toggles open to done", () => {
    const tasks = [makeTask({ status: "open" })];
    const result = toggleTaskRecord(tasks, "t1");
    expect(result[0].status).toBe("done");
  });

  it("toggles done to open", () => {
    const tasks = [makeTask({ status: "done" })];
    const result = toggleTaskRecord(tasks, "t1");
    expect(result[0].status).toBe("open");
  });

  it("does not toggle dismissed tasks", () => {
    const tasks = [makeTask({ status: "dismissed" })];
    const result = toggleTaskRecord(tasks, "t1");
    expect(result[0].status).toBe("dismissed");
  });

  it("does not mutate input", () => {
    const tasks = [makeTask()];
    toggleTaskRecord(tasks, "t1");
    expect(tasks[0].status).toBe("open");
  });
});

describe("dismissTaskRecord", () => {
  it("sets status to dismissed", () => {
    const tasks = [makeTask()];
    const result = dismissTaskRecord(tasks, "t1");
    expect(result[0].status).toBe("dismissed");
  });

  it("does not mutate input", () => {
    const tasks = [makeTask()];
    dismissTaskRecord(tasks, "t1");
    expect(tasks[0].status).toBe("open");
  });
});

describe("replaceTasksForApplication", () => {
  it("dismisses open tasks and adds new ones", () => {
    const tasks = [
      makeTask({ id: "t1", applicationId: "app-1", action: "apply", status: "open" }),
      makeTask({ id: "t2", applicationId: "app-1", action: "research", status: "open" }),
    ];
    const result = replaceTasksForApplication(tasks, "app-1", [
      { applicationId: "app-1", action: "follow_up", priority: "normal", status: "open" },
    ]);
    const dismissed = result.filter((t) => t.status === "dismissed");
    const open = result.filter((t) => t.status === "open");
    expect(dismissed).toHaveLength(2);
    expect(open).toHaveLength(1);
    expect(open[0].action).toBe("follow_up");
  });

  it("leaves done tasks intact", () => {
    const tasks = [
      makeTask({ id: "t1", applicationId: "app-1", action: "apply", status: "done" }),
    ];
    const result = replaceTasksForApplication(tasks, "app-1", []);
    expect(result[0].status).toBe("done");
  });

  it("does not affect tasks for other applications", () => {
    const tasks = [
      makeTask({ id: "t1", applicationId: "app-2", action: "apply", status: "open" }),
    ];
    const result = replaceTasksForApplication(tasks, "app-1", []);
    expect(result[0].status).toBe("open");
  });
});
