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
  weeklyGoals: WeeklyGoals;
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

export interface AppContextType {
  weeklyGoals: WeeklyGoals;
  darkMode: boolean;
  session: UserSession | null;
  authLoading: boolean;
  syncState: SyncState;
  updateWeeklyGoals: (goals: Partial<WeeklyGoals>) => void;
  toggleChecklistItem: (id: string) => void;
  addChecklistItem: (label: string) => void;
  removeChecklistItem: (id: string) => void;
  resetPassword: (email: string) => Promise<void>;
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
