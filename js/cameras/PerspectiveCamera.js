class PerspectiveCamera extends Camera {
  constructor(fov, aspect, near, far) {
    super();
    this.fov = fov;
    this.aspect = aspect;
    this.near = near;
    this.far = far;
  }
}