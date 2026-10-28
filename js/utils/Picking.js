// Intersección rayo/triángulo. Se evalúa la geometría visible, no solo su caja.
class Picking {
  static transform(matrix, point) {
    const e = matrix.elements, [x,y,z] = point;
    return [e[0]*x+e[4]*y+e[8]*z+e[12], e[1]*x+e[5]*y+e[9]*z+e[13], e[2]*x+e[6]*y+e[10]*z+e[14]];
  }
  static subtract(a,b) { return a.map((v,i)=>v-b[i]); }
  static dot(a,b) { return a.reduce((sum,v,i)=>sum+v*b[i],0); }
  static ray(camera, rect, x, y) {
    const forward = Matrix4.normalize(this.subtract(camera.target,camera.position));
    const right = Matrix4.normalize(Matrix4.cross(forward,camera.up));
    const up = Matrix4.cross(right,forward);
    const scale = Math.tan(camera.fov/2);
    const nx = ((x-rect.left)/rect.width*2-1)*scale*rect.width/rect.height;
    const ny = (1-(y-rect.top)/rect.height*2)*scale;
    return { origin: camera.position, direction: Matrix4.normalize(forward.map((v,i)=>v+right[i]*nx+up[i]*ny)) };
  }
  static triangle(ray,a,b,c) {
    const edge1=this.subtract(b,a), edge2=this.subtract(c,a);
    const h=Matrix4.cross(ray.direction,edge2), determinant=this.dot(edge1,h);
    if (Math.abs(determinant)<1e-8) return Infinity;
    const inverse=1/determinant, s=this.subtract(ray.origin,a), u=inverse*this.dot(s,h);
    if (u<0 || u>1) return Infinity;
    const q=Matrix4.cross(s,edge1), v=inverse*this.dot(ray.direction,q);
    if (v<0 || u+v>1) return Infinity;
    const distance=inverse*this.dot(edge2,q);
    return distance>0.01 ? distance : Infinity;
  }
  static select(scene,camera,rect,x,y) {
    scene.updateMatrixWorld();
    const ray=this.ray(camera,rect,x,y);
    let nearest=Infinity, result=null;
    const visit=node=>{
      if (node.visible===false) return;
      if (node.isMesh && !node.ignorePicking) {
        const {vertices,indices}=node.geometry;
        const points=[];
        for(let i=0;i<vertices.length;i+=8) points.push(this.transform(node.matrixWorld,Array.from(vertices.slice(i,i+3))));
        for(let i=0;i<indices.length;i+=3) {
          const distance=this.triangle(ray,points[indices[i]],points[indices[i+1]],points[indices[i+2]]);
          if(distance<nearest) { nearest=distance; result=node.selectable ? node : null; }
        }
      }
      for(const child of node.children) visit(child);
    };
    visit(scene); return result;
  }
  static project(point,camera,rect) {
    const matrix=Matrix4.perspective(camera.fov,rect.width/rect.height,0.1,100).multiply(Matrix4.lookAt(camera.position,camera.target,camera.up)).elements;
    const [x,y,z]=point;
    const w=matrix[3]*x+matrix[7]*y+matrix[11]*z+matrix[15];
    if(w<=0) return null;
    const nx=(matrix[0]*x+matrix[4]*y+matrix[8]*z+matrix[12])/w;
    const ny=(matrix[1]*x+matrix[5]*y+matrix[9]*z+matrix[13])/w;
    return [rect.left+(nx+1)*rect.width/2,rect.top+(1-ny)*rect.height/2];
  }
}
