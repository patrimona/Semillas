import fs from 'node:fs'
import { elements } from '../src/data.js'
fs.mkdirSync('electron', { recursive: true })
fs.writeFileSync('electron/seed-manifest.json', JSON.stringify(elements.map(({slug, title, subtitleName}) => ({slug,title,subtitleName})), null, 2))
