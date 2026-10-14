/* Shared authored geometry for the WebGL sculpture and its animated 2D renderer. */
(function(root){
  'use strict';
  const COUNT=112;
  const rotate=(v,x,y,z)=>{
    let [a,b,c]=v;let s=Math.sin(x),q=Math.cos(x);[b,c]=[b*q-c*s,b*s+c*q];
    s=Math.sin(y);q=Math.cos(y);[a,c]=[a*q+c*s,-a*s+c*q];
    s=Math.sin(z);q=Math.cos(z);return [a*q-b*s,a*s+b*q,c];
  };
  function pose(i,time){
    const a=i/COUNT*Math.PI*2;
    const open=Math.pow(Math.max(0,Math.sin(time*.56)),8);
    const radius=1.68+.12*Math.sin(a*3-time*1.4)+open*.22;
    return {
      position:[Math.cos(a)*radius+open*.18*Math.cos(a*5),Math.sin(a)*radius+open*.18*Math.sin(a*4),.34*Math.sin(a*2-time*.7)+open*.65*Math.sin(a*3)],
      rotation:[a*.5+time*.34,.38*Math.sin(a*2-time*.75),a-Math.PI/2],
      orange:(i+Math.floor(time*8))%COUNT<24,
      scale:1-.12*open
    };
  }
  function orientation(time,pointer={x:0,y:0},scroll=0){return [.22+Math.sin(time*.32)*.28+pointer.y*.18,.35+time*.26+pointer.x*.3+scroll*.8,-.16+Math.sin(time*.24)*.13];}
  const api={COUNT,pose,rotate,orientation};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.SentinelForm=api;
})(typeof window==='undefined'?globalThis:window);
