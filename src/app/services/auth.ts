import type { UserSession } from "../types";
import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut as firebaseSignOut,
} from "firebase/auth";
import { getFirebaseContext } from "./firebase";

interface StorageLike {
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
  removeItem: (key: string) => void;
}

const SESSION_KEY = "jobsprint_session_v1";

export interface AuthService {
  supportsGoogleSignIn: boolean;
  bootstrapSession: () => Promise<UserSession | null>;
  signIn: (
    email: string,
    password?: string,
    options?: { createAccount?: boolean }
  ) => Promise<UserSession>;
  signInWithGoogle: () => Promise<UserSession>;
  signOut: () => Promise<void>;
}

function toUserId(email: string) {
  return `user_${email.trim().toLowerCase().replace(/[^a-z0-9]/g, "_")}`;
}

export function createAuthService(storage: StorageLike): AuthService {
  const firebase = getFirebaseContext();

  if (firebase) {
    const provider = new GoogleAuthProvider();

    return {
      supportsGoogleSignIn: true,
      async bootstrapSession() {
        const current = firebase.auth.currentUser;
        if (current?.uid && current.email) {
          return {
            userId: current.uid,
            email: current.email,
            provider: "firebase",
          };
        }

        return await new Promise<UserSession | null>((resolve) => {
          let settled = false;
          let unsubscribe: (() => void) | null = null;

          const finish = (session: UserSession | null) => {
            if (settled) return;
            settled = true;
            if (unsubscribe) {
              unsubscribe();
            }
            resolve(session);
          };

          const timeoutId = setTimeout(() => {
            finish(null);
          }, 5000);

          unsubscribe = onAuthStateChanged(
            firebase.auth,
            (user) => {
              clearTimeout(timeoutId);
              if (!user?.uid || !user.email) {
                finish(null);
                return;
              }
              finish({
                userId: user.uid,
                email: user.email,
                provider: "firebase",
              });
            },
            () => {
              clearTimeout(timeoutId);
              finish(null);
            }
          );
        });
      },
      async signIn(email, password, options) {
        const normalizedEmail = email.trim().toLowerCase();
        const normalizedPassword = (password || "").trim();
        if (!normalizedEmail) {
          throw new Error("Email is required");
        }
        if (!normalizedPassword) {
          throw new Error("Password is required for Firebase sign-in");
        }

        const credential = options?.createAccount
          ? await createUserWithEmailAndPassword(
              firebase.auth,
              normalizedEmail,
              normalizedPassword
            )
          : await signInWithEmailAndPassword(
              firebase.auth,
              normalizedEmail,
              normalizedPassword
            );

        if (!credential.user.uid || !credential.user.email) {
          throw new Error("Unable to establish session.");
        }

        return {
          userId: credential.user.uid,
          email: credential.user.email,
          provider: "firebase",
        };
      },
      async signInWithGoogle() {
        const credential = await signInWithPopup(firebase.auth, provider);
        if (!credential.user.uid || !credential.user.email) {
          throw new Error("Unable to establish Google session.");
        }
        return {
          userId: credential.user.uid,
          email: credential.user.email,
          provider: "firebase",
        };
      },
      async signOut() {
        await firebaseSignOut(firebase.auth);
      },
    };
  }

  return {
    supportsGoogleSignIn: false,
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
    async signInWithGoogle() {
      throw new Error("Google sign-in requires Firebase configuration.");
    },
    async signOut() {
      storage.removeItem(SESSION_KEY);
    },
  };
}
