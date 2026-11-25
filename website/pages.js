// Shared behaviour for the Events and About pages.
(() => {
  const $ = (id) => document.getElementById(id);
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // menu
  const btn = $('menuBtn'), menu = $('menu');
  if (btn) {
    btn.addEventListener('click', () => {
      const open = menu.hidden; menu.hidden = !open; btn.setAttribute('aria-expanded', String(open));
      btn.textContent = open ? 'Close' : 'Menu'; document.body.style.overflow = open ? 'hidden' : '';
    });
    menu.addEventListener('click', (e) => { if (e.target.closest('a')) btn.click(); });
  }

  // stars where you touch the sky
  function starSky(hero, box) {
    if (!hero || !box) return;
    let last = null;
    const add = (e, force) => {
      const r = hero.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top;
      if (y > r.height * 0.55 || e.target.closest('a, button, input')) { last = null; return; }
      if (!force && last && Math.hypot(x - last.x, y - last.y) < 44) return;
      last = { x, y };
      const img = document.createElement('img'); img.src = 'layers/star.webp'; img.alt = '';
      img.style.setProperty('--s', 14 + Math.random() * 22 + 'px');
      img.style.left = x + 'px'; img.style.top = y + 'px';
      box.appendChild(img);
      img.animate([{ transform: 'translate(-50%,-50%) scale(0) rotate(-40deg)', opacity: 1 }, { transform: 'translate(-50%,-50%) scale(1.15) rotate(0)', opacity: 1, offset: 0.12 }, { transform: 'translate(-50%,-50%) scale(1) rotate(0)', opacity: 1, offset: 0.8 }, { transform: 'translate(-50%,-50%) scale(1)', opacity: 0 }], { duration: 9000, easing: 'ease-out' }).onfinish = () => img.remove();
      if (box.children.length > 70) box.firstChild.remove();
    };
    hero.addEventListener('pointermove', (e) => { if (e.pointerType === 'mouse') add(e); });
    hero.addEventListener('pointerdown', (e) => { if (e.pointerType !== 'mouse') add(e, true); });
  }
  starSky(document.querySelector('.ev-hero'), $('evStars'));
  starSky(document.querySelector('.ab-hero'), $('abStars'));

  // Events: lanterns on a string; hover or tap to light them
  const lb = $('evLanterns');
  if (lb) {
    const n = innerWidth < 720 ? 5 : 7;
    for (let i = 0; i < n; i++) {
      const u = (i + 0.5) / n, b = document.createElement('button');
      b.className = 'lantern'; b.type = 'button'; b.setAttribute('aria-label', 'Light lantern ' + (i + 1));
      b.style.left = `calc(${u * 100}% - 29px)`;
      b.style.top = (20 + 220 * u * (1 - u)) * 110 / 120 - 6 + 'px';   // hangs on the string's curve
      b.style.animationDelay = -i * 0.7 + 's';
      b.innerHTML = '<img src="layers/lantern-head.webp" alt="">';
      const light = () => { if (b.classList.contains('on')) return; b.classList.add('on'); if (!reduce) b.animate([{ scale: 1 }, { scale: 1.18 }, { scale: 1 }], { duration: 420, easing: 'cubic-bezier(.34,1.56,.64,1)' }); allLit(); };
      b.addEventListener('mouseenter', light); b.addEventListener('click', light);
      lb.appendChild(b);
    }
    const allLit = () => {
      if (lb.querySelectorAll('.lantern:not(.on)').length) return;
      const hero = document.querySelector('.ev-hero'), box = $('evStars'), r = hero.getBoundingClientRect();
      for (let i = 0; i < 24; i++) setTimeout(() => {
        const img = document.createElement('img'); img.src = 'layers/star.webp'; img.alt = '';
        img.style.setProperty('--s', 12 + Math.random() * 26 + 'px');
        img.style.left = Math.random() * r.width + 'px'; img.style.top = Math.random() * r.height * 0.5 + 'px';
        box.appendChild(img);
        img.animate([{ transform: 'translate(-50%,-50%) scale(0)', opacity: 1 }, { transform: 'translate(-50%,-50%) scale(1.2)', opacity: 1, offset: 0.15 }, { transform: 'translate(-50%,-50%) scale(1)', opacity: 0 }], { duration: 6000, easing: 'ease-out' }).onfinish = () => img.remove();
      }, i * 60);
    };
  }

  // Events: list or coming soon
  const list = $('evList');
  if (list) {
    const evs = window.LOFT_EVENTS || [];
    if (!evs.length) $('evSoon').hidden = false;
    list.innerHTML = evs.map((e) => `<article class="ev-card"><div class="ev-date">${e.day}<small>${e.month}</small></div><div><h3>${e.title}</h3><p>${[e.where, e.time].filter(Boolean).join(' · ')}</p></div>${e.link ? `<a class="btn gold" href="${e.link}">Get tickets</a>` : ''}</article>`).join('');
    const f = $('notify');
    // Prototype only: no mailing list connected yet.
    // send through the LOFT app, which uses the same SMTP as app.landoffairytales.com
    const api = () => { try { return localStorage.getItem('loftApi') || 'https://app.landoffairytales.com'; } catch { return 'https://app.landoffairytales.com'; } };
    f.addEventListener('submit', (e) => {
      e.preventDefault();
      const btn = f.querySelector('[type=submit]'); btn.disabled = true; btn.textContent = 'Sending…';
      fetch(`${api()}/api/site/events-signup`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(Object.fromEntries(new FormData(f))) })
        .then((r) => r.json().catch(() => ({})).then((d) => { if (!r.ok || !d.ok) throw new Error(d.error || r.status); }))
        .then(() => { f.hidden = true; const m = document.querySelector('.notify-done'); m.textContent = "Lovely! We'll be in touch when the next event is booked."; m.hidden = false; })
        .catch(() => { btn.textContent = 'Try again'; const m = document.querySelector('.notify-done'); m.textContent = "Sorry, that didn't send. Please try again in a moment."; m.hidden = false; })
        .finally(() => { btn.disabled = false; if (btn.textContent === 'Sending…') btn.textContent = 'Tell me first'; });
    });
  }

  // About: numbers count up, and 365 little stars light as you scroll past them
  const nums = document.querySelectorAll('[data-n]');
  if (nums.length) {
    const io = new IntersectionObserver((es) => es.forEach((e) => {
      if (!e.isIntersecting) return; io.unobserve(e.target);
      const n = e.target, to = +n.dataset.n, t0 = performance.now();
      (function step(t) { const u = Math.min(1, (t - t0) / 1500); n.textContent = Math.round(to * (1 - Math.pow(1 - u, 3))); if (u < 1) requestAnimationFrame(step); })(t0);
    }), { threshold: 0.5 });
    nums.forEach((n) => io.observe(n));
  }
  const nights = $('nights');
  if (nights) {
    nights.innerHTML = '<i></i>'.repeat(365);
    const dots = [...nights.children];
    const tick = () => {
      const r = nights.getBoundingClientRect();
      const u = reduce ? 1 : Math.min(1, Math.max(0, (innerHeight * 0.92 - r.top) / (r.height + innerHeight * 0.35)));
      const k = Math.round(u * 365);
      dots.forEach((d, i) => d.classList.toggle('on', i < k));
    };
    addEventListener('scroll', tick, { passive: true }); addEventListener('resize', tick); tick();
  }
})();
