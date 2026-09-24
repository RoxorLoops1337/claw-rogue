# Clawbound

A mobile browser roguelike built around a physical claw machine. Formerly Claw Rogue.

**Main branch game:** https://roxorloops1337.github.io/claw-rogue/

Your robot fights above the machine. Drag across the glass or hold the arrow buttons to aim; press Grab to lower the claw. Keyboard: A/D or arrows to aim, Space to grab, Escape to pause. The sound button mutes mechanical and collection cues.

## Physical grip and delivery

The jaws and the items share a continuous contact simulation. Items are never attached to the claw or placed in an invisible carrying box. Moving fingers transfer velocity through contact; friction helps support the load, and loose items can slip. The claw closes when its hub reaches the pile, lifts, moves left, opens over the chute, and returns to its previous aim.

Only an item that falls through the visible prize chute applies its effect. A wider claw changes the actual jaw geometry. Rubber grips increase contact friction. The displayed scoop count is approximate while carrying; it is not a hard capacity limit.

This approach was informed by the author's [Claw Crawl](https://games-71g.pages.dev/claw_crawl/) and its [source](https://github.com/RoxorLoops1337/Games/blob/main/claw_crawl/index.html).

## Loot and progression

- Swords deal 4 damage, sparks deal 6, and scrap deals 1.
- Shields add 4 block; hearts restore 3 health.
- Coins buy extra drops when you run out.
- Clear a floor to choose an upgrade: wider jaws, more friction, damage, block, health, or drops.
- Ten floors, with bosses on floors 5 and 10.
- Best floor and mute preference are saved on this device. In-progress runs are not persisted.

## Development

No build step or external runtime dependencies. Open `index.html`, or serve the directory with `python3 -m http.server`.

- `index.html`: accessible controls and layout
- `styles.css`: responsive presentation
- `game.js`: run state, input, audio, combat, rendering
- `physics.js`: fixed-substep contact solver for circle bodies and moving capsule jaws

Run `node tests/game.test.cjs` for deterministic integration checks of the actual game code: edge/center grabs, physical delivery accounting, containment, upgraded jaws, empty grabs and pause/resume. Run `node --check game.js` and `node --check physics.js` for syntax validation.

The physics is a 2D arcade approximation. These automated checks do not substitute for real-device touch, visual and performance testing.
