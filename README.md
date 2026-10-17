# Sentinel — independent development website

This is the independent development copy of `wyattbombara/sentinel`, originally based on `0e1f862fd55052bd8902d4c06ac0535a4868ca89`. The original repository holds generated output and is outside this development workflow. Do not run the original publishing script or deploy to production without a separate request. This repository was verified public on October 14, 2026; the redesign does not change its audience.

## Current presentation

The October 16 signature pass takes visual reference from the main [Sentinel site](https://wyattbombara.github.io/sentinel/) and [repository](https://github.com/wyattbombara/sentinel) at `1c64ad8`: graphite/gold, mask identity, serif accents and measured drawings. It merges no main-line branch and preserves the independent development workflow. The earlier clarity pass adds an annotated domain study and dark evidence exhibit. See [CHANGELOG.md](CHANGELOG.md). The homepage build marker is `signature-2026-10-16`.

The **Afterimage** visual rebuild replaces the old mask room with an original kinetic sculpture: 112 metal plates twist, open, separate and reform. It draws on the sculptural/material and modular-motion ideas observed in [Optikka](https://optikka.com/) and [Max Yinger](https://yinger.dev/), discovered through the user's [3D gallery](https://refs.gallery/category/3d?page=2). No reference code or media was copied.

Animation starts in a small Canvas 2D renderer, then upgrades to an instanced Three.js renderer. Both use the same authored geometry and keep moving if WebGL or its bundle fails. There is no model download, heavy room, reflection pass or poster dependency. The first view uses a fixed paper palette; the product tools support automatic, light and dark themes. New asset filenames keep the new renderer separate from cached older versions.

The visible motion control can pause/play both engines and CSS loops. Reduced motion starts still with a visible Play option. An explicit choice persists for the browser session; `?motion=on` is an opt-in motion preview. Animation pauses offscreen and when the document is hidden, resumes after browser back navigation, caps pixel density, and targets at most 30 fps. Performance on every device is not claimed.

Twelve short, coordinated copy presets choose on navigation and stay stable while reading. Session storage excludes the immediately previous preset on refresh; blocked storage retains random selection without that cross-load guarantee.

## Product boundaries

This is a static HTML/CSS/JavaScript preview. The local address checker does not visit the submitted URL, inspect its page or query live threat lists. Example verdicts are saved snapshots. Search selection/replay, severity controls, the six-round game, twelve-message practice inbox, pricing recommendation, recovery checklist and legal pages remain available. Planned monthly prices/allowances remain Free $0, Pro $15, Max $40, Ultimate $100. Accounts, payments, uploads, live protection and installers are not connected.

## Development

Serve this directory over HTTP, for example `python -m http.server 8765 --bind 127.0.0.1`, and open `/index.html`. The committed site needs no build to serve.

- `assets/css/afterimage.css`: current visual system; `sentinel.css`, `interactive.css`, `practice.css` and `redesign.css` retain product layout/component foundations.
- `assets/js/form.js`: shared procedural geometry.
- `assets/js/kinetic.js`: motion state, animated fallback, renderer upgrade, visibility and section entrances.
- `design/afterimage-scene.mjs`: editable Three.js renderer. Run `npm ci`, then `npm run build:hero` to regenerate `assets/js/afterimage-scene.js` and its license notice.
- `assets/js/copy.js`: coordinated copy selection.
- `design/capture-form.cjs`: export an optional local study frame from a running preview. Earlier Blender sources and scene posters remain as design history, not current runtime dependencies.

All runtime assets are self-hosted. Existing supplied GLBs are unchanged. Third-party licensing is retained beside the bundle.

## Validation and publishing

`npm test` runs 21 static/DOM regressions. `npm run test:browser` runs all nine pages at five viewport sizes in both themes, then verifies actual changing/paused images in both renderers, reduced-motion opt-in, blocked storage, back navigation, copy variants and interactive tools. It starts its own loopback server and writes review screenshots/report under ignored `test-results/`. Set `SENTINEL_CHROMIUM` for an existing Chromium executable or `SENTINEL_BASE_URL` for a running preview.

`static.yml` validates changes. `pages.yml` validates and publishes this independent repository on changes to `main`; draft-branch pushes alone do not update the live site. Only runtime HTML/assets are packaged. Current build marker: `afterimage-2026-10-14`. See [REDESIGN-REVIEW.md](REDESIGN-REVIEW.md).
