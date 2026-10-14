/* Keep the 3D bundle and model off reduced-motion/data-saving page loads. */
(() => {
  const hero=document.querySelector('.hero--reveal');
  if(!hero)return;
  hero.dataset.renderer='poster';
  if(!window.IntersectionObserver||!window.ResizeObserver)return;
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  const capture=new URLSearchParams(location.search).has('capture-scene');
  const url=new URL('hero-scene.js',document.currentScript.src).href;
  let visible=false,loaded=false;
  const load=()=>{
    if(loaded||!visible||(!capture&&(reduced.matches||navigator.connection?.saveData)))return;
    loaded=true;
    const script=document.createElement('script');script.src=url;script.async=true;
    script.addEventListener('error',()=>{hero.dataset.renderer='fallback';});
    document.head.appendChild(script);
  };
  new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;load();},{threshold:.05}).observe(hero);
  reduced.addEventListener('change',load);
})();
