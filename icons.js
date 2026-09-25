/* Original Clawbound interface icons. Decorative, self-contained and offline safe. */
(function (root) {
  'use strict';
  const paths = {
    gear: '<path d="m9 3 1 2h4l1-2 3 2-.5 2.3 2 3.4L22 11v3l-2.5.3-2 3.4L18 20l-3 2-1-2h-4l-1 2-3-2 .5-2.3-2-3.4L2 14v-3l2.5-.3 2-3.4L6 5Z"/><circle cx="12" cy="12.5" r="3.2"/>',
    shield: '<path d="m12 3 8 3v5c0 5-4.5 8.5-8 10-3.5-1.5-8-5-8-10V6Z"/><path d="m8.5 11.5 2.5 2.5 4.5-5"/>',
    bolt: '<path d="M13.5 2 5 13h6l-.5 9L20 10h-6Z"/>',
    sword: '<path d="m9 14 8-11 4-1-1 4L9 17m-3-6 7 7m-4-2-5 5-2-2 5-5"/>',
    heart: '<path d="M12 20 4.5 13C-.5 8.4 6 1.5 12 7c6-5.5 12.5 1.4 7.5 6Z"/>',
    coin: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="6" opacity=".4"/><path d="m12 7 3 5-3 5-3-5Z"/>',
    scrap: '<path d="m7 4 10 1 4 8-5 7-10-2-3-8Z"/><path d="m8 9 6-1 2 5-4 3-5-3Z" opacity=".65"/>',
    jaws: '<path d="M12 2v5M8 7h8M8 7 4 13l2 5 4-1m6-10 4 6-2 5-4-1M3 21h18m-18 0 2-2m-2 2 2 2m16-2-2-2m2 2-2 2"/>',
    grip: '<path d="M5 4h4v3H8v4l3 3v5H7l-4-5V8Zm14 0h-4v3h1v4l-3 3v5h4l4-5V8Z"/><path d="m10 4 2-2 2 2" opacity=".6"/>',
    crown: '<path d="m3 7 5 4 4-7 4 7 5-4-3 12H6Z"/><path d="M7 15h10"/><circle cx="12" cy="3" r="1" fill="currentColor" stroke="none"/>',
    repair: '<path d="M9 3h6v6h6v6h-6v6H9v-6H3V9h6Z"/>',
    capacitor: '<path d="M8 4v16M16 4v16M3 12h5m8 0h5"/><path d="m10 6 4 6-4 6" opacity=".6"/>',
    aegis: '<path d="m12 2 9 4v6c0 4-5 8-9 10-4-2-9-6-9-10V6Z"/><path d="m12 7 3 5-3 5-3-5Z"/>',
    right: '<path d="M4 12h15m-6-6 6 6-6 6"/>',
    left: '<path d="M20 12H5m6-6-6 6 6 6"/>',
    chevron: '<path d="m9 5 7 7-7 7"/>',
    check: '<path d="m5 12 4.5 4.5L19 7"/>',
    play: '<path d="m8 4 12 8-12 8Z" fill="currentColor" fill-opacity=".12"/>',
    star: '<path d="m12 2 3 7 7 3-7 3-3 7-3-7-7-3 7-3Z"/>',
    help: '<circle cx="12" cy="12" r="9"/><path d="M9.5 9a2.5 2.5 0 1 1 4 2c-1 .6-1.5 1.2-1.5 2"/><circle cx="12" cy="16.5" r=".8" fill="currentColor" stroke="none"/>',
    vault: '<path d="M4 21V9a8 8 0 0 1 16 0v12ZM2 21h20M8 21V10a4 4 0 0 1 8 0v11"/><circle cx="12" cy="13" r="1.5"/><path d="M12 14.5V17"/>',
    again: '<path d="M20 8a8 8 0 1 0 .3 7M20 3v5h-5"/>',
    exit: '<path d="M10 4H4v16h6M9 12h12m-5-5 5 5-5 5"/>'
  };
  const marks = {
    '⚙':'gear','◇':'shield','ϟ':'bolt','⚔':'sword','♥':'heart','●':'coin','▪':'scrap',
    '↔':'jaws','⊞':'grip','×':'crown','+':'repair','⌁':'capacitor','◈':'aegis',
    '→':'right','←':'left','›':'chevron','✓':'check','▶':'play','✦':'star','?':'help',
    '♜':'vault','↻':'again','↗':'exit'
  };
  const lootImages = {sword:'sword', shield:'shield', bolt:'spark', heart:'heal', coin:'coin', scrap:'scrap'};
  function escape(value) { return String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
  function mark(value) {
    const name = Object.prototype.hasOwnProperty.call(marks, value) ? marks[value] : null;
    if (!name) return escape(value);
    const loot = lootImages[name];
    if (loot) return '<img class="choice-glyph loot-glyph" data-icon="'+name+'" src="assets/art-v5/loot-'+loot+'.webp" width="24" height="24" alt="" aria-hidden="true" decoding="async">';
    return '<svg class="choice-glyph loot-glyph" data-icon="'+name+'" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">'+paths[name]+'</svg>';
  }
  root.ClawIcons = Object.freeze({mark});
  if (typeof module !== 'undefined' && module.exports) module.exports = root.ClawIcons;
})(typeof window !== 'undefined' ? window : globalThis);
