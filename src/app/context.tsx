import React, { createContext, useContext, useState, useEffect } from "react";
import type {
  Application,
  WeeklyGoals,
  WeeklyChecklistItem,
  AppContextType,
} from "./types";

const AppContext = createContext<AppContextType | undefined>(undefined);

const DEFAULT_CHECKLIST: WeeklyChecklistItem[] = [
  { id: "cv", label: "CV updated?", completed: false },
  { id: "linkedin", label: "LinkedIn aligned?", completed: false },
  { id: "networking", label: "Networking done (min 2)?", completed: false },
  { id: "followups", label: "Follow-ups sent?", completed: false },
];

const STORAGE_KEY = "jobsprint_data";

// Sample data for initial demo
const SAMPLE_APPLICATIONS: Application[] = [
  {
    id: "sample-1",
    company: "Google",
    role: "Senior Product Manager",
    location: "Mountain View, CA",
    type: "product",
    salary: "$180k - $220k",
    jobLink: "https://careers.google.com",
    dateApplied: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    referral: true,
    notes: "Met team at conference, strong culture fit",
    status: "interview",
    priority: "high",
  },
  {
    id: "sample-2",
    company: "Meta",
    role: "Product Manager, AI",
    location: "Menlo Park, CA",
    type: "product",
    salary: "$170k - $200k",
    jobLink: "https://www.metacareers.com",
    dateApplied: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    referral: false,
    notes: "Exciting AI product team",
    status: "hr_screen",
    priority: "high",
  },
  {
    id: "sample-3",
    company: "Stripe",
    role: "Senior Product Manager",
    location: "San Francisco, CA",
    type: "product",
    salary: "$160k - $190k",
    jobLink: "https://stripe.com/jobs",
    dateApplied: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    referral: false,
    notes: "Payment infrastructure space",
    status: "applied",
    priority: "medium",
  },
  {
    id: "sample-4",
    company: "Airbnb",
    role: "Product Manager",
    location: "Remote",
    type: "product",
    salary: "$150k - $180k",
    jobLink: "https://careers.airbnb.com",
    dateApplied: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    referral: true,
    notes: "Travel tech, matches my interests",
    status: "final_round",
    priority: "high",
  },
  {
    id: "sample-5",
    company: "Shopify",
    role: "Technical Product Manager",
    location: "Toronto, ON",
    type: "technical",
    salary: "$140k - $170k",
    jobLink: "https://www.shopify.com/careers",
    dateApplied: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    referral: false,
    notes: "E-commerce platform",
    status: "rejected",
    priority: "medium",
  },
  {
    id: "sample-6",
    company: "Notion",
    role: "Product Manager",
    location: "San Francisco, CA",
    type: "product",
    salary: "$160k - $185k",
    jobLink: "https://www.notion.so/careers",
    dateApplied: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    referral: false,
    notes: "Love the product, strong team",
    status: "applied",
    priority: "high",
  },
  {
    id: "sample-7",
    company: "Linear",
    role: "Senior Product Manager",
    location: "Remote",
    type: "product",
    salary: "$155k - $175k",
    jobLink: "https://linear.app/careers",
    dateApplied: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    referral: false,
    notes: "Great product philosophy",
    status: "targeted",
    priority: "medium",
  },
];

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [applications, setApplications] = useState<Application[]>([]);
  const [weeklyGoals, setWeeklyGoals] = useState<WeeklyGoals>({
    target: 10,
    checklist: DEFAULT_CHECKLIST,
  });
  const [darkMode, setDarkMode] = useState(() => {
    const stored = localStorage.getItem("jobsprint_darkmode");
    return stored ? JSON.parse(stored) : true;
  });

  // Load data from localStorage
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const data = JSON.parse(stored);
        setApplications(data.applications || []);
        setWeeklyGoals(data.weeklyGoals || { target: 10, checklist: DEFAULT_CHECKLIST });
      } catch (error) {
        console.error("Failed to parse stored data:", error);
      }
    } else {
      // Load sample data on first visit
      setApplications(SAMPLE_APPLICATIONS);
    }
  }, []);

  // Save data to localStorage
  useEffect(() => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ applications, weeklyGoals })
    );
  }, [applications, weeklyGoals]);

  // Save dark mode preference
  useEffect(() => {
    localStorage.setItem("jobsprint_darkmode", JSON.stringify(darkMode));
    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [darkMode]);

  const addApplication = (app: Omit<Application, "id">) => {
    const newApp: Application = {
      ...app,
      id: `app-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    };
    setApplications((prev) => [...prev, newApp]);
  };

  const updateApplication = (id: string, updates: Partial<Application>) => {
    setApplications((prev) =>
      prev.map((app) => (app.id === id ? { ...app, ...updates } : app))
    );
  };

  const deleteApplication = (id: string) => {
    setApplications((prev) => prev.filter((app) => app.id !== id));
  };

  const updateWeeklyGoals = (goals: Partial<WeeklyGoals>) => {
    setWeeklyGoals((prev) => ({ ...prev, ...goals }));
  };

  const toggleChecklistItem = (id: string) => {
    setWeeklyGoals((prev) => ({
      ...prev,
      checklist: prev.checklist.map((item) =>
        item.id === id ? { ...item, completed: !item.completed } : item
      ),
    }));
  };

  const toggleDarkMode = () => {
    setDarkMode((prev) => !prev);
  };

  return (
    <AppContext.Provider
      value={{
        applications,
        weeklyGoals,
        darkMode,
        addApplication,
        updateApplication,
        deleteApplication,
        updateWeeklyGoals,
        toggleChecklistItem,
        toggleDarkMode,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useApp must be used within AppProvider");
  }
  return context;
}