document.documentElement.classList.add("js");

const navbar = document.querySelector(".navbar");
const navContainer = document.querySelector(".nav-container");
const navLinks = document.querySelectorAll(".navbar nav a");
const root = document.documentElement;

/* ---------- Theme toggle (remembers choice, defaults to system) ---------- */
const saved = (() => { try { return localStorage.getItem("theme"); } catch { return null; } })();
const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
root.dataset.theme = saved || (prefersDark ? "dark" : "light");

const themeBtn = document.createElement("button");
themeBtn.className = "theme-btn";
themeBtn.type = "button";
const syncThemeBtn = () => {
    const dark = root.dataset.theme === "dark";
    themeBtn.textContent = dark ? "☀️" : "🌙";
    themeBtn.setAttribute("aria-label", dark ? "Switch to light theme" : "Switch to dark theme");
};
themeBtn.addEventListener("click", () => {
    root.dataset.theme = root.dataset.theme === "dark" ? "light" : "dark";
    try { localStorage.setItem("theme", root.dataset.theme); } catch {}
    syncThemeBtn();
});
syncThemeBtn();

/* ---------- Mobile menu ---------- */
const menuBtn = document.createElement("button");
menuBtn.className = "menu-btn";
menuBtn.type = "button";
menuBtn.textContent = "☰";
menuBtn.setAttribute("aria-label", "Toggle menu");
menuBtn.setAttribute("aria-expanded", "false");
menuBtn.addEventListener("click", () => {
    const open = navbar.classList.toggle("open");
    menuBtn.setAttribute("aria-expanded", String(open));
    menuBtn.textContent = open ? "✕" : "☰";
});
navLinks.forEach(link => link.addEventListener("click", () => {
    navbar.classList.remove("open");
    menuBtn.setAttribute("aria-expanded", "false");
    menuBtn.textContent = "☰";
}));

navContainer.append(themeBtn, menuBtn);

/* ---------- Highlight the current section in the nav ---------- */
const sections = [...document.querySelectorAll("main section, section[id]")];
const navObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        navLinks.forEach(a => a.classList.toggle("active", a.getAttribute("href") === "#" + entry.target.id));
    });
}, { rootMargin: "-45% 0px -50% 0px" });
sections.forEach(s => navObserver.observe(s));

/* ---------- Reveal cards as they scroll into view ---------- */
const revealTargets = document.querySelectorAll(
    ".education-card, .skill-card, .project-card, .research-card, .about-content, .contact-content"
);
revealTargets.forEach(el => el.classList.add("reveal"));
const revealObserver = new IntersectionObserver((entries, obs) => {
    entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("visible");
        obs.unobserve(entry.target);
    });
}, { threshold: 0.12 });
revealTargets.forEach(el => revealObserver.observe(el));

(() => {
    const canvas = document.getElementById("network-bg");
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const hero = canvas.parentElement;

    const COLOR = "216, 107, 50";   // orange. For blue use "40, 80, 255"
    const LINK_DISTANCE = 140;
    const SPEED = 0.35;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let w, h, dots = [], running = true;
    const mouse = { x: null, y: null };

    function resize() {
        const dpr = window.devicePixelRatio || 1;
        w = hero.clientWidth; h = hero.clientHeight;
        canvas.width = w * dpr; canvas.height = h * dpr;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        const count = Math.min(110, Math.floor((w * h) / 14000));
        dots = Array.from({ length: count }, () => ({
            x: Math.random() * w, y: Math.random() * h,
            vx: (Math.random() - .5) * SPEED * 2, vy: (Math.random() - .5) * SPEED * 2,
            r: Math.random() * 1.6 + .6
        }));
    }

    function link(a, b, strength) {
        ctx.beginPath();
        ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y);
        ctx.strokeStyle = `rgba(${COLOR}, ${strength * .45})`;
        ctx.lineWidth = 1;
        ctx.stroke();
    }

    function draw() {
        ctx.clearRect(0, 0, w, h);
        for (const d of dots) {
            if (!reduceMotion) {
                d.x += d.vx; d.y += d.vy;
                if (d.x < 0 || d.x > w) d.vx *= -1;
                if (d.y < 0 || d.y > h) d.vy *= -1;
            }
            ctx.beginPath();
            ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(${COLOR}, .8)`;
            ctx.fill();
        }
        for (let i = 0; i < dots.length; i++) {
            for (let j = i + 1; j < dots.length; j++) {
                const dist = Math.hypot(dots[i].x - dots[j].x, dots[i].y - dots[j].y);
                if (dist < LINK_DISTANCE) link(dots[i], dots[j], 1 - dist / LINK_DISTANCE);
            }
            if (mouse.x !== null) {
                const dm = Math.hypot(dots[i].x - mouse.x, dots[i].y - mouse.y);
                if (dm < 180) link(dots[i], mouse, 1 - dm / 180);
            }
        }
        if (running && !reduceMotion) requestAnimationFrame(draw);
    }

    hero.addEventListener("mousemove", e => {
        const r = hero.getBoundingClientRect();
        mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top;
    });
    hero.addEventListener("mouseleave", () => { mouse.x = mouse.y = null; });
    window.addEventListener("resize", resize);

    new IntersectionObserver(([entry]) => {
        const wasRunning = running;
        running = entry.isIntersecting;
        if (running && !wasRunning) draw();
    }).observe(hero);

    resize();
    draw();
})();