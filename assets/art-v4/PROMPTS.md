# Clawbound — Enchanted Arcade art direction (v4)

Generated with the built-in image_gen tool, then inspected and exported as production WebP assets. No external character art or stock assets.

## Shared art direction

**Enchanted Arcade**: sculpted collectible characters made from ivory enamel, warm brass and teal ceramic, with readable oversized expressions. Silhouettes remain recognizable at 70–110 pixels high. Warm upper-left highlights, cool teal rim lights, deep ink shadows and broad clean shapes connect every asset. The hero is a round ivory-and-brass salvage automaton; enemies share the same sculpted material language but each has one dominant accent: mint, coral, lavender, slate, emerald, amethyst or indigo.

The environment uses teal carved architecture and brass trim with quiet negative space behind characters. The cabinet and interface should use the same deep ink foundation, ivory labels, restrained teal enamel surfaces and warm brass interaction accents. Reserve bright coral for incoming danger, lilac for magic, mint for restoration. Avoid photoreal textures, distressed noise, rainbow gradients and inconsistent sticker-like icon outlines.

## Runtime files

- `hero.webp`, `slime.webp`, `beetle.webp`, `ghost.webp`, `golem.webp`, `root.webp`, `prism.webp`, `astral.webp`: individually cropped true-alpha character sprites, 384 pixels high, WebP quality 88 / alpha quality 100.
- `vault.webp`: 1260×450 background, WebP quality 88.
- `manifest.json`: dimensions, original source crop rectangles and normalized ground anchors.

Each actor is cropped to visible alpha bounds plus two source pixels of padding. Use the full image rectangle; place the foot baseline at approximately 99.5% height. Slime and beetle naturally have broad silhouettes; keep aspect ratio. Hero faces right and enemies face left or three-quarter front-left. The ghost has an intentionally floating body; render its ground shadow independently.

The transparent image viewer can expose near-zero-alpha RGB specks. Actual compositing against the game's dark ink background was inspected and is clean; the hero's apparent red fringe pixels have alpha 0 or 1 out of 255. Do not flatten sprites onto a matte.

## Generation provenance

Initial atlas: `exec-eddf210d-5f3a-4872-855d-af55184e5b1e.png`, 1774×887 RGBA.
Selected cleanup atlas: `exec-81734e8a-be8d-4679-bdc4-38ca839e9eae.png`, 1774×887 RGBA.
Selected environment: `exec-e8ffd6d1-7da0-4d9d-a5e8-1a9cb261d788.png`.

### Initial character atlas prompt

Use case: stylized-concept
Asset type: production transparent character sprite atlas for an original premium portrait mobile claw-machine roguelike, called Clawbound.
Primary request: Create exactly eight original, exquisitely sculpted stylized 2.5D game characters on a genuinely transparent background. This must be a clean usable sprite atlas: 4 equal columns × 2 equal rows, wide 2:1 canvas. One entire isolated character centered in each cell, generous transparent padding on all four sides, no overlap, feet aligned at 85% of each cell height, no ground planes or shadows beyond the character, no text.
Art direction: collectible designer-toy meets magical arcade dungeon, simple bold readable silhouettes and oversized expressive faces. Professional hand-crafted animated-film rendering, polished ceramic enamel, warm brushed brass, soft clay forms, crisp luminous rim highlights and beautiful soft contact shading within each figure. Readable at 70 pixels tall. Clean saturated colors and large shapes, no fine noisy texture, no realism, no weapons pointing outside cells.
TOP ROW left to right:
1. Hero: adorable courageous stout salvage automaton facing three-quarter RIGHT, ivory enamel torso, brass joints, rounded teal faceplate with two large warm-white expressive eyes, small antenna, oversized rounded mitten claw hands, broad short feet. Confident stance.
2. Slime: plump lime-mint translucent jelly troublemaker facing three-quarter LEFT, enormous expressive dark teal eyes and mischievous mouth, one simple glossy highlight and a tiny leaf sprout.
3. Beetle: compact fiery coral-red armored scarab facing three-quarter LEFT, polished domed shell with a gold center stripe, two little raised brows and luminous ivory eyes, four thick curled dark burgundy legs and two sturdy golden mandibles.
4. Ghost: elegant plump lavender-blue phantom facing three-quarter LEFT, expressive ivory eyes beneath thick soft folds, broad flowing taper and two curled tiny arms, luminous mint inner face, simple playful silhouette.
BOTTOM ROW left to right:
5. Golem: chunky slate-teal stone guardian facing three-quarter LEFT, ivory luminous eyebrows and rectangular eyes, copper seam across broad chest, two big block hands, small feet, sculptural smooth rock planes.
6. Root guardian: regal emerald forest spirit boss facing three-quarter LEFT, stout wooden mask face with gold expressive eye slits, three large antler-like ivory branches forming a crown, broad leafy shoulder mantle, rooted feet, no spindly tendrils.
7. Prism guardian: imposing amethyst crystal boss facing three-quarter LEFT, broad shield-like lavender crystal shoulders, simplified angular body, gold eye slits in navy face, one large central pale pink crystal crown, ivory and gold rim highlights.
8. Astral guardian: majestic deep indigo celestial owl-like automaton facing three-quarter LEFT, broad cape-like folded wing arms, crescent brass halo crown, two large mint luminous eyes, ivory chest and one gold star set in chest, solid short feet.
Lighting: consistent bright warm key light from upper left, cool teal rim light from upper right, luminous but sharply defined shapes, rich colors.
Constraints: exactly eight separate full-body figures, no extra character, no letters or labels, no checkerboard, no background, no scenery, no cropped limbs, no floating props between cells, no blur. Each has a memorable silhouette and readable expression. Use true transparent alpha.

### Targeted character cleanup prompt

Use case: precise-object-edit. Asset type: production transparent sprite atlas.
Edit this sprite sheet. Preserve exactly these eight character designs, colors, expressions and row order. Make TWO technical cleanup changes only:
1. Place them within a precise regular FOUR COLUMN by TWO ROW grid with generous clear padding: each character entirely contained in central80%widthand80%height of its own equal cell. No touch between neighboring characters or rows. Root guardian antlers entirely visible without reaching rowabove. No cropping. Full bodies. Keep equal cell sizes. Outputwide2:1.
2. Professionally clean the transparent cutout edges. Remove every stray isolated pixel, colored fringe, green/cyan/red chroma-key speck, white halo and image segmentation artifact. Clean smooth natural anti-aliased character silhouettes. The empty background must have alpha ZERO with no opaque white or gray areas. Retain opaque character bodies (slime translucent only within silhouette), no floating particles. Full transparent background, no checkerboard. Keep refined polishedenamel/brass sculpted appearance. No ground shadows, no labels or text, no borders or cell markers.
This is production game art. Preserve character identity and improve only padding and clean alpha edges.

### Environment prompt

Use case: stylized-concept
Asset type: production background plate for a premium portrait mobile game, shown behind small colorful characters in a 420×150 pixel wide battle viewport.
Primary request: Original exquisite 2.5D enchanted arcade vault interior, uncluttered side-view platform arena. Canvas wide 2.8:1 landscape. A grand teal arched doorway at center in the far background with a softly glowing mint central seam, clean art-deco brass trim. Smooth deep teal stone walls, one warm ivory illuminated hanging orb lamp near each outer edge, monumental rounded architecture, three simple distant wall panels. A broad flat warm-charcoal stone platform extends all across the bottom 20%, with a thin brass inlay line marking its top edge, seen slightly from above. The rest is a calm mid-dark teal backdrop with balanced elegant negative space so bright small characters can be read at left and right.
Style: premium animated-film environment, polished sculpted shapes, clean expressive art direction, subtle hand painted gradients, no distressed gritty noise. Restrained teal, emerald shadows, warm brass gold trim, soft mint light accents. Quiet magical atmosphere, coherent simple shape language, visible architectural depth.
Composition: side-scrolling combat stage, camera square-on, stage ground at 82% height, evenly level surface with NO foreground obstructions. Character placements will be 22% and70% across, leave those areas clear. Broad low-contrast background forms, very subtle dust motes.
Constraints: background only, no characters, no creatures, no claw machine, no text, no symbols, no logos, no UI, no treasure piles, no ornate clutter, no overly dark black corners, no stairs on floor. Wide landscape.

