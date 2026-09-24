/* Clawbound contact solver. Circle bodies, kinematic capsule jaws and solid walls.
 * Based on the sequential impulse approach in the author's Claw Crawl reference.
 * All tokens remain dynamic during a grab; the solver never attaches a token.
 */
(function (root) {
  'use strict';
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
  const copySegment = (s, i) => ({ ax:s.ax, ay:s.ay, bx:s.bx, by:s.by, r:s.r ?? 3.5, id:s.id ?? i });
  function create(options = {}) {
    const cfg = { left:12, right:408, floor:326, top:-90, gravity:870,
      jawFriction:.85, iterations:12, maxStep:1/240, contactSkin:.3, ...options };
    let previous = new Map();
    function reset(segments = []) { previous = new Map(segments.map((s,i) => [s.id ?? i, copySegment(s,i)])); }
    function init(b) {
      b.vx = Number.isFinite(b.vx) ? b.vx : 0;
      b.vy = Number.isFinite(b.vy) ? b.vy : 0;
      b.angle = Number.isFinite(b.angle) ? b.angle : 0;
      b.spin = Number.isFinite(b.spin) ? b.spin : 0;
      b._im = 1 / ((b.mass ?? (b.r*b.r/196)) || 1);
      b._ii = 2 * b._im / (b.r*b.r);
    }
    function step(dt, balls, segments = []) {
      if (!Number.isFinite(dt) || dt <= 0) return { jawContacts:0, maxPenetration:0 };
      // Callers use a fixed update clock; small internal steps prevent fast jaws tunnelling.
      dt = Math.min(dt, .05);
      const active = balls.filter(b => b.alive !== false);
      for (const b of active) { init(b); b.oldX=b.x; b.oldY=b.y; b.clawContact=Math.max(0,(b.clawContact||0)-dt); }
      const end = segments.map(copySegment);
      const start = end.map(s => previous.get(s.id) || s);
      const steps = Math.max(1, Math.ceil(dt/cfg.maxStep)), h=dt/steps;
      const touched = new Set();
      const stats = { jawContacts:0, maxPenetration:0, touchedIds:[] };
      for (let sub=0;sub<steps;sub++) {
        const t=(sub+1)/steps;
        const moving=end.map((s,i) => {
          const p=start[i];
          return { id:s.id, jaw:true, ax:p.ax+(s.ax-p.ax)*t, ay:p.ay+(s.ay-p.ay)*t,
            bx:p.bx+(s.bx-p.bx)*t, by:p.by+(s.by-p.by)*t, r:s.r,
            avx:(s.ax-p.ax)/dt, avy:(s.ay-p.ay)/dt,
            bvx:(s.bx-p.bx)/dt, bvy:(s.by-p.by)/dt };
        });
        if (Number.isFinite(cfg.chuteRight)) {
          moving.push({ax:cfg.chuteRight,ay:cfg.dividerTop ?? 145,bx:cfg.chuteRight,by:cfg.floor+100,r:3,jaw:false,avx:0,avy:0,bvx:0,bvy:0});
          moving.push({ax:cfg.chuteRight,ay:cfg.floor,bx:cfg.right,by:cfg.floor,r:0,jaw:false,avx:0,avy:0,bvx:0,bvy:0});
        }
        for(const b of active) { b.vy+=cfg.gravity*h; b.vx*=1-.12*h; b.vy*=1-.12*h; b.spin*=1-1.7*h; }
        const contacts=[];
        function contact(a,b,nx,ny,pen,mu,kvx=0,kvy=0,jaw=false) {
          // Include touching surfaces: containment keeps floor penetration at
          // zero, but a supported token still needs a normal/friction impulse.
          // A small separating contact is speculative, never an attraction.
          if(pen < -cfg.contactSkin) return;
          const ra=a.r, rb=b?b.r:0;
          // Circle contact radius is parallel to the normal: no normal torque.
          const c={a,b,nx,ny,pen,mu,kvx,kvy,ra,rb,jn:0,jt:0,
            kn:1/(a._im+(b?b._im:0)),
            kt:1/(a._im+a._ii*ra*ra+(b?b._im+b._ii*rb*rb:0)),
            bias:pen<0 ? pen/h : Math.min(jaw?100:160,.22/h*Math.max(0,pen-.12))};
          const vn=(kvx+(b?b.vx:0)-a.vx)*nx+(kvy+(b?b.vy:0)-a.vy)*ny;
          if(vn < -95) c.bias=Math.max(c.bias,-vn*.1);
          contacts.push(c);
          stats.maxPenetration=Math.max(stats.maxPenetration,pen);
          if(jaw && pen>=0) { stats.jawContacts++; a.clawContact=.12; }
        }
        for(let i=0;i<active.length;i++) {
          const a=active[i];
          // Normals point from token toward the obstacle.
          contact(a,null,-1,0,cfg.left+a.r-a.x,.5);
          contact(a,null,1,0,a.x+a.r-cfg.right,.5);
          if (!Number.isFinite(cfg.chuteRight)) contact(a,null,0,1,a.y+a.r-cfg.floor,.6);
          contact(a,null,0,-1,cfg.top+a.r-a.y,.5);
          for(let j=i+1;j<active.length;j++) {
            const b=active[j], dx=b.x-a.x,dy=b.y-a.y, rr=a.r+b.r;
            if(Math.abs(dx)>rr+cfg.contactSkin||Math.abs(dy)>rr+cfg.contactSkin) continue;
            const d2=dx*dx+dy*dy;
            if(d2>(rr+cfg.contactSkin)*(rr+cfg.contactSkin)) continue;
            const d=Math.sqrt(d2);
            contact(a,b,d>1e-8?dx/d:1,d>1e-8?dy/d:0,rr-d,.46);
          }
          for(const s of moving) {
            const dx=s.bx-s.ax,dy=s.by-s.ay,l2=dx*dx+dy*dy;
            const u=l2>1e-8?clamp(((a.x-s.ax)*dx+(a.y-s.ay)*dy)/l2,0,1):0;
            const qx=s.ax+u*dx,qy=s.ay+u*dy,ex=qx-a.x,ey=qy-a.y;
            const rr=a.r+s.r,d2=ex*ex+ey*ey;
            if(d2>(rr+cfg.contactSkin)*(rr+cfg.contactSkin)) continue;
            const d=Math.sqrt(d2);
            // A token exactly on a segment receives a deterministic perpendicular.
            const len=Math.sqrt(l2)||1;
            contact(a,null,d>1e-8?ex/d:-dy/len,d>1e-8?ey/d:dx/len,
              rr-d,s.jaw?cfg.jawFriction:.5,s.avx+(s.bvx-s.avx)*u,s.avy+(s.bvy-s.avy)*u,s.jaw);
            if(s.jaw && d<=rr) touched.add(s.id);
          }
        }
        // Accumulated normal and Coulomb tangent impulses support a resting pile
        // and transfer the actual jaw velocity into tokens during lift and carry.
        for(let iteration=0;iteration<cfg.iterations;iteration++) {
          const reverse=iteration%2;
          for(let k=0;k<contacts.length;k++) {
            const c=contacts[reverse?contacts.length-1-k:k],a=c.a,b=c.b;
            const rvx=(b?b.vx:c.kvx)-a.vx,rvy=(b?b.vy:c.kvy)-a.vy;
            const vn=rvx*c.nx+rvy*c.ny,oldN=c.jn;
            c.jn=Math.max(0,oldN+(c.bias-vn)*c.kn);
            const jn=c.jn-oldN,px=jn*c.nx,py=jn*c.ny;
            a.vx-=px*a._im; a.vy-=py*a._im;
            if(b) { b.vx+=px*b._im; b.vy+=py*b._im; }
            const tx=-c.ny,ty=c.nx;
            const vt=((b?b.vx:c.kvx)-a.vx)*tx+((b?b.vy:c.kvy)-a.vy)*ty-a.spin*c.ra-(b?b.spin*c.rb:0);
            const oldT=c.jt,limit=c.mu*c.jn;
            c.jt=clamp(oldT-vt*c.kt,-limit,limit);
            const jt=c.jt-oldT;
            a.vx-=jt*tx*a._im; a.vy-=jt*ty*a._im; a.spin-=jt*c.ra*a._ii;
            if(b) { b.vx+=jt*tx*b._im; b.vy+=jt*ty*b._im; b.spin-=jt*c.rb*b._ii; }
          }
        }
        for(const b of active) {
          const speed=Math.hypot(b.vx,b.vy);
          if(speed>1200) { b.vx*=1200/speed; b.vy*=1200/speed; }
          b.x+=b.vx*h; b.y+=b.vy*h; b.angle+=b.spin*h;
          // Exact cabinet containment guards cumulative roundoff and externally
          // inserted objects. It is never used as a hidden claw/basket boundary.
          if(b.x<cfg.left+b.r) { b.x=cfg.left+b.r; b.vx=Math.max(0,b.vx); }
          if(b.x>cfg.right-b.r) { b.x=cfg.right-b.r; b.vx=Math.min(0,b.vx); }
          if((!Number.isFinite(cfg.chuteRight)||b.x>=cfg.chuteRight)&&b.y>cfg.floor-b.r) { b.y=cfg.floor-b.r; b.vy=Math.min(0,b.vy); }
          if(b.y<cfg.top+b.r) { b.y=cfg.top+b.r; b.vy=Math.max(0,b.vy); }
        }
      }
      previous=new Map(end.map(s=>[s.id,s]));
      stats.touchedIds=[...touched];
      return stats;
    }
    return {step,reset,config:cfg};
  }
  root.ClawPhysics={create};
  if(typeof module!=='undefined'&&module.exports) module.exports=root.ClawPhysics;
})(typeof window!=='undefined'?window:globalThis);
