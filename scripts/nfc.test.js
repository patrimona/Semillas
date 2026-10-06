import test from 'node:test'
import assert from 'node:assert/strict'
import { readTag, writeTag, seedUrl } from '../src/nfc.js'
const tag = (serialNumber, values = []) => ({ serialNumber, values, hasContent: !!values.length })
function mock(tags, failure) {
  const writes = []
  class Reader extends EventTarget {
    async scan({ signal }) {
      const next = tags.shift()
      if (!next) return
      setTimeout(() => {
        if (signal.aborted) return
        const event = new Event('reading')
        Object.assign(event, {serialNumber: next.serialNumber, message: { records: next.values.map(value => ({ recordType: 'url', data: new TextEncoder().encode(value) })) }})
        this.dispatchEvent(event)
      }, 0)
    }
    async write(message, options) {
      if (failure) throw new Error(failure)
      writes.push({message, options})
    }
  }
  return {Reader, writes}
}
const url = 'https://example.org/semillas/?pieza=algarroba'
test('Genera enlaces sin modo de administración ni parámetros anteriores', () => {
  assert.equal(seedUrl('https://example.org/semillas/?modo=nfc&fondo=negro#x', 'algarroba'), url)
  for (const base of ['http://example.org', 'http://localhost:5173', 'https://localhost', 'https://127.0.0.1', 'https://[::1]']) assert.throws(() => seedUrl(base, 'algarroba'))
})
test('Graba un registro URL y verifica la misma pegatina', async () => {
  const {Reader, writes} = mock([tag('01'), tag('01', [url])])
  const states = []
  const result = await writeTag(Reader, url, tag('01'), new AbortController().signal, s => states.push(s))
  assert.deepEqual(writes[0].message, {records: [{recordType: 'url', data: url}]})
  assert.equal(result.values[0], url)
  assert.deepEqual(states, ['writing', 'verifying'])
})
test('Rechaza otra pegatina antes de escribir', async () => {
  const {Reader, writes} = mock([tag('02')])
  await assert.rejects(writeTag(Reader, url, tag('01'), new AbortController().signal, () => {}), /otra pegatina/)
  assert.equal(writes.length, 0)
})
test('Rechaza cambios del contenido antes de escribir', async () => {
  const {Reader, writes} = mock([tag('01', ['https://other.example'])])
  await assert.rejects(writeTag(Reader, url, tag('01'), new AbortController().signal, () => {}), /contenido ha cambiado/)
  assert.equal(writes.length, 0)
})
test('No confirma grabaciones cuyo enlace o código no coincide', async () => {
  for (const verified of [tag('01', ['https://other.example']), tag('02', [url])]) {
    const {Reader} = mock([tag('01'), verified])
    await assert.rejects(writeTag(Reader, url, tag('01'), new AbortController().signal, () => {}))
  }
})
test('Propaga fallos de escritura', async () => {
  const {Reader} = mock([tag('01')], 'Pegatina bloqueada')
  await assert.rejects(writeTag(Reader, url, tag('01'), new AbortController().signal, () => {}), /bloqueada/)
})
test('Permite cancelar la espera de lectura', async () => {
  const {Reader} = mock([])
  const controller = new AbortController()
  const pending = readTag(Reader, controller.signal)
  controller.abort()
  await assert.rejects(pending, {name: 'AbortError'})
})
