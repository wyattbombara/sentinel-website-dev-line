import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

// One instanced sculpture. No downloaded model or reflection pass.
const stage=window.SentinelStage,form=window.SentinelForm;
if(stage&&form){
  let renderer;
  try{
    const capture=new URLSearchParams(location.search).has('capture-scene');
    renderer=new THREE.WebGLRenderer({alpha:true,antialias:true,powerPreference:'low-power',preserveDrawingBuffer:capture});
    renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.25;
    renderer.setClearColor(0,0);renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.5));
    renderer.domElement.className='sculpture-webgl';renderer.domElement.setAttribute('aria-hidden','true');
    const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(37,1,.1,30);camera.position.set(0,.1,9.8);
    const generator=new THREE.PMREMGenerator(renderer),room=new RoomEnvironment();
    const environment=generator.fromScene(room,.05).texture;scene.environment=environment;room.dispose();generator.dispose();
    const material=new THREE.MeshStandardMaterial({color:'#e2e3da',metalness:.92,roughness:.22,envMapIntensity:1.8});
    const geometry=new RoundedBoxGeometry(.07,1.04,.34,2,.025);
    const sculpture=new THREE.InstancedMesh(geometry,material,form.COUNT);sculpture.instanceMatrix.setUsage(THREE.DynamicDrawUsage);sculpture.frustumCulled=false;scene.add(sculpture);
    const rig=new THREE.Group();scene.remove(sculpture);rig.add(sculpture);scene.add(rig);
    const key=new THREE.DirectionalLight('#fff6dd',4.2);key.position.set(-4,5,4);scene.add(key);
    const rim=new THREE.DirectionalLight('#ff8248',3.6);rim.position.set(4,-1,-3);scene.add(rim);scene.add(new THREE.HemisphereLight('#e7f1ff','#8e6b44',1.2));
    const dummy=new THREE.Object3D(),color=new THREE.Color();
    function draw(time,pointer,scroll){
      rig.rotation.set(...form.orientation(time,pointer,scroll),'ZYX');rig.position.y=Math.sin(time*.9)*.08;
      for(let i=0;i<form.COUNT;i++){
        const p=form.pose(i,time);dummy.position.set(...p.position);dummy.rotation.set(...p.rotation,'ZYX');dummy.scale.set(1,p.scale,1);dummy.updateMatrix();sculpture.setMatrixAt(i,dummy.matrix);
        sculpture.setColorAt(i,color.set(p.orange?'#f15c1b':'#dce0d4'));
      }
      sculpture.instanceMatrix.needsUpdate=true;sculpture.instanceColor.needsUpdate=true;renderer.render(scene,camera);
    }
    renderer.domElement.addEventListener('webglcontextlost',event=>{event.preventDefault();stage.downgrade();renderer.dispose();renderer.domElement.remove();});
    stage.host.appendChild(renderer.domElement);
    stage.upgrade({canvas:renderer.domElement,draw,resize(width,height){renderer.setSize(width,height,false);camera.aspect=width/height;camera.updateProjectionMatrix();}});
  }catch{renderer?.dispose();renderer?.domElement.remove();stage.downgrade();}
}
