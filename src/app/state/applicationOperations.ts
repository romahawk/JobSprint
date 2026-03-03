import type { Application, PipelineStatus } from "../types";

export function addApplicationRecord(
  applications: Application[],
  app: Omit<Application, "id">
): Application[] {
  const record: Application = {
    ...app,
    id: `app-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
  };
  return [...applications, record];
}

export function updateApplicationRecord(
  applications: Application[],
  id: string,
  updates: Partial<Application>
): Application[] {
  return applications.map((app) => (app.id === id ? { ...app, ...updates } : app));
}

export function deleteApplicationRecord(
  applications: Application[],
  id: string
): Application[] {
  return applications.filter((app) => app.id !== id);
}

export function moveApplicationStatus(
  applications: Application[],
  id: string,
  status: PipelineStatus
): Application[] {
  return updateApplicationRecord(applications, id, { status });
}

