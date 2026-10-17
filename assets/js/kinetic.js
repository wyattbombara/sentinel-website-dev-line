/* Motion starts with a small, dependency-free renderer. WebGL is an enhancement. */
(()=>{
  'use strict';
  const hero=document.querySelector('[data-kinetic-hero]'),host=hero?.querySelector('[data-sculpture]');
  const reduced=matchMedia('(prefers-reduced-motion:reduce)'),root=document.documentElement;
  const buttons=[...document.querySelectorAll('[data-motion-toggle]')];
  const scriptURL=document.currentScript.src;
  let choice=null;
  try{choice=sessionStorage.getItem('sentinel:motion');}catch{}
  if(new URLSearchParams(location.search).get('motion')==='on'){choice='on';try{sessionStorage.setItem('sentinel:motion','on');}catch{}}
  let enabled=choice==='on'||(choice!=='off'&&!reduced.matches),visible=true;
  let frame=0,start=0,elapsed=0,lastPaint=0,upgrade=null,loaded=false,pointer={x:0,y:0},scroll=0;
  const canvas=host?document.createElement('canvas'):null,ctx=canvas?.getContext('2d');
  if(canvas){canvas.className='sculpture-canvas';canvas.setAttribute('aria-hidden','true');host.appendChild(canvas);}
  let width=1,height=1;
  const form=window.SentinelForm;
  const faces=[[0,1,2,3],[4,7,6,5],[0,4,5,1],[3,2,6,7],[1,5,6,2],[0,3,7,4]].map(face=>face.reverse());
  const corners=[[-1,-1,-1],[1,-1,-1],[1,1,-1],[-1,1,-1],[-1,-1,1],[1,-1,1],[1,1,1],[-1,1,1]];
  function drawFallback(time){
    if(!ctx||!form)return;
    ctx.clearRect(0,0,width,height);
    const scale=Math.min(width,height)/5.9,spin=form.orientation(time,pointer,scroll),polygons=[];
    const yOffset=Math.sin(time*.9)*.08;
    for(let i=0;i<form.COUNT;i++){
      const p=form.pose(i,time),vertices=corners.map(([x,y,z])=>{
        const local=form.rotate([x*.035,y*.52*p.scale,z*.17],...p.rotation);
        return form.rotate(local.map((v,k)=>v+p.position[k]),...spin);
      });
      for(const face of faces){
        const points=face.map(j=>vertices[j]);
        const u=points[1].map((v,k)=>v-points[0][k]),v=points[2].map((v,k)=>v-points[0][k]);
        const normal=[u[1]*v[2]-u[2]*v[1],u[2]*v[0]-u[0]*v[2],u[0]*v[1]-u[1]*v[0]];
        const length=Math.hypot(...normal)||1;normal.forEach((v,k)=>normal[k]=v/length);
        if(normal[2]<0)continue;
        const shine=.35+.45*Math.max(0,normal[1]*.65+normal[0]*-.4+normal[2]*.6)+.2*Math.pow(Math.max(0,normal[2]),12);
        const rgb=p.orange?[213,174,95]:[211,211,211];
        polygons.push({z:points.reduce((s,p)=>s+p[2],0)/4,points:points.map(([x,y,z])=>{const lens=9/(9-z);return [width/2+x*scale*lens,height/2-(y+yOffset)*scale*lens];}),color:`rgb(${rgb.map(c=>Math.round(c*shine)).join(',')})`});
      }
    }
    polygons.sort((a,b)=>a.z-b.z);
    for(const p of polygons){ctx.beginPath();p.points.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.closePath();ctx.fillStyle=p.color;ctx.fill();ctx.strokeStyle=p.color;ctx.lineWidth=.5;ctx.stroke();}
  }
  function draw(time){
    if(!hero)return;
    if(upgrade)upgrade.draw(time,pointer,scroll);else drawFallback(time);
    hero.dataset.frame=String(Math.round(time*1000));
  }
  const active=()=>enabled&&!document.hidden&&visible;
  function tick(now){
    frame=0;if(!active())return;
    if(!lastPaint||now-lastPaint>=32){lastPaint=now;draw(elapsed+(now-start)/1000);}
    frame=requestAnimationFrame(tick);
  }
  function load3D(){
    if(!host||loaded||!enabled||!visible||navigator.connection?.saveData)return;
    loaded=true;const script=document.createElement('script');script.src=new URL('afterimage-scene.js',scriptURL).href;script.async=true;document.head.appendChild(script);
  }
  function update(){
    root.dataset.motion=enabled?(document.hidden?'resting':'running'):'paused';
    if(hero)hero.dataset.motion=enabled?(active()?'running':'resting'):(reduced.matches&&choice===null?'reduced':'paused');
    buttons.forEach(button=>{button.hidden=false;button.textContent=enabled?'Pause animation':'Play animation';button.setAttribute('aria-pressed',String(!enabled));});
    document.querySelectorAll('[data-motion-note]').forEach(el=>{el.textContent=!enabled&&reduced.matches?'Reduced motion is on. You can play the sculpture.':'An evolving point of view.';});
    if(!active()){
      if(frame){elapsed+=(performance.now()-start)/1000;cancelAnimationFrame(frame);frame=0;}
      lastPaint=0;
    }else if(hero&&!frame){start=performance.now();frame=requestAnimationFrame(tick);}
    load3D();
  }
  buttons.forEach(button=>button.addEventListener('click',()=>{enabled=!enabled;choice=enabled?'on':'off';try{sessionStorage.setItem('sentinel:motion',choice);}catch{}update();}));
  reduced.addEventListener('change',()=>{if(choice===null)enabled=!reduced.matches;update();});
  document.addEventListener('visibilitychange',update);
  if(host){
    hero.dataset.renderer=ctx?'canvas':'static';
    const resize=()=>{
      const rect=host.getBoundingClientRect();width=rect.width;height=rect.height;
      if(ctx){const dpr=Math.min(devicePixelRatio||1,1.25);canvas.width=width*dpr;canvas.height=height*dpr;ctx.setTransform(dpr,0,0,dpr,0,0);}
      upgrade?.resize(width,height);draw(elapsed+(frame?(performance.now()-start)/1000:0));
    };
    window.SentinelStage={
      host,upgrade(renderer){upgrade=renderer;renderer.resize(width,height);hero.dataset.renderer='webgl';draw(elapsed+(frame?(performance.now()-start)/1000:0));},
      downgrade(){upgrade=null;hero.dataset.renderer=ctx?'canvas':'static';draw(elapsed);},
      capture(time=0){draw(time);return (upgrade?.canvas||canvas).toDataURL('image/png');}
    };
    if(window.ResizeObserver)new ResizeObserver(resize).observe(host);else addEventListener('resize',resize);
    if(window.IntersectionObserver)new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;update();},{threshold:.05}).observe(hero);
    hero.addEventListener('pointermove',event=>{if(!enabled||!matchMedia('(pointer:fine)').matches)return;const rect=hero.getBoundingClientRect();pointer={x:(event.clientX-rect.left)/rect.width-.5,y:.5-(event.clientY-rect.top)/rect.height};},{passive:true});
    hero.addEventListener('pointerleave',()=>{pointer={x:0,y:0};});
    addEventListener('scroll',()=>{scroll=Math.min(1,Math.max(0,-hero.getBoundingClientRect().top/hero.offsetHeight));},{passive:true});
    addEventListener('pagehide',()=>{if(frame){elapsed+=(performance.now()-start)/1000;cancelAnimationFrame(frame);frame=0;}});addEventListener('pageshow',update);
    resize();
  }
  if(window.IntersectionObserver){
    const observer=new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add('is-present');observer.unobserve(entry.target);}}),{threshold:.12});
    document.querySelectorAll('.section__head,.try__copy,.try__panel,.mask-card,.step,.tile,.plan,.support-card,.page-head,.cta').forEach((el,index)=>{el.classList.add('arrival');el.style.setProperty('--arrival-delay',`${index%3*85}ms`);observer.observe(el);});
  }
  update();
})();
