/* Presentation motion also works when WebGL is unavailable. */
(() => {
  'use strict';
  const root=document.documentElement,hero=document.querySelector('.hero--reveal');
  const reduced=matchMedia('(prefers-reduced-motion:reduce)'),button=document.querySelector('[data-motion-toggle]');
  let paused=false,visible=true;
  const update=()=>{
    root.dataset.motion=reduced.matches?'reduced':paused?'paused':document.hidden?'resting':'running';
    if(hero)hero.dataset.motion=reduced.matches?'reduced':paused?'paused':!visible||document.hidden?'resting':'running';
    if(button){button.hidden=reduced.matches;button.textContent=paused?'Play motion':'Pause motion';button.setAttribute('aria-pressed',String(paused));}
  };
  button?.addEventListener('click',()=>{paused=!paused;update();});reduced.addEventListener('change',update);document.addEventListener('visibilitychange',update);
  if(hero&&window.IntersectionObserver)new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;update();},{threshold:.05}).observe(hero);
  if(window.IntersectionObserver){
    const observer=new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add('is-seen');observer.unobserve(entry.target);}}),{threshold:.12});
    document.querySelectorAll('.section__head,.try__copy,.try__panel,.mask-card,.step,.plan,.support-card,.page-head,.cta').forEach((element,index)=>{element.classList.add('gallery-enter');element.style.setProperty('--entry-delay',`${index%3*70}ms`);observer.observe(element);});
  }
  update();
})();
