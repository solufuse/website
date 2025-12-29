
import { CONFIG } from './config.js';
import { initAuth, login, logout } from './auth.js';

// Expose functions to window for HTML onclick events
window.loginWithGoogle = login;
window.logoutUser = logout;
window.copyToClipboard = (id) => {
    const el = document.getElementById(id);
    navigator.clipboard.writeText(el.innerText);
    
    // Visual Feedback
    const btn = document.querySelector(`button[onclick="copyToClipboard('${id}')"]`);
    const originalText = btn.innerText;
    btn.innerText = "Copied!";
    setTimeout(() => btn.innerText = originalText, 1500);
};

// API Status Check
async function checkApiStatus() {
    const dot = document.getElementById('status-dot');
    const text = document.getElementById('status-text');
    const box = document.getElementById('api-status');
    
    try {
        const res = await fetch(CONFIG.apiHealthUrl);
        if (res.ok) {
            setApiStatus('online', dot, text, box);
        } else {
            throw new Error();
        }
    } catch (e) {
        setApiStatus('offline', dot, text, box);
    }
}

function setApiStatus(status, dot, text, box) {
    if (status === 'online') {
        dot.className = "status-dot bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.6)]";
        text.innerText = "SYSTEM ONLINE";
        text.className = "text-xs font-bold uppercase tracking-wider text-green-400";
        box.className = "inline-flex items-center gap-2 px-4 py-1.5 bg-green-500/10 rounded-full border border-green-500/30 transition-all duration-300";
    } else {
        dot.className = "status-dot bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.6)]";
        text.innerText = "SYSTEM OFFLINE";
        text.className = "text-xs font-bold uppercase tracking-wider text-red-400";
        box.className = "inline-flex items-center gap-2 px-4 py-1.5 bg-red-500/10 rounded-full border border-red-500/30 transition-all duration-300";
    }
}

// Init
document.addEventListener('DOMContentLoaded', () => {
    initAuth();
    checkApiStatus();
    setInterval(checkApiStatus, 60000);
});
