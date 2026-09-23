# Clawbound

A mobile-first browser roguelike built around a claw machine. Formerly Claw Rogue.

**Play:** https://roxorloops1337.github.io/claw-rogue/

Your robot fights at the top of the screen while you scoop items from the machine below. Drag across the glass or hold the arrow buttons to aim; press Grab to collect up to five items in one scoop. Keyboard controls are A/D or arrows, Space to grab, Escape to pause.

## Loot and progression

- Swords deal 4 damage, sparks deal 6, and scrap deals 1.
- Shields add 4 block; hearts restore 3 health.
- Coins buy extra drops when you run out.
- Clear a floor to choose an upgrade. Bigger claws widen the scoop and increase capacity. Other upgrades improve damage, shields, health, or the number of drops.
- Ten floors, with bosses on floors 5 and 10.

## Run locally

Open `index.html` in a modern browser. No build step or external dependencies. All illustrations are drawn on canvas. The layout adapts to phone height and includes safe-area padding.

## Physics

The pile uses circle collisions and gravity. The articulated claw pushes items as it descends and closes. Capture is determined geometrically within its scoop and limited by capacity; captured items continue colliding inside the carrying area. This is an arcade simulation, not a full rigid-body gripping solver.

## Validation

Checked syntax, pile containment, 16 full grab cycles, mixed five-item combat effects, room progression, claw upgrades, pause, defeat/restart, and purchasing extra drops. Best floor is saved locally; in-progress runs are not persisted.
