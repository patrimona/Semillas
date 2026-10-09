import { seedDetails } from './seed-details.js'
import { sampleLocations, sampleMapPoint } from './sample-locations.js'
import { smoothVideos } from './smooth-videos.js'

const seeds = [
  {
    slug: 'algarroba', title: 'Algarroba o lenteja moruna', scientificName: 'Vicia articulata Hornem.', videoFile: 'ALGARROBA.mp4', whiteVideoFile: 'ALGARROBA.mp4',
    videoFraming: { previousAspectRatio: 9 / 16, aspectRatio: 1, contentScale: 0.7497 },
    // Rótulos transcritos de la referencia gráfica aportada para esta ficha.
    editorial: {
      collection: 'Leguminosas\nde España',
      coordinates: '37.189° N\n3.606° W',
      location: 'España\nEuropa',
    },
  },
  { slug: 'berenjena', title: 'Berenjena', scientificName: 'Solanum melongena L.', videoFile: 'BERENJENA.mp4', whiteVideoFile: 'BERENJENA.mp4', videoScale: 0.85 },
  { slug: 'cardo_blanco', title: 'Cardo blanco', scientificName: 'Cynara cardunculus L.', videoFile: 'CARDO BUENO.mp4', whiteVideoFile: 'cardo-bueno-blanco.mp4', videoScale: 0.6, seedAnchors: { 0: [54, 39], 1: [37, 45], 4: [53, 55] } },
  { slug: 'cebada', title: 'Cebada', scientificName: 'Hordeum vulgare L.', videoFile: 'cebada-2-compatible.mp4', whiteVideoFile: 'cebada-2-blanco.mp4', videoScale: 0.54, cardOverrides: { 4: { y: 72 } } },
  { slug: 'cebolla', title: 'Cebolla', scientificName: 'Allium cepa L.', videoFile: 'cebolla.mp4', videoScale: 0.85 },
  { slug: 'escanda', title: 'Escanda', scientificName: 'Triticum aestivum L.', videoFile: 'escanda-bueno-compatible.mp4', whiteVideoFile: 'escanda-bueno-blanco.mp4', videoScale: 0.6 },
  { slug: 'faba', title: 'Faba', scientificName: 'Phaseolus vulgaris', videoFile: 'gueyín (1).mp4', whiteVideoFile: 'gueyín (1).mp4', videoScale: 0.85 },
  { slug: 'guisante', title: 'Guisante', scientificName: 'Pisum sativum L.', videoFile: 'GUISANTE.mp4', whiteVideoFile: 'GUISANTE.mp4', videoScale: 0.7, videoFraming: { previousAspectRatio: 1, aspectRatio: 9 / 16, contentScale: 1.1607 } },
  { slug: 'maiz', title: 'Maíz', scientificName: 'Zea mays L.', videoFile: 'MAIZ.mp4', whiteVideoFile: 'MAIZ.mp4', videoScale: 0.7 },
  { slug: 'mijo', title: 'Mijo', scientificName: 'Sorghum bicolor (L.) Moench.', videoFile: 'MIJO BUENO.mp4', whiteVideoFile: 'mijo-bueno-blanco.mp4', videoScale: 0.63 },
  { slug: 'nabo', title: 'Nabo', scientificName: 'Brassica rapa L.', videoFile: 'NABO.mp4', whiteVideoFile: 'NABO.mp4', videoScale: 0.78, videoTop: '45%' },
  { slug: 'tomate', title: 'Tomate', scientificName: 'Solanum lycopersicum L.', videoFile: 'TOMATE.mp4', whiteVideoFile: 'TOMATE.mp4', videoScale: 0.9 },
  { slug: 'azafranero', title: 'Azafranero', videoFile: 'azafranero_semilla_360_negro_uniforme.mp4' },
  { slug: 'sarraceno', title: 'Sarraceno', videoFile: 'SARRACENO.mp4', whiteVideoFile: 'SARRACENO.mp4', videoScale: 0.78, titleLineGap: '1.3cqw' },
  { slug: 'zanahoria_redonda', title: 'Zanahoria redonda', videoFile: 'ZANAHORIA BUENO.mp4', whiteVideoFile: 'zanahoria-bueno-blanco.mp4', videoScale: 0.85 },
  { slug: 'faba_vino', title: 'Faba de vino', videoFile: 'FABA VINO.mp4', whiteVideoFile: 'FABA VINO.mp4' },
  { slug: 'altramuz', aliases: ['semilla_provisional'], title: 'Altramuz azul', videoFile: 'One-uncut-photoreal-macro-turntable-of-O.mp4', videoScale: 0.7 },
  { slug: 'panis', aliases: ['maiz2'], title: "Panís d’ensalat", videoFile: 'maiz2 (1).mp4', whiteVideoFile: 'maiz2 (1).mp4', videoScale: 0.7 },
]

// Conserva la numeración existente; las nuevas semillas se añaden al final.
export const elements = seeds.map((seed, index) => ({
  ...seed,
  ...seedDetails[seed.slug],
  editorial: {
    ...seed.editorial,
    mapPoint: sampleMapPoint(sampleLocations[seed.slug], seedDetails[seed.slug]?.info.collectedAt),
  },
  // Copias fluidas para las fichas grises; las fuentes se conservan para comparar.
  whiteVideoFile: smoothVideos[seed.slug] ?? seed.whiteVideoFile ?? seed.videoFile?.replace(/\.mp4$/, '-blanco.mp4'),
  id: `pieza-${String(index + 1).padStart(3, '0')}`,
  number: String(index + 1).padStart(2, '0'),
}))

export function findPiece(key) {
  return elements.find((piece) => piece.slug === key || piece.id === key || piece.aliases?.includes(key))
}
