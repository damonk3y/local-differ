interface Settings {
  projectPath: string | null
}

interface ElectronAPI {
  git: {
    selectRepo: () => Promise<{ success: boolean; path?: string; error?: string }>
    setRepo: (path: string) => Promise<{ success: boolean; path?: string; error?: string }>
    getDiff: () => Promise<{ staged: string; unstaged: string }>
    getChangedFiles: () => Promise<{
      staged: Array<{ status: string; path: string }>
      unstaged: Array<{ status: string; path: string }>
    }>
    getFileContent: (filePath: string, ref: string) => Promise<string>
    getFileDiff: (filePath: string, staged: boolean) => Promise<string>
  }
  settings: {
    getProjectPath: () => Promise<string | null>
    setProjectPath: (path: string | null) => Promise<{ success: boolean }>
    getAll: () => Promise<Settings>
  }
}

declare global {
  interface Window {
    electron: ElectronAPI
  }
}

export {}
