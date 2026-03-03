import { initializeApp, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";

export interface FirebaseContext {
  app: FirebaseApp;
  auth: Auth;
  db: Firestore;
}

function readFirebaseConfig() {
  const apiKey = (import.meta.env.VITE_FIREBASE_API_KEY || "").trim();
  const authDomain = (import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "").trim();
  const projectId = (import.meta.env.VITE_FIREBASE_PROJECT_ID || "").trim();
  const appId = (import.meta.env.VITE_FIREBASE_APP_ID || "").trim();

  if (!apiKey || !authDomain || !projectId || !appId) {
    return null;
  }

  return {
    apiKey,
    authDomain,
    projectId,
    appId,
    storageBucket: (import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "").trim(),
    messagingSenderId: (import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "").trim(),
  };
}

let cached: FirebaseContext | null | undefined;

export function getFirebaseContext(): FirebaseContext | null {
  if (cached !== undefined) {
    return cached;
  }
  const config = readFirebaseConfig();
  if (!config) {
    cached = null;
    return cached;
  }

  const app = initializeApp(config);
  cached = {
    app,
    auth: getAuth(app),
    db: getFirestore(app),
  };
  return cached;
}

