import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { AppContextType, WeeklyGoals } from "./types";
import { createRepository, DEFAULT_APP_DATA } from "./services/storage";
import { createAuthService } from "./services/auth";

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const repository = useMemo(() => createRepository(window.localStorage), []);
  const auth = useMemo(() => createAuthService(window.localStorage), []);

  const [weeklyGoals, setWeeklyGoals] = useState<WeeklyGoals>(
    DEFAULT_APP_DATA.weeklyGoals
  );
  const [darkMode, setDarkMode] = useState(
    () => window.matchMedia?.("(prefers-color-scheme: dark)").matches ?? true
  );
  const [session, setSession] = useState<AppContextType["session"]>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [syncState, setSyncState] = useState<AppContextType["syncState"]>({
    isSyncing: false,
    lastSyncedAt: null,
    error: null,
    storageMode: repository.mode,
  });

  const hydratedRef = useRef(false);

  const loadUserData = useCallback(
    async (userId: string) => {
      setSyncState((prev) => ({ ...prev, isSyncing: true, error: null }));
      try {
        const data = await repository.loadAppData(userId);
        if (data) {
          setWeeklyGoals(data.weeklyGoals);
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
      try {
        const storedDarkMode = repository.getDarkMode();
        if (mounted) {
          setDarkMode(storedDarkMode);
        }
        const existingSession = await auth.bootstrapSession();
        if (!mounted) return;
        setSession(existingSession);
        if (existingSession) {
          void loadUserData(existingSession.userId).catch((error) => {
            console.error("Initial data hydration failed:", error);
          });
        } else {
          hydratedRef.current = true;
        }
      } catch (error) {
        console.error("Session bootstrap failed:", error);
        hydratedRef.current = true;
      } finally {
        if (mounted) {
          setAuthLoading(false);
        }
      }
    };
    bootstrap();
    return () => {
      mounted = false;
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
        await repository.saveAppData(session.userId, { weeklyGoals });
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
  }, [weeklyGoals, repository, session]);

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
    setWeeklyGoals(DEFAULT_APP_DATA.weeklyGoals);
  }, [auth]);

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

  const addChecklistItem = useCallback((label: string) => {
    const trimmed = label.trim();
    if (!trimmed) return;
    setWeeklyGoals((prev) => ({
      ...prev,
      checklist: [
        ...prev.checklist,
        {
          id: `item-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          label: trimmed,
          completed: false,
        },
      ],
    }));
  }, []);

  const removeChecklistItem = useCallback((id: string) => {
    setWeeklyGoals((prev) => ({
      ...prev,
      checklist: prev.checklist.filter((item) => item.id !== id),
    }));
  }, []);

  const toggleDarkMode = useCallback(() => {
    setDarkMode((prev) => !prev);
  }, []);

  return (
    <AppContext.Provider
      value={{
        weeklyGoals,
        darkMode,
        session,
        authLoading,
        syncState,
        updateWeeklyGoals,
        toggleChecklistItem,
        addChecklistItem,
        removeChecklistItem,
        resetPassword: auth.resetPassword.bind(auth),
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
