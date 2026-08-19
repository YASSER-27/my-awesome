interface ElectronAPI {
  readFile: (path: string) => Promise<string>
  readDir: (path: string) => Promise<string[]>
  startServer: () => Promise<'started' | 'already-running' | 'failed'>
  stopServer: () => Promise<void>
  isServerRunning: () => Promise<boolean>
  getNewComponentsPath: () => Promise<string>
  saveDesignerImage: (projectId: string, fileName: string, base64: string) => Promise<string>
  getDesignerProjectPath: (projectId: string) => Promise<string>
  generateImage: (params: { prompt: string; aspectRatio?: string }) => Promise<string>
  editImage: (params: { prompt: string; imageBase64?: string; aspectRatio?: string }) => Promise<string>
  saveImageFile: (base64: string, defaultName: string) => Promise<boolean>
}

interface Window {
  electronAPI?: ElectronAPI
}
