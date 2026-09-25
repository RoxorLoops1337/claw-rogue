# Release verification — 25 September 2026

Game release: 1.0.0. Native build input: commit `45f61936aafb1eaf9f9fb24f351cbcb3cb28a484`.

## Implemented

Reference-inspired compound loot physics, independently compliant claw fingers, manual closing depth, drag-release controls, generated painted vault/character assets, shape-matched loot, mobile typography and buttons, combat effects, sound cues, twelve chambers, three guardians, route choices, shops, capped upgrades, workshop progression, unlockable machines, and saved runs. Native projects bundle all assets; the browser edition includes atomic offline caching.

## Checks completed

- Physics: compound contact torque, shaped containment, rolling, frictional carry, free release, pile stability, divider and chute behavior.
- Controls: manual closing preserves depth and spends one drop; tap aims; drag-release waits for carriage arrival; cancelled gestures never drop; pause freezes simulation.
- Progression: twelve-chamber transitions, elite rewards, shops, victory/loss, guarded enemies, repairs, capped upgrades, workshop unlocks, and duplicate reward protection.
- Persistence: mid-grab restore, malformed save rejection, storage quota failure handling, and legacy circle-save compatibility.
- Ten independently seeded center scoops delivered 2–6 physical items, averaging 4.6. No attachments or artificial catch selection are used.
- Five heuristic campaigns using actual physical grabs produced four victories and one loss at chamber eight, with no softlocks. These are automated reachability checks, not a human difficulty study.
- Browser previews at 320×568, 360×640, and 390×844 showed visible controls, preserved loot geometry, and undistorted painted characters after the final compact-layout correction. These are browser viewport checks, not physical-device tests.
- Full npm audit: zero reported vulnerabilities after the scoped development-tool dependency patch.
- Android release AAB successfully compiled in GitHub Actions.
- iOS Release archive successfully compiled using Xcode on macOS, without signing.

Build logs and downloadable unsigned artifacts: https://github.com/RoxorLoops1337/claw-rogue/actions/runs/36075866303

Artifacts are retained for 14 days by the workflow and can be regenerated from source. The update launcher added in the next commit only migrates the browser service worker; it is excluded from native asset bundles.

## Outstanding store acceptance

Neither package is signed or submitted. The owner must supply developer-account signing and final publisher/store choices. Test the signed releases on physical Android and iOS phones, including offline cold launch, touch feel, sustained frame rate, audio interruptions, safe areas, force-quit save recovery, and a complete campaign. Capture listing screenshots from those binaries. iOS/Android compilation and browser previews do not establish store approval or device acceptance.
