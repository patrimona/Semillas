import { packager } from '@electron/packager'
import fs from 'node:fs'
import path from 'node:path'
const staging = path.resolve('.tools/desktop-stage')
fs.mkdirSync(staging, { recursive: true })
fs.cpSync('dist', path.join(staging,'dist'), { recursive: true })
fs.cpSync('electron', path.join(staging,'electron'), { recursive: true })
fs.writeFileSync(path.join(staging,'package.json'), JSON.stringify({name:'semillas-nfc',version:'1.0.0',main:'electron/main.cjs'}))
const output = await packager({dir:staging,out:'release',name:'Semillas NFC',platform:'win32',arch:'x64',asar:false,overwrite:true,prune:false,download:{cacheRoot:path.resolve('.tools/electron-cache')},electronVersion:JSON.parse(fs.readFileSync('node_modules/electron/package.json','utf8')).version})
console.log(output.join('\n'))
