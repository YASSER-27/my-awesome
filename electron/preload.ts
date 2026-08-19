import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('electronAPI', {
  readFile: (path: string) => ipcRenderer.invoke('read-file', path),
  readDir: (path: string) => ipcRenderer.invoke('read-dir', path),
  startServer: () => ipcRenderer.invoke('start-server'),
  stopServer: () => ipcRenderer.invoke('stop-server'),
  isServerRunning: () => ipcRenderer.invoke('is-server-running'),
  getNewComponentsPath: () => ipcRenderer.invoke('get-new-components-path'),
  saveDesignerImage: (projectId: string, fileName: string, base64: string) => ipcRenderer.invoke('save-designer-image', projectId, fileName, base64),
  getDesignerProjectPath: (projectId: string) => ipcRenderer.invoke('get-designer-project-path', projectId),
  generateImage: (params: { prompt: string; aspectRatio?: string }) => ipcRenderer.invoke('generate-image', params),
  editImage: (params: { prompt: string; imageBase64?: string; aspectRatio?: string }) => ipcRenderer.invoke('edit-image', params),
  saveImageFile: (base64: string, defaultName: string) => ipcRenderer.invoke('save-image-file', base64, defaultName),
})
