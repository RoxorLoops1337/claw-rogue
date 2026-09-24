/* Clawbound rigid-body solver.
 * Compound circle bodies and rotating capsule fingers follow the Claw Crawl
 * reference: contact impulses act at the actual contact point, including torque.
 * Cargo is always dynamic. There are no grab joints or hidden basket walls.
 */
(function (root) {
  'use strict';
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
  const cross = (x, y, u, v) => x * v - y * u;
  const copySegment = (s, i) => ({ ...s, r:s.r ?? 3.5, id:s.id ?? i });

  // Local circular pieces create rounded, snag-able item silhouettes. The same
  // pieces can be rendered by the client so the visible shape is the collider.
  function shapeParts(shape, scale = 1) {
    const kind = shape[0], out = [];
    if (kind === 'cap') {
      const radius = shape[2] * scale, length = Math.max(shape[1] * scale, radius * 2);
      const count = Math.max(2, Math.ceil((length - 2 * radius) / (radius * .9)) + 1);
      for (let i = 0; i < count; i++) out.push({ x:-length/2+radius+(length-2*radius)*i/(count-1), y:0, r:radius });
    } else if (kind === 'blob') {
      const radius = shape[1] * scale;
      out.push({ x:0, y:0, r:radius*.62 });
      for (let i = 0; i < 3; i++) {
        const angle = -Math.PI/2+i*Math.PI*2/3;
        out.push({ x:Math.cos(angle)*radius*.42, y:Math.sin(angle)*radius*.42, r:radius*.58 });
      }
    } else out.push({ x:0, y:0, r:shape[1]*scale });
    return out;
  }

  function create(options = {}) {
    const cfg = { left:12, right:408, floor:326, top:-90, gravity:870,
      jawFriction:.85, iterations:12, maxStep:1/240, contactSkin:.3, ...options };
    let previous = new Map();
    const shapes = new WeakMap();
    function reset(segments = []) { previous = new Map(segments.map((s,i) => [s.id ?? i, copySegment(s,i)])); }
    function init(b) {
      b.vx = Number.isFinite(b.vx) ? b.vx : 0;
      b.vy = Number.isFinite(b.vy) ? b.vy : 0;
      b.angle = Number.isFinite(b.angle) ? b.angle : 0;
      b.spin = Number.isFinite(b.spin) ? b.spin : 0;
      let cached = shapes.get(b);
      if (!cached || cached.source !== b.parts || cached.radius !== b.r) {
        const parts = Array.isArray(b.parts) && b.parts.length ? b.parts : [{x:0,y:0,r:b.r}];
        let area = 0, inertia = 0, bound = 0;
        for (const p of parts) {
          const weight = p.r*p.r;
          area += weight;
          inertia += weight*(p.r*p.r*.5+p.x*p.x+p.y*p.y);
          bound = Math.max(bound, Math.hypot(p.x,p.y)+p.r);
        }
        cached = { source:b.parts, radius:b.r, parts, area, inertia:inertia/area, bound,
          world:parts.map(p=>({x:0,y:0,r:p.r})) };
        shapes.set(b,cached);
      }
      b._im = 1/Math.max(.05,b.mass ?? cached.area/196*(b.density ?? 1));
      b._ii = b._im/Math.max(1,cached.inertia);
      // Derived collision caches must not bloat a saved run's JSON snapshot.
      if (Object.hasOwn(b,'_shape')) b._shape=cached;
      else Object.defineProperty(b,'_shape',{value:cached,writable:true,configurable:true});
    }
    function updateParts(b) {
      const c=Math.cos(b.angle), s=Math.sin(b.angle), shape=b._shape;
      for (let i=0;i<shape.parts.length;i++) {
        const p=shape.parts[i], w=shape.world[i];
        w.x=b.x+p.x*c-p.y*s; w.y=b.y+p.x*s+p.y*c;
      }
    }
    function velocity(c) {
      const a=c.a,b=c.b;
      return [(b?b.vx-b.spin*c.rby:c.kvx)-a.vx+a.spin*c.ray,
        (b?b.vy+b.spin*c.rbx:c.kvy)-a.vy-a.spin*c.rax];
    }
    function impulse(c, px, py) {
      const a=c.a,b=c.b;
      a.vx-=px*a._im; a.vy-=py*a._im; a.spin-=cross(c.rax,c.ray,px,py)*a._ii;
      if (b) { b.vx+=px*b._im; b.vy+=py*b._im; b.spin+=cross(c.rbx,c.rby,px,py)*b._ii; }
    }
    function closest(s, x, y) {
      const dx=s.bx-s.ax,dy=s.by-s.ay,l2=dx*dx+dy*dy;
      const u=l2>1e-8?clamp(((x-s.ax)*dx+(y-s.ay)*dy)/l2,0,1):0;
      return { x:s.ax+u*dx,y:s.ay+u*dy,u,dx,dy,l2 };
    }
    function step(dt, balls, segments = []) {
      const stats = { jawContacts:0,maxPenetration:0,touchedIds:[],
        jawPressure:{left:0,right:0,hub:0},jawImpulse:{left:0,right:0,hub:0} };
      if (!Number.isFinite(dt) || dt <= 0) return stats;
      dt = Math.min(dt,.05);
      const active=balls.filter(b=>b.alive!==false);
      for (const b of active) { init(b); b.oldX=b.x;b.oldY=b.y;b.clawContact=Math.max(0,(b.clawContact||0)-dt); }
      const end=segments.map(copySegment),start=end.map(s=>previous.get(s.id)||s);
      const steps=Math.max(1,Math.ceil(dt/cfg.maxStep)),h=dt/steps,touched=new Set();
      for (let sub=0;sub<steps;sub++) {
        const t=(sub+1)/steps;
        const moving=end.map((s,i)=>{
          const p=start[i];
          return {...s,jaw:true,ax:p.ax+(s.ax-p.ax)*t,ay:p.ay+(s.ay-p.ay)*t,
            bx:p.bx+(s.bx-p.bx)*t,by:p.by+(s.by-p.by)*t,
            avx:(s.ax-p.ax)/dt,avy:(s.ay-p.ay)/dt,bvx:(s.bx-p.bx)/dt,bvy:(s.by-p.by)/dt};
        });
        if (Number.isFinite(cfg.chuteRight)) {
          moving.push({ax:cfg.chuteRight,ay:cfg.dividerTop??145,bx:cfg.chuteRight,by:cfg.floor+100,r:3,jaw:false,avx:0,avy:0,bvx:0,bvy:0});
          moving.push({ax:cfg.chuteRight,ay:cfg.floor,bx:cfg.right,by:cfg.floor,r:0,jaw:false,avx:0,avy:0,bvx:0,bvy:0});
        }
        for (const b of active) { b.vy+=cfg.gravity*h;b.vx*=1-.12*h;b.vy*=1-.12*h;b.spin*=1-1.7*h;updateParts(b); }
        const contacts=[];
        function contact(a,b,px,py,nx,ny,pen,mu,segment=null,u=0) {
          if (pen < -cfg.contactSkin) return;
          const rax=px-a.x,ray=py-a.y,rbx=b?px-b.x:0,rby=b?py-b.y:0;
          const tx=-ny,ty=nx;
          const an=cross(rax,ray,nx,ny),at=cross(rax,ray,tx,ty),bn=cross(rbx,rby,nx,ny),bt=cross(rbx,rby,tx,ty);
          let kvx=0,kvy=0;
          if (segment) {
            const dx=segment.bx-segment.ax,dy=segment.by-segment.ay,length2=dx*dx+dy*dy;
            const dvx=segment.bvx-segment.avx,dvy=segment.bvy-segment.avy;
            const omega=length2>1e-8?cross(dx,dy,dvx,dvy)/length2:0;
            // Endpoint interpolation supplies centerline velocity. Rotation
            // also moves the rubber surface away from that centerline.
            const qx=segment.ax+dx*u,qy=segment.ay+dy*u;
            kvx=segment.avx+dvx*u-omega*(py-qy);
            kvy=segment.avy+dvy*u+omega*(px-qx);
          }
          const c={a,b,nx,ny,pen,mu,rax,ray,rbx,rby,jn:0,jt:0,segment,
            kvx,kvy,
            kn:1/(a._im+a._ii*an*an+(b?b._im+b._ii*bn*bn:0)),
            kt:1/(a._im+a._ii*at*at+(b?b._im+b._ii*bt*bt:0)),
            bias:pen<0?pen/h:Math.min(segment?.jaw?100:160,.22/h*Math.max(0,pen-.12))};
          const v=velocity(c),vn=v[0]*nx+v[1]*ny;
          if (vn < -95) c.bias=Math.max(c.bias,-vn*.1);
          contacts.push(c);stats.maxPenetration=Math.max(stats.maxPenetration,pen);
          if (segment?.jaw && pen>=0) {
            stats.jawContacts++;a.clawContact=.12;touched.add(segment.id);
            const side=segment.side??(segment.id==='hub'?0:String(segment.id).startsWith('jaw-0')?-1:1);
            c.jawSide=side<0?'left':side>0?'right':'hub';
            stats.jawPressure[c.jawSide]=Math.max(stats.jawPressure[c.jawSide],pen);
          }
        }
        for (let i=0;i<active.length;i++) {
          const a=active[i],as=a._shape;
          for (const p of as.world) {
            contact(a,null,p.x-p.r,p.y,-1,0,cfg.left+p.r-p.x,.5);
            contact(a,null,p.x+p.r,p.y,1,0,p.x+p.r-cfg.right,.5);
            if (!Number.isFinite(cfg.chuteRight)) contact(a,null,p.x,p.y+p.r,0,1,p.y+p.r-cfg.floor,.6);
            contact(a,null,p.x,p.y-p.r,0,-1,cfg.top+p.r-p.y,.5);
          }
          for (let j=i+1;j<active.length;j++) {
            const b=active[j],bs=b._shape,dx=b.x-a.x,dy=b.y-a.y,bound=as.bound+bs.bound+cfg.contactSkin;
            if (Math.abs(dx)>bound||Math.abs(dy)>bound||dx*dx+dy*dy>bound*bound) continue;
            for (const p of as.world) for (const q of bs.world) {
              const ex=q.x-p.x,ey=q.y-p.y,rr=p.r+q.r,d2=ex*ex+ey*ey;
              if (d2>(rr+cfg.contactSkin)*(rr+cfg.contactSkin)) continue;
              const d=Math.sqrt(d2),nx=d>1e-8?ex/d:1,ny=d>1e-8?ey/d:0,pen=rr-d;
              contact(a,b,p.x+nx*(p.r-pen*.5),p.y+ny*(p.r-pen*.5),nx,ny,pen,Math.sqrt((a.friction??.46)*(b.friction??.46)));
            }
          }
          for (const s of moving) {
            const center=closest(s,a.x,a.y),bound=as.bound+s.r+cfg.contactSkin;
            if ((center.x-a.x)**2+(center.y-a.y)**2>bound*bound) continue;
            for (const p of as.world) {
              const q=closest(s,p.x,p.y),ex=q.x-p.x,ey=q.y-p.y,rr=p.r+s.r,d2=ex*ex+ey*ey;
              if (d2>(rr+cfg.contactSkin)*(rr+cfg.contactSkin)) continue;
              const d=Math.sqrt(d2),len=Math.sqrt(q.l2)||1,nx=d>1e-8?ex/d:-q.dy/len,ny=d>1e-8?ey/d:q.dx/len;
              contact(a,null,p.x+nx*p.r,p.y+ny*p.r,nx,ny,rr-d,s.friction??(s.jaw?cfg.jawFriction:.5),s,q.u);
            }
          }
        }
        for (let iteration=0;iteration<cfg.iterations;iteration++) {
          const reverse=iteration%2;
          for (let k=0;k<contacts.length;k++) {
            const c=contacts[reverse?contacts.length-1-k:k];
            let v=velocity(c),vn=v[0]*c.nx+v[1]*c.ny,old=c.jn;
            c.jn=Math.max(0,old+(c.bias-vn)*c.kn);
            const normal=c.jn-old;impulse(c,normal*c.nx,normal*c.ny);
            const tx=-c.ny,ty=c.nx;v=velocity(c);old=c.jt;
            c.jt=clamp(old-(v[0]*tx+v[1]*ty)*c.kt,-c.mu*c.jn,c.mu*c.jn);
            const tangent=c.jt-old;impulse(c,tangent*tx,tangent*ty);
          }
        }
        for (const c of contacts) if (c.jawSide) stats.jawImpulse[c.jawSide]+=c.jn;
        for (const b of active) {
          const speed=Math.hypot(b.vx,b.vy);
          if (speed>1200) { b.vx*=1200/speed;b.vy*=1200/speed; }
          b.spin=clamp(b.spin,-50,50);
          b.x+=b.vx*h;b.y+=b.vy*h;b.angle+=b.spin*h;
          // Contain actual rotated pieces, not their enclosing circle. This is
          // only a cabinet guard; it never supports cargo inside the claw.
          updateParts(b);
          let minX=Infinity,maxX=-Infinity,minY=Infinity,floorY=-Infinity;
          for (const p of b._shape.world) {
            minX=Math.min(minX,p.x-p.r);maxX=Math.max(maxX,p.x+p.r);minY=Math.min(minY,p.y-p.r);
            if (!Number.isFinite(cfg.chuteRight)||p.x>=cfg.chuteRight) floorY=Math.max(floorY,p.y+p.r);
          }
          if (minX<cfg.left) { b.x+=cfg.left-minX;b.vx=Math.max(0,b.vx); }
          if (maxX>cfg.right) { b.x-=maxX-cfg.right;b.vx=Math.min(0,b.vx); }
          if (floorY>cfg.floor) { b.y-=floorY-cfg.floor;b.vy=Math.min(0,b.vy); }
          if (minY<cfg.top) { b.y+=cfg.top-minY;b.vy=Math.max(0,b.vy); }
        }
      }
      previous=new Map(end.map(s=>[s.id,s]));stats.touchedIds=[...touched];return stats;
    }
    return {step,reset,config:cfg};
  }
  root.ClawPhysics={create,shapeParts};
  if(typeof module!=='undefined'&&module.exports) module.exports=root.ClawPhysics;
})(typeof window!=='undefined'?window:globalThis);
