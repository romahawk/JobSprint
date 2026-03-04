import { useState, useEffect, useCallback } from "react";
import {
  collection,
  doc,
  onSnapshot,
  addDoc,
  setDoc,
  deleteDoc,
} from "firebase/firestore";
import { getFirebaseContext } from "../services/firebase";
import { computeRiskStatus } from "../utils/afaRiskEngine";
import { computeDeadline } from "../utils/afaDeadlineEngine";
import type {
  AfaVorschlag,
  AfaVorschlagFormData,
  AfaComputed,
} from "../types/afa";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const LOCAL_STORAGE_KEY_PREFIX = "afa_vorschlaege_local_v2";

function localStorageKey(userId: string): string {
  return `${LOCAL_STORAGE_KEY_PREFIX}_${userId}`;
}

function loadLocal(userId: string): AfaVorschlag[] {
  try {
    const raw = localStorage.getItem(localStorageKey(userId));
    return raw ? (JSON.parse(raw) as AfaVorschlag[]) : [];
  } catch {
    return [];
  }
}

function saveLocal(userId: string, cases: AfaVorschlag[]): void {
  localStorage.setItem(localStorageKey(userId), JSON.stringify(cases));
}

function generateCaseId(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  const yyyymmdd = `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}`;
  const seq = String(Math.floor(Math.random() * 900) + 100);
  return `VS-${yyyymmdd}-${seq}`;
}

function generateLocalId(): string {
  return `afa-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function computeAll(v: AfaVorschlag): AfaVorschlag {
  const risk_status = computeRiskStatus(
    v.rfb_present,
    v.applied_date,
    v.portal_feedback_date
  );
  const { deadline_status, days_left } = computeDeadline(v.deadline_date);
  const computed: AfaComputed = { risk_status, deadline_status, days_left };
  return { ...v, computed };
}

function docToVorschlag(id: string, data: Record<string, unknown>): AfaVorschlag {
  const raw = { ...(data as Omit<AfaVorschlag, "id">), id };
  return computeAll(raw);
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export interface UseAfaComplianceReturn {
  cases: AfaVorschlag[];
  loading: boolean;
  error: string | null;
  addCase: (data: AfaVorschlagFormData) => Promise<void>;
  updateCase: (
    id: string,
    updates: Partial<Omit<AfaVorschlag, "id" | "case_id" | "audit">>
  ) => Promise<void>;
  deleteCase: (id: string) => Promise<void>;
  markApplied: (id: string) => Promise<void>;
  markFeedbackSubmitted: (id: string) => Promise<void>;
  closeCase: (id: string) => Promise<void>;
}

export function useAfaCompliance(userId: string | null): UseAfaComplianceReturn {
  const [cases, setCases] = useState<AfaVorschlag[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const firebase = getFirebaseContext();

  // -------------------------------------------------------------------------
  // Subscription
  // -------------------------------------------------------------------------

  useEffect(() => {
    if (!userId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCases([]);
      setError(null);
      setLoading(false);
      return;
    }

    const cachedCases = loadLocal(userId).map(computeAll);
    setCases(cachedCases);
    setError(null);

    if (!firebase) {
      // Intentional: set initial state from localStorage in fallback mode.
      setLoading(false);
      return;
    }

    setLoading(cachedCases.length === 0);
    const colRef = collection(firebase.db, "users", userId, "afa_vorschlaege");
    const unsubscribe = onSnapshot(
      colRef,
      (snapshot) => {
        const docs = snapshot.docs.map((d) =>
          docToVorschlag(d.id, d.data() as Record<string, unknown>)
        );
        const shouldKeepCached =
          docs.length === 0 &&
          cachedCases.length > 0 &&
          snapshot.metadata.fromCache;

        const nextCases = shouldKeepCached ? cachedCases : docs;
        setCases(nextCases);
        saveLocal(userId, nextCases);
        setError(null);
        setLoading(false);
      },
      (err) => {
        setError(err.message);
        if (cachedCases.length > 0) {
          setCases(cachedCases);
        }
        setLoading(false);
      }
    );

    return unsubscribe;
  }, [userId, firebase]);

  // -------------------------------------------------------------------------
  // Mutations
  // -------------------------------------------------------------------------

  const addCase = useCallback(
    async (data: AfaVorschlagFormData): Promise<void> => {
      if (!userId) return;

      const now = new Date().toISOString();
      const skeleton: AfaVorschlag = computeAll({
        id: "",
        case_id: generateCaseId(),
        ...data,
        computed: { risk_status: "CHECK", days_left: null, deadline_status: "NO_DEADLINE" },
        audit: { created_at: now, updated_at: now },
      });

      if (!firebase) {
        const local: AfaVorschlag = { ...skeleton, id: generateLocalId() };
        const updated = [...cases, local];
        saveLocal(userId, updated);
        setCases(updated);
        return;
      }

      const { id: _id, ...payload } = skeleton;
      const colRef = collection(firebase.db, "users", userId, "afa_vorschlaege");
      const created = await addDoc(colRef, payload);
      const nextCases = [...cases, { ...skeleton, id: created.id }];
      saveLocal(userId, nextCases);
      setCases(nextCases);
    },
    [userId, firebase, cases]
  );

  const updateCase = useCallback(
    async (
      id: string,
      updates: Partial<Omit<AfaVorschlag, "id" | "case_id" | "audit">>
    ): Promise<void> => {
      if (!userId) return;

      const existing = cases.find((c) => c.id === id);
      if (!existing) return;

      const merged = computeAll({
        ...existing,
        ...updates,
        audit: { ...existing.audit, updated_at: new Date().toISOString() },
      });

      if (!firebase) {
        const updated = cases.map((c) => (c.id === id ? merged : c));
        saveLocal(userId, updated);
        setCases(updated);
        return;
      }

      const { id: _id, ...payload } = merged;
      const docRef = doc(firebase.db, "users", userId, "afa_vorschlaege", id);
      await setDoc(docRef, payload, { merge: true });
      const updated = cases.map((c) => (c.id === id ? merged : c));
      saveLocal(userId, updated);
      setCases(updated);
    },
    [userId, firebase, cases]
  );

  const deleteCase = useCallback(
    async (id: string): Promise<void> => {
      if (!userId) return;

      if (!firebase) {
        const updated = cases.filter((c) => c.id !== id);
        saveLocal(userId, updated);
        setCases(updated);
        return;
      }

      const docRef = doc(firebase.db, "users", userId, "afa_vorschlaege", id);
      await deleteDoc(docRef);
      const updated = cases.filter((c) => c.id !== id);
      saveLocal(userId, updated);
      setCases(updated);
    },
    [userId, firebase, cases]
  );

  // -------------------------------------------------------------------------
  // Quick actions
  // -------------------------------------------------------------------------

  const markApplied = useCallback(
    (id: string) =>
      updateCase(id, {
        action_status: "applied",
        applied_date: new Date().toISOString().slice(0, 10),
      }),
    [updateCase]
  );

  const markFeedbackSubmitted = useCallback(
    (id: string) =>
      updateCase(id, {
        action_status: "feedback_submitted",
        portal_feedback_date: new Date().toISOString().slice(0, 10),
      }),
    [updateCase]
  );

  const closeCase = useCallback(
    (id: string) => updateCase(id, { action_status: "closed" }),
    [updateCase]
  );

  return {
    cases,
    loading,
    error,
    addCase,
    updateCase,
    deleteCase,
    markApplied,
    markFeedbackSubmitted,
    closeCase,
  };
}
