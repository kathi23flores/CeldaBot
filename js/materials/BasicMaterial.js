class BasicMaterial {
  constructor(color = [1, 1, 1], texture = null) {
    this.color = color;
    this.texture = texture;
    this.uvRepeat = [1, 1];
    this.uvOffset = [0, 0];
    this.emissive = false;
    this.shininess = 32;
    this.opacity = 1;
  }
}
