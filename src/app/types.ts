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

export interface AppData {
  applications: Application[];
  weeklyGoals: WeeklyGoals;
}

export interface UserSession {
  userId: string;
  email: string;
  provider: "local";
}

export interface SyncState {
  isSyncing: boolean;
  lastSyncedAt: string | null;
  error: string | null;
  storageMode: "local" | "remote";
}

export interface PendingDeletion {
  id: string;
  company: string;
  expiresAt: number;
}

export interface AppContextType {
  applications: Application[];
  weeklyGoals: WeeklyGoals;
  darkMode: boolean;
  session: UserSession | null;
  authLoading: boolean;
  syncState: SyncState;
  pendingDeletions: PendingDeletion[];
  addApplication: (app: Omit<Application, "id">) => void;
  updateApplication: (id: string, updates: Partial<Application>) => void;
  scheduleDeleteApplication: (id: string) => void;
  undoDeleteApplication: (id: string) => void;
  updateWeeklyGoals: (goals: Partial<WeeklyGoals>) => void;
  toggleChecklistItem: (id: string) => void;
  signIn: (email: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshData: () => Promise<void>;
  toggleDarkMode: () => void;
}
