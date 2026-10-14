# Sentinel website — independent development line

This repository is the independent website development copy of `wyattbombara/sentinel`. It started from the exact source commit `0e1f862fd55052bd8902d4c06ac0535a4868ca89`. The original repository holds generated build output; **this development line is edited independently**. Do not run the upstream publishing script against this repository or deploy these changes to production without a separate request. Repository visibility was public when verified on October 14, 2026; that setting is not managed by this redesign.

## Product status

This is a static HTML/CSS/vanilla JavaScript product preview. No API, account service, checkout, file-upload service, live protection or downloadable installer is connected here. The URL checker runs the bundled address engine locally and fetches only its bundled word list. It does not visit the submitted URL, inspect its page, or query live threat lists. Example search verdicts are saved snapshots.

The pricing cards preserve the original planned monthly prices and allowances: Free $0, Pro $15, Max $40, Ultimate $100. Paid plans are disabled. The download page fails closed in its HTML and script; it does not distribute unverified installers or browser companions.

## Development

The site needs no build step or runtime packages. Serve this directory with any static server, for example:

```sh
python3 -m http.server 8765 --bind 127.0.0.1
```

Open `http://127.0.0.1:8765/index.html`. Use an HTTP server so the local word-list fetch works; do not use `file://` for interaction review.

Styles are in `assets/css/sentinel.css` (component foundations), `interactive.css` (demo behavior), `practice.css` (practice inbox), `redesign.css` (shared layouts), and `reveal.css` (The Evidence Room art direction). Inspired by Wonderland's spatial gallery, the hero is an original self-hosted Three.js room: repeated architectural frames, a reflective floor, suspended typographic exhibits, a rotating mask, a traveling scan and a moving camera. The runtime targets at most 30 fps and caps pixel density. Motion pauses when the hero is offscreen, the page is hidden, or the visitor presses Pause. Reduced motion, data saving and unavailable WebGL retain a matching responsive poster.

`assets/js/gallery.js` coordinates the motion control independently of WebGL, the moving editorial strip, and section entrances across the nine pages. Native scrolling remains intact. Hover responses and section entrances carry motion into the product tools; content and actions remain visible without JavaScript. The art-directed gallery stays dark in both themes; the surrounding interface follows the selected theme.

The headline, eyebrow, and description choose from twelve coordinated presets on navigation. Session storage excludes the immediately previous choice on refresh. Copy stays stable while reading, and a complete default remains without JavaScript. If storage is blocked, random selection still works but immediate repetition cannot be excluded across separate document loads.

Editable runtime source is `design/hero-scene.mjs`. After `npm ci`, run `npm run build:hero` to regenerate the bundled script. The shipped website has no package installation or build requirement. Third-party runtime licensing is included beside the bundle.

To regenerate fallback artwork, serve the site locally, run `node design/capture-posters.cjs`, then run `python design/prepare-posters.py` with Pillow installed. Set `SENTINEL_BASE_URL` if the server is not on port 8765. The capture uses software rendering and the exact runtime scene; compression records four WebP sizes in `design/asset-manifest.json`. Raw PNG captures stay local and are ignored by Git. The earlier Blender composition study remains in `design/sentinel-reveal.blend`; its `render-scene.py` writes separate study renders rather than replacing current runtime artwork.

For an existing local Chromium installation, `SENTINEL_CHROMIUM` can point the browser checks at its executable. The checks run headlessly and do not control an interactive browser.

## Checks

Node 22 is recommended. The dependency-free checks run without installing packages:

```sh
npm run test:static
```

For the DOM interaction checks:

```sh
npm ci
npm test
```

These execute the real exported scripts against actual page markup using LinkeDOM. They cover theme cycling (including blocked storage), navigation, pricing recommendations, search tabs/replay/result details, severity controls/cycling, local scan outcomes/errors, the six-round game, the twelve-message inbox, and the recovery checklist. They are **not rendered browser tests**.

For browser review in a supported local/CI environment:

```sh
npx playwright install --with-deps chromium
npm run test:browser
```

The runner starts a loopback-only server, checks all nine pages at 375, 768, 1024, 1440 and landscape 812px in both themes, exercises real browser interactions, checks runtime errors/overflow, and writes screenshots plus a report to ignored `test-results/`. It compares rendered canvas images to verify motion and pause, and checks CSS motion without WebGL. Set `SENTINEL_BASE_URL` to test an already running preview.

`static.yml` validates branches and pull requests. `pages.yml` publishes only this independent development repository when `main` changes, or on manual dispatch. A draft pull request does not update the repository's main version or its Pages preview. The Pages workflow runs validation before packaging only HTML and runtime assets; authored source, node_modules and local review files are excluded.

See [REDESIGN-REVIEW.md](REDESIGN-REVIEW.md) for changes, validation evidence and remaining review limits.
