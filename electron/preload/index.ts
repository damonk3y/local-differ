import { contextBridge, ipcRenderer } from 'electron'

const electronAPI = {
  git: {
    selectRepo: () => ipcRenderer.invoke('git:select-repo'),
    setRepo: (path: string) => ipcRenderer.invoke('git:set-repo', path),
    getDiff: () => ipcRenderer.invoke('git:get-diff'),
    getChangedFiles: () => ipcRenderer.invoke('git:get-changed-files'),
    getFileContent: (filePath: string, ref: string) =>
      ipcRenderer.invoke('git:get-file-content', { filePath, ref }),
    getFileDiff: (filePath: string, staged: boolean) =>
      ipcRenderer.invoke('git:get-file-diff', { filePath, staged })
  },
  settings: {
    getProjectPath: () => ipcRenderer.invoke('settings:get-project-path'),
    setProjectPath: (path: string | null) => ipcRenderer.invoke('settings:set-project-path', path),
    getAll: () => ipcRenderer.invoke('settings:get-all')
  }
}

contextBridge.exposeInMainWorld('electron', electronAPI)
