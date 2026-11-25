// Confidence Club hero: pass Abena the three tools, the bridge mends, and the friends run across cheering.
(() => {
  const $ = (id) => document.getElementById(id);
  // where the forms send; override for local testing with localStorage.loftApi = 'http://localhost:3000'
  const loftApi = () => { try { return localStorage.getItem('loftApi') || 'https://app.landoffairytales.com'; } catch { return 'https://app.landoffairytales.com'; } };
  const tools = [...document.querySelectorAll('#ccTools button')];
  const bridge = $('ccBridge'), say = $('ccSay'), scene = $('ccScene'), stage = $('ccStage'), hud = $('ccHud');
  const RAVINE = 629 / 2172, GORGE = 0.48;

  // size the scene to the space left under the copy: as big as fits, never cut off at the bottom,
  // always covering the full width, centred on the gorge (or between Abena and the gorge on narrow screens)
  function fitScene() {
    const W = stage.clientWidth, H = stage.clientHeight, hudH = hud.offsetHeight;
    const narrow = W / H < 1;
    // phones: show about half the ravine (friends, Abena and the gorge) so nothing is too small or cut off
    let sw = narrow ? Math.max(W * 1.04, Math.min((H - hudH * 0.55) / RAVINE, W / 0.5)) : Math.max(W * 1.04, (H - hudH * 0.55) / RAVINE);
    const focus = narrow ? 0.34 : GORGE;
    let left = W / 2 - focus * sw;
    left = Math.min(0, Math.max(W - sw, left));
    scene.style.width = sw + 'px'; scene.style.left = left + 'px';
    const gx = left + GORGE * sw, half = hud.offsetWidth / 2;
    hud.style.left = Math.min(W - half - 12, Math.max(half + 12, gx)) + 'px';
    hud.style.top = Math.max(0, H - sw * RAVINE - hudH * 0.55) + 'px';
    scene.style.setProperty('--end', '70%');
    fitScene.pan = left > W - sw + 1 ? W - sw : null;   // where to pan so the far ledge shows, if it doesn't already
    if (scene.classList.contains('crossed') && fitScene.pan !== null) scene.style.left = fitScene.pan + 'px';
  }
  const rav = scene.querySelector('.cc-ravine');
  (rav.complete ? Promise.resolve() : new Promise((r) => (rav.onload = r))).then(fitScene);
  addEventListener('resize', fitScene);
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let given = 0, shown = 0, target = 0;
  const lines = ['The bridge is broken! Pass Abena the tools.', 'A rope! Two more to go.', 'A wrench! One more.', "Nothing's broken forever. Here we go!"];

  function mask(v) {
    const e = v * 104 - 2;
    bridge.style.webkitMaskImage = bridge.style.maskImage = `linear-gradient(to right, #000 ${e}%, transparent ${e + 2}%)`;
  }
  mask(0);
  function ease() {
    shown += (target - shown) * 0.08;
    if (Math.abs(target - shown) < 0.002) shown = target;
    mask(shown);
    if (shown !== target) requestAnimationFrame(ease);
    else if (target >= 1) cross();
  }
  function cross() {
    say.textContent = "You did it! When you try, and try again, you find out you're braver than you thought.";
    scene.classList.add('crossed');
    hud.classList.add('done');
    if (fitScene.pan !== null && fitScene.pan !== undefined) {
      scene.style.transition = reduce ? 'none' : 'left 2.6s cubic-bezier(.45,.05,.35,1)';
      scene.style.left = fitScene.pan + 'px';
    }
  }
  tools.forEach((b) => b.addEventListener('click', () => {
    if (b.disabled) return;
    b.disabled = true; b.classList.add('used');
    const img = b.querySelector('img'), r = img.getBoundingClientRect(), a = $('ccAbena').getBoundingClientRect();
    const fly = img.cloneNode(); fly.className = 'fly';
    Object.assign(fly.style, { position: 'fixed', left: r.left + 'px', top: r.top + 'px', width: r.width + 'px' });
    document.body.appendChild(fly);
    const dx = a.left + a.width * 0.6 - r.left - r.width / 2, dy = a.top + a.height * 0.3 - r.top - r.height / 2;
    const done = () => { fly.remove(); given++; target = given / 3; say.textContent = lines[given]; $('ccAbena').animate([{ rotate: '0deg' }, { rotate: '-4deg' }, { rotate: '3deg' }, { rotate: '0deg' }], { duration: 400 }); requestAnimationFrame(ease); };
    if (reduce) { done(); return; }
    fly.animate([
      { transform: 'translate(0,0) rotate(0) scale(1)' },
      { transform: `translate(${dx * 0.5}px, ${dy - 140}px) rotate(200deg) scale(.9)`, offset: 0.5 },
      { transform: `translate(${dx}px, ${dy}px) rotate(360deg) scale(.4)`, opacity: 0.2 },
    ], { duration: 750, easing: 'cubic-bezier(.3,.6,.4,1)' }).onfinish = done;
  }));

  // the enquiry reads as a sentence: each blank grows with what you type
  const form = $('enquiryForm');
  if (form) {
    const meas = document.createElement('span'); meas.className = 'madlib-measure'; form.appendChild(meas);
    const fit = (el) => {
      const t = el.tagName === 'SELECT' ? el.options[el.selectedIndex].text : (el.value || el.placeholder);
      meas.textContent = t; el.style.width = meas.offsetWidth + (el.tagName === 'SELECT' ? 36 : 16) + 'px';
    };
    const fields = [...form.querySelectorAll('.madlib-text input, .madlib-text select')];
    // modern browsers size the blanks themselves (field-sizing: content); older ones get measured here
    const native = window.CSS && CSS.supports('field-sizing', 'content');
    fields.forEach((el) => {
      if (!native) { fit(el); el.addEventListener('input', () => fit(el)); el.addEventListener('change', () => fit(el)); }
      el.addEventListener('input', () => el.classList.toggle('filled', !!el.value));
    });
    if (!native) addEventListener('load', () => fields.forEach(fit));
    const err = form.querySelector('.madlib-err');
    // Prototype only: no backend yet, so check the blanks and show the thank-you state.
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const bad = fields.filter((el) => !el.checkValidity());
      fields.forEach((el) => el.classList.toggle('miss', bad.includes(el)));
      const ok = form.querySelector('[name=ok]');
      if (bad.length) { err.textContent = 'Just fill in the underlined blanks: ' + bad.map((el) => el.placeholder).join(', ') + '.'; err.hidden = false; bad[0].focus(); return; }
      if (!ok.checked) { err.textContent = 'Please tick the box so we can contact you.'; err.hidden = false; ok.focus(); return; }
      // send through the LOFT app, which uses the same SMTP as app.landoffairytales.com
      const btn = form.querySelector('[type=submit]');
      btn.disabled = true; btn.textContent = 'Sending…';
      fetch(`${loftApi()}/api/site/enquiry`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(Object.fromEntries(new FormData(form))) })
        .then((r) => r.json().catch(() => ({})).then((d) => { if (!r.ok || !d.ok) throw new Error(d.error || r.status); }))
        .then(showThanks)
        .catch(() => { err.innerHTML = 'Sorry, that didn\'t send. Please try again, or email <a href="mailto:support@landoffairytales.com">support@landoffairytales.com</a>.'; err.hidden = false; })
        .finally(() => { btn.disabled = false; btn.textContent = 'Send enquiry'; });
    });
    function showThanks() {
      const v = (n) => form.querySelector(`[name=${n}]`).value.trim();
      const first = v('name').split(/\s+/)[0], school = v('school');
      const line = $('thanksLine');
      line.textContent = `Thank you, ${first}! We'll write to ${v('email')} soon to plan ${school.endsWith('s') ? school + "'" : school + "'s"} first session.`;
      form.querySelector('.madlib-text').hidden = true; form.querySelector('.madlib-foot').hidden = true; err.hidden = true;
      form.querySelector('.thanks').hidden = false; line.focus();
    }
    $('thanksAgain').addEventListener('click', () => {
      form.reset(); fields.forEach((el) => { el.classList.remove('miss', 'filled'); if (!native) fit(el); });
      form.querySelector('.thanks').hidden = true; form.querySelector('.madlib-text').hidden = false; form.querySelector('.madlib-foot').hidden = false;
      fields[0].focus();
    });
  }
})();
