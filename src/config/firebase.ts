
import { initializeApp, getApps } from "firebase/app";
import { browserLocalPersistence, getAuth, setPersistence } from "firebase/auth";
import {
  getFirestore,
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
} from "firebase/firestore";

// IMPORTANT: Firebase Configuration
// Your Firebase project credentials should be set as environment variables.
// Create a .env.local file in the root of your project and add your Firebase config:
// NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
// NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
// NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
// NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
// NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
// NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
//
// The placeholder values below are to prevent initialization errors if .env.local is missing.
// Firebase services will NOT work correctly with these placeholders.
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyCGtP1NmMpb19yE951WGYlbfM4_2RVwCuk",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "rueda-compartida.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "rueda-compartida",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "rueda-compartida.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "686636323966",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:686636323966:web:512536d1c11f8a4c51f42f",
};

// Initialize Firebase
let app = getApps()[0];

if (!app) {
  app = initializeApp(firebaseConfig);
  initializeFirestore(app, {
    localCache: persistentLocalCache({
      tabManager: persistentMultipleTabManager(),
    }),
  });
}

const auth = getAuth(app);
const db = getFirestore(app);

if (typeof window !== "undefined") {
  setPersistence(auth, browserLocalPersistence).catch((error) => {
    console.warn("No se pudo establecer la persistencia del auth", error);
  });
}

export { app, auth, db };
