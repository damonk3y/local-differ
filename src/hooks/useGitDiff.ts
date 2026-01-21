import { useState, useCallback, useEffect, useRef } from 'react'
import { invoke } from '@tauri-apps/api/core'
import { ChangedFile, FileChange } from '../types/diff'
import { detectLanguage } from '../services/languageDetector'
import { parseIgnorePatterns, shouldIgnoreFile } from '../services/ignorePatterns'
import type { RepoResult, ChangedFiles } from '../types/tauri'

export function useGitDiff() {
  const [repoPath, setRepoPath] = useState<string | null>(null)
  const [files, setFiles] = useState<ChangedFile[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [initialized, setInitialized] = useState(false)
  const hasLoadedFiles = useRef(false)
  const ignorePatternsRef = useRef<string[]>([])

  // Load ignore patterns from .ldignore file via Tauri command
  const loadIgnorePatterns = useCallback(async () => {
    try {
      const content = await invoke<string>('get_ignore_patterns')
      ignorePatternsRef.current = parseIgnorePatterns(content)
    } catch {
      ignorePatternsRef.current = []
    }
  }, [])

  const refreshFiles = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      // Reload ignore patterns in case they changed
      await loadIgnorePatterns()

      const result = await invoke<ChangedFiles>('get_changed_files')
      const allFiles: ChangedFile[] = [
        ...result.staged.map(f => ({ ...f, staged: true })),
        ...result.unstaged.map(f => ({ ...f, staged: false }))
      ]

      // Filter out ignored files
      const filteredFiles = allFiles.filter(
        f => !shouldIgnoreFile(f.path, ignorePatternsRef.current)
      )
      setFiles(filteredFiles)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get changed files')
    } finally {
      setLoading(false)
    }
  }, [loadIgnorePatterns])

  // Load saved project path on startup
  useEffect(() => {
    const loadSavedPath = async () => {
      try {
        const savedPath = await invoke<string | null>('get_project_path')
        if (savedPath) {
          const result = await invoke<RepoResult>('set_repo', { path: savedPath })
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
      const result = await invoke<RepoResult>('set_repo', { path })
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
      const result = await invoke<RepoResult>('select_repo')
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
          ? await invoke<string>('get_file_content', { filePath: file.path, gitRef: 'index' })
          : await invoke<string>('get_file_content', { filePath: file.path, gitRef: 'working' })
      } else if (file.status === 'D') {
        // Deleted file
        oldContent = await invoke<string>('get_file_content', { filePath: file.path, gitRef: 'HEAD' })
        newContent = ''
      } else {
        // Modified file
        if (file.staged) {
          oldContent = await invoke<string>('get_file_content', { filePath: file.path, gitRef: 'HEAD' })
          newContent = await invoke<string>('get_file_content', { filePath: file.path, gitRef: 'index' })
        } else {
          // For unstaged changes, compare working directory against HEAD
          // (index might be empty if nothing was staged)
          oldContent = await invoke<string>('get_file_content', { filePath: file.path, gitRef: 'HEAD' })
          newContent = await invoke<string>('get_file_content', { filePath: file.path, gitRef: 'working' })
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
