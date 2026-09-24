'use strict';
const assert = require('node:assert/strict');
const storage = new Map();
let quotaExceeded = false;
global.localStorage = {
  getItem: key => storage.get(key) || null,
  setItem(key, value) { if (quotaExceeded) throw new Error('QuotaExceededError'); storage.set(key, value); },
  removeItem: key => storage.delete(key)
};
const P = require('../progression.js');
const SAVE = 'clawbound-campaign-v2';
const copy = value => JSON.parse(JSON.stringify(value));
function freshSnapshot() {
  const run = P.createRun(813);
  run.enemy = P.enemyFor(run.floor);
  run.drops = 6;
  return {
    run, balls: [{ x: 150, y: 260, r: 13, vx: .1, vy: 1, angle: .2, spin: .01, alive: true, type: 'sword' }],
    claw: { x: 210, y: 48, open: 1, depth: 244, contactTime: 0, held: [] },
    phase: 'aim', phaseTime: .6, clock: 5.2, lastDelivery: 0,
    delivered: [], totals: { damage: 0, block: 0, heal: 0, coins: 0 }
  };
}

// Resume preserves the physical state, rather than rerolling a pile or restarting a grab.
const snapshot = freshSnapshot();
snapshot.phase = 'carry'; snapshot.claw.open = 0; snapshot.claw.x = 147;
assert(P.saveRun(snapshot));
assert.deepEqual(P.loadRun(), snapshot);
const resumed = P.loadRun(); resumed.balls[0].x += 20;
assert.notEqual(P.loadRun().balls[0].x, resumed.balls[0].x, 'Loaded snapshots are independent objects');
for (const phase of ['aim', 'down', 'close', 'up', 'carry', 'release', 'resolve', 'enemy', 'return', 'reward']) {
  const s = freshSnapshot(); s.phase = phase;
  assert(P.saveRun(s), `Phase ${phase} is resumable`);
  assert.equal(P.loadRun().phase, phase);
}

// Corrupted saves must never enter the live simulation or UI.
const corruptions = [
  s => { delete s.run; }, s => { s.run.floor = '3'; }, s => { s.run.floor = 13; },
  s => { s.run.hp = null; }, s => { s.run.hp = s.run.maxHp + 1; }, s => { s.run.coins = '999'; },
  s => { s.run.grip = 0; }, s => { delete s.run.blade; }, s => { s.run.stage = 'teleport'; },
  s => { s.run.relics = []; }, s => { s.run.relics = { size: 99 }; },
  s => { s.run.relics = { fake: 1 }; }, s => { s.run.pendingUpgrades = ['unknown']; },
  s => { s.run.routeHistory = null; }, s => { s.run.enemy = null; }, s => { s.run.enemy.kind = 7; },
  s => { s.run.enemy.hp = -1; }, s => { s.run.enemy.attack = '4'; },
  s => { s.run.enemy.pattern = []; }, s => { s.run.enemy.pattern = ['poison']; },
  s => { s.run.enemy.armor = -10; }, s => { s.claw = null; }, s => { s.claw.x = null; },
  s => { delete s.claw.y; }, s => { s.claw.open = 2; }, s => { s.balls = {}; },
  s => { s.balls[0].r = 0; }, s => { s.balls[0].x = '150'; }, s => { s.balls[0].type = 'unknown'; },
  s => { s.balls[0].alive = 'true'; }, s => { s.balls = Array(201).fill(s.balls[0]); },
  s => { s.phase = 'unknown'; }, s => { s.clock = -1; }, s => { s.phaseTime = null; },
  s => { s.delivered = null; }, s => { s.totals.damage = '40'; }, s => { s.run.finished = true; }
];
for (const mutate of corruptions) {
  const s = freshSnapshot(); mutate(s);
  storage.set(SAVE, JSON.stringify({ version: P.VERSION, snapshot: s }));
  assert.equal(P.loadRun(), null, String(mutate));
  assert.equal(P.saveRun(s), false, 'Invalid live snapshots are also rejected');
}
for (const raw of ['not JSON', 'null', '{}', JSON.stringify({ version: 1, snapshot })]) {
  storage.set(SAVE, raw); assert.equal(P.loadRun(), null);
}
assert(P.saveRun(snapshot));
const beforeQuota = storage.get(SAVE);
quotaExceeded = true;
assert.equal(P.saveRun(snapshot), false);
assert.equal(storage.get(SAVE), beforeQuota, 'Quota failure preserves the previous checkpoint');
quotaExceeded = false;

// Route economy and boundaries: the caller advances the chamber exactly once.
for (let floor = 1; floor <= 12; floor++) {
  const run = P.createRun(17); run.floor = floor;
  const routes = P.routeChoices(run);
  assert.equal(new Set(routes.map(r => r.id)).size, routes.length);
  assert.equal(routes.length === 0, floor === 12);
  if ((floor + 1) % 4 === 0 && floor < 12) assert.deepEqual(routes.map(r => r.id), ['rest', 'shop']);
}
let run = P.createRun(18); run.hp = 5;
const coinsBefore = run.coins;
assert(P.applyRoute(run, 'combat')); assert.equal(run.coins, coinsBefore + 5); assert.equal(run.floor, 1);
run = P.createRun(18); run.hp = 5;
const rest = P.applyRoute(run, 'rest'); assert.equal(rest.healed, 11); assert.equal(run.hp, 16);
run = P.createRun(18); P.applyRoute(run, 'elite'); assert.equal(run.routeKind, 'elite');
assert.equal(P.applyRoute(run, 'missing'), null);
run.enemy = P.enemyFor(1, 'elite');
const priorCoins = run.coins, clear = P.clearReward(run);
assert.equal(clear.choices, 2); assert.equal(run.elitesDefeated, 1); assert.equal(run.enemiesDefeated, 1);
assert.equal(run.coins, priorCoins + clear.coins);
const again = P.clearReward(run);
assert(again.repeated); assert.equal(run.coins, priorCoins + clear.coins); assert.equal(run.enemiesDefeated, 1);

// Every upgrade has an enforced cap and can be selected deterministically after reload.
for (const upgrade of P.UPGRADES) {
  const r = P.createRun(33);
  for (let n = 0; n < upgrade.max; n++) assert(P.applyUpgrade(r, upgrade.id));
  const capped = copy(r);
  assert.equal(P.applyUpgrade(r, upgrade.id), false);
  assert.deepEqual(r, capped);
  assert(!P.upgradeChoices(r, 100).some(u => u.id === upgrade.id));
  assert(r.hp <= r.maxHp);
}
run = P.createRun(19);
assert.deepEqual(P.upgradeChoices(run).map(u => u.id), P.upgradeChoices(copy(run)).map(u => u.id));
assert.equal(P.applyUpgrade(run, 'not-an-upgrade'), false);
run.coins = 0; run.hp = 1;
const beforeBuy = copy(run);
assert.equal(P.buy(run, 'repair'), false); assert.deepEqual(run, beforeBuy);
run.coins = 40; const offer = P.shopOffers(run).find(o => o.id.startsWith('upgrade:'));
assert(P.buy(run, offer.id)); assert.equal(run.coins, 40 - offer.price); assert.equal(P.buy(run, offer.id),false,'shop upgrade sold once per visit');
assert.equal(run.relics[offer.id.slice(8)], 1);
run.hp = run.maxHp; assert.equal(P.buy(run, 'repair'), false);

// Every enemy action is explicit, finite, and periodic, including each guardian.
const seen = new Set();
for (let floor = 1; floor <= 12; floor++) {
  for (const route of ['combat', 'elite']) {
    const enemy = P.enemyFor(floor, route);
    assert.equal(enemy.boss, floor % 4 === 0);
    assert.equal(enemy.elite, route === 'elite' && !enemy.boss);
    for (let turn = 0; turn < enemy.pattern.length * 2; turn++) {
      const intent = P.intentFor(enemy, turn); seen.add(intent.type);
      for (const key of ['damage', 'armor', 'heal']) assert(Number.isFinite(intent[key]) && intent[key] >= 0);
      assert.deepEqual(intent, P.intentFor(enemy, turn + enemy.pattern.length));
      assert(intent.label && intent.description);
      if (intent.type === 'guard' || intent.type === 'mend') assert.equal(intent.damage, 0);
    }
  }
}
assert.deepEqual([...seen].sort(), ['guard', 'heavy', 'mend', 'strike']);

// Completed runs award persistent currency exactly once and unlock distinct machines.
storage.clear(); run = P.createRun(77);
assert.equal(P.createRun('warden').loadout, 'scrapper', 'Locked loadouts cannot be selected');
run.floor = 12; run.enemiesDefeated = 12; run.elitesDefeated = 2; run.bossesDefeated = 3; run.totalCollected = 210;
const finished = P.finishRun(run, true);
assert.equal(finished.earned, 33); assert.equal(finished.meta.wins, 1); assert.equal(finished.meta.runs, 1);
assert.equal(P.finishRun(copy(run), true).earned, 0); assert.equal(P.loadMeta().embers, 33);
assert(P.loadouts().every(l => l.unlocked));
assert.equal(P.createRun('warden').startShield, 4); assert.equal(P.createRun('storm').spark, 3);
const hullPrice = P.workshopOffers().find(o => o.id === 'hull').price;
assert(P.buyWorkshop('hull')); assert.equal(P.loadMeta().embers, 33 - hullPrice);
assert.equal(P.createRun().maxHp, 47);
assert.equal(P.buyWorkshop('invalid'), false);
console.log('Progression checks passed: full snapshots, 37 corrupted shapes, quota safety, route economy, rewards, caps, shop, 12 encounter intents, meta unlocks.');
