# Sentinel website — independent development line

This repository is the private, independent website development copy of `wyattbombara/sentinel`. It started from the exact source commit `0e1f862fd55052bd8902d4c06ac0535a4868ca89`. The original repository holds generated build output; **this development line is edited independently**. Do not run the upstream publishing script against this repository or deploy these changes to production without a separate request.

## Product status

This is a static HTML/CSS/vanilla JavaScript product preview. No API, account service, checkout, file-upload service, live protection or downloadable installer is connected here. The URL checker runs the bundled address engine locally and fetches only its bundled word list. It does not visit the submitted URL, inspect its page, or query live threat lists. Example search verdicts are saved snapshots.

The pricing cards preserve the original planned monthly prices and allowances: Free $0, Pro $15, Max $40, Ultimate $100. Paid plans are disabled. The download page fails closed in its HTML and script; it does not distribute unverified installers or browser companions.

## Development

The site needs no build step or runtime packages. Serve this directory with any static server, for example:

```sh
python3 -m http.server 8765 --bind 127.0.0.1
```

Open `http://127.0.0.1:8765/index.html`. Use an HTTP server so the local word-list fetch works; do not use `file://` for interaction review.

Styles are in `assets/css/sentinel.css` (component foundations), `interactive.css` (demo behavior), `practice.css` (practice inbox), and `redesign.css` (shared visual system and responsive layouts). Self-hosted Geist and Instrument Serif fonts and existing WebP mask art retain the Sentinel brand. No Blender or new 3D renderer is required.

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

The runner starts a loopback-only server, checks all nine pages at 375, 768, 1024, 1440 and landscape 812px in both themes, exercises real browser interactions, checks runtime errors/overflow, and writes screenshots plus a report to ignored `test-results/`. Set `SENTINEL_BASE_URL` to test an already running preview. The private development workflow runs validation only; the inherited GitHub Pages deployment workflow was removed.

See [REDESIGN-REVIEW.md](REDESIGN-REVIEW.md) for changes, validation evidence and remaining review limits.
