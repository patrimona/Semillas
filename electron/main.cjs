const { app, BrowserWindow, ipcMain, dialog, Menu } = require('electron')
const { spawn } = require('node:child_process')
const fs = require('node:fs')
const path = require('node:path')
const readline = require('node:readline')
const { createTagStore, normalizeUid } = require('./tag-store.cjs')
const manifest = require('./seed-manifest.json')
let window, readerProcess, store
let status = { connected: false, message: 'Buscando el lector ACR1552U…' }
app.setName('Semillas NFC')
if (process.env.SEEDS_DATA_DIR) app.setPath('userData', process.env.SEEDS_DATA_DIR)
if (!app.requestSingleInstanceLock()) app.quit()
else {
  app.whenReady().then(() => {
    store = createTagStore(path.join(app.getPath('userData'), 'tarjetas-semillas.json'), manifest.map(p => p.slug))
    window = new BrowserWindow({ width: 1100, height: 850, show: !process.argv.includes('--smoke-test'), backgroundColor: '#E0E0E0',
      webPreferences: { preload: path.join(__dirname, 'preload.cjs'), contextIsolation: true, nodeIntegration: false, sandbox: true } })
    window.webContents.setWindowOpenHandler(() => ({ action: 'deny' }))
    window.webContents.on('will-navigate', (event, url) => { if (!url.startsWith('file://')) event.preventDefault() })
    window.webContents.session.setPermissionRequestHandler((_webContents, _permission, callback) => callback(false))
    window.webContents.session.webRequest.onBeforeRequest({ urls: ['http://*/*', 'https://*/*'] }, (_details, callback) => callback({ cancel: true }))
    Menu.setApplicationMenu(Menu.buildFromTemplate([{ label: 'Semillas', submenu: [
      { label: 'Ver semillas', click: () => window.webContents.send('seeds:mode', 'view') },
      { label: 'Asignar tarjetas', click: () => window.webContents.send('seeds:mode', 'nfc') },
      { type: 'separator' }, { role: 'togglefullscreen', label: 'Pantalla completa', accelerator:'F11' }, { role: 'quit', label: 'Salir' },
    ] }]))
    const trusted = event => { if (event.sender !== window.webContents || event.senderFrame !== window.webContents.mainFrame) throw new Error('Origen no permitido.') }
    ipcMain.handle('seeds:state', event => { trusted(event); return { ...store.read(), status, storagePath: app.getPath('userData') } })
    ipcMain.handle('seeds:save', (event, uid, slug, expectedSlug) => { trusted(event); return store.save(uid, slug, expectedSlug) })
    ipcMain.handle('seeds:export', async event => {
      trusted(event)
      const data = store.read()
      const { canceled, filePath } = await dialog.showSaveDialog(window, { defaultPath: 'tarjetas-semillas.json', filters: [{ name: 'Asociaciones de semillas', extensions: ['json'] }] })
      if (canceled) return false
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8'); return true
    })
    if (process.argv.includes('--assign')) window.webContents.once('did-finish-load', () => {
      setTimeout(() => window.webContents.send('seeds:mode', 'nfc'), 350)
    })
    window.loadFile(path.join(__dirname, '../dist/index.html'))
    startReader()
    if (process.argv.includes('--smoke-test')) smokeTest()
  })
  app.on('second-instance', () => { window?.show(); window?.focus() })
  app.on('window-all-closed', () => app.quit())
  app.on('before-quit', () => { app.isQuitting=true; readerProcess?.kill() })
}
function startReader() {
  const powershell = path.join(process.env.SystemRoot || 'C:\\Windows', 'System32/WindowsPowerShell/v1.0/powershell.exe')
  readerProcess = spawn(powershell, ['-NoLogo', '-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass', '-File', path.join(__dirname, 'reader.ps1')], { windowsHide: true })
  const report = message => { status = { connected: false, message }; window?.webContents.send('seeds:status', status) }
  readline.createInterface({ input: readerProcess.stdout }).on('line', line => {
    try {
      const event = JSON.parse(line.replace(/^\uFEFF/, ''))
      if (event.type === 'tag') window.webContents.send('seeds:tag', { uid: normalizeUid(event.uid), reader: event.reader })
      if (event.type === 'status') { status = { connected: !!event.connected, message: String(event.message) }; window.webContents.send('seeds:status', status) }
    } catch (error) { report('Error de lectura: ' + error.message) }
  })
  readerProcess.stderr.on('data', data => report(String(data)))
  readerProcess.on('error', error => report('No se puede iniciar el lector: ' + error.message))
  readerProcess.on('exit', () => { if (!app.isQuitting) report('La lectura USB se ha detenido. Reinicia la aplicación.') })
}
async function smokeTest() {
  try {
    await new Promise(resolve => window.webContents.once('did-finish-load', resolve))
    await new Promise(resolve => setTimeout(resolve, 1000))
    if (!process.env.SEEDS_DATA_DIR) throw new Error('Smoke test requires an isolated data directory.')
    const result = await window.webContents.executeJavaScript(`(async () => {
      const state = await window.seedDesktop.getState();
      return {bridge: !!window.seedDesktop, local: location.protocol === 'file:', text: document.body.innerText, state};
    })()`)
    if (!result.bridge || !result.local) throw new Error('Offline application did not load')
    const videos = []
    for (let index=0;index<manifest.length;index++) {
      const seed = manifest[index]
      const uid = (0x04000000 + index).toString(16).padStart(8,'0').toUpperCase()
      const existing = store.read().tags[uid] || null
      if (existing !== seed.slug) await window.webContents.executeJavaScript(`window.seedDesktop.save(${JSON.stringify(uid)},${JSON.stringify(seed.slug)},${JSON.stringify(existing)})`)
      window.webContents.send('seeds:tag',{uid,reader:'Smoke test'})
      await new Promise(resolve => setTimeout(resolve, 550))
      const video = await window.webContents.executeJavaScript(`(async()=>{
        const v=document.querySelector('video'); if(!v) return {missing:true};
        try { await v.play() } catch(e) { return {src:v.currentSrc,error:e.message,code:v.error?.code} }
        const start=v.currentTime; await new Promise(r=>setTimeout(r,150));
        return {src:v.currentSrc,error:v.error?.message,ready:v.readyState,playing:v.currentTime>start};
      })()`)
      videos.push({slug:seed.slug,...video})
    }
    result.videos=videos
    window.webContents.send('seeds:mode','nfc')
    window.webContents.send('seeds:tag',{uid:'04AABBCC',reader:'Smoke test'})
    await new Promise(resolve => setTimeout(resolve,250))
    await window.webContents.executeJavaScript(`(()=>{
      const select=document.querySelector('select'); select.value='panis'; select.dispatchEvent(new Event('change',{bubbles:true}));
    })()`)
    await new Promise(resolve => setTimeout(resolve,150))
    await window.webContents.executeJavaScript(`(()=>{
      const button=[...document.querySelectorAll('button')].find(b=>b.textContent==='Guardar asociación');
      if(!button || button.disabled) throw new Error('Assignment button unavailable'); button.click();
    })()`)
    await new Promise(resolve => setTimeout(resolve,300))
    result.assignment=store.read().tags['04AABBCC']==='panis'
    result.assignmentText=await window.webContents.executeJavaScript('document.body.innerText')
    fs.writeFileSync(path.join(app.getPath('userData'), 'smoke-result.json'), JSON.stringify(result, null, 2))
    readerProcess?.kill()
    app.exit(result.assignment && videos.every(v=>v.playing && !v.error) ? 0 : 1)
  } catch (error) { console.error(error); readerProcess?.kill(); app.exit(1) }
}
