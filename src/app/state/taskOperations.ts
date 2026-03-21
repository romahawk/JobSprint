import type { NextActionTask, TaskStatus } from "../types";

function makeId(): string {
  return `task-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function now(): string {
  return new Date().toISOString();
}

/**
 * Append tasks, skipping any that already have an open entry for the same
 * applicationId + action combination.
 */
export function addTasksRecord(
  existing: NextActionTask[],
  incoming: Omit<NextActionTask, "id" | "createdAt" | "updatedAt">[]
): NextActionTask[] {
  const openKeys = new Set(
    existing
      .filter((t) => t.status === "open")
      .map((t) => `${t.applicationId}:${t.action}`)
  );

  const toAdd: NextActionTask[] = [];
  for (const task of incoming) {
    const key = `${task.applicationId}:${task.action}`;
    if (openKeys.has(key)) continue;
    const ts = now();
    toAdd.push({ ...task, id: makeId(), createdAt: ts, updatedAt: ts });
    openKeys.add(key);
  }

  return toAdd.length === 0 ? existing : [...existing, ...toAdd];
}

/**
 * Toggle open ↔ done. Dismissed tasks are never mutated.
 */
export function toggleTaskRecord(
  tasks: NextActionTask[],
  taskId: string
): NextActionTask[] {
  return tasks.map((t) => {
    if (t.id !== taskId || t.status === "dismissed") return t;
    const next: TaskStatus = t.status === "open" ? "done" : "open";
    return { ...t, status: next, updatedAt: now() };
  });
}

/**
 * Mark a task as dismissed.
 */
export function dismissTaskRecord(
  tasks: NextActionTask[],
  taskId: string
): NextActionTask[] {
  return tasks.map((t) =>
    t.id === taskId ? { ...t, status: "dismissed" as TaskStatus, updatedAt: now() } : t
  );
}

/**
 * Dismiss all open tasks for the given applicationId, then add the
 * incoming tasks (deduplication still applies).
 */
export function replaceTasksForApplication(
  tasks: NextActionTask[],
  applicationId: string,
  incoming: Omit<NextActionTask, "id" | "createdAt" | "updatedAt">[]
): NextActionTask[] {
  const dismissed = tasks.map((t) =>
    t.applicationId === applicationId && t.status === "open"
      ? { ...t, status: "dismissed" as TaskStatus, updatedAt: now() }
      : t
  );
  return addTasksRecord(dismissed, incoming);
}
