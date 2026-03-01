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

export interface AppContextType {
  applications: Application[];
  weeklyGoals: WeeklyGoals;
  darkMode: boolean;
  addApplication: (app: Omit<Application, "id">) => void;
  updateApplication: (id: string, updates: Partial<Application>) => void;
  deleteApplication: (id: string) => void;
  updateWeeklyGoals: (goals: Partial<WeeklyGoals>) => void;
  toggleChecklistItem: (id: string) => void;
  toggleDarkMode: () => void;
}
