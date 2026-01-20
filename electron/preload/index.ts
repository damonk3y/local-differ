import { contextBridge, ipcRenderer } from 'electron'

const electronAPI = {
  git: {
    selectRepo: () => ipcRenderer.invoke('git:select-repo'),
    getDiff: () => ipcRenderer.invoke('git:get-diff'),
    getChangedFiles: () => ipcRenderer.invoke('git:get-changed-files'),
    getFileContent: (filePath: string, ref: string) =>
      ipcRenderer.invoke('git:get-file-content', { filePath, ref }),
    getFileDiff: (filePath: string, staged: boolean) =>
      ipcRenderer.invoke('git:get-file-diff', { filePath, staged })
  }
}

contextBridge.exposeInMainWorld('electron', electronAPI)
