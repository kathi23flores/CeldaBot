// Integración del mini motor: escena, materiales, robot, simulación e interacción.
const canvas=document.getElementById('glCanvas');
const renderer=new Renderer(canvas), gl=renderer.gl;
const scene=new Scene();
const camera=new PerspectiveCamera(Math.PI/3,canvas.width/canvas.height,0.1,100);
const geometries={box:new BoxGeometry(1,1,1),cylinder:new CylinderGeometry(0.5,1,24),sphere:new SphereGeometry(0.5,16,24),bin:new OpenBoxGeometry(1.7,0.85,1.7),cone:new ConeGeometry(0.5,1,24)};
for(const geometry of Object.values(geometries))renderer.uploadGeometry(geometry);
const materials={
  floor:new BasicMaterial([0.65,0.70,0.76],TextureLoader.load(gl,'texturas/piso.png','piso')),
  belt:new BasicMaterial([0.65,0.68,0.72],TextureLoader.load(gl,'texturas/banda.png','banda')),
  orange:new BasicMaterial([1,0.48,0.12],TextureLoader.load(gl,'texturas/metal.png','metal')),
  dark:new BasicMaterial([0.22,0.28,0.35]), metal:new BasicMaterial([0.65,0.72,0.8]),
  red:new BasicMaterial([0.95,0.16,0.16]),blue:new BasicMaterial([0.12,0.4,1]),green:new BasicMaterial([0.15,0.85,0.35]),
  yellow:new BasicMaterial([1,0.74,0.10]),lamp:new BasicMaterial([0.2,1,0.4]),wall:new BasicMaterial([0.12,0.17,0.23])
};
materials.floor.uvRepeat=[5,5];materials.belt.uvRepeat=[5,1];materials.orange.uvRepeat=[2,2];materials.lamp.emissive=true;
const selectable=[];
function mesh(geometry,material,parent,position,scale,name='',rotation=[0,0,0]){
  const object=new Mesh(geometry,material);object.position=position;object.scale=scale;object.rotation=rotation;object.name=name;
  parent.add(object);return object;
}
const floor=mesh(geometries.box,materials.floor,scene,[0,-0.1,0],[15,0.2,13],'Piso');
mesh(geometries.box,materials.wall,scene,[0,1.5,-5],[15,3,0.15],'Pared del taller');
const conveyor=new Object3D();scene.add(conveyor);
mesh(geometries.box,materials.dark,conveyor,[-1.9,0.59,2.6],[6.1,0.3,1.4],'Banda transportadora');
mesh(geometries.box,materials.belt,conveyor,[-1.9,0.76,2.6],[6.1,0.08,1.3],'Caucho');
for(const x of [-4.3,0.3])for(const z of [2.15,3.05])mesh(geometries.box,materials.dark,conveyor,[x,0.27,z],[0.18,0.54,0.18],'Soporte de banda');
const rollers=[];
for(let i=0;i<13;i++){
  const roller=mesh(geometries.cylinder,materials.metal,conveyor,[-4.7+i*0.47,0.63,2.6],[0.29,1.55,0.29],'Rodillo',[Math.PI/2,0,0]);rollers.push(roller);
}
for(const z of [1.88,3.32])for(let i=0;i<22;i++)mesh(geometries.box,i%2?materials.dark:materials.yellow,conveyor,[-4.8+i*0.27,0.79,z],[0.27,0.09,0.10],'Franja de seguridad');
// Marca amarilla: las piezas se detienen aquí antes de ser recogidas.
mesh(geometries.box,materials.yellow,conveyor,[0,0.807,2.6],[0.05,0.012,1.3],'Zona de recogida');
const bins=[];
for(const [i,definition] of PIECE_TYPES.entries()){
  const bin=new Object3D();bin.position=definition.position.slice();bin.type=i;bin.deposited=0;scene.add(bin);
  const material=materials[definition.material], geometry=geometries[definition.geometry];
  const box=mesh(geometries.bin,material,bin,[0,0.525,0],[1,1,1],'Contenedor '+definition.plural);
  box.selectable=true;box.castShadow=true;selectable.push(box);bins.push(bin);
  mesh(geometry,material,bin,[1.1,0.27,0],[0.3,0.3,0.3],'Símbolo de categoría');
}
const robot=new RobotArm(geometries,materials,selectable);scene.add(robot);
for(const object of selectable)object.selectable=true;
// Torre de estado: soporte, carcasa y lámpara conectada a una luz puntual.
const tower=new Object3D();tower.position=[-2.8,0,-2.1];scene.add(tower);
mesh(geometries.cylinder,materials.dark,tower,[0,0.15,0],[0.75,0.3,0.75],'Base de torre');
mesh(geometries.cylinder,materials.metal,tower,[0,1.9,0],[0.12,3.6,0.12],'Mástil de torre');
mesh(geometries.cylinder,materials.dark,tower,[0,3.65,0],[0.65,0.15,0.65],'Carcasa de torre');
const lamp=mesh(geometries.sphere,materials.lamp,tower,[0,3.98,0],[0.55,0.65,0.55],'Luz de estado');lamp.selectable=true;
mesh(geometries.cone,materials.dark,tower,[0,4.38,0],[0.72,0.24,0.72],'Sombrerete de torre');
scene.pointLight=new Light('point',[0.2,1,0.4],1.4);scene.pointLight.position=[0,3.98,0];tower.add(scene.pointLight);
scene.ambientLight=new Light('ambient',[1,1,1],0.38);scene.add(scene.ambientLight);
scene.directionalLight=new Light('directional',[1,1,1],0.72);scene.add(scene.directionalLight);
// Referencias X y Z sobre el piso.
const axisX=mesh(geometries.box,materials.red,scene,[-3.5,0.012,-4],[2,0.012,0.025]);axisX.ignorePicking=true;
const axisZ=mesh(geometries.box,materials.blue,scene,[-4.5,0.013,-3],[0.025,0.012,2]);axisZ.ignorePicking=true;
const simulation=new Simulation(scene,robot,geometries,materials,bins,rollers);
const controls=new OrbitControls(canvas,camera,(x,y)=>simulation.select(Picking.select(scene,camera,canvas.getBoundingClientRect(),x,y)));
const byId=id=>document.getElementById(id);
const actions={
  auto:()=>simulation.toggleAuto(),
  grip:()=>simulation.toggleGrip(),
  pickup:()=>simulation.pickupSelected(),
  belt:()=>{simulation.beltPaused=!simulation.beltPaused;},
  stop:()=>{simulation.stopped=!simulation.stopped;simulation.message=simulation.stopped?'Simulación detenida. Pulsa Reanudar para continuar.':'Simulación reanudada.';},
  reset:()=>{simulation.reset();controls.view(1);},
  view1:()=>controls.view(1),view2:()=>controls.view(2),view3:()=>controls.view(3)
};
for(const [id,action] of Object.entries(actions))byId(id).addEventListener('click',()=>{action();canvas.focus();});
byId('speed').addEventListener('input',event=>{simulation.speed=Number(event.target.value);});
const shortcut={m:'auto',' ':'grip',g:'pickup',p:'belt',r:'reset','1':'view1','2':'view2','3':'view3'};
window.addEventListener('keydown',event=>{
  if(event.target && ['INPUT','TEXTAREA','SELECT'].includes(event.target.tagName))return;
  const key=event.key.toLowerCase();
  if(shortcut[key] || ['a','d','w','s','q','e','arrowleft','arrowright','arrowup','arrowdown'].includes(key))event.preventDefault();
  if(shortcut[key]){if(!event.repeat)actions[shortcut[key]]();return;}
  if(['a','d','w','s','q','e'].includes(key))simulation.manual();
  simulation.keys[key]=true;
});
window.addEventListener('keyup',event=>{delete simulation.keys[event.key.toLowerCase()];});
let previous=null;
function clearKeys(){simulation.keys={};previous=null;}
window.addEventListener('blur',clearKeys);
document.addEventListener('visibilitychange',()=>{if(document.hidden)clearKeys();});
const labels=PIECE_TYPES.map(definition=>[definition.label,()=>[definition.position[0],1.15,definition.position[2]]]);
labels.push(['labelTower',()=>[-2.8,4.6,-2.1]]);
function updateHUD(){
  const [status,color]=simulation.status;
  byId('estado').textContent=status;byId('estado').style.color=`rgb(${color.map(v=>Math.round(v*255)).join(',')})`;
  byId('modo').textContent=simulation.auto?'AUTOMÁTICO':'MANUAL';
  byId('contador').textContent=simulation.count;byId('errors').textContent=simulation.errors;
  byId('selection').textContent=simulation.selected?simulation.selected.name:'Ninguna';
  byId('pieceState').textContent=simulation.selected && simulation.selected.state?simulation.selected.state:'—';
  byId('message').textContent=simulation.message;
  byId('detection').textContent=simulation.lastDetection;
  byId('auto').textContent=simulation.auto?'Pasar a manual (M)':'Clasificar automático (M)';
  byId('belt').textContent=simulation.beltPaused?'Reanudar banda (P)':'Pausar banda (P)';
  byId('stop').textContent=simulation.stopped?'Reanudar simulación':'Detener simulación';
  byId('pickup').disabled=simulation.stopped || !!simulation.held || !simulation.selected || !['banda','suelo'].includes(simulation.selected.state);
  byId('speedValue').textContent=simulation.speed.toFixed(1)+' m/s';
  for(let i=0;i<bins.length;i++)byId('binCount'+i).textContent=bins[i].deposited+'/9';
  const rect=canvas.getBoundingClientRect();
  for(const [id,position] of labels){const screen=Picking.project(position(),camera,rect),element=byId(id);
    const inside=screen && screen[0]>rect.left+30 && screen[0]<rect.right-30 && screen[1]>rect.top+100 && screen[1]<rect.bottom-30;
    element.style.display=inside?'block':'none';if(inside){element.style.left=screen[0]+'px';element.style.top=screen[1]+'px';}}
  scene.pointLight.color=color;scene.pointLight.intensity=simulation.stopped?1.1:1.5+Math.sin(simulation.time*5)*0.2;
  materials.lamp.color=color;
  lamp.scale=[0.55,0.65+Math.sin(simulation.time*5)*0.025,0.55];
}
function animate(ms){
  const dt=previous===null?0:Math.max(0,Math.min((ms-previous)/1000,0.05));previous=ms;
  simulation.update(dt);scene.updateMatrixWorld();
  const keys=simulation.keys;
  if(keys.arrowleft)controls.pan(-dt*3,0);if(keys.arrowright)controls.pan(dt*3,0);
  if(keys.arrowup)controls.pan(0,dt*2);if(keys.arrowdown)controls.pan(0,-dt*2);
  controls.update(robot.grip.getWorldPosition());updateHUD();renderer.render(scene,camera);
  requestAnimationFrame(animate);
}
requestAnimationFrame(animate);
