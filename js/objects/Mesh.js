class Mesh extends Object3D {
  constructor(geometry, material) {
    super();
    this.geometry = geometry;
    this.material = material;
    this.isMesh = true;
    this.visible = true;
    this.isSelected = false;
  }
}