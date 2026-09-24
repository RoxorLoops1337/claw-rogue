'use strict';
// A repeatable campaign report, not a win-rate assertion. This exercises actual
// contact physics, loot delivery, enemy turns, and the real menu callbacks.
const { boot } = require('./game.test.cjs');
const STEP = 1 / 120;

function upgradeScore(id, run) {
  if (id === 'repair' && run.hp < run.maxHp * .55) return 150;
  return ({ combo: 110, size: run.size < 2 ? 105 : 82, blade: 100, spark: 92,
    capacity: 80, salvage: 73, aegis: 68, repair: 62, block: 58, heart: 53,
    battery: 45, mint: 35 })[id] || 0;
}
function aim(state) {
  const { run, balls } = state, width = 50 + Math.min(run.size, 3) * 12;
  const candidates = Array.from({ length: 12 }, (_, i) => Math.max(93 + width, Math.min(407 - width, 170 + i * 15)));
  let bestX = 210, bestScore = -Infinity;
  for (const x of candidates) {
    const nearby = balls.filter(b => b.alive && Math.abs(b.x - x) < width * .9);
    const top = Math.min(326, ...nearby.map(b => b.y));
    const score = nearby.reduce((sum, b) => {
      // Prioritise visible, reachable layers, useful offense, and missing health.
      const value = ({ sword: 1.2 + run.blade * .13, spark: 1.5 + run.spark * .13,
        shield: run.shield < 10 ? 1.05 : .7, heart: run.hp < run.maxHp * .8 ? 1.5 : .55,
        coin: .8, stone: .4 + run.salvage * .15 })[b.type];
      return sum + value * Math.max(.1, 1 - (b.y - top) / 90) * (1 - Math.abs(b.x - x) / (width * 1.9));
    }, 0);
    if (score > bestScore) { bestScore = score; bestX = x; }
  }
  return bestX;
}
function campaign(seed) {
  const { test: t, els, env } = boot(seed), P = env.ClawProgression;
  t.newRun(); t.get().run.seed = seed;
  const report = { seed, won: false, highestFloor: 1, drops: 0, collected: 0, credits: 0, softlock: null, chambers: [], purchases: [] };
  let frames = 0, decisions = 0, chamber;
  function advance() { t.update(STEP); frames++; }
  while (decisions++ < 1000 && frames < 1000000) {
    let state = t.get(), run = state.run;
    report.highestFloor = Math.max(report.highestFloor, run.floor);
    if (state.phase === 'over') { report.won = !!run.won; break; }
    if (state.paused) {
      const buttons = els.get('#choices').children;
      let index = -1;
      if (run.stage === 'reward') {
        index = run.pendingUpgrades.reduce((best, id, i, ids) => upgradeScore(id, run) > upgradeScore(ids[best], run) ? i : best, 0);
      } else if (run.stage === 'route') {
        const routes = P.routeChoices(run);
        const target = run.hp < run.maxHp * .8 && routes.some(r => r.id === 'rest') ? 'rest'
          : run.coins >= 25 && routes.some(r => r.id === 'shop') ? 'shop'
          : routes.some(r => r.id === 'combat') ? 'combat' : 'rest';
        index = routes.findIndex(r => r.id === target);
      } else if (run.stage === 'shop') {
        const offers = P.shopOffers(run);
        const ranked = offers.map((o, i) => ({ o, i, score: o.id === 'repair'
          ? (run.hp <= run.maxHp - 12 ? 160 : -1) : upgradeScore(o.id.slice(8), run) }));
        ranked.sort((a, b) => b.score - a.score);
        const buy = ranked.find(({ o, score }) => !o.disabled && score >= 68 && run.coins - o.price >= 8);
        index = buy ? buy.i : offers.length;
        if (buy) report.purchases.push({ floor: run.floor, id: buy.o.id });
      } else if (run.stage === 'battle' && run.drops <= 0) {
        index = 0; report.credits++;
      }
      if (index < 0 || !buttons[index] || buttons[index].disabled) {
        report.softlock = 'Unhandled or disabled menu at ' + run.stage; break;
      }
      buttons[index].onclick();
      continue;
    }
    if (state.phase !== 'aim') {
      let waits = 0;
      while (!t.get().paused && !['aim', 'over'].includes(t.get().phase) && waits++ < 3600) advance();
      if (waits >= 3600) { report.softlock = 'Phase failed to resolve: ' + t.get().phase; break; }
      continue;
    }
    if (!chamber || chamber.floor !== run.floor) {
      chamber = { floor: run.floor, hpIn: run.hp, drops: 0, delivered: 0, hpOut: run.hp, enemyHp: run.enemy.hp };
      report.chambers.push(chamber);
    }
    // Reposition only at the normal aiming boundary, then use the real drop cycle.
    state.claw.x = aim(state); t.engine.reset();
    const before = run.totalCollected;
    t.drop(); report.drops++; chamber.drops++;
    let waits = 0;
    while (!t.get().paused && !['aim', 'over'].includes(t.get().phase) && waits++ < 3600) advance();
    chamber.delivered += run.totalCollected - before;
    chamber.hpOut = run.hp; chamber.enemyHp = run.enemy.hp;
    if (waits >= 3600) { report.softlock = 'Drop failed to resolve: ' + t.get().phase; break; }
  }
  const state = t.get();
  if (decisions >= 1000 || frames >= 1000000) report.softlock = 'Simulation budget exceeded';
  report.collected = state.run.totalCollected;
  report.hpRemaining = state.run.hp;
  report.coinsRemaining = state.run.coins;
  report.upgrades = state.run.relics;
  report.simulatedSeconds = Math.round(frames * STEP);
  return report;
}

if (require.main === module) {
  const seeds = process.argv.slice(2).map(Number);
  const results = (seeds.length ? seeds : [101, 202, 303, 404, 505]).map(seed => {
    const result = campaign(seed); console.log(JSON.stringify(result)); return result;
  });
  console.log(JSON.stringify({ summary: {
    runs: results.length, wins: results.filter(r => r.won).length,
    highestFloors: results.map(r => r.highestFloor), softlocks: results.filter(r => r.softlock).length,
    averageDrops: +(results.reduce((sum, r) => sum + r.drops, 0) / results.length).toFixed(1),
    note: 'A heuristic simulation checks reachability and mechanics; it does not establish human difficulty or mobile feel.'
  } }));
}
module.exports = { campaign, aim };
