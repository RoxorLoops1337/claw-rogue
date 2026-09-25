# Clawbound 1.1.0 — visual release verification

25 September 2026. Native build number: 2. Verified game commit: `9329ed1965037fec8ad0334a5132f423518938ed`.

## Implemented

Five specialist passes cover interface/typography, original character art, animation, combat feedback, and integration QA. Eight original generated sculpted characters and a vault share ivory enamel, brass, teal lighting, and readable silhouettes. Matching loot, claw materials, 23 original SVG interface symbols, and self-hosted Manrope/Barlow Condensed fonts carry the style through play, title, rewards, workshop, and pause screens. Prompts and provenance are in `assets/art-v4/PROMPTS.md`; font licenses are bundled.

Distinct creature motion, attacks, recoil, grounded shadows, hit flashes, death poses, projectiles, collection bursts and readable combined damage feedback are integrated. Visual randomness is separate from gameplay randomness, effects are capped, and reduced-motion preferences are respected. Startup waits for artwork or a bounded loading fallback without resetting an active run.

## Verification

- Physics, progression, game integration, and twelve-chamber campaign suites pass on the final code.
- Contact-only carries, free release, compliant fingers, empty grabs, manual closing, drag-release, cancelled gestures, pause, capped rewards, shops, victory, and mid-grab save restoration remain covered.
- Live browser play cleared a first chamber, selected an upgrade and elite route, and resumed chamber two across the release update.
- Browser viewport checks: 320×568, 360×640, 393×852, and 430×932. Controls fit without horizontal overflow; machine canvas preserves its aspect ratio and status text sits below combat art on compact screens.
- Final 320×568 pause dialog: 472px tall, no internal overflow. Final menu icons render at their intended 24px/18px sizes.
- Final live game inspection showed no page JavaScript errors. Browser-extension diagnostics were excluded.
- All eight sprites were inspected on the dark game palette; individual animations and combat effects were reviewed visually.
- Offline revision `1fc171509a154705` contains 32 files. Native bundle contains 37 local assets, approximately 1.14 MiB, including fonts, artwork and interface icons.
- Android unsigned release AAB and iOS unsigned Release archive both compile successfully in GitHub Actions.

Native build logs/artifacts: https://github.com/RoxorLoops1337/claw-rogue/actions/runs/36193951104

Playable release: https://roxorloops1337.github.io/claw-rogue/?v=20260925-4

These are automated checks and browser viewport observations. Store signing, physical-device acceptance, and store submission are still outstanding as described in `STORE_RELEASE.md`; compilation does not establish store approval. Workflow artifacts expire after 14 days and can be regenerated from source.
