const seeds = [
  {
    slug: 'algarroba', title: 'Algarroba o lenteja moruna', scientificName: 'Vicia articulata Hornem.', videoFile: 'algarroba.mp4',
    info: {
      family: 'Leguminosae (Fabaceae)',
      genus: 'Vicia',
      species: 'Vicia articulata',
      commonNames: 'lenteja moruna, algarroba',
      averageSize: '6 milímetros',
      collectedOn: '21/06/1996',
      collectedAt: 'Lobras (Granada)',
      depositedOn: '09/06/2022',
      uses: 'Se ha utilizado sobre todo como alimento para el ganado, si bien en tiempo de penurias también se usó para el consumo humano.',
    },
  },
  { slug: 'berenjena', title: 'Berenjena', scientificName: 'Solanum melongena L.', videoFile: 'berenjena.mp4' },
  { slug: 'cardo_blanco', title: 'Cardo blanco', scientificName: 'Cynara cardunculus L.', videoFile: 'cardo_blanco.mp4' },
  { slug: 'cebada', title: 'Cebada', scientificName: 'Hordeum vulgare L.', videoFile: 'cebada.mp4' },
  { slug: 'cebolla', title: 'Cebolla', scientificName: 'Allium cepa L.', videoFile: 'cebolla.mp4' },
  { slug: 'escanda', title: 'Escanda', scientificName: 'Triticum aestivum L.', videoFile: 'escanda.mp4' },
  { slug: 'faba', title: 'Faba', scientificName: 'Phaseolus vulgaris', videoFile: 'faba.mp4' },
  { slug: 'guisante', title: 'Guisante', scientificName: 'Pisum sativum L.', videoFile: 'guisante.mp4' },
  { slug: 'maiz', title: 'Maíz', scientificName: 'Zea mays L.', videoFile: 'maiz1.mp4' },
  { slug: 'mijo', title: 'Mijo', scientificName: 'Sorghum bicolor (L.) Moench.', videoFile: 'mijo.mp4' },
  { slug: 'nabo', title: 'Nabo', scientificName: 'Brassica rapa L.', videoFile: 'nabo.mp4' },
  { slug: 'tomate', title: 'Tomate', scientificName: 'Solanum lycopersicum L.', videoFile: 'tomate.mp4' },
  { slug: 'pieza-013', title: '', videoFile: null },
  { slug: 'pieza-014', title: '', videoFile: null },
  { slug: 'pieza-015', title: '', videoFile: null },
]

// Numeración provisional por orden alfabético; los enlaces usan el nombre.
export const elements = seeds.map((seed, index) => ({
  ...seed,
  whiteVideoFile: seed.videoFile?.replace(/\.mp4$/, '-blanco.mp4'),
  id: `pieza-${String(index + 1).padStart(3, '0')}`,
  number: String(index + 1).padStart(2, '0'),
}))

export function findPiece(key) {
  return elements.find((piece) => piece.slug === key || piece.id === key)
}
