import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

const hero = document.querySelector('.hero--reveal');
const host = hero?.querySelector('[data-scene]');
const button = hero?.querySelector('[data-motion-toggle]');
const reduce = matchMedia('(prefers-reduced-motion: reduce)');
const systemDark = matchMedia('(prefers-color-scheme: dark)');
const capture = new URLSearchParams(location.search).has('capture-scene');
let renderer, scene, camera, model, env, frame = 0, last = 0, clock = 0;
let visible = true, userPaused = false, ready = false, disposed = false;
let pointer = {x:0,y:0};
const fragments = [];
const materials = [];
let key, rim, fill;

const isLight = () => document.documentElement.dataset.theme === 'light' || (!document.documentElement.dataset.theme && !systemDark.matches);
function resetPointer() { pointer.x=0;pointer.y=0; }
function paint() { if (ready && renderer && !disposed) renderer.render(scene,camera); }
function applyTheme() {
  if (!scene) return;
  const light=isLight();
  scene.background = new THREE.Color(light ? '#e5e0d5' : '#080c0f');
  scene.fog = new THREE.Fog(scene.background,8,18);
  materials.forEach((material,i)=>{
    material.color.set(light ? (i===0?'#41444a':'#7a7468') : (i===0?'#39434e':'#45434a'));
    material.roughness=light ? .33 : .25;
    material.envMapIntensity=light ? .9 : 1.6;
  });
  if(key){key.color.set(light?'#ffe2b0':'#ffae55');key.intensity=light?55:75;}
  if(rim){rim.color.set(light?'#dcecff':'#94bdce');rim.intensity=light?35:75;}
  if(fill)fill.intensity=light?13:18;
  paint();
}
function resize() {
  if(!renderer||!camera)return;
  const rect=host.getBoundingClientRect();
  if(!rect.width||!rect.height)return;
  renderer.setPixelRatio(Math.min(devicePixelRatio||1,innerWidth<801?1.25:1.5));
  renderer.setSize(rect.width,rect.height,false);
  camera.aspect=rect.width/rect.height;
  const phone=innerWidth<=800;
  camera.position.set(0,phone ? .25 : .15,phone ? 6.9 : 6.8);
  camera.lookAt(0,0,0);
  camera.updateProjectionMatrix();
  if(model) model.position.x=phone?0:1.65;
  fragments.forEach(f=>{f.object.position.x=f.origin.x+(phone?0:1.65);});
  paint();
}
function setPose(time) {
  if(!model)return;
  model.rotation.set(.07+Math.sin(time*.35)*.025,-.44+Math.sin(time*.27)*.15+pointer.x*.09,-.09+Math.sin(time*.23)*.025);
  model.position.y=.08+Math.sin(time*.65)*.065+pointer.y*.035;
  fragments.forEach((f,i)=>{
    f.object.position.y=f.origin.y+Math.sin(time*.45+i)*.055;
    f.object.rotation.x=f.rotation.x+Math.sin(time*.22+i)*.1;
    f.object.rotation.z=f.rotation.z+Math.sin(time*.18+i)*.08;
  });
  if(key)key.position.x=-2+Math.sin(time*.2)*.55;
}
function updateState() {
  const running=ready&&!userPaused&&!reduce.matches&&!document.hidden&&visible&&!capture;
  if(button){
    button.hidden=!ready||reduce.matches||capture;
    button.textContent=userPaused?'Resume motion':'Pause motion';
    button.setAttribute('aria-pressed',String(userPaused));
  }
  hero.dataset.motion=reduce.matches?'reduced':userPaused?'paused':running?'running':'resting';
  if(!running){cancelAnimationFrame(frame);frame=0;last=0;return;}
  if(!frame)frame=requestAnimationFrame(tick);
}
function tick(now) {
  frame=0;
  if(last&&now-last<33){frame=requestAnimationFrame(tick);return;}
  const delta=last?Math.min((now-last)/1000,.1):0;
  last=now;clock+=delta;
  setPose(clock);paint();
  updateState();
}
function fail() {
  cancelAnimationFrame(frame);frame=0;ready=false;
  hero.dataset.renderer='fallback';hero.dataset.motion='resting';
  if(button)button.hidden=true;
  renderer?.domElement.remove();
  if(renderer&&!disposed){renderer.dispose();disposed=true;}
}
async function initialise() {
  if(!host||ready||renderer||(!capture&&(reduce.matches||navigator.connection?.saveData)))return;
  try {
    hero.dataset.renderer='loading';
    renderer=new THREE.WebGLRenderer({antialias:true,alpha:false,preserveDrawingBuffer:capture,powerPreference:'low-power'});
    renderer.outputColorSpace=THREE.SRGBColorSpace;
    renderer.toneMapping=THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure=1.05;
    renderer.domElement.setAttribute('aria-hidden','true');
    renderer.domElement.addEventListener('webglcontextlost',event=>{event.preventDefault();fail();});
    scene=new THREE.Scene();
    camera=new THREE.PerspectiveCamera(38,1,.1,40);
    const pmrem=new THREE.PMREMGenerator(renderer);
    const room=new RoomEnvironment();
    env=pmrem.fromScene(room,.06).texture;
    scene.environment=env;room.dispose();pmrem.dispose();
    const metal=new THREE.MeshStandardMaterial({color:'#161b23',metalness:.94,roughness:.29,envMapIntensity:1.35});
    const shard=new THREE.MeshStandardMaterial({color:'#28272b',metalness:.88,roughness:.29,envMapIntensity:1.1});
    materials.push(metal,shard);
    const gltf=await new GLTFLoader().loadAsync('assets/models/scam.glb');
    if(disposed)return;
    model=gltf.scene;
    const box=new THREE.Box3().setFromObject(model);
    const center=box.getCenter(new THREE.Vector3()),size=box.getSize(new THREE.Vector3());
    const wrapper=new THREE.Group();
    model.position.sub(center);wrapper.add(model);wrapper.scale.setScalar(3.15/size.y);
    model.traverse(object=>{if(object.isMesh){object.material=metal;object.castShadow=false;}});
    model=wrapper;scene.add(model);
    for(let i=0;i<8;i++){
      const object=new THREE.Mesh(new THREE.TetrahedronGeometry(.07+(i%3)*.035),shard);
      const origin=new THREE.Vector3(1.2+(i%3)*.35,1.18-i*.35,-.4-(i%2)*.35);
      object.position.copy(origin);object.rotation.set(i*.36,i*.62,i*.25);
      fragments.push({object,origin,rotation:object.rotation.clone()});scene.add(object);
    }
    key=new THREE.PointLight('#ffae55',75,12,2);key.position.set(-2,2.2,3);scene.add(key);
    rim=new THREE.PointLight('#94bdce',75,12,2);rim.position.set(3,1,-2);scene.add(rim);
    fill=new THREE.PointLight('#e8f0ff',5,12,2);fill.position.set(0,-2,4);scene.add(fill);
    scene.add(new THREE.HemisphereLight('#a7c0d2','#0a0807',.4));
    ready=true;host.appendChild(renderer.domElement);
    applyTheme();resize();setPose(0);paint();
    hero.dataset.renderer='ready';
    button?.addEventListener('click',()=>{userPaused=!userPaused;updateState();});
    host.dispatchEvent(new Event('scene-ready'));
    updateState();
    if(capture)window.SentinelSceneCapture=()=>{setPose(0);paint();return renderer.domElement.toDataURL('image/png');};
  }catch(error){fail();}
}
if(hero&&host){
  hero.dataset.renderer='poster';
  const observer=new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;if(visible)initialise();updateState();},{threshold:.05});observer.observe(hero);
  new ResizeObserver(resize).observe(host);
  new MutationObserver(applyTheme).observe(document.documentElement,{attributes:true,attributeFilter:['data-theme']});
  systemDark.addEventListener('change',applyTheme);
  reduce.addEventListener('change',()=>{resetPointer();if(reduce.matches){setPose(0);paint();}else initialise();updateState();});
  document.addEventListener('visibilitychange',()=>{resetPointer();updateState();});
  hero.addEventListener('pointermove',event=>{
    if(reduce.matches||!matchMedia('(pointer:fine)').matches)return;
    const rect=hero.getBoundingClientRect();pointer.x=(event.clientX-rect.left)/rect.width-.5;pointer.y=.5-(event.clientY-rect.top)/rect.height;
  },{passive:true});
  hero.addEventListener('pointerleave',resetPointer);
  addEventListener('pagehide',()=>{cancelAnimationFrame(frame);renderer?.dispose();env?.dispose();disposed=true;});
}
