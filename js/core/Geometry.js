class Geometry {
  constructor() {
    this.vertices = new Float32Array(); // x,y,z, nx,ny,nz, u,v
    this.indices = new Uint16Array();
    this.vao = null;
  }
}