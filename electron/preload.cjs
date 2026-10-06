const { contextBridge, ipcRenderer } = require('electron')
contextBridge.exposeInMainWorld('seedDesktop', {
  getState: () => ipcRenderer.invoke('seeds:state'),
  save: (uid, slug, expectedSlug) => ipcRenderer.invoke('seeds:save', uid, slug, expectedSlug),
  exportBackup: () => ipcRenderer.invoke('seeds:export'),
  onMode: callback => {
    const listener = (_event, value) => callback(value)
    ipcRenderer.on('seeds:mode', listener)
    return () => ipcRenderer.removeListener('seeds:mode', listener)
  },
  onTag: callback => {
    const listener = (_event, value) => callback(value)
    ipcRenderer.on('seeds:tag', listener)
    return () => ipcRenderer.removeListener('seeds:tag', listener)
  },
  onStatus: callback => {
    const listener = (_event, value) => callback(value)
    ipcRenderer.on('seeds:status', listener)
    return () => ipcRenderer.removeListener('seeds:status', listener)
  },
})
