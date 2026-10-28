class CylinderGeometry extends Geometry {
  constructor(radio, alto, segmentos) {
    super();
    const v = [];
    const idx = [];
    const h = alto / 2;

    // 1. SUPERFICIE LATERAL
    for (let i = 0; i <= segmentos; i++) {
      const ang = (i / segmentos) * Math.PI * 2;
      const cx = Math.cos(ang);
      const sx = Math.sin(ang);
      const u = i / segmentos;

      // Vértice inferior
      v.push(cx * radio, -h, sx * radio); // Posición
      v.push(cx, 0, sx);                  // Normal
      v.push(u, 0);                       // UV

      // Vértice superior
      v.push(cx * radio, h, sx * radio);
      v.push(cx, 0, sx);
      v.push(u, 1);
    }

    // Índices del cuerpo lateral
    for (let i = 0; i < segmentos; i++) {
      const a = i * 2;
      const b = a + 1;
      const c = a + 2;
      const d = a + 3;
      idx.push(a, b, c, b, d, c);
    }

    // 2. TAPA SUPERIOR
    const centroSup = v.length / 8;
    v.push(0, h, 0); v.push(0, 1, 0); v.push(0.5, 0.5); // Centro
    for (let i = 0; i <= segmentos; i++) {
      const ang = (i / segmentos) * Math.PI * 2;
      const cx = Math.cos(ang);
      const sx = Math.sin(ang);
      v.push(cx * radio, h, sx * radio);
      v.push(0, 1, 0); // Normal apuntando hacia arriba
      v.push(0.5 + 0.5 * cx, 0.5 + 0.5 * sx);
    }
    for (let i = 0; i < segmentos; i++) {
      idx.push(centroSup, centroSup + 2 + i, centroSup + 1 + i);
    }

    // 3. TAPA INFERIOR
    const centroInf = v.length / 8;
    v.push(0, -h, 0); v.push(0, -1, 0); v.push(0.5, 0.5); // Centro
    for (let i = 0; i <= segmentos; i++) {
      const ang = (i / segmentos) * Math.PI * 2;
      const cx = Math.cos(ang);
      const sx = Math.sin(ang);
      v.push(cx * radio, -h, sx * radio);
      v.push(0, -1, 0); // Normal apuntando hacia abajo
      v.push(0.5 + 0.5 * cx, 0.5 + 0.5 * sx);
    }
    for (let i = 0; i < segmentos; i++) {
      // Invertimos el orden para que la cara mire hacia afuera (abajo)
      idx.push(centroInf, centroInf + 1 + i, centroInf + 2 + i);
    }

    this.vertices = new Float32Array(v);
    this.indices = new Uint16Array(idx);
  }
}