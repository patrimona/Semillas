const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')
const { createTagStore, normalizeUid } = require('../electron/tag-store.cjs')
function fixture(t) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'semillas-test-'))
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }))
  const filename = path.join(dir, 'tags.json')
  return { filename, store: createTagStore(filename, ['algarroba', 'panis']) }
}
test('normaliza el UID y rechaza entradas inválidas', () => {
  assert.equal(normalizeUid('04:ab:cd:12:34:56:78'), '04ABCD12345678')
  for (const value of ['', 'x1234567', '../../file', '__proto__', '123', null]) assert.throws(() => normalizeUid(value))
})
test('guarda y recupera asociaciones al reiniciar', t => {
  const {filename, store} = fixture(t)
  store.save('04ABCD12345678','algarroba',null)
  assert.equal(createTagStore(filename,['algarroba','panis']).read().tags['04ABCD12345678'],'algarroba')
})
test('exige la asociación esperada al cambiar una tarjeta y conserva una copia', t => {
  const {filename, store} = fixture(t)
  store.save('04ABCD12345678','algarroba',null)
  assert.throws(() => store.save('04ABCD12345678','panis',null))
  store.save('04ABCD12345678','panis','algarroba')
  assert.equal(store.read().tags['04ABCD12345678'],'panis')
  assert.equal(JSON.parse(fs.readFileSync(filename+'.bak','utf8')).tags['04ABCD12345678'],'algarroba')
})
test('rechaza semillas desconocidas sin guardar', t => {
  const {filename, store} = fixture(t)
  assert.throws(() => store.save('04ABCD12345678','unknown',null))
  assert.equal(fs.existsSync(filename),false)
})
test('un archivo dañado no se reemplaza silenciosamente', t => {
  const {filename, store} = fixture(t)
  fs.writeFileSync(filename,'{bad')
  assert.throws(() => store.read())
  assert.throws(() => store.save('04ABCD12345678','panis',null))
  assert.equal(fs.readFileSync(filename,'utf8'),'{bad')
})
