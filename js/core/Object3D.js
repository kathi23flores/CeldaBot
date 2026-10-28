class Object3D {
  constructor() {
    this.position = [0, 0, 0];
    this.rotation = [0, 0, 0]; // X, Y, Z
    this.scale = [1, 1, 1];
    this.children = [];
    this.parent = null;
    this.matrixWorld = new Matrix4();
  }
  add(child) {
    if (child.parent) child.parent.remove(child);
    child.parent = this;
    this.children.push(child);
    return child;
  }
  remove(child) {
    const index = this.children.indexOf(child);
    if (index !== -1) this.children.splice(index, 1);
    if (child.parent === this) child.parent = null;
  }
  getWorldPosition() {
    return Array.from(this.matrixWorld.elements.slice(12, 15));
  }
  updateMatrixWorld(parentMatrix = null) {
    const local = new Matrix4();
    local.makeTranslation(this.position[0], this.position[1], this.position[2]);
    
    const rx = new Matrix4().makeRotationX(this.rotation[0]);
    const ry = new Matrix4().makeRotationY(this.rotation[1]);
    const rz = new Matrix4().makeRotationZ(this.rotation[2]);
    const s = new Matrix4().makeScale(this.scale[0], this.scale[1], this.scale[2]);
    
    // Orden: T * R * S
    local.multiply(rx).multiply(ry).multiply(rz).multiply(s);

    if (parentMatrix) {
      this.matrixWorld.elements.set(parentMatrix.elements);
      this.matrixWorld.multiply(local);
    } else {
      this.matrixWorld.elements.set(local.elements);
    }

    for (let i = 0; i < this.children.length; i++) {
      this.children[i].updateMatrixWorld(this.matrixWorld);
    }
  }
}
