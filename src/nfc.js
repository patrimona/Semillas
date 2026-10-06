export async function readTag(Reader, signal) {
  const reader = new Reader()
  const scanController = new AbortController()
  const abort = () => scanController.abort()
  signal.addEventListener('abort', abort, { once: true })
  if (signal.aborted) abort()
  try {
    return await new Promise((resolve, reject) => {
      scanController.signal.addEventListener('abort', () => reject(new DOMException('Cancelado', 'AbortError')), { once: true })
      if (scanController.signal.aborted) { reject(new DOMException('Cancelado', 'AbortError')); return }
      reader.addEventListener('reading', ({ message, serialNumber }) => {
        const values = []
        for (const record of message.records) {
          if (record.recordType === 'url' || record.recordType === 'text') values.push(new TextDecoder(record.encoding || 'utf-8').decode(record.data))
        }
        resolve({ serialNumber, values, hasContent: message.records.some(record => record.recordType !== 'empty') })
      }, { once: true })
      reader.addEventListener('readingerror', () => reject(new Error('No se pudo leer la pegatina. Acércala de nuevo.')), { once: true })
      reader.scan({ signal: scanController.signal }).catch(reject)
    })
  } finally { scanController.abort(); signal.removeEventListener('abort', abort) }
}
export async function writeTag(Reader, url, tag, signal, onStatus) {
  const current = await readTag(Reader, signal)
  if (tag.serialNumber && current.serialNumber !== tag.serialNumber) throw new Error('Esta es otra pegatina. Lee primero la pegatina que quieres asignar.')
  if (!tag.serialNumber && JSON.stringify(current.values) !== JSON.stringify(tag.values)) throw new Error('El contenido de la pegatina ha cambiado. Vuelve a leerla.')
  if (current.hasContent !== tag.hasContent || JSON.stringify(current.values) !== JSON.stringify(tag.values)) throw new Error('El contenido ha cambiado. Lee de nuevo la pegatina antes de reemplazarlo.')
  onStatus('writing')
  await new Reader().write({ records: [{ recordType: 'url', data: url }] }, { signal, overwrite: true })
  onStatus('verifying')
  const verified = await readTag(Reader, signal)
  if (tag.serialNumber && verified.serialNumber !== tag.serialNumber) throw new Error('La pegatina leída al verificar es distinta. Vuelve a leer la pegatina grabada.')
  if (!verified.values.includes(url)) throw new Error('No se ha confirmado el enlace grabado. Vuelve a leer la pegatina.')
  return verified
}
export function seedUrl(base, slug) {
  const url = new URL(base)
  if (url.protocol !== 'https:' || url.hostname === 'localhost' || url.hostname === '127.0.0.1' || url.hostname === '[::1]') throw new Error('Introduce la dirección HTTPS publicada del interactivo.')
  url.search = ''; url.hash = ''
  url.searchParams.set('pieza', slug)
  return url.href
}
