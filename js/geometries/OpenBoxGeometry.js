class OpenBoxGeometry extends Geometry {
  constructor(ancho, alto, profundo) {
    super();
    const w = ancho / 2;
    const h = alto / 2;
    const d = profundo / 2;
    const v = [];
    const idx = [];

    // Función auxiliar para crear una cara (4 vértices)
    // p: array de 4 puntos [x,y,z]
    // n: array normal [x,y,z]
    const cara = (p, n) => {
      const base = v.length / 8;
      // Empujamos los 4 vértices
      for (let i = 0; i < 4; i++) {
        v.push(p[i][0], p[i][1], p[i][2]); // Posición
        v.push(n[0], n[1], n[2]);          // Normal
        // UVs simples (0,0), (1,0), (1,1), (0,1)
        v.push([0,1,1,0][i], [0,0,1,1][i]);
      }
      // Creamos los 2 triángulos de la cara
      idx.push(base, base + 2, base + 1, base, base + 3, base + 2);
    };

    // 1. FONDO (La normal apunta hacia arriba porque estamos dentro)
    cara([
      [-w, -h, -d], [ w, -h, -d], [ w, -h,  d], [-w, -h,  d]
    ], [0, 1, 0]);

    // 2. PARED FRONTAL (+Z) (La normal apunta hacia el centro)
    cara([
      [-w, -h,  d], [ w, -h,  d], [ w,  h,  d], [-w,  h,  d]
    ], [0, 0, -1]);

    // 3. PARED TRASERA (-Z) (La normal apunta hacia el centro)
    cara([
      [ w, -h, -d], [-w, -h, -d], [-w,  h, -d], [ w,  h, -d]
    ], [0, 0, 1]);

    // 4. PARED DERECHA (+X) (La normal apunta hacia el centro)
    cara([
      [ w, -h,  d], [ w, -h, -d], [ w,  h, -d], [ w,  h,  d]
    ], [-1, 0, 0]);

    // 5. PARED IZQUIERDA (-X) (La normal apunta hacia el centro)
    cara([
      [-w, -h, -d], [-w, -h,  d], [-w,  h,  d], [-w,  h, -d]
    ], [1, 0, 0]);

    // 6. BORDES EXTERIORES (Opcional, para que se vea sólido por fuera)
    // Si quieres que el contenedor se vea sólido por fuera, 
    // se agregarían aquí las caras mirando hacia afuera.
    // Para simplificar, con las 5 caras interiores basta para simular el contenedor.

    this.vertices = new Float32Array(v);
    this.indices = new Uint16Array(idx);
  }
}