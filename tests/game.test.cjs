const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const base=path.resolve(__dirname,'..');
function boot(seed=1234,storage=new Map()){
 const els=new Map();
 const context=new Proxy({}, {get(o,k){return o[k]??(k.startsWith('create')?()=>({addColorStop(){}}):()=>{})},set(o,k,v){o[k]=v;return true}});
 class Element{constructor(){this.style={};this.children=[];this.open=false;this.disabled=false;this.listeners={};this.classList={add(){},remove(){},toggle(){}}}setAttribute(){}addEventListener(t,f){this.listeners[t]=f}append(e){this.children.push(e)}replaceChildren(){this.children=[]}getContext(){return context}showModal(){this.open=true}close(){this.open=false}getBoundingClientRect(){return {left:0,width:420,height:340}}setPointerCapture(){}}
 const math=Object.create(Math);math.random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296};
 const env={console,Math:math,Map,Set,document:{hidden:false,querySelector(s){if(!els.has(s))els.set(s,new Element());return els.get(s)},createElement:()=>new Element(),addEventListener(){}},localStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v),removeItem:k=>storage.delete(k)},requestAnimationFrame(){},addEventListener(){},setTimeout(){},devicePixelRatio:1};env.window=env;vm.createContext(env);
 env.ClawPhysics=require('../physics.js');for(const f of ['progression.js','art.js','loot.js'])vm.runInContext(fs.readFileSync(path.join(base,f),'utf8'),env);
 const source=fs.readFileSync(path.join(base,'game.js'),'utf8').replace(/\}\)\(\);\s*$/,`window.test={get:()=>({run,claw,balls,phase,paused,delivered,totals}),update,drop,newRun,startFloor,pause,closeModal,setPhase,render,engine,checkpoint,restore,reward,showRoute,showShop,gameOver,enemyAttack,collectBall,showLoadouts,showWorkshop,showBuild,showMap,closeGrip,jawPoints};})();`);
 vm.runInContext(source,env);return {test:env.test,els,env,storage};
}
if(require.main!==module){module.exports={boot};return;}
const {test:t,els}=boot();
function advance(seconds){for(let n=0;n<seconds*120;n++)t.update(1/120)}
function playDrop(x){t.get().claw.x=x;t.engine.reset();t.drop();let n=0;while(!['aim','reward','over'].includes(t.get().phase)&&!t.get().paused&&n++<2400)t.update(1/120);assert.ok(n<2400,'grab cycle must finish');return t.get().delivered.length}
const catches=[];
for(const x of [145,210,300,355]){t.newRun();catches.push(playDrop(x));const s=t.get();for(const b of s.balls.filter(b=>b.alive)){assert.ok(Number.isFinite(b.x)&&Number.isFinite(b.y));for(const p of b.parts||[{x:0,y:0,r:b.r}]){const x=b.x+p.x*Math.cos(b.angle)-p.y*Math.sin(b.angle),y=b.y+p.x*Math.sin(b.angle)+p.y*Math.cos(b.angle);assert.ok(x>=12+p.r-.1&&x<=408-p.r+.1,'walls contain physical silhouettes');if(x>=84)assert.ok(y<=326-p.r+.1,'floor contains physical silhouettes')}}assert.equal(s.run.totalCollected,s.delivered.length,'only delivered tokens count')}
assert.ok(catches.some(n=>n>=3),'a physical multi-item scoop must be possible');
t.newRun();t.drop();advance(.25);t.pause();const frozen=t.get().claw.y;advance(1);assert.equal(t.get().claw.y,frozen,'pause stops simulation');t.closeModal();advance(.25);assert.notEqual(t.get().claw.y,frozen);
t.newRun();t.get().run.size=3;t.get().run.capacity=8;t.startFloor();assert.ok(playDrop(245)>=1,'large claw can deliver');
t.newRun();t.get().balls.length=0;assert.equal(playDrop(245),0,'empty grab completes without inventing cargo');assert.ok(t.get().run.hp<t.get().run.maxHp,'empty grab gives enemy a turn');

// The same main button changes to Close Now during descent. It must stop at
// the player's chosen height, without charging a second drop or teleporting.
t.newRun();
const beforeManual=t.get().run.drops;
els.get('#drop').onclick();advance(.4);
assert.equal(t.get().phase,'down');
const chosenDepth=t.get().claw.y;
els.get('#drop').onclick();
assert.equal(t.get().phase,'close','Close Now immediately starts the squeeze');
assert.equal(t.get().run.drops,beforeManual-1,'manual closure never spends another drop');
advance(.1);
assert.equal(t.get().claw.y,chosenDepth,'manual closure preserves the selected height');
let manualFrames=0;
while(!['aim','reward','over'].includes(t.get().phase)&&!t.get().paused&&manualFrames++<1800)t.update(1/120);
assert.ok(manualFrames<1800,'a deliberately early manual closure completes normally');

// Rapid repeated input previously closed the jaws at y=40, before descent.
// The same guard must cover direct button/keyboard actions and canvas taps.
t.newRun();
const rapidDrops=t.get().run.drops,rapidStartY=t.get().claw.y;
els.get('#drop').onclick();els.get('#drop').onclick();
assert.equal(t.get().phase,'down','double pressing Grab cannot close at the rail');
assert.equal(t.get().claw.y,rapidStartY,'second input arrives before any descent frame');
assert.equal(els.get('#drop').disabled,true,'Close Now stays unavailable during initial descent');
assert.equal(els.get('#dropLabel').textContent,'LOWERING');
for(let i=0;i<6;i++){
 t.drop();
 els.get('#machineCanvas').listeners.pointerdown({clientX:210,pointerId:7,preventDefault(){}});
 advance(.01);
 assert.equal(t.get().phase,'down','repeated button and canvas input cannot bypass descent');
}
advance(.32);
assert.ok(t.get().claw.y-rapidStartY>=70,'claw visibly descends before closure is armed');
assert.equal(els.get('#drop').disabled,false,'Close Now arms after physical descent');
assert.equal(els.get('#dropLabel').textContent,'CLOSE NOW');
const armedY=t.get().claw.y;
els.get('#machineCanvas').listeners.pointerdown({clientX:210,pointerId:8,preventDefault(){}});
assert.equal(t.get().phase,'close','canvas depth control still works after descent');
assert.equal(t.get().claw.y,armedY,'armed closure preserves the chosen depth');
assert.equal(t.get().run.drops,rapidDrops-1,'repeated inputs consume only one drop');

// Exercise the actual mobile pointer handlers. A tap only aims; dragging then
// releasing queues exactly one drop after the carriage reaches that location.
const canvas=els.get('#machineCanvas');
const pointer=clientX=>({clientX,pointerId:7,preventDefault(){}});
t.newRun();
canvas.listeners.pointerdown(pointer(250));canvas.listeners.pointerup(pointer(250));advance(.3);
assert.equal(t.get().phase,'aim','a tap adjusts aim without dropping');
assert.ok(Math.abs(t.get().claw.x-250)<2,'tap aiming reaches the requested position');
const beforeDrag=t.get().run.drops;
canvas.listeners.pointerdown(pointer(250));canvas.listeners.pointermove(pointer(315));canvas.listeners.pointerup(pointer(315));
assert.equal(t.get().phase,'aim','release waits for the carriage to arrive');
advance(.3);
assert.equal(t.get().phase,'down','drag release automatically starts a grab');
assert.ok(Math.abs(t.get().claw.x-315)<2,'automatic drop occurs at the selected aim');
assert.equal(t.get().run.drops,beforeDrag-1,'drag release spends exactly one drop');
canvas.listeners.pointerdown(pointer(315));
assert.equal(t.get().phase,'down','a follow-up tap after drag release cannot close at the rail');

// Interrupted gestures must never become accidental drops.
t.newRun();const beforeCancel=t.get().run.drops;
canvas.listeners.pointerdown(pointer(210));canvas.listeners.pointermove(pointer(285));canvas.listeners.pointercancel(pointer(285));canvas.listeners.pointerup(pointer(285));advance(.4);
assert.equal(t.get().phase,'aim','cancelled dragging does not trigger a grab');
assert.equal(t.get().run.drops,beforeCancel,'cancelled gesture does not consume a drop');
t.render();console.log('Integration passed:',{edgeAndCenterCatches:catches,pause:true,upgradedClaw:true,emptyGrab:true,manualClose:true,minimumDescent:true,rapidInput:true,dragRelease:true,cancelledGesture:true});
