const seeds = [
  { slug: 'algarroba', title: 'Algarroba', videoFile: 'algarroba.mp4' },
  { slug: 'berenjena', title: 'Berenjena', videoFile: 'berenjena.mp4' },
  { slug: 'cardo_blanco', title: 'Cardo blanco', videoFile: 'cardo_blanco.mp4' },
  { slug: 'cebada', title: 'Cebada', videoFile: 'cebada.mp4' },
  { slug: 'cebolla', title: 'Cebolla', videoFile: 'cebolla.mp4' },
  { slug: 'escanda', title: 'Escanda', videoFile: 'escanda.mp4' },
  { slug: 'faba', title: 'Faba', videoFile: 'faba.mp4' },
  { slug: 'guisante', title: 'Guisante', videoFile: 'guisante.mp4' },
  { slug: 'maiz', title: 'Maíz', videoFile: 'maiz1.mp4' },
  { slug: 'mijo', title: 'Mijo', videoFile: 'mijo.mp4' },
  { slug: 'nabo', title: 'Nabo', videoFile: 'nabo.mp4' },
  { slug: 'tomate', title: 'Tomate', videoFile: 'tomate.mp4' },
  { slug: 'pieza-013', title: '', videoFile: null },
  { slug: 'pieza-014', title: '', videoFile: null },
  { slug: 'pieza-015', title: '', videoFile: null },
]

// Numeración provisional por orden alfabético; los enlaces usan el nombre.
export const elements = seeds.map((seed, index) => ({
  ...seed,
  id: `pieza-${String(index + 1).padStart(3, '0')}`,
  number: String(index + 1).padStart(2, '0'),
}))

export function findPiece(key) {
  return elements.find((piece) => piece.slug === key || piece.id === key)
}