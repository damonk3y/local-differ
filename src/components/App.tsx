import { useState, useEffect, useCallback } from 'react'
import { Header } from './Header/Header'
import { FileList } from './FileList/FileList'
import { DiffViewer } from './DiffViewer/DiffViewer'
import { useGitDiff } from '../hooks/useGitDiff'
import { ViewMode, ChangedFile, FileChange } from '../types/diff'
import './App.css'

export function App() {
  const { repoPath, files, loading, error, selectRepo, refreshFiles, getFileChange } = useGitDiff()
  const [viewMode, setViewMode] = useState<ViewMode>('split')
  const [selectedFile, setSelectedFile] = useState<ChangedFile | null>(null)
  const [fileChange, setFileChange] = useState<FileChange | null>(null)
  const [loadingDiff, setLoadingDiff] = useState(false)

  const handleSelectFile = useCallback(async (file: ChangedFile) => {
    setSelectedFile(file)
    setLoadingDiff(true)
    const change = await getFileChange(file)
    setFileChange(change)
    setLoadingDiff(false)
  }, [getFileChange])

  // Auto-select first file when files change
  useEffect(() => {
    if (files.length > 0 && !selectedFile) {
      handleSelectFile(files[0])
    }
  }, [files, selectedFile, handleSelectFile])

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Tab to toggle view mode
      if (e.key === 'Tab' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault()
        setViewMode(prev => prev === 'split' ? 'unified' : 'split')
      }

      // n/p for next/previous file
      if (selectedFile && files.length > 1) {
        const currentIndex = files.findIndex(
          f => f.path === selectedFile.path && f.staged === selectedFile.staged
        )
        if (e.key === 'n' && currentIndex < files.length - 1) {
          handleSelectFile(files[currentIndex + 1])
        }
        if (e.key === 'p' && currentIndex > 0) {
          handleSelectFile(files[currentIndex - 1])
        }
      }

      // r to refresh
      if (e.key === 'r' && !e.ctrlKey && !e.metaKey && repoPath) {
        refreshFiles()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [selectedFile, files, handleSelectFile, refreshFiles, repoPath])

  return (
    <div className="app">
      <Header
        repoPath={repoPath}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        onRefresh={refreshFiles}
        onSelectRepo={selectRepo}
        loading={loading}
      />

      <div className="main-content">
        {!repoPath ? (
          <div className="welcome-screen">
            <div className="welcome-content">
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
                <path d="M9 18c-4.51 2-5-2-7-2" />
              </svg>
              <h2>Welcome to Local Differ</h2>
              <p>View and compare your local git changes with syntax highlighting</p>
              <button className="open-repo-btn" onClick={selectRepo}>
                Open Repository
              </button>
              <p className="keyboard-hint">
                <kbd>Tab</kbd> Toggle view &nbsp;
                <kbd>n</kbd>/<kbd>p</kbd> Next/Prev file &nbsp;
                <kbd>r</kbd> Refresh
              </p>
            </div>
          </div>
        ) : (
          <>
            <aside className="sidebar">
              <FileList
                files={files}
                selectedFile={selectedFile}
                onSelectFile={handleSelectFile}
              />
            </aside>
            <main className="content">
              {error ? (
                <div className="error-message">
                  <p>{error}</p>
                  <button onClick={refreshFiles}>Try Again</button>
                </div>
              ) : (
                <DiffViewer
                  file={selectedFile}
                  oldContent={fileChange?.oldContent || ''}
                  newContent={fileChange?.newContent || ''}
                  language={fileChange?.language || 'text'}
                  viewMode={viewMode}
                  loading={loadingDiff}
                />
              )}
            </main>
          </>
        )}
      </div>
    </div>
  )
}
