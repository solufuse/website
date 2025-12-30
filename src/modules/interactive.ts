
export class InteractiveManager {
    constructor() { this.initParticles(); this.initTilt(); this.initTypewriter(); }
    initParticles() {
        const canvas = document.getElementById('bg-canvas') as HTMLCanvasElement;
        if (!canvas) return;
        const ctx = canvas.getContext('2d')!;
        let width = canvas.width = window.innerWidth;
        let height = canvas.height = window.innerHeight;
        const particles: any[] = [];
        for (let i = 0; i < 60; i++) particles.push({
            x: Math.random() * width, y: Math.random() * height,
            vx: (Math.random() - 0.5) * 0.5, vy: (Math.random() - 0.5) * 0.5
        });
        const animate = () => {
            ctx.clearRect(0, 0, width, height);
            for (let i = 0; i < particles.length; i++) {
                let p = particles[i];
                p.x += p.vx; p.y += p.vy;
                if (p.x < 0 || p.x > width) p.vx *= -1;
                if (p.y < 0 || p.y > height) p.vy *= -1;
                ctx.fillStyle = '#3b82f6'; ctx.beginPath(); ctx.arc(p.x, p.y, 2, 0, Math.PI * 2); ctx.fill();
                for (let j = i; j < particles.length; j++) {
                    let p2 = particles[j];
                    let d = Math.sqrt((p.x-p2.x)**2 + (p.y-p2.y)**2);
                    if (d < 150) {
                        ctx.beginPath(); ctx.strokeStyle = `rgba(59, 130, 246, ${1 - d / 150})`;
                        ctx.lineWidth = 1; ctx.moveTo(p.x, p.y); ctx.lineTo(p2.x, p2.y); ctx.stroke();
                    }
                }
            }
            requestAnimationFrame(animate);
        };
        window.addEventListener('resize', () => { width = canvas.width = window.innerWidth; height = canvas.height = window.innerHeight; });
        animate();
    }
    initTilt() {
        const cards = document.querySelectorAll('.card-tilt') as NodeListOf<HTMLElement>;
        cards.forEach(card => {
            card.addEventListener('mousemove', (e) => {
                const rect = card.getBoundingClientRect();
                const x = e.clientX - rect.left - rect.width / 2;
                const y = e.clientY - rect.top - rect.height / 2;
                card.style.transform = `perspective(1000px) rotateX(${y / -10}deg) rotateY(${x / 10}deg) scale(1.02)`;
            });
            card.addEventListener('mouseleave', () => card.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) scale(1)');
        });
    }
    initTypewriter() {
        const el = document.getElementById('typewriter-text');
        if (!el) return;
        const text = "Central Hub for the Solufuse Ecosystem";
        let i = 0; el.innerHTML = "";
        const type = () => {
            if (i < text.length) { el.innerHTML += text.charAt(i); i++; setTimeout(type, 50); }
            else { el.classList.remove('cursor-blink'); }
        };
        setTimeout(type, 1000);
    }
}
