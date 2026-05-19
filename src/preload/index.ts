import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

// Custom APIs for renderer
const api = {
  getSystemHealth: () => ipcRenderer.invoke('check-system-health'),
  checkDocker: () => ipcRenderer.invoke('check-docker'),
  pullModel: () => ipcRenderer.invoke('pull-ollama-model'),
  getProjects: () => ipcRenderer.invoke('get-projects'),
  saveProject: (project: any) => ipcRenderer.invoke('save-project', project),
  deleteProject: (id: string, path: string) => ipcRenderer.invoke('delete-project', id, path),
  analyzeProject: (path: string) => ipcRenderer.invoke('analyze-project', path),
  cloneRepo: (url: string) => ipcRenderer.invoke('clone-repo', url),
  getFiles: (path: string) => ipcRenderer.invoke('get-files', path),
  readFile: (path: string) => ipcRenderer.invoke('read-file', path),
  scanFile: (path: string) => ipcRenderer.invoke('scan-file', path),
  getAIReview: (code: string, file: string) => ipcRenderer.invoke('get-ai-review', code, file),
  chatWithArchitect: (messages: any[]) => ipcRenderer.invoke('chat-with-architect', messages),
  saveChatMessage: (projectId: string, filePath: string, content: string, role: string) => 
    ipcRenderer.invoke('save-chat-message', projectId, filePath, content, role),
  getChatHistory: (projectId: string, filePath: string) => 
    ipcRenderer.invoke('get-chat-history', projectId, filePath),
  
  // Execution & Docker
  runBuild: (path: string) => ipcRenderer.invoke('run-build', path),
  dockerBuild: (id: string, path: string) => ipcRenderer.invoke('docker-build', { id, path }),
  dockerRun: (id: string) => ipcRenderer.invoke('docker-run', id),
  dockerStop: (id: string) => ipcRenderer.invoke('docker-stop', id),
  dockerStats: (id: string) => ipcRenderer.invoke('docker-stats', id),
  ensureAIDocker: () => ipcRenderer.invoke('ensure-ai-container'),
  openFileDialog: () => ipcRenderer.invoke('open-file-dialog'),
  dockerBuildSingleFile: (id: string, filePath: string) => ipcRenderer.invoke('docker-build-single-file', { id, filePath }),
  onBuildLog: (callback: (data: string) => void) => ipcRenderer.on('build-log', (_, data) => callback(data)),
  onDockerLog: (callback: (data: string) => void) => ipcRenderer.on('docker-log', (_, data) => callback(data)),
  onAIChatChunk: (callback: (chunk: string) => void) => ipcRenderer.on('ai-chat-chunk', (_, chunk) => callback(chunk)),
  onAIReviewChunk: (callback: (chunk: string) => void) => ipcRenderer.on('ai-review-chunk', (_, chunk) => callback(chunk)),
  onAIPullLog: (callback: (data: string) => void) => ipcRenderer.on('ai-pull-log', (_, data) => callback(data)),
  onAnalysisProgress: (callback: (p: { progress: number, file: string }) => void) => ipcRenderer.on('analysis-progress', (_, p) => callback(p)),

  minimize: () => ipcRenderer.send('window-minimize'),
  maximize: () => ipcRenderer.send('window-maximize'),
  close: () => ipcRenderer.send('window-close')
}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.api = api
}
