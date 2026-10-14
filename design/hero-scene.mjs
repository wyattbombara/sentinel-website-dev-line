import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { Reflector } from 'three/addons/objects/Reflector.js';

// The evidence room: local architecture, materials and exhibit graphics.
const hero=document.querySelector('.hero--reveal'),host=hero?.querySelector('[data-scene]');
const capture=new URLSearchParams(location.search).has('capture-scene');
const dark=matchMedia('(prefers-color-scheme:dark)'),reduced=matchMedia('(prefers-reduced-motion:reduce)');
let renderer,scene,camera,environment,frame=0,last=0,time=0,ready=false,disposed=false;
let scan,orbit,mask,phone=false,progress=0;
const pointer={x:0,y:0},target={x:0,y:0},exhibits=[],walls=[];
const lightTheme=()=>document.documentElement.dataset.theme==='light'||(!document.documentElement.dataset.theme&&!dark.matches);
const paint=()=>{if(ready&&!disposed)renderer.render(scene,camera);};
function box(w,h,d,material,x,y,z,parent=scene){
  const mesh=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),material);mesh.position.set(x,y,z);parent.add(mesh);return mesh;
}
function label(title,subtitle,color='#ff9a53'){
  const canvas=document.createElement('canvas');canvas.width=768;canvas.height=512;
  const ctx=canvas.getContext('2d');ctx.fillStyle='#111513';ctx.fillRect(0,0,768,512);
  ctx.strokeStyle='#343c35';ctx.lineWidth=2;ctx.strokeRect(24,24,720,464);
  ctx.fillStyle=color;ctx.font='18px monospace';ctx.fillText('SENTINEL / EVIDENCE ARCHIVE',48,65);
  ctx.font='bold 72px sans-serif';title.split('|').forEach((line,i)=>ctx.fillText(line,45,181+i*82));
  ctx.fillStyle='#d4d6c9';ctx.font='19px monospace';ctx.fillText(subtitle,48,446);
  const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;return new THREE.MeshBasicMaterial({map:texture});
}
function concrete(){
  const canvas=document.createElement('canvas');canvas.width=128;canvas.height=128;
  const ctx=canvas.getContext('2d'),pixels=ctx.createImageData(128,128);let seed=812;
  for(let i=0;i<pixels.data.length;i+=4){seed=(seed*1664525+1013904223)>>>0;const v=145+(seed%38);pixels.data.set([v,v,v,255],i);}
  ctx.putImageData(pixels,0,0);const texture=new THREE.CanvasTexture(canvas);
  texture.wrapS=texture.wrapT=THREE.RepeatWrapping;texture.repeat.set(6,12);return texture;
}
function buildRoom(){
  const stone=new THREE.MeshStandardMaterial({color:'#3e4035',map:concrete(),roughness:.84,metalness:.05});walls.push(stone);
  const floor=new THREE.MeshStandardMaterial({color:'#202b29',roughness:.26,metalness:.6});
  const bronze=new THREE.MeshStandardMaterial({color:'#4f4a35',roughness:.34,metalness:.85});
  const frameMat=new THREE.MeshStandardMaterial({color:'#131b19',roughness:.4,metalness:.7});
  const led=new THREE.MeshBasicMaterial({color:'#ffbc76'});
  const seam=new THREE.MeshBasicMaterial({color:'#526058',transparent:true,opacity:.23});
  box(24,.24,88,floor,0,-.15,-29);box(.3,11,88,stone,-11,5.4,-29);box(.3,11,88,stone,11,5.4,-29);box(24,.25,88,stone,0,10.8,-29);
  const reflection=new Reflector(new THREE.PlaneGeometry(24,88),{color:'#788477',textureWidth:768,textureHeight:512,clipBias:.003,multisample:0});
  reflection.rotation.x=-Math.PI/2;reflection.position.set(0,-.015,-29);scene.add(reflection);
  for(let i=0;i<8;i++){
    const z=6-i*9;
    for(const x of [-8.6,8.6]){box(.4,10.6,.65,bronze,x,5.2,z);box(1,.16,1.1,frameMat,x,.04,z);box(.055,9.8,.06,led,x+(x<0?.24:-.24),5.3,z+.36);}
    box(17.6,.38,.65,bronze,0,10.3,z);box(13,.045,.16,led,0,10.05,z);
    for(const x of [-5.8,0,5.8])box(.035,.018,9,seam,x,0,z-4.5);
    box(22,.018,.025,seam,0,0,z);
    for(const x of [-10.7,10.7])box(.05,.06,9,led,x,.1,z-4.5);
  }
  // Original typographic exhibits. The nearest one is an open sculpture frame.
  [['LOOK|AGAIN.','01 / A FAMILIAR NAME',4.7,3.4,.7,0],['NOT WHAT|IT SEEMS.','02 / AN UNFAMILIAR ADDRESS',-4.3,3,-12,.14],['TRUST IS|EARNED.','03 / READ THE EVIDENCE',4.5,3,-24,-.12]].forEach(([title,sub,x,y,z,rotation],i)=>{
    const group=new THREE.Group();group.position.set(x,y,z);group.rotation.y=rotation;scene.add(group);
    if(i){box(3.5,4.8,.18,frameMat,0,0,0,group);const panel=new THREE.Mesh(new THREE.PlaneGeometry(3.2,4.5),label(title,sub,i===1?'#f3b66e':'#b8c3a4'));panel.position.z=.105;group.add(panel);}
    else{for(const x of [-1.75,1.75])box(.055,4.8,.22,bronze,x,0,0,group);box(3.5,.06,.22,led,0,-2.4,0,group);box(3.5,.06,.22,led,0,2.4,0,group);}
    box(3.8,.16,1.1,bronze,0,-y+.16,0,group);exhibits.push({group,y,phase:i*1.7});
  });
  scan=new THREE.Group();scene.add(scan);box(20,.022,.09,led,0,.025,0,scan);
  for(const x of [-10,10])box(.03,9,.09,led,x,4.5,0,scan);
  orbit=new THREE.Mesh(new THREE.TorusGeometry(1.75,.014,5,100,.9*Math.PI),new THREE.MeshBasicMaterial({color:'#eea866',transparent:true,opacity:.52}));orbit.position.set(4.7,3.35,1.15);scene.add(orbit);
  const key=new THREE.PointLight('#ffc083',115,35,2);key.position.set(1,6,7);scene.add(key);
  const rim=new THREE.PointLight('#c9ddce',155,30,2);rim.position.set(7,5,-4);scene.add(rim);
  const hall=new THREE.PointLight('#e69c50',100,45,2);hall.position.set(-3,4,-17);scene.add(hall);
  scene.add(new THREE.HemisphereLight('#c2c8af','#18251e',.7));
}
function theme(){
  if(!scene)return;const light=lightTheme();
  // The gallery stays dark in both themes; the surrounding interface follows the theme.
  scene.background=new THREE.Color(light?'#27302a':'#101914');scene.fog=new THREE.FogExp2(scene.background,.024);
  walls[0]?.color.set(light?'#4a4e3e':'#34392e');
  if(mask)mask.traverse(object=>{if(object.isMesh)object.material.color.set(light?'#586455':'#3e4b40');});paint();
}
function pose(t){
  if(!camera)return;const idle=Math.sin(t*.24)*.6;
  camera.position.set((phone?2.8:1.7)+pointer.x*.6,phone?3.8:3.6,(phone?13.8:13.2)-progress*2.8+idle);camera.lookAt(phone?3.2:1.5,phone?3.3:3.4,-12);
  if(mask){mask.rotation.set(Math.sin(t*.7)*.08,t*.42-.45,Math.sin(t*.5)*.06);mask.position.y=3.45+Math.sin(t*1.2)*.19;}
  exhibits.forEach(({group,y,phase})=>{group.position.y=y+Math.sin(t*.7+phase)*.085;});
  if(scan)scan.position.z=7-(t*3.2)%48;
  if(orbit){orbit.rotation.set(.1,Math.sin(t*.4)*.22,t*.32);orbit.position.y=3.4+Math.sin(t*1.2)*.19;}
}
function resize(){
  if(!renderer)return;const rect=host.getBoundingClientRect();if(!rect.width||!rect.height)return;
  phone=innerWidth<=800;renderer.setPixelRatio(Math.min(devicePixelRatio||1,phone?1.1:1.25));renderer.setSize(rect.width,rect.height,false);
  camera.aspect=rect.width/rect.height;camera.fov=phone?47:55;camera.updateProjectionMatrix();pose(time);paint();
}
const running=()=>ready&&!disposed&&!capture&&hero.dataset.motion==='running';
function sync(){if(!running()){cancelAnimationFrame(frame);frame=0;last=0;return;}if(!frame)frame=requestAnimationFrame(tick);}
function tick(now){
  frame=0;if(!running())return;if(last&&now-last<33){frame=requestAnimationFrame(tick);return;}
  const delta=last?Math.min((now-last)/1000,.1):0;last=now;time+=delta;pointer.x+=(target.x-pointer.x)*.06;pointer.y+=(target.y-pointer.y)*.06;pose(time);paint();frame=requestAnimationFrame(tick);
}
function fail(){cancelAnimationFrame(frame);frame=0;ready=false;hero.dataset.renderer='fallback';renderer?.domElement.remove();if(renderer&&!disposed){renderer.dispose();disposed=true;}}
async function init(){
  if(!hero||!host||renderer||(!capture&&(reduced.matches||navigator.connection?.saveData)))return;
  try{
    hero.dataset.renderer='loading';renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:'low-power',preserveDrawingBuffer:capture});renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.22;renderer.domElement.setAttribute('aria-hidden','true');renderer.domElement.addEventListener('webglcontextlost',event=>{event.preventDefault();fail();});
    scene=new THREE.Scene();camera=new THREE.PerspectiveCamera(55,1,.1,110);
    const pmrem=new THREE.PMREMGenerator(renderer),room=new RoomEnvironment();environment=pmrem.fromScene(room,.07).texture;scene.environment=environment;room.dispose();pmrem.dispose();buildRoom();
    const gltf=await new GLTFLoader().loadAsync('assets/models/scam.glb');if(disposed)return;
    const asset=gltf.scene,bounds=new THREE.Box3().setFromObject(asset),center=bounds.getCenter(new THREE.Vector3());
    const material=new THREE.MeshStandardMaterial({color:'#8e8e79',metalness:.88,roughness:.27,envMapIntensity:1.3});asset.position.sub(center);asset.traverse(object=>{if(object.isMesh)object.material=material;});
    mask=new THREE.Group();mask.add(asset);mask.scale.setScalar(2.8/bounds.getSize(new THREE.Vector3()).y);mask.position.set(4.7,3.45,1.05);scene.add(mask);
    ready=true;host.appendChild(renderer.domElement);theme();resize();pose(0);paint();hero.dataset.renderer='ready';host.dispatchEvent(new Event('scene-ready'));sync();
    if(capture)window.SentinelSceneCapture=()=>{pose(0);paint();return renderer.domElement.toDataURL('image/png');};
  }catch{fail();}
}
if(hero&&host){
  new ResizeObserver(resize).observe(host);
  new MutationObserver(()=>{if(reduced.matches){pose(0);paint();}sync();}).observe(hero,{attributes:true,attributeFilter:['data-motion']});
  new MutationObserver(theme).observe(document.documentElement,{attributes:true,attributeFilter:['data-theme']});dark.addEventListener('change',theme);reduced.addEventListener('change',()=>{if(!reduced.matches)init();});
  addEventListener('scroll',()=>{progress=Math.min(1,Math.max(0,-hero.getBoundingClientRect().top/hero.offsetHeight));},{passive:true});
  hero.addEventListener('pointermove',event=>{if(reduced.matches||!matchMedia('(pointer:fine)').matches)return;const rect=hero.getBoundingClientRect();target.x=(event.clientX-rect.left)/rect.width-.5;target.y=.5-(event.clientY-rect.top)/rect.height;},{passive:true});hero.addEventListener('pointerleave',()=>{target.x=target.y=0;});
  addEventListener('pagehide',()=>{cancelAnimationFrame(frame);frame=0;last=0;});addEventListener('pageshow',sync);init();
}
