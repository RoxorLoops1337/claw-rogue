const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
(async()=>{
 const scope='https://example.test/claw-rogue/',handlers={};let requests=[],offline=false;
 const cached={ok:true,source:'cached'},network={ok:true,source:'network'};
 const env={URL,Request,Set,Promise,self:{registration:{scope},location:{origin:'https://example.test'},addEventListener:(name,fn)=>handlers[name]=fn},caches:{open:async()=>({match:async()=>cached})},fetch:async request=>{requests.push(request);if(offline)throw Error('offline');return network;}};
 vm.runInNewContext(fs.readFileSync(require.resolve('../sw.js'),'utf8'),env);
 async function get(url,mode){let response;handlers.fetch({request:{method:'GET',url:scope+url,mode},respondWith:r=>response=r});return await response;}
 // Supply standard Request objects to the network-first branch.
 async function request(url,navigate=false){let response;const req=new Request(scope+url);if(navigate)Object.defineProperty(req,'mode',{value:'navigate'});handlers.fetch({request:req,respondWith:r=>response=r});return await response;}
 assert.equal((await request('?v=future',true)).source,'network','online navigation cannot return stale app HTML');
 assert.equal((await request('game.js?v=future')).source,'network','an older worker cannot strip a newer asset version');
 assert.equal((await request('game.js?v=20260926-3')).source,'cached');
 offline=true;assert.equal((await request('',true)).source,'cached','offline launch still uses the complete cached revision');
 const events=[],script=fs.readFileSync(require.resolve('../play.html'),'utf8').match(/<script>([\s\S]*?)<\/script>/)[1];
 const old={scope,active:{scriptURL:scope+'sw.js?v=old'},unregister:async()=>{events.push('unregister');}};
 const other={scope:'https://example.test/other/',unregister:async()=>{throw Error('must not touch another app');}};
 await vm.runInNewContext(script,{URL,Promise,location:{href:scope+'play.html'},navigator:{serviceWorker:{getRegistrations:async()=>[old,other]}},document:{createElement:()=>({}),body:{replaceChildren:frame=>events.push(frame.src)}}});
 assert.deepEqual(events,['unregister','./?v=20260926-3'],'old worker is removed before fresh game client, without accessing saves');
 console.log('Offline passed: fresh online HTML, version-safe scripts, offline fallback, scoped old-worker migration before launch.');
})().catch(e=>{console.error(e);process.exitCode=1});
