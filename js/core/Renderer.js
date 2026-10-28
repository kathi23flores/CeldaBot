class Renderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.gl = canvas.getContext("webgl2", { antialias: true, preserveDrawingBuffer: true });
    if (!this.gl) throw new Error("Este navegador no permite WebGL2");
    const gl = this.gl;
    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    this.initShaders();
  }
  initShaders() {
    const gl = this.gl;
    const vertex = `#version 300 es
      in vec3 aPosition; in vec3 aNormal; in vec2 aTexCoord;
      uniform mat4 uModel, uView, uProj;
      uniform bool uShadow;
      uniform vec3 uLightPos;
      out vec3 vNormal, vWorldPos; out vec2 vUV;
      void main() {
        vec4 world = uModel * vec4(aPosition, 1.0);
        vWorldPos = world.xyz;
        vNormal = transpose(inverse(mat3(uModel))) * aNormal;
        vUV = aTexCoord;
        if (uShadow) {
          float factor = (uLightPos.y - 0.018) / max(uLightPos.y - world.y, 0.1);
          world.xyz = uLightPos + (world.xyz - uLightPos) * factor;
          world.y = 0.018;
        }
        gl_Position = uProj * uView * world;
      }`;
    const fragment = `#version 300 es
      precision highp float;
      in vec3 vNormal, vWorldPos; in vec2 vUV;
      uniform vec3 uColor, uLightPos, uViewPos, uLightColor, uDir;
      uniform float uIntensity, uShininess, uAmbient, uDirectional, uOpacity;
      uniform bool uUseTexture, uEmissive, uSelected, uShadow;
      uniform vec2 uRepeat, uOffset;
      uniform sampler2D uTexture;
      out vec4 outColor;
      void main() {
        if (uShadow) { outColor = vec4(0.025, 0.035, 0.05, 0.20); return; }
        vec3 base = uColor;
        if (uUseTexture) base *= texture(uTexture, vUV * uRepeat + uOffset).rgb;
        if (uEmissive) { outColor = vec4(base, uOpacity); return; }
        vec3 N = normalize(vNormal) * (gl_FrontFacing ? 1.0 : -1.0);
        vec3 delta = uLightPos - vWorldPos;
        vec3 L = normalize(delta);
        vec3 V = normalize(uViewPos - vWorldPos);
        float attenuation = 1.0 / (1.0 + 0.035 * dot(delta, delta));
        float diffuse = max(dot(N, L), 0.0);
        float specular = diffuse > 0.0 ? pow(max(dot(N, normalize(L + V)), 0.0), uShininess) : 0.0;
        vec3 light = vec3(uAmbient + uDirectional * max(dot(N, normalize(uDir)), 0.0));
        light += uLightColor * uIntensity * attenuation * diffuse;
        vec3 color = base * light + vec3(0.18) * specular * attenuation;
        if (uSelected) color += vec3(0.32, 0.22, 0.04);
        outColor = vec4(color, uOpacity);
      }`;
    const compile = (type, source) => {
      const shader = gl.createShader(type);
      gl.shaderSource(shader, source); gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(shader));
      return shader;
    };
    this.program = gl.createProgram();
    gl.attachShader(this.program, compile(gl.VERTEX_SHADER, vertex));
    gl.attachShader(this.program, compile(gl.FRAGMENT_SHADER, fragment));
    gl.linkProgram(this.program);
    if (!gl.getProgramParameter(this.program, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(this.program));
    this.loc = {};
    for (const name of ['Model','View','Proj','Color','LightPos','ViewPos','LightColor','Dir',
      'Intensity','Shininess','Opacity','Ambient','Directional','UseTexture','Emissive','Selected','Shadow','Repeat','Offset','Texture']) {
      this.loc[name] = gl.getUniformLocation(this.program, 'u' + name);
    }
  }
  uploadGeometry(geometry) {
    const gl = this.gl;
    geometry.vao = gl.createVertexArray(); gl.bindVertexArray(geometry.vao);
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ARRAY_BUFFER, geometry.vertices, gl.STATIC_DRAW);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, geometry.indices, gl.STATIC_DRAW);
    for (const [name, size, offset] of [['aPosition',3,0],['aNormal',3,12],['aTexCoord',2,24]]) {
      const location = gl.getAttribLocation(this.program, name);
      if (location >= 0) { gl.enableVertexAttribArray(location); gl.vertexAttribPointer(location, size, gl.FLOAT, false, 32, offset); }
    }
    geometry.count = geometry.indices.length;
    gl.bindVertexArray(null);
  }
  render(scene, camera) {
    const gl = this.gl;
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    const width = Math.max(1, Math.round(this.canvas.clientWidth * ratio));
    const height = Math.max(1, Math.round(this.canvas.clientHeight * ratio));
    if (this.canvas.width !== width || this.canvas.height !== height) { this.canvas.width = width; this.canvas.height = height; }
    gl.viewport(0, 0, width, height);
    camera.aspect = width / height;
    gl.clearColor(0.065, 0.085, 0.12, 1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.useProgram(this.program);
    scene.updateMatrixWorld();
    gl.uniformMatrix4fv(this.loc.View, false, Matrix4.lookAt(camera.position, camera.target, camera.up).elements);
    gl.uniformMatrix4fv(this.loc.Proj, false, Matrix4.perspective(camera.fov, camera.aspect, 0.1, 100).elements);
    gl.uniform3fv(this.loc.ViewPos, camera.position);
    const point = scene.pointLight;
    gl.uniform3fv(this.loc.LightPos, point ? point.getWorldPosition() : [-4,5,-3]);
    gl.uniform3fv(this.loc.LightColor, point ? point.color : [1,1,1]);
    gl.uniform1f(this.loc.Intensity, point ? point.intensity : 1);
    gl.uniform1f(this.loc.Ambient, scene.ambientLight ? scene.ambientLight.intensity : 0.35);
    gl.uniform1f(this.loc.Directional, scene.directionalLight ? scene.directionalLight.intensity : 0.65);
    gl.uniform3fv(this.loc.Dir, scene.directionalLight ? scene.directionalLight.direction : [-0.4,1,0.5]);
    gl.uniform1i(this.loc.Texture, 0);
    this.drawNode(scene, false);
    gl.depthMask(false);
    this.drawNode(scene, true);
    gl.depthMask(true);
    gl.bindVertexArray(null);
  }
  drawNode(node, shadow) {
    if (node.visible === false) return;
    const gl = this.gl;
    if (node.isMesh && (!shadow || node.castShadow)) {
      const material = node.material;
      gl.uniform1i(this.loc.Shadow, shadow ? 1 : 0);
      gl.uniformMatrix4fv(this.loc.Model, false, node.matrixWorld.elements);
      gl.uniform3fv(this.loc.Color, material.color);
      gl.uniform1i(this.loc.UseTexture, material.texture ? 1 : 0);
      gl.uniform1i(this.loc.Emissive, material.emissive ? 1 : 0);
      gl.uniform1i(this.loc.Selected, node.isSelected ? 1 : 0);
      gl.uniform1f(this.loc.Shininess, material.shininess);
      gl.uniform1f(this.loc.Opacity, material.opacity);
      gl.uniform2fv(this.loc.Repeat, material.uvRepeat);
      gl.uniform2fv(this.loc.Offset, material.uvOffset);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, material.texture);
      gl.bindVertexArray(node.geometry.vao);
      gl.drawElements(gl.TRIANGLES, node.geometry.count, gl.UNSIGNED_SHORT, 0);
    }
    for (const child of node.children) this.drawNode(child, shadow);
  }
}
