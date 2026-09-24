const assert=require('node:assert/strict');
const {boot}=require('./game.test.cjs');
const {test:t,els,env,storage}=boot(481516);
const P=env.ClawProgression;
const advance=seconds=>{for(let i=0;i<seconds*120;i++)t.update(1/120)};
const choice=index=>{const c=els.get('#choices').children[index];assert(c&&!c.disabled,'choice available');c.onclick()};
t.newRun();
// Full 12-chamber state flow, including elite double rewards and merchant purchases.
// Defeats are injected here to isolate progression; physical grabs have separate tests.
for(let floor=1;floor<=12;floor++){
 const r=t.get().run;assert.equal(r.floor,floor);r.enemy.hp=0;t.reward();
 if(floor===12)break;
 const picks=r.enemy.elite?2:1;
 for(let i=0;i<picks;i++){assert.equal(r.stage,'reward');choice(0)}
 assert.equal(r.stage,'route');
 const routes=P.routeChoices(r);const ri=routes.findIndex(x=>floor===1?x.id==='elite':x.id==='shop');choice(ri<0?0:ri);
 if(r.stage==='shop'){
  r.hp=Math.max(1,r.hp-18);r.coins+=20;t.showShop();const before=r.hp,coins=r.coins;choice(0);assert(r.hp>before);assert(r.coins<coins);
  choice(els.get('#choices').children.length-1);
 }
 assert.equal(r.floor,floor+1);assert.equal(r.stage,'battle');
}
assert.equal(t.get().phase,'over');assert.equal(P.loadMeta().wins,1);assert.equal(P.loadMeta().runs,1);assert.equal(P.loadRun(),null);t.gameOver(true);assert.equal(P.loadMeta().wins,1,'finish idempotent');
// Save mid-grab: restore same physical bodies, counters, phase, and eventual result.
t.newRun();t.drop();advance(1.2);t.checkpoint();const snapshot=P.loadRun();assert(snapshot,'mid-grab saved');
const b=boot(999,storage);b.test.restore(snapshot);
assert.equal(b.test.get().phase,t.get().phase);assert.equal(b.test.get().claw.y,t.get().claw.y);assert.equal(b.test.get().run.drops,t.get().run.drops);
for(let i=0;i<1600;i++){t.update(1/120);b.test.update(1/120)}
assert.equal(b.test.get().run.totalCollected,t.get().run.totalCollected,'reload preserves delivery count');assert.equal(b.test.get().run.hp,t.get().run.hp);
// Guard/mend take their displayed turn without an unannounced strike.
t.newRun();let r=t.get().run;r.enemy=P.enemyFor(5);r.turn=1;r.enemy.hp-=15;const hp=r.hp;t.enemyAttack();assert.equal(r.hp,hp);assert.equal(r.enemy.hp,r.enemy.maxHp-4);
r.enemy=P.enemyFor(3);r.turn=0;t.enemyAttack();assert.equal(r.enemy.armor,7);assert.equal(r.hp,hp);
const token={type:'sword',x:30,y:400,alive:true};t.collectBall(token);assert.equal(r.enemy.hp,r.enemy.maxHp);assert.equal(r.enemy.armor,3);
// Every menu renders with the production art, with only canvas drawing calls mocked.
t.newRun();for(const f of [t.showMap,t.showBuild,t.showLoadouts,t.showWorkshop]){t.closeModal();f();t.render()}
console.log('Campaign passed: 12 chambers, elite rewards, shop, victory, idempotent records, mid-grab restore, armor, mend, menus.');
