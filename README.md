# Clawbound · The Sunken Vault

A complete, dependency-free browser roguelike built around a physical claw machine.

**Play:** https://roxorloops1337.github.io/claw-rogue/

Drag and release on the glass to aim and grab, or hold the arrow buttons and press Grab. Tap Close Now during descent to select your scoop depth. You can queue the next aim during delivery. Keyboard: A/D or arrows, Space to grab, Escape to pause. Only treasures that fall through the left delivery chute apply their effects. Sound can be toggled in the header.

## The expedition

- Twelve chambers across the Verdant Works, Prism Mines, and Astral Vault, with guardians in chambers 4, 8, and 12.
- Enemies telegraph strikes, heavy attacks, armour, and repairs before each drop.
- Choose capped upgrades after victories. Elite routes grant two upgrades and extra coins.
- Choose roads, elite treasuries, sanctuaries, and merchants between chambers.
- Spend coins on repairs, upgrades, or emergency drops. Build around swords, sparks, shields, healing, scrap, or large hauls.
- Win or retire an expedition to bank embers for permanent workshop improvements. Unlock Warden and Stormsmith loadouts through play.
- Full run state—including moving loot and the claw—is saved automatically on this device. Continue from the title screen. Saves use browser storage; clearing site data removes them.

## Physics and art

Compound rigid bodies give swords and vials long silhouettes, while shields and scrap have rounded clusters. Each articulated finger slows independently under contact pressure, wrapping around the pile as it settles. Contact impulses, friction, spin, and gravity carry the load; items are never attached to an invisible basket. Floor contact supports natural rolling. Widening the claw changes its geometry, while grip upgrades change contact friction. The mobile canvas keeps its aspect ratio so balls remain circular.

An original sculpted enamel-and-brass art direction unifies eight generated characters, the vault, the claw, physical loot, and 23 custom interface icons. Characters have distinct idle, attack, recoil and defeat animation; loot triggers material-specific projectiles and impact effects. Self-hosted Manrope and Barlow Condensed typefaces and tactile gold controls work offline. The current art bible and generation prompts are in `assets/art-v4/PROMPTS.md`; font licenses are under `fonts/`. Procedural sound has no network dependencies. Reduced-motion preferences are respected.

Inspired by the author's [Claw Crawl](https://games-71g.pages.dev/claw_crawl/).

## Development and verification

No build step. Serve the directory with `python3 -m http.server`.

- `game.js`: controls, campaign integration, combat, menus, audio, saving, frame loop
- `physics.js`: sequential contact impulse solver
- `progression.js`: campaign data, upgrades, economy, validated persistence
- `art.js`: sculpted sprites, character animation, vault scenery, and canvas fallback
- `icons.js`: shared original interface icon system
- `loot.js`: shape-matched loot illustration
- `styles.css`: responsive layout and shared typography/material system
- `tests/mobile.html`: phone-size browser preview

Run:

```sh
node tests/physics.test.cjs
node tests/progression.test.cjs
node tests/game.test.cjs
node tests/campaign.test.cjs
node tests/balance.cjs
```

Physics tests cover rolling, free release, actual moving-surface carry, pile stability, and chute/divider collisions. Integration checks cover physical grabs, empty grabs, pause, full campaign transitions, elite rewards, shops, armour, repairs, victory, and reloading mid-grab. Persistence tests cover malformed saves, quota errors, upgrade caps, unlocks, and duplicate reward prevention.

The campaign transition test injects defeats to isolate progression logic; the balance script runs actual physical grabs. Automated checks and desktop phone-size previews do not replace testing on physical Android and iOS devices.

Current release verification: [1.1.0 visual release](release/VALIDATION_V4.md).

## Native release

Android and iOS source projects, icons, offline asset bundling, a privacy page, and a release build workflow are included. See [the native release guide](release/STORE_RELEASE.md) for packaging status and signing. The web game installs as a PWA and caches its complete asset revision for offline play. Native apps bundle assets directly.
