// Opening: a match strikes, the lantern lights the storybook, a page flutters, the title paints itself.
// Scrolling then zooms into the book and fades to night, handing over to chapter 1.
(() => {
  const $ = (id) => document.getElementById(id);
  const sec = $('top'), stage = $('oStage'), book = $('oBook'), room = $('oRoom');
  const page = $('oPage'), title = $('oTitle'), spark = $('oSpark'), dark = $('oDark'), fade = $('oFade'), copy = $('oCopy');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // where things sit on the book image (fractions of its box); tuned to o-book.png
  const BOOK = { pageR: { x: 0.5, y: 0.04, w: 0.375, h: 0.7 }, title: { x: 0.12, y: 0.2, w: 0.76 } };
  const FLAME = { x: 0.632, y: 0.45 }; // the oil lamp's flame in o-room.png

  function layout() {
    const s = stage.getBoundingClientRect();
    Object.assign(page.style, { left: BOOK.pageR.x * 100 + '%', top: BOOK.pageR.y * 100 + '%', width: BOOK.pageR.w * 100 + '%', height: BOOK.pageR.h * 100 + '%' });
    page.style.transformOrigin = '0% 50%';
    Object.assign(title.style, { left: BOOK.title.x * 100 + '%', top: BOOK.title.y * 100 + '%', width: BOOK.title.w * 100 + '%' });
    const iw = room.naturalWidth, ih = room.naturalHeight, cw = s.width, ch = s.height;
    const k = Math.max(cw / iw, ch / ih), ox = parseFloat(getComputedStyle(room).objectPosition) / 100 || 0.5;
    flame = { x: (cw - iw * k) * ox + FLAME.x * iw * k, y: (ch - ih * k) / 2 + FLAME.y * ih * k };
    spark.style.left = flame.x + 'px'; spark.style.top = flame.y + 'px';
    dark.style.setProperty('--x', flame.x + 'px'); dark.style.setProperty('--y', flame.y + 'px');
  }
  let flame = { x: 0, y: 0 }, currentScale = 1;

  // ---- the intro, once ----
  function intro() {
    if (reduce) { dark.style.opacity = 0; room.classList.add('lit'); title.classList.add('paint'); copy.classList.add('on'); return; }
    const t0 = performance.now();
    spark.animate([{ opacity: 0, transform: 'translate(-50%,-50%) scale(0) rotate(0)' }, { opacity: 1, transform: 'translate(-50%,-50%) scale(1.4) rotate(45deg)', offset: 0.35 }, { opacity: 0, transform: 'translate(-50%,-50%) scale(.6) rotate(90deg)' }], { duration: 700, delay: 400, easing: 'ease-out' });
    setTimeout(() => room.classList.add('lit'), 750);
    const maxR = Math.hypot(innerWidth, innerHeight);
    (function grow(now) {
      const u = Math.min(1, Math.max(0, (now - t0 - 700) / 2600));
      const e = u * u * (3 - 2 * u);
      dark.style.setProperty('--r', e * maxR + 'px');
      if (u < 1) requestAnimationFrame(grow); else dark.style.opacity = 0;
    })(t0);
    setTimeout(() => {
      page.style.opacity = 1;
      page.animate([{ transform: 'perspective(1400px) rotateY(0deg)' }, { transform: 'perspective(1400px) rotateY(-180deg)' }], { duration: 650, iterations: 2, easing: 'cubic-bezier(.4,0,.2,1)' }).onfinish = () => (page.style.opacity = 0);
    }, 2600);
    setTimeout(() => title.classList.add('paint'), 3900);
    setTimeout(() => copy.classList.add('on'), 5200);
  }

  // ---- scroll: zoom into the book, then fade to night ----
  function frame() {
    const r = sec.getBoundingClientRect();
    const p = window.loftProgress && loftProgress.top != null ? loftProgress.top : Math.min(1, Math.max(0, -r.top / Math.max(1, r.height - innerHeight)));
    const z = 1 + Math.pow(p, 1.6) * 2.6;
    currentScale = z;
    book.style.transform = `translate(-50%,-50%) scale(${z})`;
    room.style.transform = `scale(${1 + p * 0.25})`;
    if (copy.classList.contains('on')) copy.style.opacity = String(1 - Math.min(1, p * 4));
    fade.style.opacity = Math.min(1, Math.max(0, (p - 0.62) / 0.33));
    requestAnimationFrame(frame);
  }

  const imgs = [book.querySelector('img'), room];
  Promise.all(imgs.map((img) => (img.complete ? Promise.resolve() : new Promise((r) => { img.onload = img.onerror = r; }))))
    .then(() => { layout(); addEventListener('resize', layout); intro(); requestAnimationFrame(frame); });
})();
