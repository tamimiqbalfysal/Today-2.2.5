// src/lib/firebase.ts
import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore, enableIndexedDbPersistence } from "firebase/firestore";
import { getStorage, type Storage } from "firebase/storage";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
};

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;
let storage: Storage | null = null;
let analytics = null;
let isFirebaseConfigured = false;

// This check ensures that Firebase is only initialized on the client side,
// and that all the necessary environment variables are present.
// This prevents the app from crashing on the server if the .env file is not configured.
if (typeof window !== "undefined" && Object.values(firebaseConfig).every(Boolean)) {
  isFirebaseConfigured = true;
  app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
  storage = getStorage(app);
  try {
    analytics = getAnalytics(app);
  } catch (error) {
    console.warn("Could not initialize Firebase Analytics:", error);
  }

  enableIndexedDbPersistence(db)
    .catch((err) => {
      if (err.code == 'failed-precondition') {
        console.warn("Firestore persistence failed. This can happen if you have multiple tabs open.");
      } else if (err.code == 'unimplemented') {
        console.warn("The current browser does not support all of the features required for Firestore persistence.");
      }
    });
}

export { app, auth, db, storage, analytics, firebaseConfig, isFirebaseConfigured };
