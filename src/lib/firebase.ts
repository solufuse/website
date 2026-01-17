
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getFunctions } from "firebase/functions";

// CONFIGURATION EN DUR (POUR EVITER LES ERREURS DE BUILD DOCKER)
const firebaseConfig = {
  apiKey: "AIzaSyAZ-Zi6fOKCH7duGgCnnHX_qB4TI5wTC5g",
  authDomain: "solufuse-5647c.firebaseapp.com",
  projectId: "solufuse-5647c",
  storageBucket: "solufuse-5647c.firebasestorage.app",
  messagingSenderId: "718299136180",
  appId: "1:718299136180:web:fb893609b7f0283c55d7e1",
  measurementId: "G-B1FVSFY4S2"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const functions = getFunctions(app);
export const googleProvider = new GoogleAuthProvider();
