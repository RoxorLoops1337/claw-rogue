# Clawbound · The Sunken Vault

A complete, dependency-free browser roguelike built around a physical claw machine.

**Play:** https://roxorloops1337.github.io/claw-rogue/

Drag the glass or hold the arrow buttons to aim. Press Grab to scoop. Keyboard: A/D or arrows, Space to grab, Escape to pause. Only treasures that fall through the left delivery chute apply their effects. Sound can be toggled in the header.

## The expedition

- Twelve chambers across the Verdant Works, Prism Mines, and Astral Vault, with guardians in chambers 4, 8, and 12.
- Enemies telegraph strikes, heavy attacks, armour, and repairs before each drop.
- Choose capped upgrades after victories. Elite routes grant two upgrades and extra coins.
- Choose roads, elite treasuries, sanctuaries, and merchants between chambers.
- Spend coins on repairs, upgrades, or emergency drops. Build around swords, sparks, shields, healing, scrap, or large hauls.
- Win or retire an expedition to bank embers for permanent workshop improvements. Unlock Warden and Stormsmith loadouts through play.
- Full run state—including moving loot and the claw—is saved automatically on this device. Continue from the title screen. Saves use browser storage; clearing site data removes them.

## Physics and art

Free circle bodies collide with articulated moving capsule jaws. Contact impulses, friction, spin, and gravity carry the load; items are never attached to an invisible basket. Floor contact supports natural rolling. Widening the claw changes its geometry, while grip upgrades change contact friction. The mobile canvas keeps its aspect ratio so balls remain circular.

Original resolution-independent canvas art includes a brass/enamel salvager, illustrated creatures, distinct guardian details, and three dungeon palettes. Procedural sound has no network dependencies.

Inspired by the author's [Claw Crawl](https://games-71g.pages.dev/claw_crawl/).

## Development and verification

No build step. Serve the directory with `python3 -m http.server`.

- `game.js`: controls, campaign integration, combat, menus, audio, saving, frame loop
- `physics.js`: sequential contact impulse solver
- `progression.js`: campaign data, upgrades, economy, validated persistence
- `art.js`: canvas artwork
- `styles.css`: responsive layout
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
