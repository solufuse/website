
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { CONFIG } from './config.js';

let auth;

export function initAuth() {
    try {
        const app = initializeApp(CONFIG.firebase);
        auth = getAuth(app);
        setupAuthListener();
    } catch (e) {
        console.error("Firebase init failed:", e);
    }
}

export function login() {
    if (!auth) return;
    const provider = new GoogleAuthProvider();
    signInWithPopup(auth, provider).catch(console.error);
}

export function logout() {
    if (auth) signOut(auth);
}

function setupAuthListener() {
    onAuthStateChanged(auth, async (user) => {
        const loginSection = document.getElementById('login-section');
        const userInfo = document.getElementById('user-info');
        
        if (user) {
            loginSection.classList.add('hidden');
            userInfo.classList.remove('hidden');
            
            // Update UI
            document.getElementById('uid-display').innerText = user.uid;
            document.getElementById('user-name').innerText = user.displayName;
            document.getElementById('user-avatar').src = user.photoURL;
            
            const token = await user.getIdToken();
            document.getElementById('token-display').innerText = token;
        } else {
            loginSection.classList.remove('hidden');
            userInfo.classList.add('hidden');
        }
    });
}
