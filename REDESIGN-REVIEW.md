# Afterimage — visual rebuild

The user rejected the prior design, reported no animation and asked to start over, then supplied Refs.Gallery's second 3D page. The gallery and live references were inspected in hidden local browser tabs. Optikka's sculptural material/motion and Max Yinger's assembling forms informed a fresh kinetic identity. Wonderland remains earlier research. No third-party code or artwork was copied, and aesthetic approval is not inferred from test results.

## Result

The old mask room, static posters and its motion loader are retired from the runtime. A fixed paper hero presents an original 112-part metal sculpture that turns, twists, opens and reforms. New typography, composition, controls, palette, section staging, mask specimens, process, pricing and footer carry the visual system through all nine pages. A moving editorial strip, floating specimens, section entrances and hover responses provide motion beyond the hero. Twelve newly coordinated short headlines vary on refresh while staying stable during reading.

The motion path now begins with Canvas 2D, using the same geometry as the WebGL sculpture. WebGL is a visual upgrade rather than a prerequisite for motion. A blocked bundle or unavailable graphics context retains an animated sculpture. New asset names avoid relying on cached versions of the retired engine. Animation uses elapsed wall time while active; a slow frame rate does not silently slow the animation clock.

Pause stops rendered movement and CSS loops. The control remains available with reduced motion, which starts still and offers an explicit Play choice. Session preference and the opt-in `?motion=on` preview are supported. Offscreen/hidden scenes stop work; returning with Back resumes correctly. GPU work uses an instanced object without a reflection pass or model fetch, capped pixel density and a 30 fps target. No universal performance claim is made.

## Preserved behavior

The local URL checker, saved-example tabs/replay/detail selection, every severity control, six-round game, twelve-message practice inbox, planned pricing/allowances, recommendation, recovery and legal pages remain. Themes work on the surrounding UI; the hero is deliberately paper-colored in every theme. Existing GLBs are unchanged. The preview still has no account, payment, upload, live-threat or installer service.

## Evidence

- 21 static/DOM regressions passed, including the actual local word-list engine and output/error handling.
- 90 page/theme/viewport checks passed, including small phone, tablet, desktop and landscape.
- Browser checks compared actual canvas pixels while playing and paused in both rendering paths; exercised blocked WebGL/bundle, reduced-motion Play, blocked session storage, browser Back and all interactive flows.
- All twelve copy variants fit the phone layout with the checker action in the first view. Refresh selection avoids immediate repetition when storage is available.
- Desktop, phone, fallback and product-section screenshots were inspected locally in background browsers.

The final handoff requires the rebuilt files on development `main`, successful Pages publishing, and motion verification on the deployed URL. The original `wyattbombara/sentinel` repository is outside the change. Live publication is reported separately after verification.
