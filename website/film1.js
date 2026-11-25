// Chapter 1: the village gets ready for bed, the lanterns come on one by one, and Luna finds the moon is missing.
(() => {
  const $ = (id) => document.getElementById(id);
  const film = $('film1'), stage = $('stage1'), starsBox = $('stars1');
  const sky = $('sky1'), farhill = $('farhill'), street = $('street'), luna = $('luna');
  const lamps = [0, 1, 2, 3].map((i) => $('lamp' + i));
  const calm = matchMedia('(prefers-reduced-motion: reduce)').matches ? 0.2 : 1;

  // c1-street.png: points of interest as fractions of its box (tuned to the art)
  const ST = { h: 0.6, mila: 0.17, kofi: 0.4, hut: 0.8, roof: { x: 0.725, y: 0.33 }, ground: 0.95 };
  const LAMPS = [0.03, 0.295, 0.61, 0.985];       // x along the street
  const W = { sky: { f: 0.1 }, farhill: { x: 1.9, w: 0.8, f: 0.3, base: 0.5 }, lamp: { h: 0.4 }, luna: { h: 0.17 } };
  // camera keys in street-fraction space: [scroll p, wide, phone]
  const CAM = [[0, 0.3, 0.17], [0.1, 0.3, 0.17], [0.4, 0.5, 0.17], [0.5, 0.5, 0.4], [0.62, 0.6, 0.4], [0.72, 0.66, 0.78], [1, 0.66, 0.78]];
  const BEATS = [
    { to: 0.4, who: 'Narrator', line: 'Once upon a time, in the Land of Fairytales, the sun went down and everyone got ready for bed.', hint: '' },
    { to: 0.62, who: 'Narrator', line: 'Mila read one more page. Kofi yawned a great big yawn. And Sukura? Already fast asleep.', hint: '' },
    { to: 0.78, who: 'Narrator', line: 'But that night, something was missing.', hint: '' },
    { to: 1.01, who: 'Luna', line: "Where's the moon?", hint: 'Touch the sky to light the stars', hintWide: 'Touch the sky to light the stars. Can you find the moon?' },
  ];

  const ratio = {};
  let V = 0, H = 0, wide = 1, S = 1, SW = 0, SH = 0;
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const smooth = (u) => u * u * (3 - 2 * u);
  const lerp = (a, b, u) => a + (b - a) * u;
  function camAt(p) {
    for (let i = 1; i < CAM.length; i++) if (p <= CAM[i][0]) {
      const [p0, d0, m0] = CAM[i - 1], [p1, d1, m1] = CAM[i];
      const u = smooth(clamp((p - p0) / (p1 - p0 || 1), 0, 1));
      return lerp(lerp(m0, d0, wide), lerp(m1, d1, wide), u);
    }
    return lerp(CAM[CAM.length - 1][2], CAM[CAM.length - 1][1], wide);
  }
  function layout() {
    V = stage.clientWidth; H = stage.clientHeight;
    wide = clamp((V / H - 0.56) / (1.78 - 0.56), 0, 1);
    S = 0.74 + 0.26 * wide;
    SH = ST.h * H; SW = SH / (ratio.street || 0.33);
    street.style.width = SW + 'px';
    Object.assign(sky.style, { width: V + 0.6 * H + 'px', height: H * 1.02 + 'px' });
  }

  // stars under your finger
  const stars = []; let lastStar = null, skyShift = 0, now = 0;
  function skyTouch(e, force) {
    const r = stage.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top;
    if (y > H - SH * 0.75 || y < 0) { lastStar = null; return; }
    if (!force && lastStar && Math.hypot(x - lastStar.x, y - lastStar.y) < 42) return;
    lastStar = { x, y };
    const img = document.createElement('img'); img.src = 'layers/star.webp'; img.alt = '';
    img.style.setProperty('--s', (14 + Math.random() * 22) * lerp(0.85, 1, wide) + 'px');
    img.style.left = x - skyShift + 'px'; img.style.top = y + 'px';
    starsBox.appendChild(img); stars.push({ img, born: now, rot: (Math.random() - 0.5) * 40, ph: Math.random() * 6 });
    if (stars.length > 80) stars.shift().img.remove();
  }
  stage.addEventListener('pointermove', (e) => { if (e.pointerType === 'mouse') skyTouch(e); });
  stage.addEventListener('pointerdown', (e) => { if (e.pointerType !== 'mouse') skyTouch(e, true); });

  let beat = -1;
  function setBeat(i) {
    if (i === beat) return; beat = i;
    const b = BEATS[i], cap = $('caption1');
    $('hint1').textContent = wide > 0.5 && b.hintWide ? b.hintWide : b.hint;
    cap.classList.add('out');
    setTimeout(() => {
      $('who1').textContent = b.who; const ln = $('line1'); ln.dataset.full = b.line; ln.textContent = '';
      cap.classList.remove('out');
      let k = 0; const tick = () => { if (ln.dataset.full !== b.line) return; ln.textContent = b.line.slice(0, ++k); if (k < b.line.length) setTimeout(tick, 28); };
      tick();
    }, 260);
  }

  let last = performance.now() / 1000, ps = 0;
  function frame(ms) {
    const real = ms / 1000, dt = Math.min(0.05, real - last); last = real; now += dt;
    const r = film.getBoundingClientRect();
    if (r.bottom < -50 || r.top > innerHeight + 50) { requestAnimationFrame(frame); return; }
    const p = window.loftProgress && loftProgress.film1 != null ? loftProgress.film1 : clamp(-r.top / Math.max(1, r.height - H), 0, 1);
    ps += (p - ps) * Math.min(1, dt * 7);
    setBeat(BEATS.findIndex((b) => ps < b.to));

    // camera: keep the street filling the screen, centred on the beat's point of interest
    const camF = camAt(ps);
    let sx0 = V / 2 - camF * SW;
    sx0 = SW > V ? clamp(sx0, V - SW, 0) : (V - SW) / 2;
    const camPx = -sx0;
    street.style.transform = `translate(${sx0}px, ${H - SH + 0.02 * H}px)`;
    skyShift = -camPx * W.sky.f - 0.1 * H;
    sky.style.transform = `translate(${skyShift}px,0)`;
    starsBox.style.transform = `translate(${skyShift}px,0)`;
    const fw = W.farhill.w * H; farhill.style.width = fw + 'px';
    farhill.style.transform = `translate(${V / 2 + (W.farhill.x * H - camPx - V / 2) * W.farhill.f + V * 0.25 - fw / 2}px, ${W.farhill.base * H - fw * (ratio.farhill || 0.5)}px)`;

    // lanterns come on one by one as you scroll
    const lh = W.lamp.h * S * H, lw = lh / (ratio.lamp || 2.4);
    lamps.forEach((el, i) => {
      el.style.width = lw + 'px';
      el.style.transform = `translate(${sx0 + LAMPS[i] * SW - lw / 2}px, ${H - SH + 0.02 * H + ST.ground * SH - lh}px)`;
      el.classList.toggle('on', ps > 0.05 + i * 0.07);
    });

    // Luna climbs onto the roof and looks up
    const nh = W.luna.h * S * H, nw = nh / (ratio.luna || 1.2);
    const up = smooth(clamp((ps - 0.6) / 0.08, 0, 1));
    luna.style.width = nw + 'px';
    luna.style.opacity = up;
    luna.style.transform = `translate(${sx0 + ST.roof.x * SW - nw / 2}px, ${H - SH + 0.02 * H + ST.roof.y * SH - nh + (1 - up) * nh * 0.4 + Math.sin(now * 1.5) * 1.5 * calm}px)`;

    for (let i = stars.length - 1; i >= 0; i--) {
      const s = stars[i], age = now - s.born;
      const k = Math.min(1, age / 0.45), back = 1 + 2.2 * Math.pow(k - 1, 3) + 1.2 * Math.pow(k - 1, 2);
      const fade = age > 9 ? Math.max(0, 1 - (age - 9) / 2) : 1;
      s.img.style.transform = `translate(-50%,-50%) rotate(${s.rot}deg) scale(${back})`;
      s.img.style.opacity = (0.88 + 0.12 * Math.sin(now * 3 + s.ph)) * fade;
      if (fade <= 0) { s.img.remove(); stars.splice(i, 1); }
    }
    requestAnimationFrame(frame);
  }

  const imgs = [['street', street.querySelector('img')], ['farhill', farhill.querySelector('img')], ['lamp', lamps[0].querySelector('img')], ['luna', luna.querySelector('img')]];
  Promise.all(imgs.map(([k, img]) => (img.complete ? Promise.resolve() : new Promise((r) => { img.onload = img.onerror = r; }))
    .then(() => { ratio[k] = img.naturalHeight / img.naturalWidth || ratio[k]; })))
    .then(() => { layout(); addEventListener('resize', layout); requestAnimationFrame(frame); });

  // Who we are: count the numbers up when they come into view
  const io = new IntersectionObserver((es) => es.forEach((e) => {
    if (!e.isIntersecting) return; io.disconnect();
    document.querySelectorAll('#stats [data-n]').forEach((n) => {
      const to = +n.dataset.n, t0 = performance.now();
      (function step(t) { const u = Math.min(1, (t - t0) / 1400); n.textContent = Math.round(to * (1 - Math.pow(1 - u, 3))); if (u < 1) requestAnimationFrame(step); })(t0);
    });
  }), { threshold: 0.4 });
  io.observe($('stats'));
})();
