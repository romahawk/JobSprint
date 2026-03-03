import type { UserSession } from "../types";

interface StorageLike {
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
  removeItem: (key: string) => void;
}

const SESSION_KEY = "jobsprint_session_v1";

export interface AuthService {
  bootstrapSession: () => Promise<UserSession | null>;
  signIn: (email: string) => Promise<UserSession>;
  signOut: () => Promise<void>;
}

function toUserId(email: string) {
  return `user_${email.trim().toLowerCase().replace(/[^a-z0-9]/g, "_")}`;
}

export function createAuthService(storage: StorageLike): AuthService {
  return {
    async bootstrapSession() {
      const raw = storage.getItem(SESSION_KEY);
      if (!raw) return null;
      try {
        const parsed = JSON.parse(raw) as UserSession;
        if (!parsed?.email || !parsed?.userId) return null;
        return parsed;
      } catch {
        return null;
      }
    },
    async signIn(email: string) {
      const normalizedEmail = email.trim().toLowerCase();
      if (!normalizedEmail) {
        throw new Error("Email is required");
      }
      const session: UserSession = {
        userId: toUserId(normalizedEmail),
        email: normalizedEmail,
        provider: "local",
      };
      storage.setItem(SESSION_KEY, JSON.stringify(session));
      return session;
    },
    async signOut() {
      storage.removeItem(SESSION_KEY);
    },
  };
}

