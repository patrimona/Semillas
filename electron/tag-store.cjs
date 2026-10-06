const fs = require('node:fs')
const path = require('node:path')

function normalizeUid(value) {
  if (typeof value !== 'string' || !/^[a-f\d :\-]+$/i.test(value)) throw new Error('Código de tarjeta no válido.')
  const uid = value.replace(/[ :\-]/g, '').toUpperCase()
  if (!/^(?:[A-F\d]{2}){4,16}$/.test(uid)) throw new Error('Código de tarjeta no válido.')
  return uid
}

function createTagStore(filename, slugs) {
  const allowed = new Set(slugs)
  function validate(data) {
    if (data?.version !== 1 || !data.tags || Array.isArray(data.tags) || typeof data.tags !== 'object') throw new Error('Archivo de asociaciones no válido.')
    for (const [uid, slug] of Object.entries(data.tags)) {
      if (normalizeUid(uid) !== uid || !allowed.has(slug)) throw new Error('El archivo contiene una tarjeta o una semilla no válida.')
    }
    return data
  }
  function read() {
    if (!fs.existsSync(filename)) return { version: 1, tags: {} }
    try { return validate(JSON.parse(fs.readFileSync(filename, 'utf8'))) }
    catch { throw new Error('No se puede leer el archivo de asociaciones. Conserva el archivo y restaura una copia válida.') }
  }
  function save(uidValue, slug, expectedSlug = null) {
    const uid = normalizeUid(uidValue)
    if (!allowed.has(slug)) throw new Error('Semilla no válida.')
    const data = read()
    if ((data.tags[uid] || null) !== expectedSlug) throw new Error('La asociación ha cambiado. Vuelve a leer la tarjeta antes de guardarla.')
    data.tags[uid] = slug
    fs.mkdirSync(path.dirname(filename), { recursive: true })
    const temporary = filename + '.tmp'
    fs.writeFileSync(temporary, JSON.stringify(data, null, 2), 'utf8')
    if (fs.existsSync(filename)) fs.copyFileSync(filename, filename + '.bak')
    fs.renameSync(temporary, filename)
    return data
  }
  return { read, save, validate }
}
module.exports = { normalizeUid, createTagStore }
