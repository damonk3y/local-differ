import { useState, useCallback } from 'react'
import { ChangedFile, FileChange } from '../types/diff'
import { detectLanguage } from '../services/languageDetector'

export function useGitDiff() {
  const [repoPath, setRepoPath] = useState<string | null>(null)
  const [files, setFiles] = useState<ChangedFile[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const selectRepo = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await window.electron.git.selectRepo()
      if (result.success && result.path) {
        setRepoPath(result.path)
        await refreshFiles()
        return true
      } else {
        setError(result.error || 'Failed to select repository')
        return false
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to select repository')
      return false
    } finally {
      setLoading(false)
    }
  }, [])

  const refreshFiles = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await window.electron.git.getChangedFiles()
      const allFiles: ChangedFile[] = [
        ...result.staged.map(f => ({ ...f, staged: true })),
        ...result.unstaged.map(f => ({ ...f, staged: false }))
      ]
      setFiles(allFiles)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get changed files')
    } finally {
      setLoading(false)
    }
  }, [])

  const getFileChange = useCallback(async (file: ChangedFile): Promise<FileChange | null> => {
    try {
      let oldContent = ''
      let newContent = ''

      if (file.status === 'A') {
        // Added file
        oldContent = ''
        newContent = file.staged
          ? await window.electron.git.getFileContent(file.path, 'index')
          : await window.electron.git.getFileContent(file.path, 'working')
      } else if (file.status === 'D') {
        // Deleted file
        oldContent = await window.electron.git.getFileContent(file.path, 'HEAD')
        newContent = ''
      } else {
        // Modified file
        if (file.staged) {
          oldContent = await window.electron.git.getFileContent(file.path, 'HEAD')
          newContent = await window.electron.git.getFileContent(file.path, 'index')
        } else {
          oldContent = await window.electron.git.getFileContent(file.path, 'index')
          newContent = await window.electron.git.getFileContent(file.path, 'working')
        }
      }

      return {
        oldContent,
        newContent,
        language: detectLanguage(file.path)
      }
    } catch (err) {
      console.error('Failed to get file content:', err)
      return null
    }
  }, [])

  return {
    repoPath,
    files,
    loading,
    error,
    selectRepo,
    refreshFiles,
    getFileChange
  }
}
