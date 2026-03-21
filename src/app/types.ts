export type PipelineStatus =
  | "targeted"
  | "applied"
  | "hr_screen"
  | "interview"
  | "final_round"
  | "offer"
  | "rejected";

export type Priority = "high" | "medium" | "backup";

export type ApplicationType = "product" | "technical" | "backup";

export interface Application {
  id: string;
  company: string;
  role: string;
  location: string;
  type: ApplicationType;
  salary: string;
  jobLink: string;
  dateApplied: string;
  referral: boolean;
  notes: string;
  status: PipelineStatus;
  priority: Priority;
}

export interface WeeklyChecklistItem {
  id: string;
  label: string;
  completed: boolean;
}

export interface WeeklyGoals {
  target: number;
  checklist: WeeklyChecklistItem[];
}

// ── Next Best Action domain ──────────────────────────────────────────────────

export type ActionType =
  | "apply"
  | "cv_tailor"
  | "outreach"
  | "follow_up"
  | "research";

export type TaskPriority = "urgent" | "high" | "normal" | "low";

export type TaskStatus = "open" | "done" | "dismissed";

export interface NextActionTask {
  id: string;
  applicationId: string;
  action: ActionType;
  priority: TaskPriority;
  status: TaskStatus;
  dueDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface OpportunityScore {
  applicationId: string;
  total: number;
  roleMatch: number;
  recency: number;
  companyTier: number;
  userFocus: number;
  scoredAt: string;
}

export interface UserProfileSignals {
  targetRoles: string[];
  targetSeniority: string[];
  preferredLocations: string[];
  remoteOnly: boolean;
  focusIndustries: string[];
}

// ── Persisted data ────────────────────────────────────────────────────────────

export interface AppData {
  applications: Application[];
  weeklyGoals: WeeklyGoals;
  tasks: NextActionTask[];
  opportunityScores: OpportunityScore[];
  userProfileSignals?: UserProfileSignals;
}

export interface UserSession {
  userId: string;
  email: string;
  provider: "local" | "firebase";
  authUid?: string;
}

export interface SyncState {
  isSyncing: boolean;
  lastSyncedAt: string | null;
  error: string | null;
  storageMode: "local" | "remote" | "firebase";
}

export interface PendingDeletion {
  id: string;
  company: string;
  expiresAt: number;
}

export interface AppContextType {
  applications: Application[];
  weeklyGoals: WeeklyGoals;
  tasks: NextActionTask[];
  opportunityScores: OpportunityScore[];
  userProfileSignals: UserProfileSignals | undefined;
  darkMode: boolean;
  session: UserSession | null;
  authLoading: boolean;
  syncState: SyncState;
  pendingDeletions: PendingDeletion[];
  addApplication: (app: Omit<Application, "id">) => void;
  addApplicationAndReturn: (app: Omit<Application, "id">) => Application;
  updateApplication: (id: string, updates: Partial<Application>) => void;
  scheduleDeleteApplication: (id: string) => void;
  undoDeleteApplication: (id: string) => void;
  updateWeeklyGoals: (goals: Partial<WeeklyGoals>) => void;
  toggleChecklistItem: (id: string) => void;
  createTasksForApplication: (
    applicationId: string,
    incoming: Omit<NextActionTask, "id" | "createdAt" | "updatedAt">[]
  ) => void;
  toggleTaskStatus: (taskId: string) => void;
  dismissTask: (taskId: string) => void;
  regenerateTasksForApplication: (
    applicationId: string,
    incoming: Omit<NextActionTask, "id" | "createdAt" | "updatedAt">[]
  ) => void;
  setUserProfileSignals: (signals: UserProfileSignals) => void;
  saveOpportunityScore: (score: OpportunityScore) => void;
  signIn: (
    email: string,
    password?: string,
    options?: { createAccount?: boolean }
  ) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  supportsGoogleSignIn: boolean;
  signOut: () => Promise<void>;
  refreshData: () => Promise<void>;
  toggleDarkMode: () => void;
}
