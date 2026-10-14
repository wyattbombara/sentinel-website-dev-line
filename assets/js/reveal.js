/* A bounded pointer response; no idle animation, WebGL, or scroll interception. */
(() => {
  'use strict';
  const hero = document.querySelector('.hero--reveal');
  if (!hero) return;
  const scene = hero.querySelector('[data-scene]');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const pointer = matchMedia('(hover: hover) and (pointer: fine)');
  const dark = matchMedia('(prefers-color-scheme: dark)');
  const picture = scene.querySelector('picture');
  const image = picture.querySelector('img');
  const sources = [...picture.querySelectorAll('source')];
  const theme = () => {
    const explicit = document.documentElement.dataset.theme;
    const mode = explicit === 'light' || (!explicit && !dark.matches) ? 'light' : 'dark';
    const desktop = `assets/img/scene/sentinel-${mode}-desktop.webp`;
    const mobile = `assets/img/scene/sentinel-${mode}-portrait.webp`;
    if (image.getAttribute('src') !== desktop) image.src = desktop;
    sources.forEach(source => {
      const url = source.dataset.orientation === 'portrait' ? mobile : desktop;
      if (source.getAttribute('srcset') !== url) source.srcset = url;
    });
  };
  theme();
  new MutationObserver(theme).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
  dark.addEventListener('change', theme);
  const reset = () => { scene.style.setProperty('--scene-x','0px'); scene.style.setProperty('--scene-y','0px'); };
  reset();
  scene.addEventListener('scene-ready',reset);
  hero.addEventListener('pointermove', event => {
    if (hero.dataset.renderer==='ready' || document.hidden || reduced.matches || !pointer.matches || innerWidth < 801) return;
    const rect = hero.getBoundingClientRect();
    scene.style.setProperty('--scene-x', `${((event.clientX - rect.left) / rect.width - .5) * 12}px`);
    scene.style.setProperty('--scene-y', `${((event.clientY - rect.top) / rect.height - .5) * 8}px`);
  }, { passive: true });
  hero.addEventListener('pointerleave', reset);
  reduced.addEventListener('change', reset);
  document.addEventListener('visibilitychange', () => { if (document.hidden) reset(); });
})();
