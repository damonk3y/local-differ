import { useState, useEffect, useMemo } from 'react'
import './ReviewModal.css'

interface LineComment {
  id?: string
  startLine: number
  endLine: number
  lineContent?: string
  lineContents?: string[]
  side: 'old' | 'new'
  text: string
}

interface FileComment {
  filePath: string
  staged: boolean
  generalComment?: string
  lineComments: LineComment[]
}

export interface ReviewData {
  version?: number
  source?: string
  comments: Record<string, FileComment>
  lastModified?: number
}

interface ReviewModalProps {
  reviewData: ReviewData
  onClose: () => void
  onImport: (selectedComments: ReviewData) => void
}

interface SelectionState {
  [fileKey: string]: {
    general: boolean
    lines: { [index: number]: boolean }
  }
}

export function ReviewModal({ reviewData, onClose, onImport }: ReviewModalProps) {
  const [selection, setSelection] = useState<SelectionState>({})
  const [expandedFiles, setExpandedFiles] = useState<Set<string>>(new Set())

  // Initialize selection state - all selected by default
  useEffect(() => {
    const initialSelection: SelectionState = {}
    for (const [key, fileComment] of Object.entries(reviewData.comments)) {
      initialSelection[key] = {
        general: !!fileComment.generalComment,
        lines: {}
      }
      fileComment.lineComments.forEach((_, idx) => {
        initialSelection[key].lines[idx] = true
      })
    }
    setSelection(initialSelection)
    // Expand all files by default
    setExpandedFiles(new Set(Object.keys(reviewData.comments)))
  }, [reviewData])

  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose()
  }

  const toggleFileExpanded = (fileKey: string) => {
    setExpandedFiles(prev => {
      const next = new Set(prev)
      if (next.has(fileKey)) next.delete(fileKey)
      else next.add(fileKey)
      return next
    })
  }

  const toggleGeneral = (fileKey: string) => {
    setSelection(prev => ({
      ...prev,
      [fileKey]: {
        ...prev[fileKey],
        general: !prev[fileKey]?.general
      }
    }))
  }

  const toggleLine = (fileKey: string, lineIdx: number) => {
    setSelection(prev => ({
      ...prev,
      [fileKey]: {
        ...prev[fileKey],
        lines: {
          ...prev[fileKey]?.lines,
          [lineIdx]: !prev[fileKey]?.lines[lineIdx]
        }
      }
    }))
  }

  const toggleAllInFile = (fileKey: string, fileComment: FileComment) => {
    const currentSelection = selection[fileKey]
    const allSelected = (fileComment.generalComment ? currentSelection?.general : true) &&
      fileComment.lineComments.every((_, idx) => currentSelection?.lines[idx])

    setSelection(prev => ({
      ...prev,
      [fileKey]: {
        general: !allSelected && !!fileComment.generalComment,
        lines: Object.fromEntries(
          fileComment.lineComments.map((_, idx) => [idx, !allSelected])
        )
      }
    }))
  }

  const selectAll = () => {
    const newSelection: SelectionState = {}
    for (const [key, fileComment] of Object.entries(reviewData.comments)) {
      newSelection[key] = {
        general: !!fileComment.generalComment,
        lines: Object.fromEntries(
          fileComment.lineComments.map((_, idx) => [idx, true])
        )
      }
    }
    setSelection(newSelection)
  }

  const deselectAll = () => {
    const newSelection: SelectionState = {}
    for (const key of Object.keys(reviewData.comments)) {
      newSelection[key] = {
        general: false,
        lines: {}
      }
    }
    setSelection(newSelection)
  }

  const selectedCount = useMemo(() => {
    let count = 0
    for (const [key, fileComment] of Object.entries(reviewData.comments)) {
      if (selection[key]?.general) count++
      fileComment.lineComments.forEach((_, idx) => {
        if (selection[key]?.lines[idx]) count++
      })
    }
    return count
  }, [selection, reviewData])

  const totalCount = useMemo(() => {
    let count = 0
    for (const fileComment of Object.values(reviewData.comments)) {
      if (fileComment.generalComment) count++
      count += fileComment.lineComments.length
    }
    return count
  }, [reviewData])

  const handleImport = () => {
    // Build filtered review data with only selected comments
    const filteredComments: Record<string, FileComment> = {}

    for (const [key, fileComment] of Object.entries(reviewData.comments)) {
      const selectedLines = fileComment.lineComments.filter(
        (_, idx) => selection[key]?.lines[idx]
      )
      const includeGeneral = selection[key]?.general && fileComment.generalComment

      if (selectedLines.length > 0 || includeGeneral) {
        filteredComments[key] = {
          ...fileComment,
          generalComment: includeGeneral ? fileComment.generalComment : '',
          lineComments: selectedLines
        }
      }
    }

    onImport({
      ...reviewData,
      comments: filteredComments
    })
  }

  const getSeverityClass = (text: string): string => {
    if (text.includes('[CRITICAL]')) return 'severity-critical'
    if (text.includes('[WARNING]')) return 'severity-warning'
    if (text.includes('[SUGGESTION]')) return 'severity-suggestion'
    return ''
  }

  const getSeverityLabel = (text: string): string | null => {
    if (text.includes('[CRITICAL]')) return 'CRITICAL'
    if (text.includes('[WARNING]')) return 'WARNING'
    if (text.includes('[SUGGESTION]')) return 'SUGGESTION'
    return null
  }

  return (
    <div className="review-modal-backdrop" onClick={handleBackdropClick}>
      <div className="review-modal">
        <div className="review-modal-header">
          <h2>Review CR Suggestions</h2>
          <div className="review-modal-actions">
            <span className="selection-count">
              {selectedCount} of {totalCount} selected
            </span>
            <button className="select-btn" onClick={selectAll}>Select All</button>
            <button className="select-btn" onClick={deselectAll}>Deselect All</button>
            <button className="close-btn" onClick={onClose} title="Close (Esc)">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                <path d="M3.72 3.72a.75.75 0 011.06 0L8 6.94l3.22-3.22a.75.75 0 111.06 1.06L9.06 8l3.22 3.22a.75.75 0 11-1.06 1.06L8 9.06l-3.22 3.22a.75.75 0 01-1.06-1.06L6.94 8 3.72 4.78a.75.75 0 010-1.06z" />
              </svg>
            </button>
          </div>
        </div>

        <div className="review-modal-body">
          {Object.entries(reviewData.comments).map(([fileKey, fileComment]) => {
            const isExpanded = expandedFiles.has(fileKey)
            const fileSelection = selection[fileKey]
            const fileSelectedCount = (fileSelection?.general ? 1 : 0) +
              Object.values(fileSelection?.lines || {}).filter(Boolean).length
            const fileTotalCount = (fileComment.generalComment ? 1 : 0) + fileComment.lineComments.length

            return (
              <div key={fileKey} className="review-file">
                <div className="review-file-header" onClick={() => toggleFileExpanded(fileKey)}>
                  <svg
                    className={`expand-icon ${isExpanded ? 'expanded' : ''}`}
                    width="12"
                    height="12"
                    viewBox="0 0 16 16"
                    fill="currentColor"
                  >
                    <path d="M6.22 3.22a.75.75 0 011.06 0l4.25 4.25a.75.75 0 010 1.06l-4.25 4.25a.75.75 0 01-1.06-1.06L9.94 8 6.22 4.28a.75.75 0 010-1.06z" />
                  </svg>
                  <span className="review-file-path">{fileComment.filePath}</span>
                  <span className="review-file-badge">{fileComment.staged ? 'staged' : 'unstaged'}</span>
                  <span className="review-file-count">{fileSelectedCount}/{fileTotalCount}</span>
                  <button
                    className="toggle-all-btn"
                    onClick={(e) => {
                      e.stopPropagation()
                      toggleAllInFile(fileKey, fileComment)
                    }}
                  >
                    {fileSelectedCount === fileTotalCount ? 'Deselect' : 'Select'} All
                  </button>
                </div>

                {isExpanded && (
                  <div className="review-file-comments">
                    {fileComment.generalComment && (
                      <label className="review-comment general-comment">
                        <input
                          type="checkbox"
                          checked={fileSelection?.general || false}
                          onChange={() => toggleGeneral(fileKey)}
                        />
                        <div className="comment-content">
                          <span className="comment-location">File comment</span>
                          <p className="comment-text">{fileComment.generalComment}</p>
                        </div>
                      </label>
                    )}

                    {fileComment.lineComments.map((lc, idx) => {
                      const severity = getSeverityLabel(lc.text)
                      return (
                        <label
                          key={idx}
                          className={`review-comment ${getSeverityClass(lc.text)}`}
                        >
                          <input
                            type="checkbox"
                            checked={fileSelection?.lines[idx] || false}
                            onChange={() => toggleLine(fileKey, idx)}
                          />
                          <div className="comment-content">
                            <div className="comment-meta">
                              <span className="comment-location">
                                Line {lc.startLine}{lc.endLine !== lc.startLine ? `-${lc.endLine}` : ''}
                              </span>
                              {severity && (
                                <span className={`severity-badge ${getSeverityClass(lc.text)}`}>
                                  {severity}
                                </span>
                              )}
                            </div>
                            {lc.lineContent && (
                              <code className="comment-code">{lc.lineContent}</code>
                            )}
                            <p className="comment-text">
                              {lc.text.replace(/\[(CRITICAL|WARNING|SUGGESTION)\]\s*/g, '')}
                            </p>
                          </div>
                        </label>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        <div className="review-modal-footer">
          <button className="cancel-btn" onClick={onClose}>Cancel</button>
          <button
            className="import-btn"
            onClick={handleImport}
            disabled={selectedCount === 0}
          >
            Import {selectedCount} Suggestion{selectedCount !== 1 ? 's' : ''}
          </button>
        </div>
      </div>
    </div>
  )
}
