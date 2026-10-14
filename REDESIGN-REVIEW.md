# Sentinel / The Evidence Room

The user rejected the earlier still-mask and subtle-motion presentations and supplied [Wonderland](https://wonderlandams.com/) as the new reference. The reference was inspected directly in a hidden local browser, including the gallery's opening, scroll-driven camera and suspended exhibits. The borrowed principles are spatial depth, visible movement, sparse navigation and exhibits staged as a place. All Sentinel architecture, exhibit graphics, lighting and motion are authored locally; no Wonderland code or artwork is included.

The homepage now opens in a real-time architectural evidence room with successive lit frames, a reflective floor, original typographic exhibits and a rotating mask. A scan travels through the room, the camera drifts and responds to native scroll and the pointer, and the mask turns through a full revolution in approximately fifteen active seconds. The editorial strip, section entrances, button arrows and exhibit hover responses continue the motion elsewhere. The twelve coordinated refresh-copy presets remain; copy stays stable while reading and storage prevents an immediate repeat on refresh when available.

The scene is a progressive enhancement. Matching desktop and portrait posters cover reduced motion, data saving and graphics failure; visible headings and working actions remain if artwork fails. Pause controls both 3D and CSS motion. GPU work stops when the hero is offscreen or the page is hidden, pixel density is capped, and animation targets at most 30 fps. These are implementation limits, not a claim of measured performance on every device. The gallery keeps a dark palette in both themes; the surrounding UI supports Auto, Light and Dark.

All nine pages share the revised typography, numbered navigation, more open spacing, architectural dividers and section entrances. The local URL checker, example search selection/replay, all severity controls, six-round game, twelve-message practice inbox, pricing recommendation and recovery checklist are retained. The checker still examines the address locally and does not visit the submitted URL. Search verdicts remain saved examples. Monthly plan prices/allowances are unchanged; accounts, payments, uploads, live protection and downloads remain unavailable.

## Source and delivery

- Working branch: `redesign/sentinel-reveal` in `wyattbombara/sentinel-website-dev-line` only.
- Runtime scene: `design/hero-scene.mjs`; `npm run build:hero` regenerates the bundled asset and linked license notices.
- Motion coordination: `assets/js/gallery.js`; visual system: `assets/css/reveal.css`.
- Poster regeneration: `design/capture-posters.cjs`, then `design/prepare-posters.py`; manifest: `design/asset-manifest.json`.
- The existing `scam.glb`, `virus.glb` and `malware.glb` files are preserved. The prior Blender study remains as editable design history, not the current runtime renderer.
- Publishing a draft branch alone does not update `main`. The requested delivery is this development repository's main version; its separate Pages workflow validates and publishes that repository. Production `wyattbombara/sentinel` is outside this change.

## Validation

The 21 static/DOM regression checks cover the actual local engine, invalid-input recovery, theme/menu controls, pricing, examples, severities, practice, game and recovery. Rendered checks cover nine pages, five viewport sizes and both themes, plus normal/reduced motion, real moving/paused canvas images, all copy presets, refresh variation, no JavaScript and unavailable WebGL. Review screenshots and the JSON report are generated under ignored `test-results/`.

Visual review is performed in headless local browsers without taking desktop focus. These checks establish functional and layout behavior; aesthetic acceptance remains the user's decision.
