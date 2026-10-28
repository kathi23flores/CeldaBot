class Matrix4 {
  constructor() {
    this.elements = new Float32Array([
      1,0,0,0,
      0,1,0,0,
      0,0,1,0,
      0,0,0,1
    ]);
  }
  identity() {
    this.elements.set([1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,0,1]);
    return this;
  }
  multiply(m) {
    const a = this.elements, b = m.elements;
    const r = new Float32Array(16);
    for (let c = 0; c < 4; c++) {
      for (let f = 0; f < 4; f++) {
        let suma = 0;
        for (let k = 0; k < 4; k++) suma += a[k * 4 + f] * b[c * 4 + k];
        r[c * 4 + f] = suma;
      }
    }
    this.elements = r;
    return this;
  }
  makeTranslation(x, y, z) {
    this.elements.set([1,0,0,0, 0,1,0,0, 0,0,1,0, x,y,z,1]);
    return this;
  }
  makeRotationX(a) {
    const c = Math.cos(a), s = Math.sin(a);
    this.elements.set([1,0,0,0, 0,c,s,0, 0,-s,c,0, 0,0,0,1]);
    return this;
  }
  makeRotationY(a) {
    const c = Math.cos(a), s = Math.sin(a);
    this.elements.set([c,0,-s,0, 0,1,0,0, s,0,c,0, 0,0,0,1]);
    return this;
  }
  makeRotationZ(a) {
    const c = Math.cos(a), s = Math.sin(a);
    this.elements.set([c,s,0,0, -s,c,0,0, 0,0,1,0, 0,0,0,1]);
    return this;
  }
  makeScale(x, y, z) {
    this.elements.set([x,0,0,0, 0,y,0,0, 0,0,z,0, 0,0,0,1]);
    return this;
  }
  static perspective(fov, aspect, near, far) {
    const f = 1.0 / Math.tan(fov / 2);
    const nf = 1.0 / (near - far);
    const m = new Matrix4();
    m.elements.set([
      f/aspect, 0, 0, 0,
      0, f, 0, 0,
      0, 0, (far+near)*nf, -1,
      0, 0, 2*far*near*nf, 0
    ]);
    return m;
  }
  static lookAt(eye, target, up) {
    const z = this.normalize([eye[0]-target[0], eye[1]-target[1], eye[2]-target[2]]);
    const x = this.normalize(this.cross(up, z));
    const y = this.cross(z, x);
    const m = new Matrix4();
    m.elements.set([
      x[0], y[0], z[0], 0,
      x[1], y[1], z[1], 0,
      x[2], y[2], z[2], 0,
      -(x[0]*eye[0]+x[1]*eye[1]+x[2]*eye[2]),
      -(y[0]*eye[0]+y[1]*eye[1]+y[2]*eye[2]),
      -(z[0]*eye[0]+z[1]*eye[1]+z[2]*eye[2]),
      1
    ]);
    return m;
  }
  static normalize(v) { const l = Math.hypot(...v)||1; return [v[0]/l, v[1]/l, v[2]/l]; }
  static cross(a, b) { return [a[1]*b[2]-a[2]*b[1], a[2]*b[0]-a[0]*b[2], a[0]*b[1]-a[1]*b[0]]; }
}