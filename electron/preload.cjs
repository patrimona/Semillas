const { contextBridge, ipcRenderer } = require('electron')
contextBridge.exposeInMainWorld('seedDesktop', {
  getState: () => ipcRenderer.invoke('seeds:state'),
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
