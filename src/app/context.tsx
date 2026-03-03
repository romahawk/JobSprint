import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type {
  Application,
  AppContextType,
  PendingDeletion,
  WeeklyGoals,
} from "./types";
import { createRepository, DEFAULT_APP_DATA } from "./services/storage";
import { createAuthService } from "./services/auth";
import {
  addApplicationRecord,
  deleteApplicationRecord,
  updateApplicationRecord,
} from "./state/applicationOperations";

const AppContext = createContext<AppContextType | undefined>(undefined);
const DELETE_UNDO_WINDOW_MS = 7000;

const SAMPLE_APPLICATIONS: Application[] = [
  {
    id: "sample-1",
    company: "Google",
    role: "Senior Product Manager",
    location: "Mountain View, CA",
    type: "product",
    salary: "$180k - $220k",
    jobLink: "https://careers.google.com",
    dateApplied: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0],
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
    dateApplied: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0],
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
    dateApplied: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0],
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
    dateApplied: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0],
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
    dateApplied: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0],
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
    dateApplied: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0],
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
    dateApplied: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0],
    referral: false,
    notes: "Great product philosophy",
    status: "targeted",
    priority: "medium",
  },
];

export function AppProvider({ children }: { children: React.ReactNode }) {
  const repository = useMemo(() => createRepository(window.localStorage), []);
  const auth = useMemo(() => createAuthService(window.localStorage), []);

  const [applications, setApplications] = useState<Application[]>([]);
  const [weeklyGoals, setWeeklyGoals] = useState<WeeklyGoals>(
    DEFAULT_APP_DATA.weeklyGoals
  );
  const [darkMode, setDarkMode] = useState(true);
  const [session, setSession] = useState<AppContextType["session"]>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [pendingDeletions, setPendingDeletions] = useState<PendingDeletion[]>(
    []
  );
  const [syncState, setSyncState] = useState<AppContextType["syncState"]>({
    isSyncing: false,
    lastSyncedAt: null,
    error: null,
    storageMode: repository.mode,
  });

  const hydratedRef = useRef(false);
  const deleteTimersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(
    new Map()
  );
  const deletedCacheRef = useRef<Map<string, Application>>(new Map());

  const loadUserData = useCallback(
    async (userId: string) => {
      setSyncState((prev) => ({ ...prev, isSyncing: true, error: null }));
      try {
        const data = await repository.loadAppData(userId);
        if (data) {
          setApplications(data.applications);
          setWeeklyGoals(data.weeklyGoals);
        } else {
          setApplications(SAMPLE_APPLICATIONS);
          setWeeklyGoals(DEFAULT_APP_DATA.weeklyGoals);
        }
        setSyncState((prev) => ({
          ...prev,
          isSyncing: false,
          lastSyncedAt: new Date().toISOString(),
          error: null,
        }));
      } catch (error) {
        setSyncState((prev) => ({
          ...prev,
          isSyncing: false,
          error: error instanceof Error ? error.message : "Failed to sync data.",
        }));
      } finally {
        hydratedRef.current = true;
      }
    },
    [repository]
  );

  useEffect(() => {
    let mounted = true;
    const bootstrap = async () => {
      const storedDarkMode = repository.getDarkMode();
      if (mounted) {
        setDarkMode(storedDarkMode);
      }
      const existingSession = await auth.bootstrapSession();
      if (!mounted) return;
      setSession(existingSession);
      if (existingSession) {
        await loadUserData(existingSession.userId);
      } else {
        hydratedRef.current = true;
      }
      setAuthLoading(false);
    };
    bootstrap();
    return () => {
      mounted = false;
      deleteTimersRef.current.forEach((timerId) => clearTimeout(timerId));
      deleteTimersRef.current.clear();
    };
  }, [auth, loadUserData, repository]);

  useEffect(() => {
    repository.setDarkMode(darkMode);
    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [darkMode, repository]);

  useEffect(() => {
    if (!hydratedRef.current || !session) return;

    const persist = async () => {
      setSyncState((prev) => ({ ...prev, isSyncing: true, error: null }));
      try {
        await repository.saveAppData(session.userId, { applications, weeklyGoals });
        setSyncState((prev) => ({
          ...prev,
          isSyncing: false,
          lastSyncedAt: new Date().toISOString(),
          error: null,
        }));
      } catch (error) {
        setSyncState((prev) => ({
          ...prev,
          isSyncing: false,
          error: error instanceof Error ? error.message : "Failed to save data.",
        }));
      }
    };

    persist();
  }, [applications, repository, session, weeklyGoals]);

  const refreshData = useCallback(async () => {
    if (!session) return;
    await loadUserData(session.userId);
  }, [loadUserData, session]);

  const signIn = useCallback(
    async (
      email: string,
      password?: string,
      options?: { createAccount?: boolean }
    ) => {
      setAuthLoading(true);
      try {
        const nextSession = await auth.signIn(email, password, options);
        setSession(nextSession);
        await loadUserData(nextSession.userId);
      } finally {
        setAuthLoading(false);
      }
    },
    [auth, loadUserData]
  );

  const signInWithGoogle = useCallback(async () => {
    setAuthLoading(true);
    try {
      const nextSession = await auth.signInWithGoogle();
      setSession(nextSession);
      await loadUserData(nextSession.userId);
    } finally {
      setAuthLoading(false);
    }
  }, [auth, loadUserData]);

  const signOut = useCallback(async () => {
    await auth.signOut();
    setSession(null);
    setApplications([]);
    setWeeklyGoals(DEFAULT_APP_DATA.weeklyGoals);
    setPendingDeletions([]);
    deletedCacheRef.current.clear();
    deleteTimersRef.current.forEach((timerId) => clearTimeout(timerId));
    deleteTimersRef.current.clear();
  }, [auth]);

  const addApplication = useCallback((app: Omit<Application, "id">) => {
    setApplications((prev) => addApplicationRecord(prev, app));
  }, []);

  const updateApplication = useCallback(
    (id: string, updates: Partial<Application>) => {
      setApplications((prev) => updateApplicationRecord(prev, id, updates));
    },
    []
  );

  const scheduleDeleteApplication = useCallback((id: string) => {
    setApplications((prev) => {
      const target = prev.find((app) => app.id === id);
      if (!target) return prev;

      const expiresAt = Date.now() + DELETE_UNDO_WINDOW_MS;
      deletedCacheRef.current.set(id, target);
      setPendingDeletions((current) => [
        ...current.filter((item) => item.id !== id),
        { id, company: target.company, expiresAt },
      ]);

      const existingTimer = deleteTimersRef.current.get(id);
      if (existingTimer) clearTimeout(existingTimer);
      const timer = setTimeout(() => {
        setPendingDeletions((current) => current.filter((item) => item.id !== id));
        deletedCacheRef.current.delete(id);
        deleteTimersRef.current.delete(id);
      }, DELETE_UNDO_WINDOW_MS);
      deleteTimersRef.current.set(id, timer);

      return deleteApplicationRecord(prev, id);
    });
  }, []);

  const undoDeleteApplication = useCallback((id: string) => {
    const cached = deletedCacheRef.current.get(id);
    if (!cached) return;

    const timer = deleteTimersRef.current.get(id);
    if (timer) clearTimeout(timer);
    deleteTimersRef.current.delete(id);

    setPendingDeletions((current) => current.filter((item) => item.id !== id));
    setApplications((prev) => [...prev, cached]);
    deletedCacheRef.current.delete(id);
  }, []);

  const updateWeeklyGoals = useCallback((goals: Partial<WeeklyGoals>) => {
    setWeeklyGoals((prev) => ({ ...prev, ...goals }));
  }, []);

  const toggleChecklistItem = useCallback((id: string) => {
    setWeeklyGoals((prev) => ({
      ...prev,
      checklist: prev.checklist.map((item) =>
        item.id === id ? { ...item, completed: !item.completed } : item
      ),
    }));
  }, []);

  const toggleDarkMode = useCallback(() => {
    setDarkMode((prev) => !prev);
  }, []);

  return (
    <AppContext.Provider
      value={{
        applications,
        weeklyGoals,
        darkMode,
        session,
        authLoading,
        syncState,
        pendingDeletions,
        addApplication,
        updateApplication,
        scheduleDeleteApplication,
        undoDeleteApplication,
        updateWeeklyGoals,
        toggleChecklistItem,
        signIn,
        signInWithGoogle,
        supportsGoogleSignIn: auth.supportsGoogleSignIn,
        signOut,
        refreshData,
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
