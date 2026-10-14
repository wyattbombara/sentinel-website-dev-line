/* Shared navigation and plan recommendation for the independent static development line. */
(() => {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const Observer = window.IntersectionObserver || class {
    constructor(callback) { this.callback = callback; }
    observe(target) { this.callback([{ target, isIntersecting: true }], this); }
    unobserve() {} disconnect() {}
  };
  window.Site = { $, $$, reduced, Observer, ready: true, reveal: el => el.classList.add('is-in'),
    scrollTo: (top, smooth) => scrollTo({ top, behavior: smooth && !reduced ? 'smooth' : 'instant' }) };
  const Masks = window.SentinelMasks;
  $$('[data-glyph]').forEach(el => { if (Masks && !el.firstElementChild) el.innerHTML = Masks.svg(el.dataset.glyph); });
  $$('[data-kind]').forEach(el => { if (Masks && !el.firstElementChild) el.innerHTML = Masks.kindIcon(el.dataset.kind); });
  $$('[data-year]').forEach(el => { el.textContent = new Date().getFullYear(); });
  const nav = $('[data-nav]'), toggle = $('[data-nav-toggle]');
  if (nav && toggle) {
    const close = (focus = false) => {
      nav.classList.remove('is-open'); toggle.setAttribute('aria-expanded', 'false');
      toggle.setAttribute('aria-label', 'Open menu'); if (focus) toggle.focus();
    };
    toggle.addEventListener('click', () => {
      const open = nav.classList.toggle('is-open');
      toggle.setAttribute('aria-expanded', String(open));
      toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    });
    $$('.nav__links a', nav).forEach(a => a.addEventListener('click', () => close()));
    document.addEventListener('keydown', ev => { if (ev.key === 'Escape' && nav.classList.contains('is-open')) close(true); });
    document.addEventListener('click', ev => { if (!nav.contains(ev.target)) close(); });
    nav.addEventListener('focusout', () => { requestAnimationFrame(() => { if (!nav.contains(document.activeElement)) close(); }); });
    matchMedia('(min-width: 1101px)').addEventListener('change', ev => { if (ev.matches) close(); });
    const current = location.pathname.split('/').pop() || 'index.html';
    $$('.nav__links a', nav).forEach(a => { if (a.getAttribute('href') === current) a.setAttribute('aria-current', 'page'); });
  }
  const finder = $('[data-finder]');
  if (finder) {
    const pricing = $('[data-pricing]');
    const state = { live: true, hours: 20, email: false };
    const hours = $('[data-f-hours]', finder);
    const hoursOut = $('[data-f-hours-out]', finder);
    const hoursRow = $('[data-f-hours-row]', finder);
    const answer = $('[data-f-answer]', finder);

    const radio = (attr, key, parse) => {
      const buttons = $$(`[${attr}]`, finder);
      const choose = (b) => {
        buttons.forEach((x) => { x.setAttribute('aria-checked', String(x === b)); x.tabIndex = x === b ? 0 : -1; });
        state[key] = parse(b.getAttribute(attr));
        update();
      };
      buttons.forEach((b, i) => {
        b.tabIndex = b.getAttribute('aria-checked') === 'true' ? 0 : -1;
        b.addEventListener('click', () => choose(b));
        b.addEventListener('keydown', (ev) => {
          if (!['ArrowLeft', 'ArrowRight'].includes(ev.key)) return;
          ev.preventDefault();
          const next = buttons[(i + (ev.key === 'ArrowRight' ? 1 : buttons.length - 1)) % buttons.length];
          next.focus();
          choose(next);
        });
      });
    };
    radio('data-f-live', 'live', (v) => v === 'yes');
    radio('data-f-email', 'email', (v) => v === 'yes');
    hours.addEventListener('input', () => { state.hours = Number(hours.value); update(); });

    function update() {
      hoursOut.textContent = `${state.hours} h`;
      hours.style.setProperty('--p', `${(state.hours / Number(hours.max || 100)) * 100}%`);
      hours.disabled = !state.live;
      hoursRow.classList.toggle('is-muted', !state.live);

      let pick;
      let why;
      if (!state.live && !state.email) {
        pick = 'free';
        why = '10 link scans and 5 virus &amp; malware scans a week cover the odd link you&rsquo;re unsure about.';
      } else if (state.email || state.hours > 24) {
        // Fast live scanning has no weekly limit from Max up; Pro's is 24 hours.
        pick = 'max';
        why = state.email
          ? 'pasting emails in for a full scan is part of Max, fast live scanning has no weekly limit, and 24 hours a week of delicate scanning research every result.'
          : `at around ${state.hours} hours a week you&rsquo;d outgrow Pro&rsquo;s 24 hours of fast scanning. Max has no weekly limit on it, and 24 hours of delicate scanning. Ultimate raises delicate to 96.`;
      } else {
        pick = 'pro';
        why = `its 24 hours a week of fast live scanning cover your ${state.hours}, with 4 hours of delicate scanning for the searches that matter. Minutes only count while Sentinel is actually checking something.`;
      }
      answer.innerHTML = `<b>${{ free: 'Free', pro: 'Pro', max: 'Max', ultimate: 'Ultimate' }[pick]}</b> fits best. ${why.charAt(0).toUpperCase()}${why.slice(1)}`;

      $$('[data-plan-card]', pricing).forEach((card) => {
        const on = card.dataset.planCard === pick;
        card.classList.toggle('is-recommended', on);
        const badge = $('.plan__pick', card);
        if (on && !badge) card.insertAdjacentHTML('afterbegin', '<span class="plan__pick">Best for you</span>');
        if (!on && badge) badge.remove();
      });
      pricing.classList.add('has-pick');
    }
    update();
  }

})();
