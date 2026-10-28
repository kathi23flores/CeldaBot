// Catálogo compartido por la escena, la detección y las pruebas.
// La clasificación compara la geometría de la pieza, no su color.
const PIECE_TYPES = [
  { geometry: 'sphere', material: 'red', name: 'Esfera roja', shape: 'Esfera', plural: 'esferas', color: 'rojo', label: 'labelRed', position: [3, 0, -1.9] },
  { geometry: 'box', material: 'blue', name: 'Cubo azul', shape: 'Cubo', plural: 'cubos', color: 'azul', label: 'labelBlue', position: [3, 0, 0] },
  { geometry: 'cylinder', material: 'green', name: 'Cilindro verde', shape: 'Cilindro', plural: 'cilindros', color: 'verde', label: 'labelGreen', position: [3, 0, 1.9] },
  { geometry: 'cone', material: 'yellow', name: 'Cono amarillo', shape: 'Cono', plural: 'conos', color: 'amarillo', label: 'labelYellow', position: [-1.2, 0, -2.8] }
];
