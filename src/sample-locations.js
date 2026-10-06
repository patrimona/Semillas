// Coordenadas de los municipios de recolección; no representan la parcela exacta.
export const sampleLocations = {
  algarroba: {
    latitude: 36.92971854, longitude: -3.212739,
    source: 'https://www.aemet.es/va/eltiempo/prediccion/municipios/horas/lobras-id18121',
  },
  nabo: {
    latitude: 43.3283, longitude: -3.2906,
    source: 'https://pares.cultura.gob.es/ParesBusquedas20/catalogo/autoridad/94060',
  },
  faba: {
    latitude: 43.16089, longitude: -5.82878,
    // Ajuste visual de Lena sobre la ilustración, indicado en la revisión.
    mapOffset: { x: 4 },
    source: 'https://pares.cultura.gob.es/ParesBusquedas20/catalogo/autoridad/82486',
  },
  escanda: {
    latitude: 43.29588, longitude: -6.228,
    mapOffset: { x: 3, y: 0.5 },
    source: 'https://pares.cultura.gob.es/ParesBusquedas20/catalogo/autoridad/77095',
  },
  zanahoria_redonda: {
    latitude: 40.832966, longitude: -0.24214934,
    source: 'https://pares.cultura.gob.es/ParesBusquedas20/catalogo/autoridad/72681',
  },
  guisante: {
    latitude: 41.48709183, longitude: -0.53303523,
    source: 'https://www.aemet.es/es/eltiempo/prediccion/municipios/pina-de-ebro-id50208',
  },
  berenjena: {
    latitude: 39.88853, longitude: 4.26583,
    // Menorca se representa en el borde derecho de la ilustración.
    mapPosition: { x: 96.5, y: 36.5 },
    source: 'https://pares.cultura.gob.es/ParesBusquedas20/catalogo/autoridad/81912',
  },
  cebada: {
    latitude: 41.52716208, longitude: -2.35187864,
    source: 'https://www.aemet.es/es/eltiempo/prediccion/municipios/horas/nolay-id42131',
  },
  mijo: {
    latitude: 39.905968, longitude: -5.2012715,
    source: 'https://pares.cultura.gob.es/ParesBusquedas20/catalogo/autoridad/82602',
  },
  sarraceno: {
    latitude: 42.62676989, longitude: -2.49825439,
    source: 'https://www.aemet.es/es/eltiempo/prediccion/municipios/bernedo-id01016',
  },
  cebolla: {
    latitude: 42.62676989, longitude: -2.49825439,
    source: 'https://www.aemet.es/es/eltiempo/prediccion/municipios/bernedo-id01016',
  },
  maiz: {
    latitude: 40.11290696, longitude: -6.79284181,
    source: 'https://www.aemet.es/es/eltiempo/prediccion/municipios/horas/cilleros-id10064',
  },
  panis: {
    latitude: 40.29248, longitude: -0.04587,
    source: 'https://mapcarta.com/es/28743120',
  },
  tomate: {
    latitude: 40.03221, longitude: -3.6039674,
    source: 'https://pares.cultura.gob.es/ParesBusquedas20/catalogo/autoridad/81996',
  },
  cardo_blanco: {
    latitude: 42.81777778, longitude: -1.63833333,
    source: 'https://www.aemet.es/es/serviciosclimaticos/datosclimatologicos/valoresclimatologicos?l=9262',
  },
  faba_vino: {
    latitude: 43.316933, longitude: -4.8448014,
    source: 'https://pares.cultura.gob.es/ParesBusquedas20/catalogo/autoridad/92992',
  },
  azafranero: {
    // Fuerteventura está desplazada a un recuadro, fuera de la proyección peninsular.
    mapPosition: { x: 28.2, y: 88.5 },
  },
  altramuz: {
    latitude: 40.11849392, longitude: -4.24156628,
    source: 'https://www.aemet.es/es/eltiempo/prediccion/municipios/horas/santa-cruz-del-retamar-id45157',
  },
}

// Calibración aproximada de la ilustración mapa.jpg (2198 × 1920).
// Coordenadas de imagen expresadas en porcentajes, antes del encuadre CSS.
const bares = { longitude: -7.688, latitude: 43.793, x: 40.49, y: 29.55 }
const creus = { longitude: 3.322, latitude: 42.319, x: 83.56, y: 36.96 }
const tarifa = { longitude: -5.609, latitude: 36.01, x: 50.45, y: 74.86 }

export function sampleMapPoint(location, label) {
  if (!location) return undefined
  if (location.mapPosition) return { ...location.mapPosition, label }
  const dx = location.longitude - bares.longitude
  const dy = location.latitude - bares.latitude
  const ux = creus.longitude - bares.longitude
  const uy = creus.latitude - bares.latitude
  const vx = tarifa.longitude - bares.longitude
  const vy = tarifa.latitude - bares.latitude
  const determinant = ux * vy - uy * vx
  const u = (dx * vy - dy * vx) / determinant
  const v = (ux * dy - uy * dx) / determinant
  const imageX = bares.x + u * (creus.x - bares.x) + v * (tarifa.x - bares.x)
  const imageY = bares.y + u * (creus.y - bares.y) + v * (tarifa.y - bares.y)
  // El mismo encuadre que .archive-map img: ancho 128%, left -14%, top -48%.
  const imageHeight = 1.28 * 1.48 * 1920 / 2198
  return {
    x: imageX * 1.28 - 14 + (location.mapOffset?.x ?? 0),
    y: imageY * imageHeight - 48 + (location.mapOffset?.y ?? 0),
    label,
  }
}
