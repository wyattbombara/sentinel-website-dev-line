/* This independent preview does not distribute or verify a release. Fail closed even without JavaScript. */
(() => {
  'use strict';
  const button = document.querySelector('[data-installer]');
  if (!button) return;
  button.removeAttribute('href');
  button.setAttribute('aria-disabled', 'true');
  button.setAttribute('tabindex', '-1');
  button.classList.add('is-soon');
})();
