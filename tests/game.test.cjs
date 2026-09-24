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
 env.ClawPhysics=require('../physics.js');for(const f of ['progression.js','art.js'])vm.runInContext(fs.readFileSync(path.join(base,f),'utf8'),env);
 const source=fs.readFileSync(path.join(base,'game.js'),'utf8').replace(/\}\)\(\);\s*$/,`window.test={get:()=>({run,claw,balls,phase,paused,delivered,totals}),update,drop,newRun,startFloor,pause,closeModal,setPhase,render,engine,checkpoint,restore,reward,showRoute,showShop,gameOver,enemyAttack,collectBall,showLoadouts,showWorkshop,showBuild,showMap};})();`);
 vm.runInContext(source,env);return {test:env.test,els,env,storage};
}
if(require.main!==module){module.exports={boot};return;}
const {test:t,els}=boot();
function advance(seconds){for(let n=0;n<seconds*120;n++)t.update(1/120)}
function playDrop(x){t.get().claw.x=x;t.engine.reset();t.drop();let n=0;while(!['aim','reward','over'].includes(t.get().phase)&&!t.get().paused&&n++<2400)t.update(1/120);assert.ok(n<2400,'grab cycle must finish');return t.get().delivered.length}
const catches=[];
for(const x of [145,210,300,355]){t.newRun();catches.push(playDrop(x));const s=t.get();for(const b of s.balls.filter(b=>b.alive)){assert.ok(Number.isFinite(b.x)&&Number.isFinite(b.y));assert.ok(b.x>=12+b.r-.01&&b.x<=408-b.r+.01,'walls contain tokens');if(b.x>=84)assert.ok(b.y<=326-b.r+.01,'pile floor contains tokens')}assert.equal(s.run.totalCollected,s.delivered.length,'only delivered tokens count')}
assert.ok(catches.some(n=>n>=3),'a physical multi-item scoop must be possible');
t.newRun();t.drop();advance(.25);t.pause();const frozen=t.get().claw.y;advance(1);assert.equal(t.get().claw.y,frozen,'pause stops simulation');t.closeModal();advance(.25);assert.notEqual(t.get().claw.y,frozen);
t.newRun();t.get().run.size=3;t.get().run.capacity=8;t.startFloor();assert.ok(playDrop(245)>=1,'large claw can deliver');
t.newRun();t.get().balls.length=0;assert.equal(playDrop(245),0,'empty grab completes without inventing cargo');assert.ok(t.get().run.hp<t.get().run.maxHp,'empty grab gives enemy a turn');
t.render();console.log('Integration passed:',{edgeAndCenterCatches:catches,pause:true,upgradedClaw:true,emptyGrab:true});
