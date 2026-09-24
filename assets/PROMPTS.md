# Generated artwork, version 3

Created with the built-in image generator. These are production game assets, not UI mockups. Original generated PNGs were encoded to WebP with Sharp, preserving atlas alpha. No generated art is used for collision geometry.

- `characters-v3.webp`: 1064 × 532, transparent atlas, 212,264 bytes. Eight individual reviewed source rectangles in `art.js` account for irregular spacing in the generated sheet.
- `vault-v3.webp`: 1008 × 432, 65,380 bytes. Battle environment.
- Art loads asynchronously and falls back to original vector rendering on errors. `ClawArt.ready` resolves after both attempts, allowing static preview canvases to redraw.

## Character atlas prompt

Use case: stylized-concept.
Asset type: one production-ready transparent sprite atlas for a mobile fantasy roguelike game, not a mockup.
Create a precisely arranged 4-column by 2-row atlas, eight equally sized square cells on a wide 2:1 canvas. Exactly one complete full-body character per cell, centered horizontally, feet baseline at 87% of cell height. Leave at least 12% transparent gutter on all four edges of every cell. No character, glow, shadow or weapon crosses a cell edge. No labels, borders, UI, scenery, lettering, watermarks. Actual transparent background, clean preserved alpha.
Characters in exact reading order: top row: (1) charming articulated antique brass robot adventurer facing right, glowing teal eyes and core, rust-red scarf, compact gripping hands and boots; (2) glossy moss-green slime facing left with two leaf sprouts and playful fierce face; (3) ochre armored beetle bandit facing left with six legs and curved feelers; (4) floating hooded violet prism ghost facing left with clear spectral silhouette. Bottom row: (5) turquoise faceted crystal golem facing left with broad angular limbs; (6) ancient mossy root guardian facing left, towering wooden armor, branching antlers and emerald crystal heart; (7) violet prism guardian facing left with dramatic purple crystal shoulder fans, crystal crown and luminous lilac eyes; (8) golden astral guardian facing left, ancient sun-metal armor, halo-ring behind head and brilliant starlight heart.
Style: richly handpainted premium fantasy mobile game, expressive readable silhouettes, stylized proportional forms, tactile brushed brass, enamel, carved wood and glowing crystalline materials. Beautiful painterly shading with precise clean contour. Cohesive deep teal and antique gold world, warm key light from upper left and turquoise rimlight. Rich material rendering and intentional color separation, high-quality finished 2D game sprites; each readable at 80 pixels tall. Keep all eight characters the same artwork scale so oversized guardians fill their cells while slime remains squat. Full body for every character. Sprite atlas only.

## Vault background prompt

Use case: stylized-concept.
Asset type: production landscape background plate for a 2D side-view mobile fantasy battle game.
Primary request: a stunning handpainted ancient submerged vault chamber, landscape 2.33:1 composition. A beautiful worn brass and mossy stone crypt with huge arched doorway centered in the distant background, luminous cyan magical mist behind it, subtle gold runes carved into arch stones, bronze pipes and tree roots curving up the walls, warm amber wall lanterns. Rich tactile stonework, emerald moss, antique brass accents, restrained teal palette. Foreground is a continuous flat stone battle platform crossing the full width at 83% image height, seen at a low three-quarter angle. Dark atmospheric painterly rendering, premium fantasy game concept art quality. Perspective gives depth without obscuring where characters stand.
Critical composition: this is scenery ONLY. No characters, creatures, humanoid statues, weapons, game objects, UI, lettering or text. Keep the left and right lower stage areas (around 25% and 75% width, 50–85% height) simple and lower contrast because moving hero/enemy sprites go there. Top quarter remains dark and readable behind overlay health labels. Environmental details are concentrated in upper outer corners and center distant arch. Platform must be uninterrupted flat ground, no water covering it, no pits. Warm upper-left lighting, subtle turquoise ambient fog, finished illustrative realism, broad confident material painting. No interface, no frame, no screenshot, no watermark.
