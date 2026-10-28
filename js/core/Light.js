// Luces independientes de la geometría que representa una lámpara.
class Light extends Object3D {
  constructor(type, color = [1, 1, 1], intensity = 1) {
    super();
    this.type = type;
    this.color = color;
    this.intensity = intensity;
    this.direction = [-0.4, 1, 0.5];
  }
}
