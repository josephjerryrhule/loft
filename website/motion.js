// Site-wide motion: Lenis smooth scrolling driven by GSAP's ticker, ScrollTrigger reveals,
// and scroll progress for the story films. Everything is skipped for reduced motion.
(() => {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  window.loftProgress = {};
  if (!window.gsap || !window.ScrollTrigger) return;
  gsap.registerPlugin(ScrollTrigger);

  // ---- film progress: each sticky film reads its 0..1 progress from ScrollTrigger ----
  ['top', 'film1', 'film', 'film3'].forEach((id) => {
    const el = document.getElementById(id);
    if (!el) return;
    ScrollTrigger.create({ trigger: el, start: 'top top', end: 'bottom bottom', onUpdate: (st) => (window.loftProgress[id] = st.progress), onRefresh: (st) => (window.loftProgress[id] = st.progress) });
  });
  if (reduce) return;

  // ---- smooth scrolling ----
  let lenis = null;
  if (window.Lenis) {
    lenis = new Lenis({ duration: 1.15, easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), smoothWheel: true });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((t) => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
    window.loftLenis = lenis;
    // in-page links glide instead of jumping
    document.addEventListener('click', (e) => {
      const a = e.target.closest('a[href*="#"]');
      if (!a) return;
      const url = new URL(a.href, location.href);
      if (url.pathname !== location.pathname || !url.hash) return;
      const target = document.querySelector(url.hash);
      if (!target) return;
      e.preventDefault();
      lenis.scrollTo(target, { offset: 0, duration: 1.6 });
      history.replaceState(null, '', url.hash);
    });
    // the full-screen menu locks scrolling while open
    const menu = document.getElementById('menu');
    if (menu) new MutationObserver(() => (menu.hidden ? lenis.start() : lenis.stop())).observe(menu, { attributes: true, attributeFilter: ['hidden'] });
    if (location.hash && document.querySelector(location.hash)) setTimeout(() => lenis.scrollTo(location.hash, { immediate: true }), 50);
  }

  // ---- headings rise in word by word ----
  function splitWords(el) {
    const words = [];
    [...el.childNodes].forEach((n) => {
      if (n.nodeType !== 3) { const w = document.createElement('span'); w.className = 'mw'; n.replaceWith(w); w.appendChild(n); words.push(w); return; }
      const frag = document.createDocumentFragment();
      n.textContent.split(/(\s+)/).forEach((part) => {
        if (!part) return;
        if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(part)); return; }
        const w = document.createElement('span'); w.className = 'mw';
        const i = document.createElement('span'); i.className = 'mwi'; i.textContent = part;
        w.appendChild(i); frag.appendChild(w); words.push(i);
      });
      n.replaceWith(frag);
    });
    return words;
  }
  gsap.utils.toArray('.page h2, .sub-copy h1, .cc-top h1, .sentence h2').forEach((h) => {
    const words = splitWords(h);
    gsap.from(words, { yPercent: 115, rotate: 4, duration: 0.9, ease: 'power3.out', stagger: 0.05, scrollTrigger: { trigger: h, start: 'top 88%', once: true } });
  });

  // ---- supporting text fades up ----
  gsap.utils.toArray('.page .kicker, .page .lede, .sub-copy .kicker, .sub-copy .lede, .cc-top .kicker, .cc-top .lede, .cc-actions, .strip, .free, .aside, .perk, .soon, .big-stat, .sent-aside').forEach((el) => {
    gsap.from(el, { y: 26, autoAlpha: 0, duration: 0.9, ease: 'power2.out', scrollTrigger: { trigger: el, start: 'top 90%', once: true } });
  });

  // ---- groups arrive in a staggered cascade (props cleared after, so CSS hovers keep working) ----
  const groups = [
    ['.cards', '.card'], ['.tiles', 'article'], ['.plan-grid', '.plan'], ['.steps', 'li'], ['.stats', ':scope > div'],
    ['.stat-row', '.stat'], ['.lib-shelf', 'img'], ['.quotes', 'figure'], ['.foot-in', ':scope > *'], ['.tools-inline', 'button'],
  ];
  groups.forEach(([wrap, item]) => gsap.utils.toArray(wrap).forEach((w) => {
    const items = w.querySelectorAll(item);
    if (!items.length) return;
    gsap.from(items, { y: 48, autoAlpha: 0, rotate: () => gsap.utils.random(-3, 3), duration: 0.85, ease: 'back.out(1.4)', stagger: 0.08, clearProps: 'transform,opacity,visibility', scrollTrigger: { trigger: w, start: 'top 85%', once: true } });
  }));
  // the hero faces on About pop in one by one
  gsap.utils.toArray('.faces').forEach((f) => gsap.from(f.children, { scale: 0, duration: 0.5, ease: 'back.out(2.2)', stagger: 0.06, clearProps: 'transform', scrollTrigger: { trigger: f, start: 'top 88%', once: true } }));

  // ---- the school enquiry sentence writes itself in, word by word ----
  gsap.utils.toArray('.madlib-text').forEach((p) => {
    if (p.closest('.thanks')) return;
    const bits = [];
    [...p.childNodes].forEach((n) => {
      if (n.nodeType === 3) {
        const frag = document.createDocumentFragment();
        n.textContent.split(/(\s+)/).forEach((part) => {
          if (!part) return;
          if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(' ')); return; }
          const s = document.createElement('span'); s.className = 'mlw'; s.textContent = part; frag.appendChild(s); bits.push(s);
        });
        n.replaceWith(frag);
      } else bits.push(n);
    });
    gsap.from(bits, { y: 18, autoAlpha: 0, duration: 0.55, ease: 'power2.out', stagger: 0.035, clearProps: 'transform,opacity,visibility', scrollTrigger: { trigger: p, start: 'top 80%', once: true } });
  });
  gsap.utils.toArray('.madlib-foot').forEach((f) => gsap.from(f, { y: 20, autoAlpha: 0, duration: 0.7, delay: 0.3, ease: 'power2.out', clearProps: 'transform,opacity,visibility', scrollTrigger: { trigger: f, start: 'top 95%', once: true } }));

  // ---- gentle parallax on the illustrated heroes ----
  gsap.utils.toArray('.sub-hero').forEach((hero) => {
    const art = hero.querySelector('.party, .village');
    const sky = hero.querySelector('.sky');
    const st = { trigger: hero, start: 'top top', end: 'bottom top', scrub: true };
    if (art) gsap.to(art, { yPercent: 10, ease: 'none', scrollTrigger: st });
    if (sky) gsap.to(sky, { yPercent: 18, ease: 'none', scrollTrigger: { ...st } });
  });

  // images and fonts change heights: recalculate once everything has loaded
  addEventListener('load', () => ScrollTrigger.refresh());
  document.fonts && document.fonts.ready.then(() => ScrollTrigger.refresh());
})();
