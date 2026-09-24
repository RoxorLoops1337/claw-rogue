(()=>{'use strict';
const $=s=>document.querySelector(s), machine=$('#machineCanvas'), battle=$('#battleCanvas'),ctx=machine.getContext('2d'),art=battle.getContext('2d');
const MW=420,MH=340,LEFT=12,RIGHT=408,FLOOR=326,STEP=1/120,CHUTE=84;
const P=ClawProgression, A=ClawArt;
const engine=ClawPhysics.create({left:LEFT,right:RIGHT,floor:FLOOR,chuteRight:CHUTE,dividerTop:145});
let delivered=[],totals={damage:0,block:0,heal:0,coins:0},contactInfo={},lastDelivery=0,gripCount=0;
let run,claw,balls=[],effects=[],floaters=[],phase='aim',phaseTime=0,clock=0,last=0,accumulator=0,paused=false,modalMode='',leftHeld=false,rightHeld=false,aimTarget=null,shake=0,battlePulse=0,enemyPulse=0,combo=0,comboTime=0,best=0;
try{best=Number(localStorage.getItem('clawbound-best'))||0}catch{}
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n)),rand=(a,b)=>a+Math.random()*(b-a),lerp=(a,b,t)=>a+(b-a)*t;
const TYPES={sword:{name:'Sword',color:'#ff9b88',rim:'#ffe2c4',dark:'#743948',damage:4},shield:{name:'Shield',color:'#81d7e6',rim:'#ccf8f2',dark:'#225a73',block:4},heart:{name:'Heart',color:'#f292bb',rim:'#ffdbdf',dark:'#7f385d',heal:3},spark:{name:'Spark',color:'#b9a0f1',rim:'#e9deff',dark:'#58427c',damage:6},coin:{name:'Coin',color:'#f3cd76',rim:'#fff0bc',dark:'#89613b',coins:2},stone:{name:'Scrap',color:'#91acb8',rim:'#ccdae0',dark:'#405a70',damage:1}};
const weighted=['sword','sword','sword','sword','shield','shield','heart','heart','spark','coin','stone'];
let audio=null,muted=false,saveClock=0,started=false;
const reducedMotion=window.matchMedia?.('(prefers-reduced-motion: reduce)').matches||false;
try{muted=localStorage.getItem('clawbound-muted')==='true'}catch{}
function sound(kind,count=0){if(muted||document.hidden)return;try{audio=audio||new(window.AudioContext||window.webkitAudioContext)();if(audio.state==='suspended')audio.resume();const tone=(freq,end,length,volume=.045,wave='sine',delay=0)=>{const o=audio.createOscillator(),g=audio.createGain(),t=audio.currentTime+delay;o.type=wave;o.frequency.setValueAtTime(freq,t);o.frequency.exponentialRampToValueAtTime(end,t+length);g.gain.setValueAtTime(.001,t);g.gain.exponentialRampToValueAtTime(volume,t+.012);g.gain.exponentialRampToValueAtTime(.001,t+length);o.connect(g);g.connect(audio.destination);o.start(t);o.stop(t+length+.02)};if(kind==='drop')tone(130,78,.35,.025,'triangle');if(kind==='grip'){tone(240,100,.075,.035,'square');tone(160,90,.09,.025,'triangle',.08)}if(kind==='release')tone(270,430,.13,.025);if(kind==='collect'){let f=420*Math.pow(1.12,Math.min(count,10));tone(f,f*1.5,.19,.045);tone(f*2,f*2,.23,.018,'sine',.05)}if(kind==='hit')tone(170,52,.18,.045,'triangle')}catch{}}
function toggleSound(){muted=!muted;try{localStorage.setItem('clawbound-muted',String(muted))}catch{}$('#sound').textContent=muted?'♩':'♪';$('#sound').setAttribute('aria-label',muted?'Enable sound':'Mute sound');$('#sound').setAttribute('aria-pressed',String(!muted));if(!muted)sound('collect',1)}
function message(text){$('#status').textContent=text}
function updateUI(){
 $('#coins').textContent=run.coins;
 $('#floor').textContent='CHAMBER '+String(run.floor).padStart(2,'0');
 $('#zone').textContent=run.enemy.boss?'GUARDIAN CHAMBER':P.actFor(run.floor).name;
 $('#heroHp').textContent=`${run.hp}/${run.maxHp}`;
 $('#heroBar').style.width=(100*run.hp/run.maxHp)+'%';
 $('#enemyHp').textContent=`${Math.max(0,run.enemy.hp)}/${run.enemy.maxHp}`;
 $('#enemyBar').style.width=(100*Math.max(0,run.enemy.hp)/run.enemy.maxHp)+'%';
 $('#enemyName').textContent=run.enemy.name;
 $('#shield').textContent=`◇ ${run.shield} BLOCK`;
 const intent=P.intentFor(run.enemy,run.turn||0);
 $('#intent').textContent=intent.label+(run.enemy.armor?` · ◇ ${run.enemy.armor}`:'');
 $('#drops').textContent=run.drops;
 $('#drop').disabled=phase!=='aim'||paused;
 $('#left').disabled=$('#right').disabled=phase!=='aim'||paused;
 $('#dropLabel').textContent=paused?'PAUSED':({aim:'GRAB',down:'LOWERING',close:'SCOOPING',up:'LIFTING',carry:'DELIVERING',release:'LOOT!',resolve:'YOUR TURN',enemy:'INCOMING',return:'RETURNING',reward:'CHAMBER CLEAR',over:'RUN COMPLETE'}[phase]||'GRAB');
 $('#clawLabel').textContent=run.size>=2?'TITAN CLAW':run.size?'WIDE CLAW':'BRASS CLAW';
 $('#load').textContent=claw.held.length+' IN SCOOP';
 $('#capacity').setAttribute('aria-label',`Grip strength: ${Math.round(run.grip*100)} percent`);
 $('#capacity').innerHTML=Array.from({length:5},(_,i)=>`<i class="${i<Math.round(run.grip*3)?'loaded':''}"></i>`).join('');
 $('#routeDots').innerHTML=Array.from({length:12},(_,i)=>`<i class="route-dot ${i+1<run.floor?'done':i+1===run.floor?'current':''} ${(i+1)%4===0?'boss':''}"></i>`).join('');
 $('.hint').textContent='DRAG TO AIM · COLLECT THROUGH THE LEFT CHUTE';
 $('#inventory').replaceChildren();
 Object.entries(run.relics).slice(-3).forEach(([id,count])=>{
  const u=P.UPGRADES.find(u=>u.id===id); if(!u)return;
  const el=document.createElement('span');el.className='relic-tag';el.textContent=`${u.mark} ${u.name}${count>1?' ×'+count:''}`;$('#inventory').append(el);
 });
 $('#build').textContent=`BUILD · ${Object.values(run.relics).reduce((a,b)=>a+b,0)}`;
}

function newBall(x,y,type){return {x,y,oldX:x,oldY:y,vx:rand(-5,5),vy:0,r:12.8+Math.random()*1.5,type,angle:rand(-.5,.5),spin:rand(-1,1),held:false,alive:true}}
function fillPile(){balls=[];for(let row=0;row<6;row++)for(let col=0;col<10-(row%2);col++){let type=weighted[Math.floor(Math.random()*weighted.length)];balls.push(newBall(108+col*29+(row%2)*14.5+rand(-1,1),FLOOR-15-row*25.3,type))}for(let i=balls.length-12;i<balls.length;i+=3)balls[i].type=i%2?'sword':'spark';}
function setPhase(value){phase=value;phaseTime=0;updateUI()}
function startFloor(){
 run.stage='battle'; run.turn=0; run.enemy=P.enemyFor(run.floor,run.routeKind||'combat');
 run.drops=6+run.extraDrops+(run.enemy.boss?2:0);
 run.shield=Math.min(run.shield,12)+(run.startShield||0);
 claw={x:210,y:48,open:1,held:[],prevX:210,prevY:48,depth:FLOOR-82,contactTime:0};
 delivered=[];totals={damage:0,block:0,heal:0,coins:0};gripCount=0;
 effects=[];floaters=[];combo=0;leftHeld=rightHeld=false;aimTarget=null;
 fillPile();engine.reset(jawSegments());for(let i=0;i<100;i++)physics(STEP);
 setPhase('aim');message(run.enemy.boss?'Guardian ahead. Watch its next move.':'Aim for the loot your build needs.');checkpoint();
}
function newRun(loadout='scrapper'){
 closeModal();started=true;P.clearRun();run=P.createRun(loadout);startFloor();
}

function halfWidth(){return 50+Math.min(run.size,3)*12}
function jawPoints(){let w=halfWidth(),closed=1-claw.open;return [-1,1].map(s=>[{x:claw.x+s*10,y:claw.y+6},{x:claw.x+s*w,y:claw.y+35},{x:claw.x+s*w*.82,y:claw.y+64},{x:claw.x+s*(w*.62*(1-closed)+5*closed),y:claw.y+77}])}
function jawSegments(){const segments=[];jawPoints().forEach((jaw,side)=>{for(let i=0;i<jaw.length-1;i++)segments.push({ax:jaw[i].x,ay:jaw[i].y,bx:jaw[i+1].x,by:jaw[i+1].y,r:3.5,id:`jaw-${side}-${i}`})});segments.push({ax:claw.x-10,ay:claw.y+3,bx:claw.x+10,by:claw.y+3,r:8,id:'hub'});return segments}
function drop(){if(phase!=='aim'||paused||run.drops<1)return;run.drops--;leftHeld=rightHeld=false;aimTarget=null;claw.open=1;claw.contactTime=0;claw.depth=FLOOR-82;claw.homeX=claw.x;delivered=[];totals={damage:0,block:0,heal:0,coins:0};lastDelivery=clock;gripCount=0;setPhase('down');checkpoint();sound('drop');message('The jaws will close when the hub reaches the pile.');}
function physics(dt){engine.config.jawFriction=run.grip||.85;contactInfo=engine.step(dt,balls,jawSegments());for(const b of balls){if(!b.alive)continue;if(b.x<CHUTE&&b.y-b.r>MH+6)collectBall(b)}if(['up','carry','release'].includes(phase)){claw.held=balls.filter(b=>b.alive&&Math.abs(b.x-claw.x)<halfWidth()+b.r&&b.y>claw.y+8&&b.y<claw.y+93);if(claw.held.length!==gripCount){gripCount=claw.held.length;updateUI()}}else claw.held=[];}
function capture(){// Feedback only: every token remains a free physical body.
claw.held=balls.filter(b=>b.alive&&Math.abs(b.x-claw.x)<halfWidth()&&b.y>claw.y+10&&b.y<claw.y+91);combo=claw.held.length;comboTime=1.7;message(combo?'Lifting carefully. Loose items can slip.':'Empty scoop. Try a denser cluster.');sound('grip');updateUI()}
function hurtEnemy(amount){
 const blocked=Math.min(run.enemy.armor||0,amount);run.enemy.armor=Math.max(0,(run.enemy.armor||0)-blocked);
 const damage=amount-blocked;run.enemy.hp=Math.max(0,run.enemy.hp-damage);return damage;
}
function collectBall(b){
 b.alive=false;delivered.push(b);lastDelivery=clock;
 const t=TYPES[b.type];
 let damage=(t.damage||0)+(b.type==='sword'?run.blade:0)+(b.type==='spark'?run.spark:0)+(b.type==='stone'?(run.salvage||0):0);
 const block=(t.block||0)+(b.type==='shield'?run.block:0),heal=(t.heal||0)+(b.type==='heart'?(run.healBonus||0):0),coins=(t.coins||0)+(b.type==='coin'?(run.coinBonus||0):0);
 if(b.type==='spark'&&run.chain)damage+=Math.min(3,delivered.filter(x=>x.type==='spark').length-1)*run.chain;
 damage=hurtEnemy(damage);totals.damage+=damage;totals.block+=block;totals.heal+=heal;totals.coins+=coins;
 run.totalCollected++;run.shield+=block;run.hp=Math.min(run.maxHp,run.hp+heal);run.coins+=coins;
 burst(48,MH-15,t.color,8);
 if(damage){float('-'+damage,315,77,t.color);enemyPulse=.4;shake=3}
 if(block)float('+'+block+' BLOCK',95,55,t.color);
 if(heal)float('+'+heal+' HP',90,83,t.color);
 if(coins)float('+'+coins+' COINS',210,46,t.color);
 sound('collect',delivered.length);updateUI();
}

function burst(x,y,color,count=12){for(let i=0;i<count;i++)effects.push({x,y,vx:rand(-80,80),vy:rand(-120,20),life:rand(.35,.7),max:.7,color})}
function float(text,x,y,color){floaters.push({text,x,y,color,life:1.3})}
function resolveLoot(){if(delivered.length>=4&&run.haul){totals.damage+=hurtEnemy(run.haul);float('HAUL +'+run.haul,315,50,'#d8ff9f')}claw.held=[];combo=delivered.length;comboTime=1.5;const {damage,block,heal,coins}=totals;const summary=[damage?damage+' damage':'',block?block+' block':'',heal?heal+' healing':'',coins?coins+' coins':''].filter(Boolean).join(' · ');message(summary||'Nothing reached the chute. The enemy has an opening.');setPhase('resolve');}
function enemyAttack(){
 const intent=P.intentFor(run.enemy,run.turn||0);run.turn=(run.turn||0)+1;
 if(intent.type==='guard'){
  run.enemy.armor=(run.enemy.armor||0)+intent.armor;
  float('+'+intent.armor+' GUARD',315,66,'#96dadb');message(run.enemy.name+' reinforces its armour.');
 }else if(intent.type==='mend'){
  run.enemy.hp=Math.min(run.enemy.maxHp,run.enemy.hp+intent.heal);float('REPAIR +'+intent.heal,315,66,'#b3e2a5');message('The guardian repairs itself. Press the attack.');
 
 }else{
  sound('hit');let incoming=intent.damage,blocked=Math.min(run.shield,incoming),damage=incoming-blocked;
  run.shield-=blocked;run.hp=Math.max(0,run.hp-damage);battlePulse=.65;shake=damage?7:2;
  float(damage?'-'+damage:'BLOCKED',95,66,damage?'#ff9d96':'#9fe9ef');
  if(blocked&&run.thorns)hurtEnemy(run.thorns);
  message(damage?`Enemy hit for ${damage}${blocked?' · '+blocked+' blocked':''}.`:'Your shields absorbed the attack.');
 }
 setPhase('enemy');checkpoint();
}
function mapMarkup(){
 return `<div class="chapter-map" aria-label="Campaign progress">${Array.from({length:12},(_,i)=>`<span class="map-node ${i+1<run.floor?'done':i+1===run.floor?'current':''} ${(i+1)%4===0?'boss':''}">${i+1<run.floor?'✓':(i+1)%4===0?'♜':i+1}</span>`).join('')}</div>`;
}
function reward(){
 if(run.stage!=='reward'){
  const loot=P.clearReward(run);run.rewardsLeft=loot.choices;
  run.cleared=run.floor;
  run.hp=Math.min(run.maxHp,run.hp+(run.onWinHeal||0));
  if(run.floor>=12){gameOver(true);return;}
  run.stage='reward';run.pendingUpgrades=P.upgradeChoices(run,3).map(u=>u.id);
 }
 setPhase('reward');checkpoint();
 const picks=run.pendingUpgrades.map(id=>P.UPGRADES.find(u=>u.id===id)).filter(Boolean);
 openModal('reward',run.enemy.boss?'GUARDIAN DEFEATED':'CHAMBER CLEARED','Build something powerful.','Choose one permanent upgrade for this expedition.',picks.map(u=>({mark:u.mark,title:u.name,desc:u.desc,action:()=>{
  P.applyUpgrade(run,u.id);run.rewardsLeft--;run.pendingUpgrades=[];closeModal();if(run.rewardsLeft>0){run.pendingUpgrades=P.upgradeChoices(run,3).map(u=>u.id);reward()}else{run.stage='route';showRoute()}
 }})),mapMarkup());
}
function showRoute(){
 run.stage='route';checkpoint();
 const choices=P.routeChoices(run);
 openModal('route','THE EXPEDITION','Choose your next path.',`Chamber ${run.floor+1} awaits. ${run.hp}/${run.maxHp} health · ${run.coins} coins`,choices.map(r=>({mark:r.mark,title:r.name,desc:r.desc,action:()=>{
  const result=P.applyRoute(run,r.id);if(!result)return;run.floor++;run.act=Math.ceil(run.floor/4);closeModal();
  if(result.opensShop){showShop();return;}
  startFloor();
 }})),mapMarkup());
}
function showShop(){
 run.stage='shop';checkpoint();
 const offers=P.shopOffers(run);
 openModal('shop','THE TINKER’S WORKSHOP','Make every coin count.',`Your purse: ${run.coins} coins. Repairs and upgrades last for this run.`,[
  ...offers.map(o=>({mark:o.mark||'✦',title:`${o.name} · ${o.price} coins`,desc:o.desc,disabled:run.coins<o.price||o.disabled,action:()=>{P.buy(run,o.id);showShop()}})),
  {mark:'→',title:'Enter the next chamber',desc:'Leave the workshop and continue.',action:()=>{closeModal();run.stage='battle';startFloor()}}
 ],mapMarkup());
}
function gameOver(won){
 run.stage='over';run.won=won;P.finishRun(run,won);P.clearRun();setPhase('over');
 const meta=P.loadMeta();
 openModal('over',won?'THE VAULT IS YOURS':'EXPEDITION COMPLETE',won?'A little machine. A mighty legend.':'Back to the workshop.',`Chamber ${run.floor}/12 · ${run.totalCollected} treasures collected<br>${won?'All three guardians defeated.':'Every expedition teaches you a better build.'}`, [
  {mark:'⚙',title:'Workshop',desc:'Spend earned embers on permanent improvements.',action:showWorkshop},
  {mark:'↻',title:'Choose a new expedition',desc:'Try a different loadout and a different build.',action:showLoadouts}
 ],`<div class="stat-grid"><div class="stat-card"><b>${meta.bestFloor||run.floor}</b><small>DEEPEST CHAMBER</small></div><div class="stat-card"><b>${meta.wins||0}</b><small>VAULTS OPENED</small></div></div>`);
}
function credit(){
 if(run.coins<8){gameOver(false);return;}
 openModal('credit','POWER DEPLETED','Keep the machine running?',`Spend 8 coins for 3 more drops. You have ${run.coins} coins.`,[
  {mark:'ϟ',title:'Refuel · 8 coins',desc:'Add three drops to this chamber.',action:()=>{run.coins-=8;run.drops=3;closeModal();setPhase('return');checkpoint()}},
  {mark:'↗',title:'Retire this expedition',desc:'Keep your expedition record and unlocks.',action:()=>gameOver(false)}
 ]);
}
function checkpoint(){
 if(!started||!run||run.stage==='over')return;
 P.saveRun({run,claw:{...claw,held:[]},balls,phase,phaseTime,clock,delivered,totals,lastDelivery});
}
function restore(snapshot){
 run=snapshot.run;claw={...snapshot.claw,held:[]};balls=snapshot.balls;phase=snapshot.phase;phaseTime=snapshot.phaseTime||0;
 clock=snapshot.clock||0;delivered=snapshot.delivered||[];totals=snapshot.totals||{damage:0,block:0,heal:0,coins:0};lastDelivery=snapshot.lastDelivery||0;
 effects=[];floaters=[];engine.reset(jawSegments());started=true;closeModal();updateUI();
 if(run.stage==='reward')reward();else if(run.stage==='route')showRoute();else if(run.stage==='shop')showShop();else if(phase==='enemy'&&run.drops<=0&&phaseTime>.75)credit();
 else message('Expedition restored. Your next move awaits.');
}
function showLoadouts(){
 const options=P.loadouts?P.loadouts(P.loadMeta()):[{id:'scrapper',name:'The Scrapper',mark:'⚙',desc:'Balanced equipment. A dependable start.',unlocked:true}];
 openModal('loadouts','PREPARE YOUR EXPEDITION','Choose your machine.','Twelve chambers. Three guardians. One priceless power core.',options.map(l=>({mark:l.mark||'⚙',title:l.name,desc:l.unlocked?l.desc:l.requirement,disabled:l.unlocked===false,action:()=>{newRun(l.id);sound('collect');}})));
}
function welcome(snapshot){
 openModal('welcome','CLAWBOUND · THE SUNKEN VAULT','Fortune favours the claw.','Pilot a tiny salvager into a forgotten mechanical kingdom. Scoop your weapons. Forge your build. Crack the vault.',[
 ...(snapshot?[{mark:'▶',title:`Continue · chamber ${snapshot.run.floor}`,desc:'Resume your saved expedition.',action:()=>restore(snapshot)}]:[]),
 {mark:'✦',title:snapshot?'New expedition':'Begin expedition',desc:'Choose your machine and descend into the vault.',action:showLoadouts},
 {mark:'⚙',title:'Workshop',desc:'Permanent improvements and expedition records.',action:()=>showWorkshop(()=>welcome(snapshot))},
 {mark:'?',title:'How to play',desc:'Learn the claw, loot, and enemy intentions.',action:()=>help(()=>welcome(snapshot))}
 ],'<canvas class="modal-art" id="titleArt" width="680" height="180" aria-label="A brass salvager waits at the vault"></canvas>');
 const c=$('#titleArt');if(c){const g=c.getContext('2d');g.scale(680/420,1);A.battle(g,1,0);A.hero(g,210,120,1.2,0);}
}

function update(dt){if(paused)return;clock+=dt;phaseTime+=dt;claw.prevX=claw.x;claw.prevY=claw.y;
if(phase==='aim'){if(leftHeld||rightHeld){aimTarget=null;claw.x+=((rightHeld?1:0)-(leftHeld?1:0))*215*dt}else if(aimTarget!==null)claw.x+=clamp(aimTarget-claw.x,-320*dt,320*dt);claw.x=clamp(claw.x,CHUTE+halfWidth()+9,MW-halfWidth()-13);claw.open=lerp(claw.open,1,dt*8)}
if(phase==='return'){const goal=clamp(claw.homeX||210,CHUTE+halfWidth()+9,MW-halfWidth()-13);claw.x+=clamp(goal-claw.x,-190*dt,190*dt);if(Math.abs(goal-claw.x)<.1){setPhase('aim');message('Aim over the pile. Deliver your catch into the left chute.')}}
if(phase==='down'){claw.y=Math.min(claw.depth,claw.y+140*dt);claw.contactTime=(contactInfo.touchedIds||[]).includes('hub')?claw.contactTime+dt:0;if(claw.y>=claw.depth||claw.contactTime>.035){setPhase('close');sound('grip')}}
if(phase==='close'){claw.open=Math.max(0,1-phaseTime*1.5);if(phaseTime>.8){capture();setPhase('up')}}
if(phase==='up'){claw.y=Math.max(48,claw.y-95*dt);if(claw.y<=48)setPhase('carry')}
if(phase==='carry'){claw.x=Math.max(48,claw.x-110*dt);if(claw.x<=48){setPhase('release');sound('release')}}
if(phase==='release'){claw.open=Math.min(1,phaseTime*1.8);const pending=balls.some(b=>b.alive&&b.x<CHUTE&&b.y<MH+25);if(phaseTime>1.35&&!pending&&clock-lastDelivery>.25||phaseTime>4)resolveLoot()}
if(phase==='resolve'&&phaseTime>1.05){if(run.enemy.hp<=0)reward();else enemyAttack()}
if(phase==='enemy'&&phaseTime>.75){if(run.hp<=0)gameOver(false);else if(run.enemy.hp<=0)reward();else if(run.drops<=0)credit();else{setPhase('return');message('Returning to your last aim.')}}
if(paused)return;
physics(dt);comboTime=Math.max(0,comboTime-dt);shake*=Math.pow(.9,dt*60);battlePulse=Math.max(0,battlePulse-dt);enemyPulse=Math.max(0,enemyPulse-dt);for(const p of effects){p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=250*dt;p.life-=dt}effects=effects.filter(p=>p.life>0);for(const f of floaters){f.y-=15*dt;f.life-=dt}floaters=floaters.filter(f=>f.life>0);saveClock+=dt;if(saveClock>=1){saveClock=0;checkpoint()}
}
function rounded(g,x,y,w,h,r,fill,stroke){g.beginPath();g.roundRect(x,y,w,h,r);if(fill){g.fillStyle=fill;g.fill()}if(stroke){g.strokeStyle=stroke;g.stroke()}}
function ellipse(g,x,y,rx,ry,color){g.fillStyle=color;g.beginPath();g.ellipse(x,y,rx,ry,0,0,Math.PI*2);g.fill()}
function line(g,pts,color,width){g.strokeStyle=color;g.lineWidth=width;g.lineCap='round';g.lineJoin='round';g.beginPath();pts.forEach((p,i)=>i?g.lineTo(p.x,p.y):g.moveTo(p.x,p.y));g.stroke()}
function drawBall(g,b){A.ball(g,b,TYPES[b.type]);}
function drawMachine(){const g=ctx;g.clearRect(0,0,MW,MH);A.machine(g,{width:MW,height:MH,floor:FLOOR,chute:CHUTE,time:reducedMotion?0:clock});
if(phase==='aim'){g.save();g.setLineDash([3,6]);line(g,[{x:claw.x,y:claw.y+76},{x:claw.x,y:FLOOR-12}],'#c8f29b35',1);g.restore();ellipse(g,claw.x,FLOOR-8,halfWidth()*.9,6,'#b6ed7825')}
for(const b of balls)if(b.alive)drawBall(g,b);
A.claw(g,{x:claw.x,y:claw.y,jaws:jawPoints(),time:clock});
for(const p of effects){g.globalAlpha=p.life/p.max;ellipse(g,p.x,p.y,2.4,2.4,p.color)}g.globalAlpha=1;
if(comboTime>0&&combo>0){g.save();g.globalAlpha=Math.min(1,comboTime*2);const text=combo>=4?'BIG HAUL! ×'+combo:'NICE! ×'+combo;g.font='900 16px system-ui';g.textAlign='center';g.shadowColor='#08131d';g.shadowBlur=8;g.fillStyle=combo>=4?'#d8ff9f':'#edf7e4';g.fillText(text,MW/2,Math.max(67,claw.y-19));g.restore()}
g.textAlign='left';g.fillStyle='#ffffff04';g.beginPath();g.moveTo(20,0);g.lineTo(83,0);g.lineTo(173,MH);g.lineTo(141,MH);g.fill();
}
function robot(g,x,y,s,t){A.hero(g,x,y,s,reducedMotion?0:t)}
function monster(g,x,y,s,t,kind){A.enemy(g,x,y,s,reducedMotion?0:t,kind,run.enemy.act)}
function drawBattle(){const g=art;g.clearRect(0,0,420,180);A.battle(g,run.floor,reducedMotion?0:clock);
let heroX=101,enemyX=316;if(phase==='resolve'&&phaseTime<.45)heroX+=Math.sin(phaseTime/.45*Math.PI)*25;if(phase==='enemy'&&phaseTime<.35)enemyX-=Math.sin(phaseTime/.35*Math.PI)*25;g.save();if(shake>1&&!reducedMotion)g.translate(Math.sin(clock*60)*shake*.25,0);robot(g,heroX,116,run.hp<=0?.85:.9,clock);monster(g,enemyX,117,run.enemy.boss?.96:.95,clock,run.enemy.kind);if(run.shield>0){g.strokeStyle='#7cdaea77';g.lineWidth=2;g.beginPath();g.ellipse(heroX,110,41,48,0,-1.3,1.3);g.stroke()}if(phase==='resolve'&&phaseTime<.45){const p=phaseTime/.45;ellipse(g,lerp(heroX+30,enemyX,p),109-Math.sin(p*Math.PI)*16,7,4,'#e4faa6');ellipse(g,lerp(heroX+17,enemyX-12,p),112-Math.sin(p*Math.PI)*16,4,2,'#e4faa677')}g.restore();for(const f of floaters){g.save();g.globalAlpha=clamp(f.life*2,0,1);g.font='900 18px system-ui';g.textAlign='center';g.lineWidth=4;g.strokeStyle='#16292e';g.strokeText(f.text,f.x,f.y);g.fillStyle=f.color;g.fillText(f.text,f.x,f.y);g.restore()}}
function resizeCanvas(canvas,g,w,h){const dpr=Math.min(window.devicePixelRatio||1,2);const width=Math.round(w*dpr),height=Math.round(h*dpr);if(canvas.width!==width||canvas.height!==height){canvas.width=width;canvas.height=height}g.setTransform(dpr,0,0,dpr,0,0)}
function render(){resizeCanvas(machine,ctx,MW,MH);resizeCanvas(battle,art,420,180);drawMachine();drawBattle()}
function frame(t){if(document.hidden){last=t;requestAnimationFrame(frame);return;}const dt=Math.min(.05,(t-last)/1000||STEP);last=t;accumulator+=dt;while(accumulator>=STEP){update(STEP);accumulator-=STEP}render();requestAnimationFrame(frame)}
function closeModal(){if($('#modal').open)$('#modal').close();paused=false;modalMode='';leftHeld=rightHeld=false;aimTarget=null;$('#pause').textContent='Ⅱ'}
function openModal(mode,eyebrow,title,copy,choices,extra=''){paused=true;modalMode=mode;leftHeld=rightHeld=false;aimTarget=null;$('#modalEyebrow').textContent=eyebrow;$('#modalTitle').textContent=title;$('#modalCopy').innerHTML=copy;$('#modalExtra').innerHTML=extra;$('#choices').replaceChildren();for(const choice of choices){const b=document.createElement('button');b.className='choice';b.innerHTML=`<span class="choice-mark">${choice.mark}</span><span><b>${choice.title}</b><small>${choice.desc||''}</small></span><span class="arrow">›</span>`;b.disabled=!!choice.disabled;b.onclick=choice.action;$('#choices').append(b)}if(!$('#modal').open)$('#modal').showModal();updateUI()}
function help(back){
 if(paused&&!back)return;
 openModal('help','THE SALVAGER’S FIELD GUIDE','Aim. Scoop. Survive.','Drag across the glass or hold the arrows to aim. Press Grab. The jaws lift a physical scoop: loose items can slip. Only treasure delivered down the left chute powers your machine.',[
 {mark:'✓',title:back?'Back to the vault':'Keep playing',desc:'Watch the enemy’s next move before you grab.',action:back||(()=>{closeModal();updateUI()})}
 ],`<div class="legend">${Object.entries(TYPES).map(([id,t])=>`<div class="legend-row"><span class="sample" style="background:${t.color};color:${t.dark}">${{sword:'⚔',shield:'◇',heart:'♥',spark:'ϟ',coin:'●',stone:'▪'}[id]}</span><span>${t.name} · ${{sword:4+run.blade+' damage',shield:4+run.block+' block',heart:3+(run.healBonus||0)+' healing',spark:6+run.spark+' damage',coin:2+(run.coinBonus||0)+' coins',stone:1+(run.salvage||0)+' damage'}[id]}</span></div>`).join('')}</div><p class="modal-copy">Shields carry between attacks. Clear chambers to choose upgrades. Routes offer healing, merchants, or tougher enemies with better rewards. Defeat the guardians in chambers 4, 8, and 12.</p>`);
}
function showWorkshop(back=showLoadouts){
 const meta=P.loadMeta();
 openModal('workshop','PERMANENT PROGRESSION','The salvager’s workshop.',`You have ${meta.embers} embers. Earn more by completing expeditions. Improvements apply to new runs.`,[
 ...P.workshopOffers().map(o=>({mark:o.mark,title:`${o.name} · ${o.level}/${o.max}`,desc:o.level>=o.max?'Fully upgraded':`${o.price} embers · ${o.desc}`,disabled:o.level>=o.max||meta.embers<o.price,action:()=>{P.buyWorkshop(o.id);showWorkshop(back)}})),
 {mark:'→',title:'Back',desc:`${meta.runs} expeditions · ${meta.wins} victories · ${meta.totalCollected} treasures`,action:back}
 ]);
}
function showBuild(){
 if(paused)return;
 openModal('build','YOUR MACHINE','Anatomy of a salvager.',`Health ${run.hp}/${run.maxHp} · Grip ${Math.round(run.grip*100)}%`,[
 {mark:'✓',title:'Return to the machine',action:()=>{closeModal();updateUI()}}
 ],`<div class="legend">${Object.entries(run.relics).map(([id,count])=>{const u=P.upgradeById(id);return u?`<div class="legend-row"><span class="choice-mark">${u.mark}</span><span><b>${u.name} ×${count}</b><br>${u.desc}</span></div>`:''}).join('')||'<p class="modal-copy">Clear your first chamber to choose an upgrade.</p>'}</div>`);
}
function showMap(){
 if(paused)return;
 openModal('map','YOUR EXPEDITION','Three acts. One vault.',`Chamber ${run.floor} of 12 · ${P.actFor(run.floor).subtitle}`,[
 {mark:'✓',title:'Return to the machine',action:()=>{closeModal();updateUI()}}
 ],mapMarkup()+`<div class="legend">${P.ACTS.map((a,i)=>`<div class="legend-row"><span class="choice-mark">${i+1}</span><span><b>${a.short}</b><br>Chambers ${i*4+1}–${i*4+4} · ${a.subtitle}</span></div>`).join('')}</div>`);
}
function pause(){
 if(paused)return;checkpoint();
 openModal('pause','TAKE A BREATHER','The vault can wait.','Your expedition is saved on this device.',[
 {mark:'▶',title:'Keep playing',desc:'Return to the machine.',action:()=>{closeModal();updateUI()}},
 {mark:'?',title:'Field guide',desc:'Review loot and enemy intentions.',action:()=>help(()=>{closeModal();pause()})},
 {mark:'↗',title:'Retire expedition',desc:'End this run and bank your earned embers.',action:()=>openModal('retire','RETURN TO THE WORKSHOP','Finish this expedition?', 'Your current run will end. Earned embers and unlocks will be kept.',[
 {mark:'▶',title:'Keep exploring',action:()=>{closeModal();updateUI()}},
 {mark:'↗',title:'Finish expedition',action:()=>gameOver(false)}])}
 ]);
}
function hold(button,key){button.addEventListener('pointerdown',e=>{if(paused||phase!=='aim')return;e.preventDefault();button.setPointerCapture(e.pointerId);if(key==='left')leftHeld=true;else rightHeld=true;aimTarget=null});const stop=()=>{if(key==='left')leftHeld=false;else rightHeld=false};['pointerup','pointercancel','lostpointercapture'].forEach(ev=>button.addEventListener(ev,stop))}
hold($('#left'),'left');hold($('#right'),'right');let dragging=false;function aim(e){if(phase!=='aim'||paused)return;const rect=machine.getBoundingClientRect();aimTarget=clamp((e.clientX-rect.left)/rect.width*MW,CHUTE+halfWidth()+9,MW-halfWidth()-13)}machine.addEventListener('pointerdown',e=>{if(phase!=='aim'||paused)return;e.preventDefault();dragging=true;machine.setPointerCapture(e.pointerId);aim(e)});machine.addEventListener('pointermove',e=>{if(dragging)aim(e)});['pointerup','pointercancel','lostpointercapture'].forEach(ev=>machine.addEventListener(ev,()=>dragging=false));$('#sound').onclick=toggleSound;$('#sound').textContent=muted?'♩':'♪';$('#sound').setAttribute('aria-label',muted?'Enable sound':'Mute sound');$('#sound').setAttribute('aria-pressed',String(!muted));$('#drop').onclick=drop;$('#help').onclick=()=>help();$('#build').onclick=showBuild;$('#map').onclick=showMap;$('#pause').onclick=pause;$('#modal').addEventListener('cancel',e=>{e.preventDefault();if(['pause','build','map'].includes(modalMode)){closeModal();updateUI()}});window.addEventListener('keydown',e=>{if(paused)return;if(['ArrowLeft','ArrowRight','Space'].includes(e.code))e.preventDefault();if(e.code==='ArrowLeft'||e.code==='KeyA'){leftHeld=true;aimTarget=null}if(e.code==='ArrowRight'||e.code==='KeyD'){rightHeld=true;aimTarget=null}if(e.code==='Space'&&!e.repeat)drop();if(e.code==='Escape')pause()});window.addEventListener('keyup',e=>{if(e.code==='ArrowLeft'||e.code==='KeyA')leftHeld=false;if(e.code==='ArrowRight'||e.code==='KeyD')rightHeld=false});window.addEventListener('blur',()=>{leftHeld=rightHeld=false;dragging=false});document.addEventListener('visibilitychange',()=>{if(document.hidden){checkpoint();leftHeld=rightHeld=false;last=0;accumulator=0;if(!paused&&started)pause()}});window.addEventListener('pagehide',checkpoint);
const saved=P.loadRun();run=P.createRun();startFloor();welcome(saved);requestAnimationFrame(frame);
})();
