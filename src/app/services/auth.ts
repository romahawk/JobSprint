import type { UserSession } from "../types";
import {
  fetchSignInMethodsForEmail,
  GoogleAuthProvider as GoogleProvider,
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  linkWithCredential,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut as firebaseSignOut,
  type User,
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

async function resolveFirebaseSession(user: User) {
  if (!user.uid || !user.email) {
    throw new Error("Unable to establish session.");
  }

  const normalizedEmail = user.email.trim().toLowerCase();

  return {
    userId: user.uid,
    authUid: user.uid,
    email: normalizedEmail,
    provider: "firebase" as const,
  };
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
          return resolveFirebaseSession(current);
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
              void resolveFirebaseSession(user).then(finish, () => finish(null));
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

        return resolveFirebaseSession(credential.user);
      },
      async signInWithGoogle() {
        try {
          const credential = await signInWithPopup(firebase.auth, provider);
          return resolveFirebaseSession(credential.user);
        } catch (error) {
          const code =
            error && typeof error === "object" && "code" in error
              ? String((error as { code?: unknown }).code)
              : "";
          const customEmail =
            error && typeof error === "object" && "customData" in error
              ? String(
                  ((error as { customData?: { email?: unknown } }).customData?.email as string | undefined) ?? ""
                )
              : "";

          if (code === "auth/account-exists-with-different-credential" && customEmail) {
            const methods = await fetchSignInMethodsForEmail(firebase.auth, customEmail);
            throw new Error(
              `An account for ${customEmail} already exists with ${methods.join(", ")}. Sign in with that method first so Google can reuse the same data.`
            );
          }

          if (
            code === "auth/credential-already-in-use" &&
            firebase.auth.currentUser &&
            error &&
            typeof error === "object" &&
            "credential" in error
          ) {
            const googleCredential = (error as { credential?: ReturnType<typeof GoogleProvider.credential> }).credential;
            if (googleCredential) {
              await linkWithCredential(firebase.auth.currentUser, googleCredential);
              return resolveFirebaseSession(firebase.auth.currentUser);
            }
          }

          throw error instanceof Error ? error : new Error("Unable to sign in with Google.");
        }
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
