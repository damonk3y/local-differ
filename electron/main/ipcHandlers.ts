import { ipcMain, dialog } from 'electron'
import { GitService } from './gitService'

let gitService: GitService | null = null

export function registerGitHandlers() {
  ipcMain.handle('git:select-repo', async () => {
    const result = await dialog.showOpenDialog({
      properties: ['openDirectory'],
      title: 'Select Git Repository'
    })

    if (!result.canceled && result.filePaths[0]) {
      const repoPath = result.filePaths[0]
      gitService = new GitService(repoPath)

      const isRepo = await gitService.isGitRepo()
      if (!isRepo) {
        gitService = null
        return { success: false, error: 'Selected directory is not a git repository' }
      }

      return { success: true, path: repoPath }
    }
    return { success: false, error: 'No directory selected' }
  })

  ipcMain.handle('git:get-diff', async () => {
    if (!gitService) {
      throw new Error('No repository selected')
    }
    return gitService.getFullDiff()
  })

  ipcMain.handle('git:get-changed-files', async () => {
    if (!gitService) {
      throw new Error('No repository selected')
    }
    return gitService.getChangedFiles()
  })

  ipcMain.handle('git:get-file-content', async (_, { filePath, ref }: { filePath: string; ref: string }) => {
    if (!gitService) {
      throw new Error('No repository selected')
    }
    return gitService.getFileContent(filePath, ref)
  })

  ipcMain.handle('git:get-file-diff', async (_, { filePath, staged }: { filePath: string; staged: boolean }) => {
    if (!gitService) {
      throw new Error('No repository selected')
    }
    return gitService.getFileDiff(filePath, staged)
  })
}
