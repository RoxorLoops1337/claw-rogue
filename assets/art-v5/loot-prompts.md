# Clawbound generated loot — Enchanted Arcade v5

Six independent original assets generated with the built-in image_gen tool, one call per object. Same art direction as v4 characters: ivory enamel, warm brass, teal details, broad sculpted forms, warm upper-left lighting. Family colors remain semantic: mint shield, pink healing, lavender energy, gold currency, slate scrap.

## Production integration

Transparent alpha is preserved. Crops use visible alpha bounds plus two source pixels. Exports are WebP quality 88 / alpha quality 100, at most 320 pixels on the longest edge. The six files total 140,974 bytes.

`loot.js` exposes `ClawLoot.ready`, `ClawLoot.assets` and `ClawLoot.draw`. Images are mapped to the body's local bounding rectangle, rotated with the rigid body and clipped to the exact compound collision silhouette. The original enamel body remains under the transparent art, so all physical contact edges remain visible. Existing procedural rendering remains as the image-failure fallback. No physics geometry is changed.

Mappings: sword→loot-sword.webp; shield→loot-shield.webp; spark→loot-spark.webp; heart→loot-heal.webp; coin→loot-coin.webp; stone→loot-scrap.webp. The same transparent files can be used for semantic UI icons, preserving aspect ratio.

Actual canvas rendering was inspected on deep ink at both game scale and enlarged scale. All six load and render; the generated art and exact collider outlines share transforms.

## Sword

Output: `loot-sword.webp`
Source: `exec-2d252161-9064-40ea-bc7f-2cf5cd8b6c08.png`

Use case: stylized-concept. Asset type: ONE production inventory/physical-loot sprite for original premium mobile game Clawbound. Art direction Enchanted Arcade: clean collectible 2.5D sculpted enamel and warm brushed brass, ivory specular highlights, mint-teal accents, deep ink contour shadows, large clean shapes readable at 24px. Orthographic front-on view, no foreshortening, object centered fully isolated with transparent background and 10% clear padding. Warm upper-left lighting, subtle cool mint rim, no external shadow, no glow beyond silhouette. No text, labels, background, frame, ground, extra objects, watermark or fine noisy texture. True alpha transparency. Subject: one whimsical compact horizontal sword collectible, blade points directly RIGHT, hilt directly LEFT, long overall capsule silhouette approximately 3.2 times wider than tall. Blade of luminous ivory enamel with a teal beveled central ridge; compact brass rounded crossguard no taller than blade width; teal short handle and brass rounded pommel. Softly rounded broad blade tip rather than needle. All parts fit one rounded horizontal capsule. This must read as a miniature magical sword, beautiful material shading, confident geometric silhouette.

## Shield

Output: `loot-shield.webp`
Source: `exec-8fbe0bf3-eb27-423e-a4b4-0ca00ba47d8b.png`

Use case: stylized-concept. Asset type: ONE production inventory/physical-loot sprite for original premium mobile game Clawbound. Art direction Enchanted Arcade: clean collectible 2.5D sculpted enamel and warm brushed brass, ivory specular highlights, mint-teal accents, deep ink contour shadows, large clean shapes readable at 24px. Orthographic front-on view, no foreshortening, object centered fully isolated with transparent background and 10% clear padding. Warm upper-left lighting, subtle cool mint rim, no external shadow, no glow beyond silhouette. No text, labels, background, frame, ground, extra objects, watermark or fine noisy texture. True alpha transparency. Subject: one broad rounded triangular shield collectible viewed absolutely straight from front. Smooth teal enamel face, chunky rounded warm brass rim, one large ivory enamel inverted teardrop emblem at the center. Silhouette a softly rounded triangle pointing DOWN with broad rounded shoulders and no sharp corners, approximately as wide as tall. Restrained bright mint reflection in upper left, strong sculpted depth and clean dark ink edge. No straps visible. Fits a palm-sized magical toy shield.

## Spark

Output: `loot-spark.webp`
Source: `exec-a8fb7c9e-3a50-47ac-a118-08c18a1adcd3.png`

Use case: stylized-concept. Asset type: ONE production inventory/physical-loot sprite for original premium mobile game Clawbound. Art direction Enchanted Arcade: clean collectible 2.5D sculpted enamel and warm brushed brass, ivory specular highlights, mint-teal accents, deep ink contour shadows, large clean shapes readable at 24px. Orthographic front-on view, no foreshortening, object centered fully isolated with transparent background and 10% clear padding. Warm upper-left lighting, subtle cool mint rim, no external shadow, no glow beyond silhouette. No text, labels, background, frame, ground, extra objects, watermark or fine noisy texture. True alpha transparency. Subject: one magical energy crystal collectible, horizontal oblong capsule-shaped cut crystal approximately 1.65 times wider than tall, long axis perfectly horizontal. Broad lavender-amethyst crystal has softly beveled six-sided facets, large ivory lightning-bolt inlay in center, chunky warm brass end caps at LEFT and RIGHT and delicate teal enamel bezel. The silhouette is a rounded horizontal capsule, not long pointy shards. Clean luminous crystal shading but NO glow outside its physical shape. A beautiful polished enchanted-arcade power cell, one simple object readable at very small scale.

## Heal

Output: `loot-heal.webp`
Source: `exec-9f5f70e5-927e-417b-98f3-14d89f98eee3.png`

Use case: stylized-concept. Asset type: ONE production inventory/physical-loot sprite for original premium mobile game Clawbound. Art direction Enchanted Arcade: clean collectible 2.5D sculpted enamel and warm brushed brass, ivory specular highlights, mint-teal accents, deep ink contour shadows, large clean shapes readable at 24px. Orthographic front-on view, no foreshortening, object centered fully isolated with transparent background and 10% clear padding. Warm upper-left lighting, subtle cool mint rim, no external shadow, no glow beyond silhouette. No text, labels, background, frame, ground, extra objects, watermark or fine noisy texture. True alpha transparency. Subject: one tiny healing potion vial collectible. Broad almost round three-lobed glass bottle with short rounded brass stopper at the top. Warm rose-pink potion fills it, with a large simple ivory heart emblem on the front and a thin teal enamel collar below the stopper. Silhouette is as wide as tall, like a rounded triangular bulb with tiny neck, NOT a tall bottle. Polished glass made readable with a single broad ivory reflection, rich raspberry base, warm brass base rim. Chunky cute premium miniature object, straight-on view.

## Coin

Output: `loot-coin.webp`
Source: `exec-c3ca94c4-90d5-4765-b5e1-d24da3106cf9.png`

Use case: stylized-concept. Asset type: ONE production inventory/physical-loot sprite for original premium mobile game Clawbound. Art direction Enchanted Arcade: clean collectible 2.5D sculpted enamel and warm brushed brass, ivory specular highlights, mint-teal accents, deep ink contour shadows, large clean shapes readable at 24px. Orthographic front-on view, no foreshortening, object centered fully isolated with transparent background and 10% clear padding. Warm upper-left lighting, subtle cool mint rim, no external shadow, no glow beyond silhouette. No text, labels, background, frame, ground, extra objects, watermark or fine noisy texture. True alpha transparency. Subject: one perfectly circular warm gold arcade treasure coin, face perfectly straight-on so silhouette is an exact circle. Chunky sculpted brass rim, inset rich gold face, one large embossed ivory-enamel four-point star in center with small teal diamond center. No lettering, no numbers, no currency symbols, no other marks. Thick rounded beveled edge, simple rich polished metal gradients, instantly readable and charming. Main color brass gold, restrained ivory and teal accent.

## Scrap

Output: `loot-scrap.webp`
Source: `exec-95dec9ee-fe39-4399-9d95-ec4cb6d0b559.png`

Use case: stylized-concept. Asset type: ONE production inventory/physical-loot sprite for original premium mobile game Clawbound. Art direction Enchanted Arcade: clean collectible 2.5D sculpted enamel and warm brushed brass, ivory specular highlights, mint-teal accents, deep ink contour shadows, large clean shapes readable at 24px. Orthographic front-on view, no foreshortening, object centered fully isolated with transparent background and 10% clear padding. Warm upper-left lighting, subtle cool mint rim, no external shadow, no glow beyond silhouette. No text, labels, background, frame, ground, extra objects, watermark or fine noisy texture. True alpha transparency. Subject: one salvaged mechanical nut collectible, squat softly rounded three-lobed almost circular metal nut shown absolutely straight from front. Slate blue-gray enamel outer body with warm worn brass bevel on rim, central dark ink circular hole surrounded by a pale ivory inner metal ring. Three large evenly spaced gentle lobes, top lobe at12o'clock and two lower lobes, like a chunky rounded triangular machine bolt, NOT many-toothed gear. Small mint inset detail on each lobe. Silhouette approximately as wide as tall. Clearly a heavy scrap part, beautifully sculpted but simpler and less valuable-looking than a gold coin. No rustflakes, no sharp protrusions, no photoreal clutter.


