
import { initializeApp, getApps } from "firebase/app";
import { browserLocalPersistence, getAuth, setPersistence } from "firebase/auth";
import {
  getFirestore,
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
} from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCGtP1NmMpb19yE951WGYlbfM4_2RVwCuk",
  authDomain: "rueda-compartida.firebaseapp.com",
  projectId: "rueda-compartida",
  storageBucket: "rueda-compartida.firebasestorage.app",
  messagingSenderId: "686636323966",
  appId: "1:686636323966:web:512536d1c11f8a4c51f42f",
  measurementId: "G-QVDNNYSLBF"
};

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