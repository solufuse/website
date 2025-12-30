
import './style.css'
import { AuthManager } from './modules/auth';
import { InteractiveManager } from './modules/interactive';
const auth = new AuthManager();
const effects = new InteractiveManager();
declare global { interface Window { loginWithGoogle: () => void; logoutUser: () => void; copyToClipboard: (id: string) => void; } }
window.loginWithGoogle = () => auth.login();
window.logoutUser = () => auth.logout();
window.copyToClipboard = (id: string) => {
    const el = document.getElementById(id); if (el) navigator.clipboard.writeText(el.innerText);
};
async function checkApi() {
    const dot = document.getElementById('status-dot'); const text = document.getElementById('status-text'); const box = document.getElementById('api-status');
    if(!dot || !text || !box) return;
    try {
        const res = await fetch("https://api.solufuse.com/health");
        if(res.ok) {
            dot.className = "status-dot h-2 w-2 rounded-full bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.6)]";
            text.innerText = "ONLINE"; text.className = "text-xs font-bold text-green-400";
            box.classList.add('border-green-500/30', 'bg-green-500/10');
        } else throw new Error();
    } catch {
        dot.className = "status-dot h-2 w-2 rounded-full bg-red-500";
        text.innerText = "OFFLINE"; text.className = "text-xs font-bold text-red-400";
    }
}
checkApi(); setInterval(checkApi, 60000);
