
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
export class AuthManager {
    private auth: any;
    constructor() {
        try { const app = initializeApp(config); this.auth = getAuth(app); this.setupListener(); }
        catch (e) { console.error("Firebase Init Error", e); }
    }
    public login() { const p = new GoogleAuthProvider(); signInWithPopup(this.auth, p).catch(console.error); }
    public logout() { signOut(this.auth); }
    private setupListener() {
        onAuthStateChanged(this.auth, async (user: User | null) => {
            const login = document.getElementById('login-section');
            const info = document.getElementById('user-info');
            if (user && login && info) {
                login.classList.add('hidden'); info.classList.remove('hidden');
                (document.getElementById('uid-display') as HTMLElement).innerText = user.uid;
                (document.getElementById('user-name') as HTMLElement).innerText = user.displayName || 'User';
                (document.getElementById('user-avatar') as HTMLImageElement).src = user.photoURL || '';
                const token = await user.getIdToken();
                (document.getElementById('token-display') as HTMLElement).innerText = token;
            } else if (login && info) {
                login.classList.remove('hidden'); info.classList.add('hidden');
            }
        });
    }
}
