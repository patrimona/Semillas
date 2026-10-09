import { packager } from '@electron/packager'
import fs from 'node:fs'
import path from 'node:path'
import { createRequire } from 'node:module'
const require = createRequire(import.meta.url)
const manifest = JSON.parse(fs.readFileSync('electron/seed-manifest.json', 'utf8'))
const { createTagStore } = require('../electron/tag-store.cjs')
const assignments = createTagStore(path.resolve('config/tarjetas-semillas.json'), manifest.map(seed => seed.slug)).read()
if (!manifest.every(seed => Object.values(assignments.tags).includes(seed.slug))) throw new Error('Faltan las asociaciones NFC de una o varias semillas para la app final')
const staging = path.resolve('.tools/desktop-stage')
fs.mkdirSync(staging, { recursive: true })
// Remove previous staged copies so obsolete videos cannot remain in the app.
for (const name of ['dist', 'electron']) {
  const target = path.resolve(staging, name)
  if (!target.startsWith(staging + path.sep)) throw new Error('Invalid staging path')
  fs.rmSync(target, { recursive: true, force: true })
}
fs.cpSync('dist', path.join(staging,'dist'), { recursive: true })
fs.cpSync('electron', path.join(staging,'electron'), { recursive: true })
// Private sticker assignments travel with the local final app, never with Git.
fs.copyFileSync('config/tarjetas-semillas.json', path.join(staging, 'electron/tarjetas-semillas.json'))
fs.writeFileSync(path.join(staging,'package.json'), JSON.stringify({name:'semillas-nfc',version:'1.0.0',main:'electron/main.cjs'}))
const output = await packager({dir:staging,out:'release',name:'Semillas NFC',platform:'win32',arch:'x64',asar:false,overwrite:true,prune:false,download:{cacheRoot:path.resolve('.tools/electron-cache')},electronVersion:JSON.parse(fs.readFileSync('node_modules/electron/package.json','utf8')).version})
console.log(output.join('\n'))
