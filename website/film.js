// Chapter 2 film: one wide world the camera travels across as you scroll.
// Units: everything is measured in H (the screen height), so phones keep characters big.
(() => {
  const $ = (id) => document.getElementById(id);
  const film = $('film'), stage = $('stage'), starsBox = $('stars');
  const el = {}; ['sky', 'hill', 'village', 'seaBack', 'seaMid', 'fish', 'boat', 'seaFront', 'beach', 'landing', 'lulu', 'duo', 'splash'].forEach((k) => (el[k] = $(k)));
  const boatSolo = $('boatSolo'), boatCrew = $('boatCrew');
  const calm = matchMedia('(prefers-reduced-motion: reduce)').matches ? 0.2 : 1;

  // ---- world layout (H units, depth 1 unless noted) ----
  const W = {
    horizon: 0.56,
    seaBack: { top: 0.545, h: 0.26, f: 0.6 },
    seaMid: { top: 0.74, h: 0.3, f: 0.85 },
    seaFront: { top: 0.79, h: 0.235, f: 1.15 },
    waterline: 0.835,
    sky: { f: 0.12 },
    village: { x: -0.65, w: 0.95, f: 0.45 },
    hill: { x: 5.95, w: 1.05, f: 0.35 },
    beach: { right: 0.98, h: 0.56 },
    landing: { left: 4.12, h: 0.5 },
    lulu: { x: 0.12, h: 0.36, base: 0.93 },
    duo: { x: 4.9, h: 0.44, base: 0.93 },
    boat: { w: 0.44, dockA: 1.22, dockC: 4.08 },
  };
  // camera keys: [scroll p, camera on a wide screen, camera on a phone]
  const CAM = [[0, 0.2, 0.12], [0.12, 0.2, 0.12], [0.24, 0.62, 1.22], [0.32, 0.62, 1.22], [0.62, 3.7, 3.95], [0.68, 3.7, 3.95], [0.78, 4.45, 4.85], [1, 4.45, 4.85]];
  const BEATS = [
    { to: 0.2, who: 'Lulu', line: 'Clues! The moon went this way.', hint: 'Scroll to follow the clues', hintWide: 'Scroll to follow the clues<br>Touch the sky to light the stars' },
    { to: 0.32, who: 'Kobi', line: 'All aboard! Hold on to your hats.', hint: '', hintWide: '' },
    { to: 0.62, who: 'Kobi', line: 'All aboard! Hold on to your hats.', hint: 'Drag the boat across the sea', hintWide: 'Drag the boat across the sea' },
    { to: 0.7, who: 'Kobi', line: 'All aboard! Hold on to your hats.', hint: '', hintWide: '' },
    { to: 0.8, who: 'Amara', line: 'The moon hides behind the tallest hill. Follow me!', hint: '', hintWide: '' },
    { to: 1.01, who: 'Amara', line: 'The moon hides behind the tallest hill. Follow me!', hint: 'Keep scrolling to meet the heroes', hintWide: 'Keep scrolling to meet the heroes' },
  ];

  const ratio = {};
  let V = 0, H = 0, wide = 1, S = 1;
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const smooth = (u) => u * u * (3 - 2 * u);
  const lerp = (a, b, u) => a + (b - a) * u;

  function camAt(p) {
    for (let i = 1; i < CAM.length; i++) {
      if (p <= CAM[i][0]) {
        const [p0, d0, m0] = CAM[i - 1], [p1, d1, m1] = CAM[i];
        const u = smooth(clamp((p - p0) / (p1 - p0 || 1), 0, 1));
        return lerp(lerp(m0, d0, wide), lerp(m1, d1, wide), u);
      }
    }
    return lerp(CAM[CAM.length - 1][2], CAM[CAM.length - 1][1], wide);
  }
  const sailU = (p) => smooth(clamp((p - 0.32) / 0.3, 0, 1));
  const sx = (wx, f, cam) => V / 2 + (wx - cam) * f * H; // screen x of a world point

  function size(node, key, wPx) { node.style.width = wPx + 'px'; return wPx * (ratio[key] || 1); }

  function layout() {
    V = stage.clientWidth; H = stage.clientHeight;
    wide = clamp((V / H - 0.56) / (1.78 - 0.56), 0, 1);
    S = 0.74 + 0.26 * wide;
    Object.assign(el.seaBack.style, { top: W.seaBack.top * H + 'px', height: W.seaBack.h * H + 'px', left: '-5%', width: '110%' });
    Object.assign(el.seaMid.style, { top: W.seaMid.top * H + 'px', height: W.seaMid.h * H + 'px', left: '-5%', width: '110%' });
    Object.assign(el.seaFront.style, { top: W.seaFront.top * H + 'px', height: W.seaFront.h * H + 'px', left: '-5%', width: '110%' });
    Object.assign(el.sky.style, { width: V + 0.75 * H + 'px', height: H * 1.02 + 'px' });
  }

  // ---- input: drag the boat, touch the sky ----
  let dragging = false, dragX0 = 0, drag0 = 0, dragOff = 0, dragT = 0, dragVel = 0, lastDragOff = 0;
  el.boat.addEventListener('pointerdown', (e) => {
    if (!sailing) return;
    dragging = true; dragX0 = e.clientX; drag0 = dragT; el.boat.classList.add('drag');
    el.boat.setPointerCapture(e.pointerId);
  });
  el.boat.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    const lim = lerp(0.1, 0.32, wide);
    dragT = clamp(drag0 + (e.clientX - dragX0) / H, -lim, lim);
  });
  const drop = () => { dragging = false; el.boat.classList.remove('drag'); };
  el.boat.addEventListener('pointerup', drop); el.boat.addEventListener('pointercancel', drop);

  const stars = []; let lastStar = null, skyShift = 0;
  function spawnStar(x, y) {
    const img = document.createElement('img');
    img.src = 'layers/star.webp'; img.alt = '';
    img.style.setProperty('--s', (14 + Math.random() * 22) * lerp(0.85, 1, wide) + 'px');
    img.style.left = x - skyShift + 'px'; img.style.top = y + 'px';
    starsBox.appendChild(img);
    stars.push({ img, born: now, rot: (Math.random() - 0.5) * 40, ph: Math.random() * 6 });
    if (stars.length > 80) stars.shift().img.remove();
  }
  function skyTouch(e, force) {
    if (dragging) return;
    const r = stage.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top;
    if (y > W.horizon * H - 12 || y < 0) { lastStar = null; return; }
    if (force || !lastStar || Math.hypot(x - lastStar.x, y - lastStar.y) > 42) { spawnStar(x, y); lastStar = { x, y }; }
  }
  stage.addEventListener('pointermove', (e) => { if (e.pointerType === 'mouse') skyTouch(e); });
  stage.addEventListener('pointerdown', (e) => { if (e.pointerType !== 'mouse') skyTouch(e, true); });

  // ---- fish and splash ----
  let leap = null, nextLeap = 3, splashAt = null;
  function startLeap(dir, bx) {
    const x0 = bx + dir * (W.boat.w * S * 0.6 + Math.random() * 0.08);
    leap = { t0: now, dur: 1.15, x0, dx: dir * (0.18 + Math.random() * 0.08), y0: W.waterline + 0.03, h: 0.16 + Math.random() * 0.05, dir };
    splashAt = { t0: now, wx: x0 };
  }

  // ---- captions ----
  let beat = -1;
  function setBeat(i) {
    if (i === beat) return; beat = i;
    const b = BEATS[i], cap = $('caption');
    $('hint').innerHTML = wide > 0.5 ? b.hintWide : b.hint;
    if ($('who').textContent === b.who && $('line').dataset.full === b.line) return;
    cap.classList.add('out');
    setTimeout(() => {
      $('who').textContent = b.who; const ln = $('line'); ln.dataset.full = b.line; ln.textContent = '';
      cap.classList.remove('out');
      let k = 0; const tick = () => { if (ln.dataset.full !== b.line) return; ln.textContent = b.line.slice(0, ++k); if (k < b.line.length) setTimeout(tick, 32); };
      tick();
    }, 260);
  }

  // ---- loop ----
  let now = 0, last = performance.now() / 1000, ps = 0, prevP = 0, sailing = false, boatPrev = W.boat.dockA;
  window.loftFilm = { speed: 1, leap: () => startLeap(1, boatPrev) };

  function frame(ms) {
    const real = ms / 1000, dt = Math.min(0.05, real - last) * window.loftFilm.speed; last = real; now += dt;
    const r = film.getBoundingClientRect();
    if (r.bottom < -50 || r.top > innerHeight + 50) { requestAnimationFrame(frame); return; }
    const p = window.loftProgress && loftProgress.film != null ? loftProgress.film : clamp(-r.top / Math.max(1, r.height - H), 0, 1);
    ps += (p - ps) * Math.min(1, dt * 7);
    const cam = camAt(ps);
    setBeat(BEATS.findIndex((b) => ps < b.to));

    // sky and far things
    skyShift = -cam * W.sky.f * H - 0.1 * H;
    el.sky.style.transform = `translate(${skyShift}px,0)`;
    starsBox.style.transform = `translate(${skyShift}px,0)`;
    const vh = size(el.village, 'village', W.village.w * H);
    el.village.style.transform = `translate(${sx(W.village.x, W.village.f, cam) - W.village.w * H / 2}px, ${(W.horizon + 0.012) * H - vh}px)`;
    const hh = size(el.hill, 'hill', W.hill.w * H);
    el.hill.style.transform = `translate(${sx(W.hill.x, W.hill.f, cam) - W.hill.w * H / 2}px, ${(W.horizon + 0.012) * H - hh}px)`;

    // boat: docked, sailing (with drag), docked again
    sailing = ps > 0.31 && ps < 0.63;
    if (!sailing) { dragT *= Math.pow(0.02, dt); if (dragging) drop(); }
    dragOff += (dragT - dragOff) * Math.min(1, dt * 6);
    dragVel = (dragOff - lastDragOff) / Math.max(dt, 1e-3); lastDragOff = dragOff;
    const env = Math.sin(Math.PI * sailU(ps));          // drag only counts mid-voyage
    const bx = lerp(W.boat.dockA, W.boat.dockC, sailU(ps)) + dragOff * env;
    const bVel = (bx - boatPrev) / Math.max(dt, 1e-3); boatPrev = bx;
    const bw = W.boat.w * S * H, bh = bw * (ratio.boat || 0.73);
    const wake = clamp(Math.abs(bVel) * 0.9, 0, 1);
    const bob = (Math.sin(now * 1.6) * 0.006 + Math.sin(now * 2.7) * 0.002) * H * calm * (1 + wake);
    const rock = Math.sin(now * 1.2) * 2.2 * calm - clamp(bVel * 6, -10, 10);
    el.boat.style.width = bw + 'px';
    el.boat.style.transform = `translate(${sx(bx, 1, cam) - bw / 2}px, ${W.waterline * H - bh + bob}px)`;
    boatSolo.style.transform = boatCrew.style.transform = `rotate(${rock}deg)`;
    const crew = clamp((ps - 0.296) / 0.014, 0, 1);
    boatCrew.style.width = bw + 'px'; boatCrew.style.opacity = crew; boatSolo.style.opacity = 1 - crew;

    // seas
    const amp = 1 + wake * 1.4;
    el.seaBack.style.transform = `translate(0, ${Math.sin(now * 0.9) * 0.004 * H * calm}px)`;
    el.seaBack.style.backgroundPositionX = -(cam * W.seaBack.f * H) - now * 14 * calm + 'px';
    el.seaMid.style.transform = `translate(0, ${Math.sin(now * 1.1 + 2) * 0.005 * H * calm}px)`;
    el.seaMid.style.backgroundPositionX = -(cam * W.seaMid.f * H) - now * 20 * calm + 'px';
    // big waves only out at sea: from just inside the beach's foam to just past the landing's edge
    const ox = V * 0.05; // seaFront starts at -5%
    const cl = sx(W.beach.right + 0.15, 1, cam) + ox, cr = V * 1.1 - (sx(W.landing.left - 0.05, 1, cam) + ox);
    const fadeW = 0.25 * H, rx = V * 1.1 - cr - fadeW;
    const m = `linear-gradient(to right, transparent ${cl - fadeW}px, #000 ${cl}px, #000 ${rx}px, transparent ${rx + fadeW}px)`;
    el.seaFront.style.maskImage = el.seaFront.style.webkitMaskImage = m;
    el.seaFront.style.transform = `translate(0, ${Math.sin(now * 1.3 + 1) * 0.007 * H * calm * amp}px)`;
    el.seaFront.style.backgroundPositionX = -(cam * W.seaFront.f * H) - now * 32 * calm + 'px';

    // shores
    const bch = W.beach.h * H, bcw = bch / (ratio.beach || 0.3);
    el.beach.style.width = bcw + 'px';
    el.beach.style.transform = `translate(${sx(W.beach.right, 1, cam) - bcw}px, ${H - bch + 0.02 * H}px)`;
    const ldh = W.landing.h * H, ldw = ldh / (ratio.landing || 0.3);
    el.landing.style.width = ldw + 'px';
    el.landing.style.transform = `translate(${sx(W.landing.left, 1, cam)}px, ${H - ldh + 0.02 * H}px)`;

    // Lulu, then her hop into the boat
    const lh = W.lulu.h * S * H, lw = lh / (ratio.lulu || 1.33);
    const hop = clamp((ps - 0.265) / 0.04, 0, 1);
    const lx = lerp(sx(W.lulu.x, 1, cam), sx(bx, 1, cam) + bw * 0.12, smooth(hop));
    const ly = lerp(W.lulu.base * H, W.waterline * H - bh * 0.35, smooth(hop)) - Math.sin(Math.PI * hop) * 0.18 * H;
    const ls = lerp(1, 0.6, hop);
    el.lulu.style.width = lw + 'px';
    el.lulu.style.opacity = hop < 0.92 ? 1 : 1 - (hop - 0.92) / 0.08;
    el.lulu.style.transform = `translate(${lx - lw / 2}px, ${ly - lh}px) scale(${ls})`;
    el.lulu.style.transformOrigin = '50% 100%';

    // Amani and Amara on the far shore
    const dh = W.duo.h * S * H, dw = dh / (ratio.duo || 1);
    el.duo.style.width = dw + 'px';
    el.duo.style.transform = `translate(${sx(W.duo.x, 1, cam) - dw / 2}px, ${W.duo.base * H - dh}px)`;

    // a splash when Lulu lands in the boat
    if (prevP < 0.3 && ps >= 0.3) splashAt = { t0: now, wx: bx };
    prevP = ps;

    // fish: while sailing, now and then, or when the boat is dragged fast
    nextLeap -= dt;
    if (!leap && sailing && (Math.abs(dragVel) > 0.35 || nextLeap <= 0)) {
      const dir = Math.abs(dragVel) > 0.05 ? Math.sign(dragVel) : 1;
      startLeap(dir, bx); nextLeap = 6 + Math.random() * 5;
    }
    const fw = 0.13 * S * H;
    if (leap) {
      const u = (now - leap.t0) / leap.dur;
      if (u >= 1) { splashAt = { t0: now, wx: leap.x0 + leap.dx }; leap = null; el.fish.style.opacity = 0; }
      else {
        const x = leap.x0 + leap.dx * u, y = leap.y0 - 4 * leap.h * u * (1 - u);
        const ang = Math.atan2(-4 * leap.h * (1 - 2 * u), leap.dx) * 180 / Math.PI;
        el.fish.style.width = fw + 'px';
        el.fish.style.opacity = u < 0.06 ? u / 0.06 : u > 0.94 ? (1 - u) / 0.06 : 1;
        el.fish.style.transform = `translate(${sx(x, 1, cam) - fw / 2}px, ${y * H - fw * 0.33}px) rotate(${leap.dir > 0 ? ang + 20 : 180 + ang - 20}deg) scaleY(${leap.dir > 0 ? 1 : -1})`;
      }
    }
    if (splashAt) {
      const u = (now - splashAt.t0) / 0.7;
      if (u >= 1) { el.splash.style.opacity = 0; splashAt = null; }
      else {
        const sw = 0.2 * S * H, sh = sw * (ratio.splash || 0.66);
        el.splash.style.width = sw + 'px';
        el.splash.style.opacity = 1 - u;
        el.splash.style.transform = `translate(${sx(splashAt.wx, 1, cam) - sw / 2}px, ${(W.seaFront.top + 0.035) * H - sh * 0.85}px) scale(${0.6 + u * 0.5}, ${0.5 + Math.sin(u * Math.PI) * 0.6})`;
        el.splash.style.transformOrigin = '50% 100%';
      }
    }

    // stars pop in, twinkle, fade
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

  const imgs = ['village', 'hill', 'beach', 'landing', 'lulu', 'duo', 'splash'].map((k) => [k, el[k].querySelector('img')]);
  imgs.push(['boat', boatSolo]);
  Promise.all(imgs.map(([k, img]) => (img.complete ? Promise.resolve() : new Promise((r) => { img.onload = img.onerror = r; }))
    .then(() => { ratio[k] = img.naturalHeight / img.naturalWidth || ratio[k]; img.addEventListener('load', () => { ratio[k] = img.naturalHeight / img.naturalWidth || ratio[k]; }); })))
    .then(() => { layout(); addEventListener('resize', layout); requestAnimationFrame(frame); });
})();
