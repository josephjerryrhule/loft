// Chapter 3 film: the broken bridge. Hand Abena three tools and the bridge mends; then everyone crosses.
// Same conventions as film.js: sizes in H (stage height), camera keys per scroll p for wide and phone.
(() => {
  const $ = (id) => document.getElementById(id);
  const film = $('film3'), stage = $('stage3'), starsBox = $('stars3');
  const el = {}; ['sky3', 'summit', 'farsea', 'ravine', 'bridge', 'friends', 'cheer', 'abena', 'toolbox'].forEach((k) => (el[k] = $(k)));
  const calm = matchMedia('(prefers-reduced-motion: reduce)').matches ? 0.2 : 1;

  // ravine.png: gap centre at 0.48 of its width; bridge posts at 0.315 and 0.64; ledge top at 0.55 of its height
  const R = { w: 2.5, gapAt: 0.48, postL: 0.315, postR: 0.64, ledge: 0.55, bottom: 1.02 };
  const W = {
    sky: { f: 0.1 },
    summit: { x: 1.35, w: 1.2, f: 0.4, top: 0.06 },
    farsea: { top: 0.5, h: 0.12, f: 0.25 },
    friends: { x: -0.78, h: 0.36 },
    abena: { x: -0.36, h: 0.27 },
  };
  const CAM = [[0, -0.25, -0.62], [0.18, -0.25, -0.62], [0.3, -0.1, -0.2], [0.62, -0.1, -0.2], [0.72, -0.1, -0.05], [0.92, 0.2, 0.62], [1, 0.2, 0.62]];
  const BEATS = [
    { to: 0.18, who: 'Amani', line: "We can't get across!", hint: '' },
    { to: 0.3, who: 'Abena', line: "Nothing's broken forever. Pass me the tools!", hint: '' },
    { to: 0.64, who: 'Abena', line: "Nothing's broken forever. Pass me the tools!", hint: 'Tap the tools to pass them to Abena', tools: true },
    { to: 1.01, who: 'Narrator', line: "When you try, and try again, you find out you're braver than you thought.", hint: '' },
  ];

  const ratio = {};
  let V = 0, H = 0, wide = 1, S = 1;
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const smooth = (u) => u * u * (3 - 2 * u);
  const lerp = (a, b, u) => a + (b - a) * u;
  const sx = (wx, f, cam) => V / 2 + (wx - cam) * f * H;
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
    Object.assign(el.sky3.style, { width: V + 0.6 * H + 'px', height: H * 1.02 + 'px' });
    Object.assign(el.farsea.style, { top: W.farsea.top * H + 'px', height: W.farsea.h * H + 'px', left: '-5%', width: '110%' });
  }

  // ---- the tools ----
  let given = 0, mend = 0, mendShown = 0, autoDone = false;
  const tools = [...document.querySelectorAll('#toolbox button')];
  tools.forEach((b) => b.addEventListener('click', () => {
    if (b.disabled) return;
    b.disabled = true; b.classList.add('used');
    flyTool(b); given++;
  }));
  function flyTool(b) {
    const img = b.querySelector('img'), r = img.getBoundingClientRect(), sr = stage.getBoundingClientRect();
    const fly = img.cloneNode(); fly.className = 'fly';
    Object.assign(fly.style, { left: r.left - sr.left + 'px', top: r.top - sr.top + 'px', width: r.width + 'px' });
    stage.appendChild(fly);
    const a = el.abena.getBoundingClientRect();
    const dx = a.left + a.width * 0.6 - r.left - r.width / 2, dy = a.top + a.height * 0.3 - r.top - r.height / 2;
    fly.animate([
      { transform: 'translate(0,0) rotate(0) scale(1)' },
      { transform: `translate(${dx * 0.5}px, ${dy - H * 0.18}px) rotate(200deg) scale(.9)`, offset: 0.5 },
      { transform: `translate(${dx}px, ${dy}px) rotate(360deg) scale(.4)`, opacity: 0.2 },
    ], { duration: 750, easing: 'cubic-bezier(.3,.6,.4,1)' }).onfinish = () => { fly.remove(); mend = given / 3; hammer = now; };
  }

  // ---- stars ----
  const stars = []; let lastStar = null, skyShift = 0;
  function skyTouch(e, force) {
    const r = stage.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top;
    if (y > 0.45 * H || y < 0 || e.target.closest('#toolbox')) { lastStar = null; return; }
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

  // ---- captions ----
  let beat = -1;
  function setBeat(i) {
    if (i === beat) return; beat = i;
    const b = BEATS[i], cap = $('caption3');
    $('hint3').textContent = b.hint;
    el.toolbox.classList.toggle('on', !!b.tools && given < 3);
    if ($('who3').textContent === b.who && $('line3').dataset.full === b.line) return;
    cap.classList.add('out');
    setTimeout(() => {
      $('who3').textContent = b.who; const ln = $('line3'); ln.dataset.full = b.line; ln.textContent = '';
      cap.classList.remove('out');
      let k = 0; const tick = () => { if (ln.dataset.full !== b.line) return; ln.textContent = b.line.slice(0, ++k); if (k < b.line.length) setTimeout(tick, 30); };
      tick();
    }, 260);
  }

  let now = 0, last = performance.now() / 1000, ps = 0, hammer = -9;
  function frame(ms) {
    const real = ms / 1000, dt = Math.min(0.05, real - last); last = real; now += dt;
    const r = film.getBoundingClientRect();
    if (r.bottom < -50 || r.top > innerHeight + 50) { requestAnimationFrame(frame); return; }
    const p = window.loftProgress && loftProgress.film3 != null ? loftProgress.film3 : clamp(-r.top / Math.max(1, r.height - H), 0, 1);
    ps += (p - ps) * Math.min(1, dt * 7);
    const cam = camAt(ps);

    // scrolling past the puzzle finishes the bridge, so nobody is ever stuck
    if (ps > 0.64 && given < 3 && !autoDone) { autoDone = true; tools.forEach((b) => { b.disabled = true; b.classList.add('used'); }); given = 3; mend = 1; hammer = now; }
    const done = given >= 3 && mendShown > 0.98;
    let bi = BEATS.findIndex((b) => ps < b.to);
    if (bi === 2 && done) bi = 3;
    setBeat(bi);
    if (given >= 3) el.toolbox.classList.remove('on');

    skyShift = -cam * W.sky.f * H - 0.1 * H;
    el.sky3.style.transform = `translate(${skyShift}px,0)`;
    starsBox.style.transform = `translate(${skyShift}px,0)`;
    const smw = W.summit.w * H; el.summit.style.width = smw + 'px';
    el.summit.style.transform = `translate(${sx(W.summit.x, W.summit.f, cam) - smw / 2}px, ${W.summit.top * H}px)`;
    el.farsea.style.backgroundPositionX = -(cam * W.farsea.f * H) - now * 8 * calm + 'px';

    // ravine and bridge
    const rw = R.w * H, rh = rw * (ratio.ravine || 0.29);
    const rx = sx(-R.gapAt * R.w, 1, cam), ry = R.bottom * H - rh;
    el.ravine.style.width = rw + 'px';
    el.ravine.style.transform = `translate(${rx}px, ${ry}px)`;
    const ledgeY = ry + R.ledge * rh;
    const bL = rx + R.postL * rw, bR = rx + R.postR * rw, bw = bR - bL, bh = bw * (ratio.bridge || 0.19);
    el.bridge.style.width = bw + 'px';
    el.bridge.style.transform = `translate(${bL}px, ${ledgeY - bh * 0.9}px)`;
    mendShown += (mend - mendShown) * Math.min(1, dt * 3.5);
    const edge = mendShown * 104 - 2;
    el.bridge.style.webkitMaskImage = el.bridge.style.maskImage = `linear-gradient(to right, #000 ${edge}%, transparent ${edge + 2}%)`;
    const thump = Math.max(0, 1 - (now - hammer) / 0.35);
    el.bridge.style.translate = `0 ${Math.sin(thump * Math.PI) * 0.006 * H}px`;

    // the friends wait, then cross cheering
    const fh = W.friends.h * S * H, fw = fh / (ratio.friends || 0.8);
    const cross = smooth(clamp((ps - 0.72) / 0.2, 0, 1));
    const wx = lerp(W.friends.x, -W.friends.x * 0.95, cross);
    const fx = sx(wx, 1, cam);
    const onBridge = clamp((fx - bL) / bw, 0, 1), sag = (fx > bL && fx < bR) ? Math.sin(onBridge * Math.PI) * bh * 0.12 : 0;
    const hop = Math.abs(Math.sin(now * 7)) * 0.012 * H * (cross > 0 && cross < 1 ? 1 : 0) * calm;
    const fy = ledgeY + sag - hop;
    el.friends.style.width = fw + 'px'; el.cheer.style.width = fw + 'px';
    const T = `translate(${fx - fw / 2}px, ${fy - fh + fh * 0.04}px)`;
    el.friends.style.transform = T; el.cheer.style.transform = T;
    const showCheer = clamp((ps - 0.66) / 0.05, 0, 1);
    el.friends.style.opacity = 1 - showCheer; el.cheer.style.opacity = showCheer;

    // Abena steps in at the post
    const ah = W.abena.h * S * H, aw = ah / (ratio.abena || 1.3);
    const ain = smooth(clamp((ps - 0.17) / 0.08, 0, 1));
    const ax = sx(W.abena.x - (1 - ain) * 0.5, 1, cam);
    const work = given > 0 && mendShown < 0.99 ? Math.sin(now * 14) * 3 : 0;
    el.abena.style.width = aw + 'px';
    el.abena.style.opacity = ain * (1 - clamp((ps - 0.74) / 0.06, 0, 1));
    el.abena.style.transform = `translate(${ax - aw / 2}px, ${ledgeY - ah + ah * 0.03}px) rotate(${work}deg)`;

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

  const imgs = ['ravine', 'bridge', 'friends', 'abena'].map((k) => [k, el[k].querySelector('img')]);
  Promise.all(imgs.map(([k, img]) => (img.complete ? Promise.resolve() : new Promise((r) => { img.onload = img.onerror = r; }))
    .then(() => { ratio[k] = img.naturalHeight / img.naturalWidth || ratio[k]; })))
    .then(() => { layout(); addEventListener('resize', layout); requestAnimationFrame(frame); });
})();
