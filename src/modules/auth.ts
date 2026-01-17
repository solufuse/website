
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged, User } from "firebase/auth";

const config = {
    apiKey: "AIzaSyAZ-Zi6fOKCH7duGgCnnHX_qB4TI5wTC5g",
    authDomain: "solufuse-5647c.firebaseapp.com",
    projectId: "solufuse-5647c",
    storageBucket: "solufuse-5647c.firebasestorage.app",
    messagingSenderId: "718299136180",
    appId: "1:718299136180:web:fb893609b7f0283c55d7e1",
    measurementId: "G-B1FVSFY4S2"
};

const app = initializeApp(config);
const auth = getAuth(app);

export const signInWithGoogle = () => {
  const provider = new GoogleAuthProvider();
  return signInWithPopup(auth, provider);
};

export const signOutFromGoogle = () => {
  return signOut(auth);
};

export const onAuthStateChange = (callback: (user: User | null) => void) => {
  return onAuthStateChanged(auth, callback);
};
