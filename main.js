/* PRAKASHRAJ E — portfolio runtime. Vanilla JS, no dependencies. */
(() => {
  'use strict';

  const root = document.documentElement;
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = matchMedia('(hover:hover) and (pointer:fine)').matches;
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

  /* ---------------------------------------------------------------- furniture */
  $$('.arrows').forEach((el) => { el.innerHTML = '<i></i>'.repeat(6); });
  $$('.dots').forEach((el) => { el.innerHTML = '<i></i>'.repeat(27); });

  /* --------------------------------------------------------------------- boot */
  const boot = $('#boot');
  const fill = $('#bootFill');
  const imgs = $$('img').filter((i) => !i.loading || i.loading !== 'lazy');
  const fontsReady = document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve();
  const imgReady = Promise.all(imgs.map((i) => (i.decode ? i.decode().catch(() => {}) : Promise.resolve())));
  let prog = 0;
  const bump = (n) => { prog = Math.min(100, prog + n); fill.style.width = prog + '%'; };
  const t0 = performance.now();
  fill.style.width = '12%';

  Promise.all([fontsReady.then(() => bump(44)), imgReady.then(() => bump(44))]).then(() => {
    const held = performance.now() - t0;
    setTimeout(go, Math.max(0, 700 - held));   // the darkness should be felt
  });
  setTimeout(go, 5000);                         // never trap the visitor on a slow line

  let launched = false;
  function go() {
    if (launched) return;
    launched = true;
    fill.style.width = '100%';
    boot.classList.add('is-done');
    root.classList.remove('is-booting');
    requestAnimationFrame(() => root.classList.add('is-live'));
  }

  /* ---------------------------------------------------------- ember particles */
  const cv = $('#embers');
  const ctx = cv.getContext('2d');
  let W = 0, H = 0, DPR = 1, embers = [], heroVisible = true;

  function sizeCanvas() {
    DPR = Math.min(window.devicePixelRatio || 1, 2);
    W = cv.clientWidth; H = cv.clientHeight;
    cv.width = W * DPR; cv.height = H * DPR;
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    const n = clamp(Math.round((W * H) / 14000), 30, 110);
    embers = Array.from({ length: n }, () => spawn(true));
  }
  function spawn(anywhere) {
    return {
      x: Math.random() * W,
      y: anywhere ? Math.random() * H : H + 10,
      r: Math.random() * 1.9 + 0.4,
      vy: -(Math.random() * 0.45 + 0.12),
      vx: (Math.random() - 0.5) * 0.25,
      a: Math.random() * 0.7 + 0.2,
      ph: Math.random() * 6.28,
      hot: Math.random() < 0.28,
    };
  }
  let last = performance.now();
  function frame(now) {
    requestAnimationFrame(frame);
    if (!heroVisible || document.hidden) { last = now; return; }
    const dt = Math.min(48, now - last) / 16.67;
    last = now;
    ctx.clearRect(0, 0, W, H);
    ctx.globalCompositeOperation = 'lighter';
    for (const e of embers) {
      e.ph += 0.03 * dt;
      e.x += (e.vx + Math.sin(e.ph) * 0.18) * dt;
      e.y += e.vy * dt;
      if (e.y < -10 || e.x < -10 || e.x > W + 10) Object.assign(e, spawn(false));
      const tw = 0.55 + Math.sin(e.ph * 2.3) * 0.45;
      const g = ctx.createRadialGradient(e.x, e.y, 0, e.x, e.y, e.r * 6);
      const c = e.hot ? '255,90,60' : '225,20,24';
      g.addColorStop(0, `rgba(${c},${e.a * tw})`);
      g.addColorStop(1, `rgba(${c},0)`);
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(e.x, e.y, e.r * 6, 0, 6.283); ctx.fill();
    }
  }
  sizeCanvas();
  window.addEventListener('resize', debounce(sizeCanvas, 160));
  if (!reduced) requestAnimationFrame(frame);

  const hero = $('#home');
  new IntersectionObserver(([e]) => { heroVisible = e.isIntersecting; }, { threshold: 0 }).observe(hero);

  /* ------------------------------------------------------- pointer + parallax */
  const cur = $('#cursor');
  let cx = 0, cy = 0, tcx = 0, tcy = 0;

  window.addEventListener('pointermove', (e) => {
    tcx = e.clientX; tcy = e.clientY;
    if (fine) cur.classList.add('is-on');
  }, { passive: true });

  $$('a,button,.card,.proj').forEach((el) => {
    el.addEventListener('pointerenter', () => cur.classList.add('is-big'));
    el.addEventListener('pointerleave', () => cur.classList.remove('is-big'));
  });

  (function pointerLoop() {
    requestAnimationFrame(pointerLoop);
    cx += (tcx - cx) * 0.22; cy += (tcy - cy) * 0.22;
    if (fine) cur.style.transform = `translate(${cx}px,${cy}px)`;
  })();

  /* ---------------------------------------------------- scroll: progress etc. */
  const bar = $('#progress');
  const finWord = $$('.fin__word');
  const fin = $('#contact');
  const heroWord = $('.hero__word');
  let ticking = false;

  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      ticking = false;
      const max = document.documentElement.scrollHeight - innerHeight;
      bar.style.transform = `scaleX(${max > 0 ? scrollY / max : 0})`;

      // hero wordmark drift
      if (heroVisible && !reduced) {
        const k = clamp(scrollY / innerHeight, 0, 1);
        heroWord.style.transform = `translateY(${k * 90}px) scale(${1 + k * 0.05})`;
        heroWord.style.opacity = String(1 - k * 0.7);
      }
      // finale parallax
      const r = fin.getBoundingClientRect();
      if (r.top < innerHeight && r.bottom > 0 && !reduced) {
        const prog = clamp(1 - r.top / innerHeight, 0, 1);       // 0 -> 1 as it enters
        finWord.forEach((w, i) => w.style.setProperty('--wy', `${(1 - prog) * (-70 - i * 30)}px`));
      }
    });
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ----------------------------------------------------------- scroll reveals */
  const revealEls = $$('[data-reveal]');
  // stagger siblings in the same parent so a group lands as one wave
  const seen = new Map();
  revealEls.forEach((el) => {
    const par = el.parentElement;
    const i = seen.get(par) || 0;
    seen.set(par, i + 1);
    el.style.setProperty('--d', `${Math.min(i, 5) * 0.09}s`);
  });
  const io = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (!en.isIntersecting) return;
      en.target.classList.add('is-in');
      io.unobserve(en.target);
      $$('[data-count]', en.target).forEach(countUp);
    });
  }, { threshold: 0.14, rootMargin: '0px 0px -6% 0px' });
  revealEls.forEach((el) => io.observe(el));

  function countUp(el) {
    const to = +el.dataset.count, suf = el.dataset.suffix || '';
    if (reduced) { el.textContent = to + suf; return; }
    const dur = 1400, s = performance.now();
    (function step(now) {
      const k = clamp((now - s) / dur, 0, 1);
      const e = 1 - Math.pow(1 - k, 4);
      el.textContent = Math.round(to * e) + suf;
      if (k < 1) requestAnimationFrame(step);
    })(s);
  }

  /* ------------------------------------------------- card glow + subtle tilt */
  if (fine && !reduced) {
    $$('[data-tilt]').forEach((el) => {
      const strong = el.classList.contains('card');
      el.addEventListener('pointermove', (e) => {
        const b = el.getBoundingClientRect();
        const x = (e.clientX - b.left) / b.width, y = (e.clientY - b.top) / b.height;
        el.style.setProperty('--mx', `${x * 100}%`);
        el.style.setProperty('--my', `${y * 100}%`);
        if (strong && el.classList.contains('is-in')) {
          el.style.transform = `perspective(900px) rotateX(${(0.5 - y) * 5}deg) rotateY(${(x - 0.5) * 6}deg) translateY(-3px)`;
        }
      });
      el.addEventListener('pointerleave', () => { el.style.transform = ''; });
    });
  }

  /* ---------------------------------------------------------------- nav state */
  const links = $$('[data-nav]').filter((a) => a.getAttribute('href')?.startsWith('#'));
  const map = new Map();
  ['home', 'about', 'skills', 'experience', 'projects', 'contact'].forEach((id) => {
    const s = document.getElementById(id);
    if (s) map.set(s, id);
  });
  const so = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (!en.isIntersecting) return;
      const id = map.get(en.target);
      $$('.hdr__nav a').forEach((a) => a.classList.toggle('is-active', a.getAttribute('href') === '#' + id));
    });
  }, { rootMargin: '-45% 0px -50% 0px' });
  map.forEach((_, s) => so.observe(s));

  /* ------------------------------------------------------------- mobile menu */
  const burger = $('#burger'), menu = $('#menu');
  function setMenu(open) {
    burger.setAttribute('aria-expanded', String(open));
    if (open) {
      menu.hidden = false;
      requestAnimationFrame(() => menu.classList.add('is-open'));
      root.style.overflow = 'hidden';
    } else {
      menu.classList.remove('is-open');
      root.style.overflow = '';
      setTimeout(() => { if (!menu.classList.contains('is-open')) menu.hidden = true; }, 450);
    }
  }
  burger.addEventListener('click', () => setMenu(burger.getAttribute('aria-expanded') !== 'true'));
  $$('a', menu).forEach((a) => a.addEventListener('click', () => setMenu(false)));
  window.addEventListener('keydown', (e) => { if (e.key === 'Escape') setMenu(false); });

  /* --------------------------------------------------------------------- misc */
  function debounce(fn, ms) { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; }
})();
