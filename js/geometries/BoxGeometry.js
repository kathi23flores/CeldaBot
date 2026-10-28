class BoxGeometry extends Geometry {
  constructor(w, h, d) {
    super();
    const W=w/2, H=h/2, D=d/2;
    const v = [], idx = [];
    const face = (p, n) => {
      const b = v.length / 8;
      for(let i=0; i<4; i++) {
        v.push(p[i][0], p[i][1], p[i][2], n[0], n[1], n[2], [0,1,1,0][i], [0,0,1,1][i]);
      }
      idx.push(b, b+1, b+2, b, b+2, b+3);
    };
    face([[-W,-H,D],[W,-H,D],[W,H,D],[-W,H,D]], [0,0,1]);
    face([[W,-H,-D],[-W,-H,-D],[-W,H,-D],[W,H,-D]], [0,0,-1]);
    face([[W,-H,D],[W,-H,-D],[W,H,-D],[W,H,D]], [1,0,0]);
    face([[-W,-H,-D],[-W,-H,D],[-W,H,D],[-W,H,-D]], [-1,0,0]);
    face([[-W,H,D],[W,H,D],[W,H,-D],[-W,H,-D]], [0,1,0]);
    face([[-W,-H,-D],[W,-H,-D],[W,-H,D],[-W,-H,D]], [0,-1,0]);
    this.vertices = new Float32Array(v);
    this.indices = new Uint16Array(idx);
  }
}