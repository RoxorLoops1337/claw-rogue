'use strict';
const assert = require('node:assert/strict');
const { create } = require('../physics.js');
const dt = 1 / 120;
const token = (x, y, extra = {}) => ({ x, y, r: 13, vx: 0, vy: 0, alive: true, ...extra });
function advance(engine, balls, seconds, segments = () => []) {
  for (let frame = 0; frame < Math.round(seconds / dt); frame++) {
    engine.step(dt, balls, segments((frame + 1) * dt));
    for (const b of balls) {
      assert.ok([b.x, b.y, b.vx, b.vy, b.angle, b.spin].every(Number.isFinite), 'finite rigid body state');
    }
  }
}

// Exact touching contacts need floor friction, even when penetration is zero.
{
  const engine = create(), b = token(150, 312, { r: 14, vx: 100 });
  advance(engine, [b], 1);
  assert.equal(b.y, 312, 'a supported token stays on the floor');
  assert.ok(b.vx > 0 && b.vx < 60, 'floor friction slows a sliding token');
  assert.ok(b.angle > 2 && b.spin > 0, 'sliding converts into visible rolling');
  assert.ok(Math.abs(b.vx - b.spin * b.r) < 1, 'rolling contact has almost no slip');
}

// A moving physical cup can carry cargo; removing its surfaces releases cargo.
{
  const engine = create({ floor: 600 }), b = token(180, 144);
  const cup = (x, y) => [
    { id: 'base', ax: x - 32, ay: y, bx: x + 32, by: y, r: 3 },
    { id: 'left', ax: x - 32, ay: y - 55, bx: x - 32, by: y, r: 3 },
    { id: 'right', ax: x + 32, ay: y - 55, bx: x + 32, by: y, r: 3 },
  ];
  engine.reset(cup(180, 160));
  advance(engine, [b], .5, () => cup(180, 160));
  advance(engine, [b], 1, t => cup(180 + t * 60, 160 - t * 50));
  assert.ok(Math.abs(b.x - 240) < 22 && b.y < 100, 'contact forces lift and carry cargo');
  const releasedY = b.y;
  advance(engine, [b], .8);
  assert.ok(b.y > releasedY + 180, 'cargo falls freely without a hidden attachment');
}

// The chute really is open, while its divider prevents floor-level leakage.
{
  const engine = create({ chuteRight: 84, dividerTop: 145 });
  const falling = token(44, 240), supported = token(140, 250);
  advance(engine, [falling, supported], 1);
  assert.ok(falling.y > 500, 'chute cargo falls below the cabinet');
  assert.ok(supported.y <= 313, 'pile cargo remains on the actual floor');
  const fast = token(160, 250, { vx: -1000 });
  advance(engine, [fast], .2);
  assert.ok(fast.x >= 99.5, 'high-speed cargo cannot cross the chute divider');
}

// A dense mobile-sized pile settles without explosive velocities or deep overlap.
let stressMs;
{
  const engine = create(), balls = [];
  for (let row = 0; row < 6; row++) {
    for (let col = 0; col < 12; col++) balls.push(token(27 + col * 30 + (row % 2) * 5, 300 - row * 27));
  }
  const started = performance.now();
  advance(engine, balls, 10);
  stressMs = Math.round(performance.now() - started);
  assert.ok(Math.max(...balls.map(b => Math.hypot(b.vx, b.vy))) < 3, 'pile reaches a quiet rest');
  for (let i = 0; i < balls.length; i++) {
    const a = balls[i];
    assert.ok(a.x >= 12 + a.r && a.x <= 408 - a.r && a.y <= 326 - a.r, 'cabinet contains pile');
    for (const b of balls.slice(i + 1)) assert.ok(a.r + b.r - Math.hypot(a.x - b.x, a.y - b.y) < 2, 'no deep resting interpenetration');
  }
}

// Inactive cargo is never simulated, and zero elapsed time never changes state.
{
  const engine = create(), b = token(200, 100, { alive: false });
  const original = { ...b };
  engine.step(0, [b]);
  engine.step(dt, [b]);
  assert.deepEqual(b, original);
}
console.log('Physics passed: rolling, moving contact carry, free release, real chute, divider, 72-token rest.', { stressMs });
