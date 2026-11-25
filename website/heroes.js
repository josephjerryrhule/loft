// Hero cards for the Meet the heroes page. Gift lines are drafts until LOFT confirms them.
(() => {
  const HEROES = [
    ['luna', 'Luna the Cat', 'Wears the moon on her collar and always notices when something is missing.'],
    ['lulu', 'Detective Lulu', 'Spots the clue everyone else walks right past.'],
    ['kobi', 'Kobi the Sailor Crab', 'Will row anyone anywhere, as long as they need a friend.'],
    ['amani', 'Amani', 'Carries a seed of hope and plants it wherever he goes.'],
    ['amara', 'Amara', 'Can read any map and always finds the way home.'],
    ['abena', 'Abena the Fixer', 'Believes nothing is broken forever.'],
    ['mila', 'Mila', 'Reads under the blanket long after bedtime.'],
    ['foofo', 'Foofo', 'Plays a flute that makes the whole village dance.'],
    ['kofi', 'Kofi the Dreamer', 'Dreams big every night and starts small every morning.'],
    ['mamele', 'Mamele', 'Dances the old stories with her golden staff.'],
    ['sukura', 'Sukura', 'Sleeps through every adventure. Almost.'],
  ];
  const box = document.getElementById('cards');
  box.innerHTML = HEROES.map(([id, name, gift]) => `
    <button class="card" aria-pressed="false" aria-label="${name}. ${gift}">
      <span class="in">
        <span class="face front"><img src="heroes/${id}.jpg" alt="" loading="lazy"><span class="nm">${name}</span></span>
        <span class="face back"><span><span class="nm" style="display:block">${name}</span><span class="gift" style="display:block">${gift}</span></span><span class="turn">Tap to turn back</span></span>
      </span>
    </button>`).join('');
  box.addEventListener('click', (e) => {
    const c = e.target.closest('.card'); if (!c) return;
    c.setAttribute('aria-pressed', c.getAttribute('aria-pressed') === 'true' ? 'false' : 'true');
  });

  const form = document.getElementById('enquiry');
  // Prototype only: no backend yet, so show the thank-you state.
  if (form && form.tagName === 'FORM') form.addEventListener('submit', (e) => {
    e.preventDefault();
    [...form.children].forEach((n) => { if (!n.classList.contains('thanks') && n.tagName !== 'H3') n.hidden = true; });
    form.querySelector('.thanks').hidden = false;
  });

  const btn = document.getElementById('menuBtn'), menu = document.getElementById('menu');
  btn.addEventListener('click', () => {
    const open = menu.hidden; menu.hidden = !open; btn.setAttribute('aria-expanded', String(open));
    btn.textContent = open ? 'Close' : 'Menu'; document.body.style.overflow = open ? 'hidden' : '';
  });
  menu.addEventListener('click', (e) => { if (e.target.closest('a')) btn.click(); });
})();
