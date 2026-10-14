/* Coordinated copy, chosen once per navigation. Never rotates while being read. */
(function (root) {
  'use strict';
  const presets = [
    ['Look past', 'the disguise.', 'Familiar isn’t always trustworthy.', 'A familiar name. An unfamiliar address. See the warning signs before you decide what to trust.'],
    ['Look closer.', 'Click wiser.', 'A second look can change the story.', 'Before you follow a link, look at where it actually leads. Start with an address check in your browser.'],
    ['Trust less.', 'Know more.', 'Confidence starts with a question.', 'A logo can look right while an address tells another story. Examine the details before your next click.'],
    ['Spot the fake.', 'Keep control.', 'Don’t let familiar do the thinking.', 'Unexpected urgency. A changed domain. An unusual download. Learn to recognise what deserves another look.'],
    ['Pause first.', 'See clearly.', 'You set the pace.', 'You don’t have to act on a message’s deadline. Take a moment, inspect the address, and choose your next move.'],
    ['Read the link.', 'Not the logo.', 'The address has a story to tell.', 'Brand names are easy to imitate. Check the actual domain and the warning signs hiding in plain sight.'],
    ['Question it.', 'Then decide.', 'A warning should come with a reason.', 'Explore the evidence in saved examples, or check an address locally. Understand the signs before deciding.'],
    ['Familiar face.', 'Hidden risk.', 'Appearances aren’t evidence.', 'A convincing message can lead somewhere unexpected. Look beyond the surface and inspect what you can verify.'],
    ['Skip the trap.', 'Keep moving.', 'Make room for a better next step.', 'Learn the patterns behind misleading addresses, then practise spotting them before they ask for your trust.'],
    ['See the signs.', 'Make the call.', 'Less guessing. More understanding.', 'Get an explanation of the warning signs in an address. No visit to the site and no account required.'],
    ['Unmask it.', 'Stay alert.', 'A clearer view starts here.', 'Look at the address behind a promise. Use the local checker and example walkthroughs to sharpen your judgement.'],
    ['Before trust,', 'look closer.', 'Take a moment before the next click.', 'Unexpected links deserve a little attention. Inspect the address, read the explanation, and decide for yourself.']
  ].map(([first, second, eyebrow, description]) => ({ first, second, eyebrow, description }));
  function choose(previous, random = Math.random) {
    const valid = Number.isInteger(previous) && previous >= 0 && previous < presets.length;
    const count = presets.length - (valid ? 1 : 0);
    const pick = Math.min(count - 1, Math.max(0, Math.floor(random() * count)));
    return valid && pick >= previous ? pick + 1 : pick;
  }
  if (typeof module !== 'undefined' && module.exports) { module.exports = { presets, choose }; return; }
  const hero = document.querySelector('.hero--reveal');
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
  hero.dataset.copySize = Math.max(copy.first.length,copy.second.length)>12?'long':'regular';
  try { sessionStorage.setItem('sentinel:hero-preset', String(index)); } catch { /* The page remains usable. */ }
})(typeof window !== 'undefined' ? window : globalThis);
