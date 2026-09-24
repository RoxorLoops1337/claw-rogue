/* Campaign data and persistence. No DOM or simulation side effects. */
(function (root) {
  'use strict';
  const VERSION = 2;
  const SAVE_KEY = 'clawbound-campaign-v2';
  const META_KEY = 'clawbound-workshop-v2';
  const ACTS = [
    { name: 'THE VERDANT WORKS', short: 'VERDANT WORKS', color: '#95dcac', subtitle: 'Wake the forgotten machines.' },
    { name: 'THE PRISM MINES', short: 'PRISM MINES', color: '#b5a0ff', subtitle: 'Follow the light beneath the roots.' },
    { name: 'THE ASTRAL VAULT', short: 'ASTRAL VAULT', color: '#ffd184', subtitle: 'Bring the last star home.' }
  ];
  const clamp = (n, low, high) => Math.max(low, Math.min(high, n));
  const number = (n, fallback = 0) => Number.isFinite(n) ? n : fallback;
  const clone = value => JSON.parse(JSON.stringify(value));
  function rng(seed) {
    let state = seed >>> 0;
    return () => { state += 0x6D2B79F5; let t = state; t = Math.imul(t ^ t >>> 15, t | 1); t ^= t + Math.imul(t ^ t >>> 7, t | 61); return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  }
  function shuffled(items, seed) {
    const out = items.slice(), random = rng(seed);
    for (let i = out.length - 1; i > 0; i--) { const j = Math.floor(random() * (i + 1)); [out[i], out[j]] = [out[j], out[i]]; }
    return out;
  }
  function read(key) { try { const raw = root.localStorage && root.localStorage.getItem(key); return raw ? JSON.parse(raw) : null; } catch (_) { return null; } }
  function write(key, value) { try { if (!root.localStorage) return false; root.localStorage.setItem(key, JSON.stringify(value)); return true; } catch (_) { return false; } }
  function clearRun() { try { root.localStorage.removeItem(SAVE_KEY); } catch (_) {} }
  function loadMeta() {
    const saved = read(META_KEY) || {};
    return {
      embers: clamp(number(saved.embers), 0, 999999), runs: clamp(number(saved.runs), 0, 999999), wins: clamp(number(saved.wins), 0, 999999),
      bestFloor: clamp(number(saved.bestFloor), 0, 12), totalCollected: clamp(number(saved.totalCollected), 0, 99999999),
      hull: clamp(number(saved.hull), 0, 3), purse: clamp(number(saved.purse), 0, 3),
      lastFinishedId: typeof saved.lastFinishedId === 'string' ? saved.lastFinishedId : ''
    };
  }
  const LOADOUTS = [
    { id: 'scrapper', name: 'Scrapper', mark: '⚙', desc: 'A balanced explorer. Start with 4 extra coins.', requirement: 'Always available' },
    { id: 'warden', name: 'Warden', mark: '◇', desc: '+6 maximum health. Begin each chamber with 4 block.', requirement: 'Reach chamber 5 to unlock' },
    { id: 'storm', name: 'Stormsmith', mark: 'ϟ', desc: 'Sparks deal +3 damage. Start with 4 less health.', requirement: 'Collect 100 items across completed runs' }
  ];
  function loadouts() {
    const meta = loadMeta();
    return LOADOUTS.map(item => ({ ...item, unlocked: item.id === 'scrapper' || (item.id === 'warden' ? meta.bestFloor >= 5 || meta.wins > 0 : meta.totalCollected >= 100) }));
  }
  function createRun(seed, loadout = 'scrapper') {
    if (seed && typeof seed === 'object') { loadout = seed.loadout || loadout; seed = seed.seed; }
    if (typeof seed === 'string') { loadout = seed; seed = undefined; }
    const meta = loadMeta();
    const chosenLoadout = loadouts().find(item => item.id === loadout && item.unlocked) || LOADOUTS[0];
    const chosenSeed = Number.isFinite(seed) ? seed >>> 0 : (Date.now() ^ Math.floor(Math.random() * 0xffffffff)) >>> 0;
    const run = {
      campaignVersion: VERSION, seed: chosenSeed, id: Date.now().toString(36) + '-' + chosenSeed.toString(36),
      stage: 'battle', loadout: chosenLoadout.id,
      floor: 1, act: 1, hp: 44 + meta.hull * 3, maxHp: 44 + meta.hull * 3, shield: 0,
      coins: 6 + meta.purse * 3, size: 0, capacity: 5, blade: 0, block: 0, spark: 0, haul: 0,
      extraDrops: 0, grip: .85, healBonus: 0, coinBonus: 0, startShield: 0, salvage: 0,
      relics: {}, totalCollected: 0, enemiesDefeated: 0, elitesDefeated: 0, bossesDefeated: 0,
      routeKind: 'combat', routeHistory: [], rewardSerial: 0, turn: 0, finished: false
    };
    if (chosenLoadout.id === 'warden') { run.maxHp += 6; run.hp += 6; run.startShield = 4; }
    else if (chosenLoadout.id === 'storm') { run.maxHp -= 4; run.hp -= 4; run.spark = 3; }
    else run.coins += 4;
    return run;
  }
  function actFor(floor) { return ACTS[clamp(Math.floor((floor - 1) / 4), 0, 2)]; }
  const ENEMIES = [
    { name: 'MOSS MUNCHER', kind: 0, hp: 24, attack: 4, pattern: ['strike', 'strike', 'guard'] },
    { name: 'BRAMBLE BANDIT', kind: 1, hp: 31, attack: 5, pattern: ['strike', 'guard', 'heavy'] },
    { name: 'SPORE SENTINEL', kind: 3, hp: 38, attack: 6, pattern: ['guard', 'heavy', 'strike'] },
    { name: 'THE ROOT WARDEN', kind: 4, hp: 80, attack: 7, pattern: ['strike', 'guard', 'heavy', 'strike'] },
    { name: 'PRISM SPRITE', kind: 2, hp: 48, attack: 7, pattern: ['strike', 'mend', 'heavy'] },
    { name: 'QUARTZ CRUSHER', kind: 3, hp: 56, attack: 8, pattern: ['guard', 'heavy', 'strike'] },
    { name: 'GLOOM STALKER', kind: 1, hp: 62, attack: 9, pattern: ['strike', 'strike', 'heavy'] },
    { name: 'THE PRISM REGENT', kind: 4, hp: 130, attack: 10, pattern: ['guard', 'heavy', 'mend', 'heavy'] },
    { name: 'STARFORGED SENTRY', kind: 3, hp: 76, attack: 10, pattern: ['guard', 'heavy', 'strike'] },
    { name: 'VOID WHISPER', kind: 2, hp: 84, attack: 11, pattern: ['strike', 'mend', 'heavy'] },
    { name: 'CROWNLESS KNIGHT', kind: 1, hp: 92, attack: 12, pattern: ['heavy', 'guard', 'heavy'] },
    { name: 'THE LAST CONSTELLATION', kind: 4, hp: 190, attack: 13, pattern: ['strike', 'guard', 'heavy', 'mend', 'heavy'] }
  ];
  function enemyFor(floor, routeKind = 'combat') {
    const f = clamp(Math.floor(floor), 1, 12), base = ENEMIES[f - 1], boss = f % 4 === 0, elite = routeKind === 'elite' && !boss;
    const hp = Math.round(base.hp * (elite ? 1.28 : 1));
    return { ...clone(base), name: elite ? 'ELITE ' + base.name : base.name, hp, maxHp: hp, attack: base.attack + (elite ? 2 : 0), boss, elite, armor: 0, turn: 0, act: Math.ceil(f / 4) };
  }
  function intentFor(enemy, turn = enemy.turn || 0) {
    const pattern = enemy.pattern || ['strike'];
    const type = pattern[Math.max(0, Math.floor(turn)) % pattern.length];
    const attack = number(enemy.attack, 4);
    if (type === 'guard') { const armor = 5 + (enemy.act || 1) * 2; return { type, damage: 0, armor, heal: 0, mark: '◇', label: 'Fortify · ' + armor + ' armor', description: 'Armor absorbs your next damage. No attack this turn.' }; }
    if (type === 'mend') { const heal = 5 + (enemy.act || 1) * 3; return { type, damage: 0, armor: 0, heal, mark: '+', label: 'Repair · ' + heal + ' HP', description: 'The enemy restores health. No attack this turn.' }; }
    const damage = type === 'heavy' ? Math.round(attack * 1.55) : attack;
    return { type, damage, armor: 0, heal: 0, mark: type === 'heavy' ? '✦' : '⚔', label: (type === 'heavy' ? 'Heavy strike · ' : 'Strike · ') + damage, description: 'Collect shields before this attack lands.' };
  }
  const UPGRADES = [
    { id: 'size', mark: '↔', name: 'Titan Jaws', desc: 'Wider physical jaws scoop a larger cluster.', max: 3, apply: r => { r.size++; r.capacity = Math.min(10, r.capacity + 1); } },
    { id: 'capacity', mark: '⊞', name: 'Velvet Grips', desc: 'More friction keeps loose treasure in the claw.', max: 4, apply: r => { r.grip = Math.min(1.85, r.grip + .25); r.capacity = Math.min(10, r.capacity + 1); } },
    { id: 'blade', mark: '⚔', name: 'Sunsteel Edge', desc: 'Every sword deals 2 more damage.', max: 6, apply: r => { r.blade += 2; } },
    { id: 'block', mark: '◇', name: 'Prism Barrier', desc: 'Every shield grants 2 more block.', max: 5, apply: r => { r.block += 2; } },
    { id: 'combo', mark: '×', name: 'Collector’s Crown', desc: 'Deliver 4+ items for 6 bonus damage.', max: 4, apply: r => { r.haul += 6; } },
    { id: 'battery', mark: 'ϟ', name: 'Reserve Cell', desc: '+1 drop in every future chamber.', max: 3, apply: r => { r.extraDrops++; } },
    { id: 'repair', mark: '+', name: 'Living Alloy', desc: '+8 maximum health. Heal 14 right now.', max: 5, apply: r => { r.maxHp += 8; r.hp = Math.min(r.maxHp, r.hp + 14); } },
    { id: 'spark', mark: '⌁', name: 'Storm Capacitor', desc: 'Every spark deals 3 more damage.', max: 6, apply: r => { r.spark += 3; } },
    { id: 'heart', mark: '♥', name: 'Bloom Engine', desc: 'Every heart restores 2 extra health.', max: 3, apply: r => { r.healBonus = (r.healBonus || 0) + 2; } },
    { id: 'mint', mark: '●', name: 'Golden Touch', desc: 'Every coin token earns 1 extra coin.', max: 3, apply: r => { r.coinBonus = (r.coinBonus || 0) + 1; } },
    { id: 'aegis', mark: '◈', name: 'Dawn Aegis', desc: 'Begin each chamber with 6 extra block.', max: 3, apply: r => { r.startShield = (r.startShield || 0) + 6; } },
    { id: 'salvage', mark: '▪', name: 'Scrap Alchemy', desc: 'Scrap deals 3 extra damage.', max: 3, apply: r => { r.salvage = (r.salvage || 0) + 3; } }
  ];
  function upgradeById(id) { return UPGRADES.find(u => u.id === id); }
  function eligible(run, upgrade) { return (run.relics[upgrade.id] || 0) < upgrade.max; }
  function upgradeChoices(run, count = 3) {
    const pool = UPGRADES.filter(u => eligible(run, u));
    const picks = shuffled(pool, (run.seed || 0) + run.floor * 107 + (run.rewardSerial || 0) * 7919);
    if (run.floor === 1 && !run.relics.size) { const index = picks.findIndex(u => u.id === 'size'); if (index >= 0) picks.unshift(...picks.splice(index, 1)); }
    return picks.slice(0, count);
  }
  function applyUpgrade(run, id) {
    const upgrade = upgradeById(id);
    if (!upgrade || !eligible(run, upgrade)) return false;
    upgrade.apply(run); run.relics[id] = (run.relics[id] || 0) + 1; run.rewardSerial = (run.rewardSerial || 0) + 1;
    return true;
  }
  function routeChoices(run) {
    if (run.floor >= 12) return [];
    if ((run.floor + 1) % 4 === 0) return [
      { id: 'rest', kind: 'rest', mark: '♥', name: 'Sanctuary', desc: 'Restore 25% health before the act guardian.' },
      { id: 'shop', kind: 'shop', mark: '●', name: 'Wandering Merchant', desc: 'Spend coins on an upgrade or repairs before the guardian.' }
    ];
    const stop = run.floor % 2 ? 'rest' : 'shop';
    return [
      { id: 'combat', kind: 'combat', mark: '⚔', name: 'The Worn Path', desc: 'Find 5 coins on the road to a regular battle.' },
      { id: 'elite', kind: 'elite', mark: '✦', name: 'The Sealed Treasury', desc: 'A stronger enemy. Win two upgrades and 12 bonus coins.' },
      stop === 'rest'
        ? { id: 'rest', kind: 'rest', mark: '♥', name: 'Quiet Sanctuary', desc: 'Restore 25% health, then face a regular enemy.' }
        : { id: 'shop', kind: 'shop', mark: '●', name: 'Wandering Merchant', desc: 'Buy upgrades and repairs, then face a regular enemy.' }
    ];
  }
  function applyRoute(run, id) {
    const route = routeChoices(run).find(item => item.id === id);
    if (!route) return null;
    run.routeKind = id === 'elite' ? 'elite' : 'combat';
    run.routeHistory.push({ floor: run.floor + 1, kind: id });
    let healed = 0;
    if (id === 'rest') { healed = Math.min(run.maxHp - run.hp, Math.ceil(run.maxHp * .25)); run.hp += healed; }
    if (id === 'combat') run.coins += 5;
    return { ...route, healed, coins: id === 'combat' ? 5 : 0, opensShop: id === 'shop' };
  }
  function shopOffers(run) {
    const choices = shuffled(UPGRADES.filter(u => eligible(run, u)), (run.seed || 0) + run.floor * 313);
    return [
      { id: 'repair', mark: '♥', name: 'Field Repair', desc: 'Restore 18 health.', price: 9, disabled: run.hp >= run.maxHp },
      ...choices.slice(0, 2).map(u => ({ id: 'upgrade:' + u.id, mark: u.mark, name: u.name, desc: u.desc, price: 14 + Math.floor(run.floor / 4) * 3, disabled: (run.shopPurchases || []).includes(run.floor + ':' + u.id) }))
    ];
  }
  function buy(run, id) {
    const offer = shopOffers(run).find(item => item.id === id);
    if (!offer || offer.disabled || run.coins < offer.price) return false;
    if (id === 'repair') run.hp = Math.min(run.maxHp, run.hp + 18);
    else { if (!applyUpgrade(run, id.slice(8))) return false; (run.shopPurchases ||= []).push(run.floor + ':' + id.slice(8)); }
    run.coins -= offer.price;
    return true;
  }
  function clearReward(run) {
    if (run.lastRewardedFloor === run.floor && run.lastClearReward) return { ...run.lastClearReward, repeated: true };
    const elite = !!run.enemy.elite, boss = !!run.enemy.boss;
    const coins = 5 + Math.ceil(run.floor / 2) + (elite ? 12 : 0) + (boss ? 8 : 0);
    run.coins += coins; run.enemiesDefeated++; if (elite) run.elitesDefeated++; if (boss) run.bossesDefeated++;
    const result = { coins, choices: elite ? 2 : 1, boss, elite, won: run.floor >= 12 };
    run.lastRewardedFloor = run.floor; run.lastClearReward = result;
    return { ...result };
  }
  function saveRun(snapshot) {
    // Caller includes the full simulation snapshot so reloading cannot reroll a grab.
    if (!validSnapshot(snapshot)) return false;
    try {
      const payload = { version: VERSION, savedAt: Date.now(), snapshot };
      if (JSON.stringify(payload).length > 1200000) return false;
      return write(SAVE_KEY, payload);
    } catch (_) { return false; }
  }
  const PHASES = ['aim', 'down', 'close', 'up', 'carry', 'release', 'resolve', 'enemy', 'return', 'reward'];
  const BALL_TYPES = ['sword', 'shield', 'heart', 'spark', 'coin', 'stone'];
  function validBall(ball) {
    return !!ball && typeof ball === 'object' && BALL_TYPES.includes(ball.type) &&
      ['x', 'y', 'r', 'vx', 'vy', 'angle', 'spin'].every(key => Number.isFinite(ball[key])) && ball.r > 0 && ball.r < 100 && typeof ball.alive === 'boolean';
  }
  function validSnapshot(snapshot) {
    const run = snapshot && snapshot.run;
    if (!run || run.campaignVersion !== VERSION || run.finished || !['battle', 'reward', 'route', 'shop'].includes(run.stage)) return false;
    const stats = ['hp', 'maxHp', 'shield', 'coins', 'size', 'capacity', 'blade', 'block', 'spark', 'haul', 'extraDrops', 'grip', 'healBonus', 'coinBonus', 'startShield', 'salvage', 'totalCollected', 'turn', 'seed', 'drops'];
    if (stats.some(key => !Number.isFinite(run[key]) || run[key] < 0) || run.maxHp < 1 || run.hp > run.maxHp || run.grip <= 0) return false;
    if (!Number.isInteger(run.floor) || run.floor < 1 || run.floor > 12 || typeof run.id !== 'string' || !run.id || !run.relics || typeof run.relics !== 'object' || Array.isArray(run.relics)) return false;
    if (Object.entries(run.relics).some(([id, count]) => !upgradeById(id) || !Number.isInteger(count) || count < 0 || count > upgradeById(id).max)) return false;
    if (!Array.isArray(run.routeHistory) || run.routeHistory.length > 12) return false;
    if (run.pendingUpgrades !== undefined && (!Array.isArray(run.pendingUpgrades) || run.pendingUpgrades.some(id => !upgradeById(id)))) return false;
    const enemy = run.enemy;
    if (!enemy || typeof enemy.name !== 'string' || !Number.isInteger(enemy.kind) || enemy.kind < 0 || enemy.kind > 4 || !Number.isFinite(enemy.hp) || !Number.isFinite(enemy.maxHp) || enemy.hp < 0 || enemy.maxHp < 1 || enemy.hp > enemy.maxHp || !Number.isFinite(enemy.attack) || enemy.attack < 0) return false;
    if (!Array.isArray(enemy.pattern) || !enemy.pattern.length || enemy.pattern.some(type => !['strike', 'heavy', 'guard', 'mend'].includes(type))) return false;
    if (['armor', 'shield'].some(key => enemy[key] !== undefined && (!Number.isFinite(enemy[key]) || enemy[key] < 0))) return false;
    const claw = snapshot.claw;
    if (!claw || !['x', 'y', 'open', 'depth', 'contactTime'].every(key => Number.isFinite(claw[key])) || claw.open < 0 || claw.open > 1) return false;
    if (!Array.isArray(snapshot.balls) || snapshot.balls.length > 200 || !snapshot.balls.every(validBall)) return false;
    if (!PHASES.includes(snapshot.phase)) return false;
    if (['phaseTime', 'clock', 'lastDelivery'].some(key => !Number.isFinite(snapshot[key]) || snapshot[key] < 0)) return false;
    if (!Array.isArray(snapshot.delivered) || snapshot.delivered.length > 200 || !snapshot.delivered.every(validBall)) return false;
    if (!snapshot.totals || ['damage', 'block', 'heal', 'coins'].some(key => !Number.isFinite(snapshot.totals[key]) || snapshot.totals[key] < 0)) return false;
    return true;
  }
  function loadRun() {
    const data = read(SAVE_KEY);
    return data && data.version === VERSION && validSnapshot(data.snapshot) ? data.snapshot : null;
  }
  function finishRun(run, won) {
    const meta = loadMeta();
    if (run.finished || meta.lastFinishedId === run.id) return { meta, earned: 0 };
    const earned = Math.max(1, (run.enemiesDefeated || 0) + (run.elitesDefeated || 0) * 2 + (run.bossesDefeated || 0) * 3 + (won ? 8 : 0));
    meta.runs++; if (won) meta.wins++; meta.embers += earned; meta.bestFloor = Math.max(meta.bestFloor, run.floor); meta.totalCollected += run.totalCollected || 0; meta.lastFinishedId = run.id;
    run.finished = true; write(META_KEY, meta); clearRun();
    return { meta, earned };
  }
  function workshopOffers() {
    const meta = loadMeta();
    return [
      { id: 'hull', mark: '◇', name: 'Reinforced Hull', level: meta.hull, max: 3, price: 8 + meta.hull * 8, desc: '+3 starting maximum health on every run.' },
      { id: 'purse', mark: '●', name: 'Supply Cache', level: meta.purse, max: 3, price: 7 + meta.purse * 7, desc: '+3 starting coins on every run.' }
    ];
  }
  function buyWorkshop(id) {
    const meta = loadMeta(), offer = workshopOffers().find(item => item.id === id);
    if (!offer || offer.level >= offer.max || meta.embers < offer.price) return false;
    meta.embers -= offer.price; meta[id]++; return write(META_KEY, meta);
  }
  const api = { VERSION, TOTAL_FLOORS: 12, ACTS, UPGRADES, LOADOUTS, loadouts, createRun, actFor, enemyFor, intentFor, upgradeById, upgradeChoices, applyUpgrade, routeChoices, applyRoute, shopOffers, buy, clearReward, saveRun, loadRun, clearRun, loadMeta, finishRun, workshopOffers, buyWorkshop };
  root.ClawProgression = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
