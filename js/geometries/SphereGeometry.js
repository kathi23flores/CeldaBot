class SphereGeometry extends Geometry {
  constructor(radio, latitudes, longitudes) {
    super();
    const v = [];
    const idx = [];

    // 1. GENERAR VÉRTICES Y UVs
    for (let lat = 0; lat <= latitudes; lat++) {
      const vv = lat / latitudes;       // Va de 0 a 1
      const phi = vv * Math.PI;         // Ángulo de latitud (0 a PI)

      for (let lon = 0; lon <= longitudes; lon++) {
        const u = lon / longitudes;       // Va de 0 a 1
        const theta = u * Math.PI * 2;    // Ángulo de longitud (0 a 2PI)

        // Cálculo de la normal (que en una esfera coincide con la dirección del vértice)
        const nx = Math.sin(phi) * Math.cos(theta);
        const ny = Math.cos(phi);
        const nz = Math.sin(phi) * Math.sin(theta);

        // Posición = Normal * Radio
        v.push(radio * nx, radio * ny, radio * nz); 
        // Normal
        v.push(nx, ny, nz);
        // UV (Invertimos V para que la textura no se vea al revés)
        v.push(u, 1.0 - vv);
      }
    }

    // 2. GENERAR ÍNDICES (Los triángulos)
    const columnas = longitudes + 1;

    for (let lat = 0; lat < latitudes; lat++) {
      for (let lon = 0; lon < longitudes; lon++) {
        const a = lat * columnas + lon;
        const b = a + columnas;

        // Primer triángulo de la cuadrícula
        idx.push(a, a + 1, b);
        // Segundo triángulo de la cuadrícula
        idx.push(b, a + 1, b + 1);
      }
    }

    // Guardamos los datos en la clase base Geometry
    this.vertices = new Float32Array(v);
    this.indices = new Uint16Array(idx);
  }
}