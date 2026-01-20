import { useState, useCallback, useEffect, useRef } from 'react'
import { ChangedFile, FileChange } from '../types/diff'
import { detectLanguage } from '../services/languageDetector'

export function useGitDiff() {
  const [repoPath, setRepoPath] = useState<string | null>(null)
  const [files, setFiles] = useState<ChangedFile[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [initialized, setInitialized] = useState(false)
  const hasLoadedFiles = useRef(false)

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

  // Load saved project path on startup
  useEffect(() => {
    const loadSavedPath = async () => {
      try {
        const savedPath = await window.electron.settings.getProjectPath()
        if (savedPath) {
          const result = await window.electron.git.setRepo(savedPath)
          if (result.success && result.path) {
            setRepoPath(result.path)
          }
        }
      } catch (err) {
        console.error('Failed to load saved project path:', err)
      } finally {
        setInitialized(true)
      }
    }
    loadSavedPath()
  }, [])

  // Refresh files when repoPath changes (and is set)
  useEffect(() => {
    if (repoPath && initialized && !hasLoadedFiles.current) {
      hasLoadedFiles.current = true
      refreshFiles()
    }
  }, [repoPath, initialized, refreshFiles])

  const setRepo = useCallback(async (path: string) => {
    setLoading(true)
    setError(null)
    hasLoadedFiles.current = false
    try {
      const result = await window.electron.git.setRepo(path)
      if (result.success && result.path) {
        setRepoPath(result.path)
        return true
      } else {
        setError(result.error || 'Failed to set repository')
        return false
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to set repository')
      return false
    } finally {
      setLoading(false)
    }
  }, [])

  const selectRepo = useCallback(async () => {
    setLoading(true)
    setError(null)
    hasLoadedFiles.current = false
    try {
      const result = await window.electron.git.selectRepo()
      if (result.success && result.path) {
        setRepoPath(result.path)
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
    initialized,
    selectRepo,
    setRepo,
    refreshFiles,
    getFileChange
  }
}
