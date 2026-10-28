// Ciclo de clasificación y estados de cada pieza: banda -> sujeta -> cayendo -> clasificada.
class Simulation {
  constructor(scene,robot,geometries,materials,bins,rollers) {
    Object.assign(this,{scene,robot,geometries,materials,bins,rollers});
    this.pieceTypes=PIECE_TYPES;
    this.trails=[]; this.pieces=[]; this.selected=null; this.held=null; this.job=null;
    this.keys={}; this.auto=true; this.beltPaused=false; this.stopped=false;
    this.speed=0.8; this.count=0; this.errors=0; this.spawnIndex=0; this.time=0;
    this.message='El modo automático recoge y clasifica una pieza a la vez.';
    this.pickup=[0,1.05,2.6]; this.reset();
  }
  spawn(x) {
    const type=this.spawnIndex++%this.pieceTypes.length;
    const definition=this.pieceTypes[type];
    const geometry=this.geometries[definition.geometry];
    const material=this.materials[definition.material];
    const piece=new Mesh(geometry,material);
    piece.type=type; piece.name=definition.name;
    piece.scale=[0.5,0.5,0.5]; piece.position=[x,1.05,2.6];
    piece.radius=0.25; piece.state='banda'; piece.selectable=true; piece.castShadow=true;
    this.scene.add(piece); this.pieces.push(piece); return piece;
  }
  reset() {
    for(const piece of [...this.pieces,...this.trails]) if(piece.parent) piece.parent.remove(piece);
    this.trails=[];
    if(this.selected) this.selected.isSelected=false;
    this.pieces=[];this.selected=null;this.held=null;this.job=null;
    this.auto=true;this.beltPaused=false;this.stopped=false;
    this.count=0;this.errors=0;this.spawnIndex=0;this.time=0;this.keys={};
    this.lastDetection='Esperando una pieza';
    for(const bin of this.bins) bin.deposited=0;
    this.robot.aim([0,2.1,2.6]);this.robot.setOpening(true);
    for(let i=0;i<this.pieceTypes.length;i++) this.spawn(-0.6-i*1.2);
    this.message='Clasificación automática iniciada. M cambia a control manual.';
  }
  select(mesh) {
    if(this.selected) this.selected.isSelected=false;
    this.selected=mesh;
    if(mesh){mesh.isSelected=true;this.message=mesh.type!==undefined ? 'Pieza seleccionada. G la recoge; Espacio acciona la pinza si está cerca.' : mesh.name;}
    else this.message='Sin selección. Haz clic en una pieza o articulación.';
  }
  manual() { this.auto=false;this.job=null; }
  toggleAuto() {
    this.auto=!this.auto; this.job=null;
    this.message=this.auto?'Clasificación automática activada.':'Control manual. G recoge la pieza seleccionada.';
  }
  toggleGrip() {
    this.manual();
    if(this.stopped){this.message='Reanuda la simulación antes de accionar la pinza.';return;}
    if(this.held){this.release();this.robot.setOpening(true);return;}
    if(!this.robot.open){this.robot.setOpening(true);return;}
    this.scene.updateMatrixWorld();
    const grip=this.robot.grip.getWorldPosition();
    const candidates=this.pieces.filter(piece=>['banda','suelo'].includes(piece.state));
    candidates.sort((a,b)=>this.distance(a.getWorldPosition(),grip)-this.distance(b.getWorldPosition(),grip));
    const candidate=candidates[0];
    if(candidate && this.distance(candidate.getWorldPosition(),grip)<0.28) this.grab(candidate);
    else {this.robot.setOpening(false);this.message='No hay una pieza entre los dedos. Selecciona una y pulsa G para acercar la pinza.';}
  }
  distance(a,b) { return Math.hypot(...a.map((value,i)=>value-b[i])); }
  detectType(piece) {
    return this.pieceTypes.findIndex(definition=>this.geometries[definition.geometry]===piece.geometry);
  }
  identify(piece) {
    const type=this.detectType(piece);
    if(type<0){this.lastDetection='Figura desconocida';this.message='No se reconoce la geometría de esta pieza.';this.auto=false;return false;}
    piece.type=type;
    const definition=this.pieceTypes[type];
    this.lastDetection=definition.shape+' → contenedor '+definition.color;
    return true;
  }
  grab(piece) {
    this.scene.updateMatrixWorld();
    if(this.held || !['banda','suelo'].includes(piece.state) || this.distance(piece.getWorldPosition(),this.robot.grip.getWorldPosition())>0.28) return false;
    this.robot.grip.add(piece);piece.position=[0,0,0];piece.rotation=[0,0,0];piece.state='sujeta';
    this.held=piece;this.robot.setOpening(false,true);
    this.message=piece.name+' sujetada: ahora hereda la transformación de la pinza.';
    return true;
  }
  release() {
    if(!this.held) return;
    this.scene.updateMatrixWorld();
    const piece=this.held, world=piece.getWorldPosition();
    this.scene.add(piece);piece.position=world;piece.rotation=[0,this.robot.base.rotation[1],0];
    piece.state='cayendo';piece.velocity=0;piece.trailClock=0;this.held=null;
    this.robot.setOpening(true);this.message='Pieza soltada. Solo cuenta si cae en el contenedor correcto.';
  }
  startPickup(piece,deliver=false) {
    if(this.stopped) return false;
    if(this.held){this.message='Ya hay una pieza sujeta. Espacio la suelta o M la clasifica automáticamente.';return false;}
    if(!piece || !['banda','suelo'].includes(piece.state)){this.message='Selecciona primero una pieza que esté en la banda o en el piso.';return false;}
    if(!this.identify(piece)) return false;
    if(deliver && this.bins[piece.type].deposited>=9){this.stopped=true;this.message='Contenedores completos. Pulsa R para iniciar otra tanda.';return false;}
    this.scene.updateMatrixWorld();
    const position=piece.getWorldPosition(), old=this.robot.grip.getWorldPosition();
    const above=[position[0],position[1]+0.9,position[2]];
    // Verificar alcance sin cambiar la postura si no se puede recoger.
    const reachable=Math.hypot(position[0],position[2],above[1]+0.32-this.robot.shoulderHeight)<4.77;
    if(!reachable){this.message='La pieza está fuera del alcance. Deja que la banda la acerque al robot.';return false;}
    this.job={piece,deliver,phase:0,elapsed:0,from:old,target:above};
    this.robot.setOpening(true);return true;
  }
  pickupSelected() {
    this.manual();this.startPickup(this.selected,false);
  }
  binTarget(piece) {
    const bin=this.bins[piece.type], index=bin.deposited;
    return [bin.position[0]+((index%3)-1)*0.52,0.92,bin.position[2]+(Math.floor(index/3)-1)*0.52];
  }
  beginDelivery() {
    const piece=this.held;
    if(!piece) return;
    if(!this.identify(piece)) return;
    if(this.bins[piece.type].deposited>=9){this.message='Contenedor lleno. R reinicia la celda.';this.stopped=true;return;}
    this.scene.updateMatrixWorld();
    this.job={piece,deliver:true,phase:3,elapsed:0,from:this.robot.grip.getWorldPosition(),target:this.binTarget(piece).map((v,i)=>i===1?2.2:v)};
  }
  nextPhase(target,phase) {
    this.scene.updateMatrixWorld();
    this.job.from=this.robot.grip.getWorldPosition();this.job.target=target;this.job.phase=phase;this.job.elapsed=0;
  }
  updateJob(dt) {
    if(!this.job) return;
    const job=this.job;
    if(job.phase===2) {
      job.elapsed+=dt;
      if(job.elapsed<0.25) return;
      if(!this.grab(job.piece)){this.message='La pieza se desplazó antes del agarre. Reintentando.';this.job=null;return;}
      const p=this.robot.grip.getWorldPosition();this.nextPhase([p[0],2.2,p[2]],3);return;
    }
    job.elapsed+=dt;
    const duration=Math.max(0.45,this.distance(job.from,job.target)/2.2);
    const ratio=Math.min(1,job.elapsed/duration), smooth=ratio*ratio*(3-2*ratio);
    const target=job.from.map((value,i)=>value+(job.target[i]-value)*smooth);
    if(!this.robot.aim(target)){this.message='Objetivo fuera del alcance del brazo.';this.job=null;this.auto=false;return;}
    if(ratio<1) return;
    this.scene.updateMatrixWorld();
    if(job.phase===0){this.nextPhase(job.piece.getWorldPosition(),1);}
    else if(job.phase===1){this.robot.setOpening(false,true);job.phase=2;job.elapsed=0;}
    else if(job.phase===3){
      if(!job.deliver){this.job=null;this.message='Pieza recogida. Muévela con A/D, W/S y Q/E; Espacio la suelta.';}
      else {const bin=this.bins[job.piece.type];if(bin.deposited>=9){this.stopped=true;this.message='Contenedor lleno. Pulsa R.';return;}this.nextPhase(this.binTarget(job.piece).map((v,i)=>i===1?2.2:v),4);}
    }
    else if(job.phase===4){this.nextPhase(this.binTarget(job.piece),5);}
    else if(job.phase===5){this.release();this.nextPhase(job.target.map((v,i)=>i===1?2.2:v),6);}
    else if(job.phase===6){this.job=null;}
  }
  updateBelt(dt) {
    if(this.beltPaused) return;
    const belt=this.pieces.filter(piece=>piece.state==='banda').sort((a,b)=>b.position[0]-a.position[0]);
    const locked=this.job && this.job.phase<=2 ? this.job.piece : null;
    let limit=0;
    for(const piece of belt){
      if(piece!==locked) piece.position[0]=Math.min(limit,piece.position[0]+dt*this.speed);
      limit=piece.position[0]-0.95;
    }
    for(const roller of this.rollers) roller.rotation[1]-=dt*this.speed*4;
    this.materials.belt.uvOffset[0]-=dt*this.speed*0.3;
    if(belt.length<this.pieceTypes.length && (!belt.length || belt[belt.length-1].position[0]>-3.5)) this.spawn(-4.55);
  }
  updateFalling(dt) {
    for(const piece of this.pieces){
      if(piece.state!=='cayendo') continue;
      piece.velocity-=dt*9.8;piece.position[1]+=piece.velocity*dt;
      piece.trailClock+=dt;
      if(piece.trailClock>0.06){
        piece.trailClock=0;
        const material=new BasicMaterial(piece.material.color.slice());material.emissive=true;material.opacity=0.18;
        const trail=new Mesh(this.geometries.sphere,material);trail.position=piece.position.slice();trail.scale=[0.28,0.28,0.28];trail.life=0.22;trail.ignorePicking=true;
        this.scene.add(trail);this.trails.push(trail);
      }
      const bin=this.bins.find(bin=>Math.abs(piece.position[0]-bin.position[0])<0.76 && Math.abs(piece.position[2]-bin.position[2])<0.76);
      // El fondo está a y=0.12, y la pieza tiene semialtura de 0.25.
      const ground=bin?0.37:0.25;
      if(piece.position[1]>ground) continue;
      piece.position[1]=ground;
      if(bin){
        const world=piece.position.slice();bin.add(piece);piece.position=world.map((v,i)=>v-bin.position[i]);
        piece.state=this.detectType(piece)===bin.type?'clasificada':'incorrecta';
        if(piece.state==='clasificada'){bin.deposited++;this.count++;this.message=piece.name+' depositada correctamente.';}
        else {this.errors++;this.message='Contenedor incorrecto: rojo/esfera, azul/cubo, verde/cilindro y amarillo/cono.';}
      } else {piece.state='suelo';this.message='Pieza en el piso. Puedes seleccionarla y recogerla con G.';}
    }
  }
  update(dt) {
    if(this.stopped) return;
    this.time+=dt;
    for(const trail of this.trails){trail.life-=dt;trail.material.opacity=Math.max(0,trail.life/0.22)*0.18;}
    for(const trail of this.trails.filter(item=>item.life<=0))this.scene.remove(trail);
    this.trails=this.trails.filter(item=>item.life>0);
    this.updateBelt(dt);
    if(this.job) this.updateJob(dt);
    else if(this.auto){
      if(this.held) this.beginDelivery();
      else {const front=this.pieces.find(piece=>piece.state==='banda' && piece.position[0]>=-0.001);if(front)this.startPickup(front,true);}
    } else this.robot.moveManual(this.keys,dt);
    this.updateFalling(dt);
  }
  get status() {
    if(this.stopped) return ['DETENIDO',[1,0.12,0.08]];
    if(this.errors && this.message.startsWith('Contenedor incorrecto')) return ['ERROR DE CLASIFICACIÓN',[1,0.12,0.08]];
    if(this.job || this.held || Object.values(this.keys).some(Boolean)) return ['OPERANDO',[0.2,1,0.4]];
    return [this.beltPaused?'BANDA PAUSADA':'EN ESPERA',[1,0.65,0.1]];
  }
}

