// Cono con normales por sector y tapa inferior, construido sin bibliotecas.
class ConeGeometry extends Geometry {
  constructor(radius=0.5,height=1,segments=24) {
    super();const vertices=[],indices=[],half=height/2;
    const triangle=(points,normals,uv)=>{
      const base=vertices.length/8;
      for(let i=0;i<3;i++)vertices.push(...points[i],...normals[i],...uv[i]);
      indices.push(base,base+1,base+2);
    };
    for(let i=0;i<segments;i++){
      const a=i/segments*Math.PI*2,b=(i+1)/segments*Math.PI*2;
      const p=[radius*Math.cos(a),-half,radius*Math.sin(a)];
      const q=[radius*Math.cos(b),-half,radius*Math.sin(b)];
      const n=Matrix4.normalize([Math.cos((a+b)/2),radius/height,Math.sin((a+b)/2)]);
      triangle([p,[0,half,0],q],[n,n,n],[[i/segments,0],[(i+0.5)/segments,1],[(i+1)/segments,0]]);
      triangle([[0,-half,0],p,q],[[0,-1,0],[0,-1,0],[0,-1,0]],[[.5,.5],[.5+.5*Math.cos(a),.5+.5*Math.sin(a)],[.5+.5*Math.cos(b),.5+.5*Math.sin(b)]]);
    }
    this.vertices=new Float32Array(vertices);this.indices=new Uint16Array(indices);
  }
}
