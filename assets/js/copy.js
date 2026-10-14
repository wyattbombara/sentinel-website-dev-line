/* Coordinated copy, chosen once per navigation. Never rotates while being read. */
(function (root) {
  'use strict';
  const presets = [
    ["Look", "again.", "Familiar isn’t always trustworthy.", "A second look can change the story. Understand the address before you decide what to trust."],
    ["Stay", "curious.", "Your attention is worth protecting.", "A convincing message can lead somewhere unexpected. Look beyond the familiar and inspect the details."],
    ["See", "through.", "Appearances aren’t evidence.", "Look at the address behind a promise. Use the local checker to understand the warning signs."],
    ["Pause.", "Then click.", "You set the pace.", "You don’t have to act on a message’s deadline. Inspect the address and choose your next move."],
    ["Spot", "the fake.", "Don’t let familiar do the thinking.", "A familiar name. An unfamiliar address. Learn what deserves a closer look before you follow it."],
    ["Read", "the link.", "The address has a story to tell.", "Brand names are easy to imitate. Check the actual domain and the signs hiding in plain sight."],
    ["Keep", "control.", "Make room for a better next step.", "Explore the evidence in saved examples, or check an address locally. Decide with a clearer view."],
    ["Trust", "with care.", "Confidence starts with a question.", "A logo can look right while an address tells another story. Examine the details before your next click."],
    ["Choose", "clarity.", "Less guessing. More understanding.", "Get an explanation of the warning signs in an address. No visit to the site and no account required."],
    ["Think", "twice.", "A moment can change the outcome.", "Unexpected urgency. A changed domain. An unusual download. Know the patterns before they ask for your trust."],
    ["Find", "the signs.", "A warning should come with a reason.", "Use the local checker and example walkthroughs to sharpen your judgement and keep the next move yours."],
    ["Click", "wiser.", "A clearer view starts here.", "Inspect the address, read the explanation, and decide for yourself. A little attention goes a long way."]
  ].map(([first, second, eyebrow, description]) => ({ first, second, eyebrow, description }));
  function choose(previous, random = Math.random) {
    const valid = Number.isInteger(previous) && previous >= 0 && previous < presets.length;
    const count = presets.length - (valid ? 1 : 0);
    const pick = Math.min(count - 1, Math.max(0, Math.floor(random() * count)));
    return valid && pick >= previous ? pick + 1 : pick;
  }
  if (typeof module !== 'undefined' && module.exports) { module.exports = { presets, choose }; return; }
  const hero = document.querySelector('[data-kinetic-hero]');
  if (!hero) return;
  let previous = null;
  try { const saved = sessionStorage.getItem('sentinel:hero-preset'); if (saved !== null && /^\d+$/.test(saved)) previous = Number(saved); } catch { /* Random choice still works without storage. */ }
  const index = choose(previous);
  const copy = presets[index];
  hero.querySelector('[data-copy-first]').textContent = copy.first;
  hero.querySelector('[data-copy-second]').textContent = copy.second;
  hero.querySelector('.eyebrow').textContent = copy.eyebrow;
  hero.querySelector('.hero__lede').textContent = copy.description;
  hero.dataset.copyPreset = String(index);
  hero.dataset.copySize = Math.max(copy.first.length,copy.second.length)>8?'long':'regular';
  try { sessionStorage.setItem('sentinel:hero-preset', String(index)); } catch { /* The page remains usable. */ }
})(typeof window !== 'undefined' ? window : globalThis);
