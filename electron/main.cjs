const { app, BrowserWindow, ipcMain, Menu } = require('electron')
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
    const bundledTags = path.join(__dirname, 'tarjetas-semillas.json')
    store = createTagStore(fs.existsSync(bundledTags) ? bundledTags : path.join(app.getPath('userData'), 'tarjetas-semillas.json'), manifest.map(p => p.slug))
    store.read()
    window = new BrowserWindow({ width: 1100, height: 850, fullscreen: !process.argv.includes('--smoke-test'), show: !process.argv.includes('--smoke-test'), backgroundColor: '#E0E0E0',
      webPreferences: { preload: path.join(__dirname, 'preload.cjs'), contextIsolation: true, nodeIntegration: false, sandbox: true } })
    window.webContents.setWindowOpenHandler(() => ({ action: 'deny' }))
    window.webContents.on('will-navigate', (event, url) => { if (!url.startsWith('file://')) event.preventDefault() })
    window.webContents.session.setPermissionRequestHandler((_webContents, _permission, callback) => callback(false))
    window.webContents.session.webRequest.onBeforeRequest({ urls: ['http://*/*', 'https://*/*'] }, (_details, callback) => callback({ cancel: true }))
    Menu.setApplicationMenu(null)
    window.webContents.on('before-input-event', (event, input) => {
      if (input.type === 'keyDown' && input.key === 'F11') {
        event.preventDefault(); window.setFullScreen(!window.isFullScreen())
      }
    })
    const trusted = event => { if (event.sender !== window.webContents || event.senderFrame !== window.webContents.mainFrame) throw new Error('Origen no permitido.') }
    ipcMain.handle('seeds:state', event => { trusted(event); return { ...store.read(), status } })
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
      return {bridge: !!window.seedDesktop, local: location.protocol === 'file:', heading:document.querySelector('h1')?.textContent,
        readOnly:!window.seedDesktop.save && !window.seedDesktop.exportBackup && !window.seedDesktop.onMode, count:Object.keys(state.tags).length};
    })()`)
    if (!result.bridge || !result.local || !result.readOnly || result.heading !== 'Escanea el sobre para descubrir una semilla' || Menu.getApplicationMenu()) throw new Error('Final exhibition app did not load in read-only waiting mode')
    const videos = []
    for (let index=0;index<manifest.length;index++) {
      const seed = manifest[index]
      const uid = Object.keys(store.read().tags).find(uid => store.read().tags[uid] === seed.slug)
      if (!uid) throw new Error('No assigned sticker for ' + seed.slug)
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
    let unknown = 'FFFFFFFFFFFFFFFF'
    while (store.read().tags[unknown]) unknown += 'FF'
    window.webContents.send('seeds:tag',{uid:unknown,reader:'Smoke test'})
    await new Promise(resolve => setTimeout(resolve,300))
    result.unknownReturnsToIdle=await window.webContents.executeJavaScript(`(()=>{
      document.dispatchEvent(new KeyboardEvent('keydown',{key:'a',ctrlKey:true,shiftKey:true,bubbles:true}));
      return document.querySelector('h1')?.textContent==='Escanea el sobre para descubrir una semilla' && !document.querySelector('select,button');
    })()`)
    fs.writeFileSync(path.join(app.getPath('userData'), 'smoke-result.json'), JSON.stringify(result, null, 2))
    readerProcess?.kill()
    app.exit(result.unknownReturnsToIdle && videos.every(v=>v.playing && !v.error) ? 0 : 1)
  } catch (error) { console.error(error); readerProcess?.kill(); app.exit(1) }
}
