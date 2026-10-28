class OrbitControls {
  constructor(canvas,camera,onSelect) {
    this.canvas=canvas; this.camera=camera; this.drag=null;
    this.radius=12.5; this.azimuth=0.65; this.elevation=0.58; this.followGrip=false;
    canvas.addEventListener('contextmenu',event=>event.preventDefault());
    canvas.addEventListener('pointerdown',event=>{
      if(event.button!==0 && event.button!==2) return;
      canvas.focus(); canvas.setPointerCapture(event.pointerId);
      this.drag={id:event.pointerId,x:event.clientX,y:event.clientY,startX:event.clientX,startY:event.clientY,button:event.button,moved:false};
    });
    canvas.addEventListener('pointermove',event=>{
      if(!this.drag || event.pointerId!==this.drag.id) return;
      const dx=event.clientX-this.drag.x,dy=event.clientY-this.drag.y;
      if(Math.hypot(event.clientX-this.drag.startX,event.clientY-this.drag.startY)>5) this.drag.moved=true;
      if(this.drag.button===2) this.pan(-dx*this.radius*0.0015,dy*this.radius*0.0015);
      else { this.azimuth-=dx*0.006; this.elevation=Math.max(0.08,Math.min(1.54,this.elevation+dy*0.006)); }
      this.drag.x=event.clientX; this.drag.y=event.clientY; this.update();
    });
    canvas.addEventListener('pointerup',event=>{
      if(this.drag && event.pointerId===this.drag.id && !this.drag.moved && this.drag.button===0) onSelect(event.clientX,event.clientY);
      this.drag=null;
    });
    for(const name of ['pointercancel','lostpointercapture']) canvas.addEventListener(name,()=>{this.drag=null;});
    canvas.addEventListener('wheel',event=>{event.preventDefault();this.radius=Math.max(3,Math.min(30,this.radius*Math.exp(event.deltaY*0.001)));this.update();},{passive:false});
    this.view(1);
  }
  pan(horizontal,vertical) {
    this.followGrip=false;
    this.camera.target[0]+=Math.cos(this.azimuth)*horizontal;
    this.camera.target[2]-=Math.sin(this.azimuth)*horizontal;
    this.camera.target[1]=Math.max(0,this.camera.target[1]+vertical);
  }
  view(number) {
    this.followGrip=number===3;
    this.camera.target=[0,0.9,0.6];
    if(number===1){this.radius=12.5;this.azimuth=0.65;this.elevation=0.58;}
    if(number===2){this.radius=12;this.azimuth=0;this.elevation=1.54;}
    if(number===3){this.radius=4;this.azimuth=0.8;this.elevation=0.28;}
    this.update();
  }
  update(grip) {
    if(this.followGrip && grip) this.camera.target=grip.slice();
    const h=this.radius*Math.cos(this.elevation),target=this.camera.target;
    this.camera.position=[target[0]+h*Math.sin(this.azimuth),target[1]+this.radius*Math.sin(this.elevation),target[2]+h*Math.cos(this.azimuth)];
  }
}
