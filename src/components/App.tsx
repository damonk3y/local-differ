import { useState, useEffect, useCallback, useRef } from 'react'
import { invoke } from '@tauri-apps/api/core'
import { Header } from './Header/Header'
import { FileList } from './FileList/FileList'
import { DiffViewer } from './DiffViewer/DiffViewer'
import { ContextModal } from './ContextModal/ContextModal'
import { ReviewModal, ReviewData } from './ReviewModal/ReviewModal'
import { useGitDiff } from '../hooks/useGitDiff'
import { useComments, ImportedReview } from '../hooks/useComments'
import { useFileApproval } from '../hooks/useFileApproval'
import { generateContextMarkdown } from '../services/contextGenerator'
import { ViewMode, ChangedFile, FileChange, FileContextData, ContextOptions } from '../types/diff'
import './App.css'

export function App() {
  const { repoPath, files, loading, error, initialized, selectRepo, refreshFiles, getFileChange } = useGitDiff()
  const {
    getFileComments,
    addLineComment,
    updateLineComment,
    removeLineComment,
    setFileComment,
    getAllComments,
    getTotalCommentCount,
    clearAllComments,
    importComments
  } = useComments()

  const {
    isApproved,
    toggleApproval,
    checkAndUpdateApproval,
    getApprovedFiles
  } = useFileApproval()

  const [viewMode, setViewMode] = useState<ViewMode>('unified')
  const [selectedFile, setSelectedFile] = useState<ChangedFile | null>(null)
  const [fileChange, setFileChange] = useState<FileChange | null>(null)
  const [loadingDiff, setLoadingDiff] = useState(false)
  const [showContextModal, setShowContextModal] = useState(false)
  const [showReviewModal, setShowReviewModal] = useState(false)
  const [pendingReviewData, setPendingReviewData] = useState<ReviewData | null>(null)
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null)

  // Show notification with auto-dismiss
  const showNotification = useCallback((message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setNotification({ message, type })
    setTimeout(() => setNotification(null), 3000)
  }, [])

  // Store file data for context generation
  const fileDataMapRef = useRef<Map<string, FileContextData>>(new Map())
  const [reviewFocus, setReviewFocus] = useState('')

  const handleSelectFile = useCallback(async (file: ChangedFile) => {
    setSelectedFile(file)
    setLoadingDiff(true)
    const change = await getFileChange(file)
    setFileChange(change)
    setLoadingDiff(false)

    // Store file data for context generation
    if (change) {
      const key = `${file.path}:${file.staged}`
      fileDataMapRef.current.set(key, {
        oldContent: change.oldContent,
        newContent: change.newContent,
        language: change.language,
        status: file.status
      })

      // Check if file was approved but content changed
      checkAndUpdateApproval(file.path, file.staged, change.oldContent, change.newContent)
    }
  }, [getFileChange, checkAndUpdateApproval])

  // Auto-select first file when files change
  useEffect(() => {
    if (files.length > 0 && !selectedFile) {
      handleSelectFile(files[0])
    }
  }, [files, selectedFile, handleSelectFile])

  // Track previous files to detect refresh
  const prevFilesRef = useRef<ChangedFile[]>([])

  // Check approved files and refresh selected file when files list changes (e.g., after refresh)
  useEffect(() => {
    const handleFilesChange = async () => {
      // Check if this is a refresh (files existed before)
      const isRefresh = prevFilesRef.current.length > 0

      // Check approved files for changes
      const approvedFiles = getApprovedFiles()
      for (const { filePath, staged } of approvedFiles) {
        const file = files.find(f => f.path === filePath && f.staged === staged)
        if (file) {
          const change = await getFileChange(file)
          if (change) {
            checkAndUpdateApproval(filePath, staged, change.oldContent, change.newContent)
          }
        }
      }

      // If we have a selected file, refresh its content
      if (selectedFile && isRefresh) {
        const stillExists = files.find(
          f => f.path === selectedFile.path && f.staged === selectedFile.staged
        )
        if (stillExists) {
          // Re-fetch the diff content
          const change = await getFileChange(stillExists)
          setFileChange(change)

          // Update file data map
          if (change) {
            const key = `${stillExists.path}:${stillExists.staged}`
            fileDataMapRef.current.set(key, {
              oldContent: change.oldContent,
              newContent: change.newContent,
              language: change.language,
              status: stillExists.status
            })
          }
        } else {
          // File no longer exists, clear selection
          setSelectedFile(null)
          setFileChange(null)
        }
      }

      prevFilesRef.current = files
    }

    if (files.length > 0) {
      handleFilesChange()
    } else if (prevFilesRef.current.length > 0) {
      // Files were cleared (e.g., all changes committed)
      setSelectedFile(null)
      setFileChange(null)
      prevFilesRef.current = []
    }
  }, [files, getApprovedFiles, getFileChange, checkAndUpdateApproval, selectedFile])

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't handle shortcuts when typing in inputs
      if (e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLInputElement) {
        return
      }

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

  // Comment handlers for current file
  const handleAddLineComment = useCallback((
    startLine: number,
    endLine: number,
    side: 'old' | 'new',
    lineContent: string,
    lineContents: string[],
    text: string
  ) => {
    if (selectedFile) {
      addLineComment(selectedFile.path, selectedFile.staged, startLine, endLine, side, lineContent, lineContents, text)
    }
  }, [selectedFile, addLineComment])

  const handleUpdateLineComment = useCallback((commentId: string, newText: string) => {
    if (selectedFile) {
      updateLineComment(selectedFile.path, selectedFile.staged, commentId, newText)
    }
  }, [selectedFile, updateLineComment])

  const handleRemoveLineComment = useCallback((commentId: string) => {
    if (selectedFile) {
      removeLineComment(selectedFile.path, selectedFile.staged, commentId)
    }
  }, [selectedFile, removeLineComment])

  const handleFileCommentChange = useCallback((text: string) => {
    if (selectedFile) {
      setFileComment(selectedFile.path, selectedFile.staged, text)
    }
  }, [selectedFile, setFileComment])

  // Approval handler - also stages the file when approving
  const handleToggleApproval = useCallback(async () => {
    if (selectedFile && fileChange) {
      const currentlyApproved = isApproved(selectedFile.path, selectedFile.staged)

      // If approving (not currently approved), stage the file
      if (!currentlyApproved) {
        try {
          await invoke('stage_file', { filePath: selectedFile.path })
          showNotification(`Staged: ${selectedFile.path}`, 'success')
          // Refresh to show the file in staged section
          refreshFiles()
        } catch (err) {
          const message = err instanceof Error ? err.message : 'Failed to stage file'
          showNotification(message, 'error')
          return // Don't toggle approval if staging failed
        }
      }

      toggleApproval(selectedFile.path, selectedFile.staged, fileChange.oldContent, fileChange.newContent)
    }
  }, [selectedFile, fileChange, toggleApproval, isApproved, showNotification, refreshFiles])

  // Context modal
  const handleExportContext = useCallback(() => {
    setShowContextModal(true)
  }, [])

  const handleCloseContextModal = useCallback(() => {
    setShowContextModal(false)
  }, [])

  // Import review from .claude/review.json - shows modal for approval
  const handleImportReview = useCallback(async () => {
    try {
      const content = await invoke<string>('get_review_file')
      const reviewData = JSON.parse(content) as ReviewData

      // Validate basic structure
      if (!reviewData.comments || typeof reviewData.comments !== 'object') {
        throw new Error('Invalid review file: missing comments')
      }

      // Check if there are any comments to import
      const hasComments = Object.values(reviewData.comments).some(
        fc => fc.generalComment || fc.lineComments.length > 0
      )
      if (!hasComments) {
        showNotification('No suggestions found in .claude/review.json', 'info')
        return
      }

      // Show the review modal for user approval
      setPendingReviewData(reviewData)
      setShowReviewModal(true)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load review file'
      showNotification(message, 'error')
    }
  }, [showNotification])

  const handleCloseReviewModal = useCallback(() => {
    setShowReviewModal(false)
    setPendingReviewData(null)
  }, [])

  const handleConfirmImport = useCallback((selectedReviewData: ReviewData) => {
    const result = importComments(selectedReviewData as ImportedReview, 'merge')
    const message = result.skipped > 0
      ? `Imported ${result.imported} suggestions (${result.skipped} duplicates skipped)`
      : `Imported ${result.imported} suggestions`
    showNotification(message, 'success')
    setShowReviewModal(false)
    setPendingReviewData(null)
  }, [importComments, showNotification])

  // Get current file's comments
  const currentFileComment = selectedFile
    ? getFileComments(selectedFile.path, selectedFile.staged)
    : undefined

  // Get current file's approval status
  const currentFileApproved = selectedFile
    ? isApproved(selectedFile.path, selectedFile.staged)
    : false

  // Generate markdown for context modal
  const contextOptions: ContextOptions = {
    reviewFocus: reviewFocus || undefined
  }
  const contextMarkdown = generateContextMarkdown(getAllComments(), fileDataMapRef.current, contextOptions)

  return (
    <div className="app">
      <Header
        repoPath={repoPath}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        onRefresh={refreshFiles}
        onSelectRepo={selectRepo}
        loading={loading}
        commentCount={getTotalCommentCount()}
        onExportContext={handleExportContext}
        onClearComments={clearAllComments}
        onImportReview={handleImportReview}
      />

      <div className="main-content">
        {!initialized ? (
          <div className="welcome-screen">
            <div className="welcome-content">
              <p>Loading...</p>
            </div>
          </div>
        ) : !repoPath ? (
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
                isFileApproved={isApproved}
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
                  fileComment={currentFileComment}
                  onAddLineComment={handleAddLineComment}
                  onUpdateLineComment={handleUpdateLineComment}
                  onRemoveLineComment={handleRemoveLineComment}
                  onFileCommentChange={handleFileCommentChange}
                  isApproved={currentFileApproved}
                  onToggleApproval={handleToggleApproval}
                />
              )}
            </main>
          </>
        )}
      </div>

      {showContextModal && (
        <ContextModal
          markdown={contextMarkdown}
          onClose={handleCloseContextModal}
          onClear={clearAllComments}
          reviewFocus={reviewFocus}
          onReviewFocusChange={setReviewFocus}
        />
      )}

      {showReviewModal && pendingReviewData && (
        <ReviewModal
          reviewData={pendingReviewData}
          onClose={handleCloseReviewModal}
          onImport={handleConfirmImport}
        />
      )}

      {notification && (
        <div className={`notification notification-${notification.type}`}>
          {notification.message}
        </div>
      )}
    </div>
  )
}
