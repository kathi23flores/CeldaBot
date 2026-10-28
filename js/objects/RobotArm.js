// Brazo de dos eslabones con muñeca y pinza. Las escalas solo viven en mallas.
class RobotArm extends Object3D {
  constructor(geometries, materials, selectable) {
    super();
    this.length1 = 2.5; this.length2 = 2.3; this.shoulderHeight = 0.6;
    const mesh = (geometry, material, parent, position, scale, name, rotation = [0,0,0]) => {
      const part = new Mesh(geometry, material);
      part.position = position; part.scale = scale; part.rotation = rotation;
      part.name = name; part.castShadow = true; parent.add(part); selectable.push(part);
      return part;
    };
    const pivot = (parent, position) => { const node = new Object3D(); node.position = position; parent.add(node); return node; };
    this.base = pivot(this, [0,0,0]);
    mesh(geometries.cylinder, materials.dark, this.base, [0,0.2,0], [1.35,0.4,1.35], 'Base giratoria');
    this.shoulder = pivot(this.base, [0,this.shoulderHeight,0]);
    mesh(geometries.cylinder, materials.dark, this.shoulder, [0,0,0], [0.7,0.7,0.7], 'Articulación del hombro', [Math.PI/2,0,0]);
    mesh(geometries.box, materials.orange, this.shoulder, [0,this.length1/2,0], [0.42,this.length1,0.42], 'Brazo');
    this.elbow = pivot(this.shoulder, [0,this.length1,0]);
    mesh(geometries.cylinder, materials.dark, this.elbow, [0,0,0], [0.55,0.65,0.55], 'Articulación del codo', [Math.PI/2,0,0]);
    mesh(geometries.box, materials.orange, this.elbow, [0,this.length2/2,0], [0.32,this.length2,0.32], 'Antebrazo');
    this.wrist = pivot(this.elbow, [0,this.length2,0]);
    mesh(geometries.cylinder, materials.dark, this.wrist, [0,0.04,0], [0.48,0.22,0.48], 'Muñeca');
    mesh(geometries.box, materials.orange, this.wrist, [0,-0.04,0], [0.85,0.16,0.35], 'Soporte de pinza');
    this.left = mesh(geometries.box, materials.dark, this.wrist, [-0.48,-0.32,0], [0.10,0.6,0.24], 'Dedo izquierdo');
    this.right = mesh(geometries.box, materials.dark, this.wrist, [0.48,-0.32,0], [0.10,0.6,0.24], 'Dedo derecho');
    this.grip = pivot(this.wrist, [0,-0.32,0]);
    this.open = true;
    this.aim([0,1.8,2.6]);
  }
  // Cinemática inversa en el plano del brazo; atan2 orienta la base hacia el objetivo.
  aim(target) {
    const radial = Math.hypot(target[0], target[2]);
    const y = target[1] + 0.32 - this.shoulderHeight;
    const distance = Math.hypot(radial, y);
    if (distance > this.length1 + this.length2 - 0.015 || distance < 0.25) return false;
    const cosine = (distance*distance - this.length1*this.length1 - this.length2*this.length2) / (2*this.length1*this.length2);
    const elbow = -Math.acos(Math.max(-1,Math.min(1,cosine)));
    const shoulder = Math.atan2(y,radial) - Math.atan2(this.length2*Math.sin(elbow), this.length1 + this.length2*Math.cos(elbow));
    this.base.rotation[1] = Math.atan2(-target[2], target[0]);
    this.shoulder.rotation[2] = shoulder - Math.PI/2;
    this.elbow.rotation[2] = elbow;
    this.levelWrist();
    return true;
  }
  levelWrist() { this.wrist.rotation[2] = -this.shoulder.rotation[2] - this.elbow.rotation[2]; }
  setOpening(open, holding = false) {
    this.open = open;
    const offset = open ? 0.48 : holding ? 0.30 : 0.12;
    this.left.position[0] = -offset; this.right.position[0] = offset;
  }
  moveManual(keys, dt) {
    const speed = dt * 1.25;
    this.base.rotation[1] += ((keys.a?1:0)-(keys.d?1:0))*speed;
    this.shoulder.rotation[2] += ((keys.w?1:0)-(keys.s?1:0))*speed;
    this.elbow.rotation[2] += ((keys.q?1:0)-(keys.e?1:0))*speed;
    this.shoulder.rotation[2] = Math.max(-1.5,Math.min(1.5,this.shoulder.rotation[2]));
    this.elbow.rotation[2] = Math.max(-2.8,Math.min(0.1,this.elbow.rotation[2]));
    this.levelWrist();
  }
}
