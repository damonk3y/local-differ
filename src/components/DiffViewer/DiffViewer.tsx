import { useState, useRef, useCallback } from 'react'
import ReactDiffViewer, { DiffMethod } from 'react-diff-viewer-continued'
import { Highlight, themes } from 'prism-react-renderer'
import { ViewMode, ChangedFile, FileComment, LineComment } from '../../types/diff'
import { CommentInput } from '../CommentInput/CommentInput'
import { InlineComment } from '../InlineComment/InlineComment'
import './DiffViewer.css'

interface DiffViewerProps {
  file: ChangedFile | null
  oldContent: string
  newContent: string
  language: string
  viewMode: ViewMode
  loading: boolean
  fileComment?: FileComment
  onAddLineComment?: (lineNumber: number, side: 'old' | 'new', lineContent: string, text: string) => void
  onUpdateLineComment?: (commentId: string, newText: string) => void
  onRemoveLineComment?: (commentId: string) => void
  onFileCommentChange?: (text: string) => void
  isApproved?: boolean
  onToggleApproval?: () => void
}

interface CommentInputState {
  visible: boolean
  lineNumber: number
  side: 'old' | 'new'
  lineContent: string
  position: { x: number; y: number }
  existingComment?: LineComment
}

const darkStyles = {
  variables: {
    dark: {
      diffViewerBackground: '#1e1e1e',
      diffViewerColor: '#d4d4d4',
      addedBackground: 'rgba(46, 160, 67, 0.15)',
      addedColor: '#d4d4d4',
      removedBackground: 'rgba(248, 81, 73, 0.15)',
      removedColor: '#d4d4d4',
      wordAddedBackground: 'rgba(46, 160, 67, 0.4)',
      wordRemovedBackground: 'rgba(248, 81, 73, 0.4)',
      addedGutterBackground: 'rgba(46, 160, 67, 0.2)',
      removedGutterBackground: 'rgba(248, 81, 73, 0.2)',
      gutterBackground: '#1e1e1e',
      gutterBackgroundDark: '#1e1e1e',
      highlightBackground: 'rgba(255, 255, 255, 0.1)',
      highlightGutterBackground: 'rgba(255, 255, 255, 0.1)',
      codeFoldGutterBackground: '#252526',
      codeFoldBackground: '#252526',
      emptyLineBackground: '#1e1e1e',
      gutterColor: '#858585',
      addedGutterColor: '#3fb950',
      removedGutterColor: '#f85149',
      codeFoldContentColor: '#808080',
      diffViewerTitleBackground: '#252526',
      diffViewerTitleColor: '#d4d4d4',
      diffViewerTitleBorderColor: '#404040'
    }
  },
  line: {
    padding: '0 10px',
    fontSize: '13px',
    fontFamily: '"Fira Code", "Cascadia Code", Menlo, Monaco, monospace',
    cursor: 'pointer'
  },
  gutter: {
    padding: '0 10px',
    minWidth: '55px',
    fontSize: '12px',
    cursor: 'pointer'
  },
  contentText: {
    fontFamily: '"Fira Code", "Cascadia Code", Menlo, Monaco, monospace',
    fontSize: '13px',
    lineHeight: '1.5'
  }
}

function mapLanguage(lang: string): string {
  const langMap: Record<string, string> = {
    typescript: 'tsx',
    javascript: 'jsx',
    text: 'text'
  }
  return langMap[lang] || lang
}

export function DiffViewer({
  file,
  oldContent,
  newContent,
  language,
  viewMode,
  loading,
  fileComment,
  onAddLineComment,
  onUpdateLineComment,
  onRemoveLineComment,
  onFileCommentChange,
  isApproved = false,
  onToggleApproval
}: DiffViewerProps) {
  const [commentInput, setCommentInput] = useState<CommentInputState | null>(null)
  const [showFileComment, setShowFileComment] = useState(false)
  const diffContainerRef = useRef<HTMLDivElement>(null)

  const handleDiffClick = useCallback((e: React.MouseEvent) => {
    if (!onAddLineComment) return

    const target = e.target as HTMLElement

    // Check if clicking on a comment badge or inside comment input
    if (target.closest('.comment-badge') || target.closest('.comment-input-container')) {
      return
    }

    // Find the table row
    const row = target.closest('tr')
    if (!row) return

    // Get all cells in the row
    const cells = row.querySelectorAll('td')
    if (cells.length === 0) return

    let lineNumber: number | null = null
    let side: 'old' | 'new' = 'new'
    let lineContent = ''

    // react-diff-viewer-continued structure:
    // Split view has structure like: gutter | content | marker | gutter | content
    // The gutters have class names containing "gutter"
    // Let's find gutter cells by looking for cells with line numbers

    const gutterCells: { cell: Element; lineNum: number; index: number }[] = []
    const contentCells: { cell: Element; index: number }[] = []

    cells.forEach((cell, index) => {
      const text = cell.textContent?.trim() || ''
      const num = parseInt(text, 10)
      // Check if this cell contains just a number (gutter cell)
      if (!isNaN(num) && text === String(num)) {
        gutterCells.push({ cell, lineNum: num, index })
      } else if (text.length > 0 || cell.querySelector('pre')) {
        contentCells.push({ cell, index })
      }
    })

    // Find which cell was clicked
    const clickedCell = target.closest('td')
    const clickedIndex = clickedCell ? Array.from(cells).indexOf(clickedCell) : -1

    if (viewMode === 'split') {
      // In split view, typically first gutter is old, second is new
      if (gutterCells.length >= 2) {
        // Determine if click was on old side (before second gutter) or new side
        const secondGutterIndex = gutterCells[1]?.index || cells.length
        if (clickedIndex < secondGutterIndex) {
          side = 'old'
          lineNumber = gutterCells[0]?.lineNum || null
          // Find content cell after first gutter
          const contentAfterFirst = contentCells.find(c => c.index > gutterCells[0].index && c.index < secondGutterIndex)
          lineContent = contentAfterFirst?.cell.textContent || ''
        } else {
          side = 'new'
          lineNumber = gutterCells[1]?.lineNum || null
          // Find content cell after second gutter
          const contentAfterSecond = contentCells.find(c => c.index > secondGutterIndex)
          lineContent = contentAfterSecond?.cell.textContent || ''
        }
      } else if (gutterCells.length === 1) {
        // Only one side has content (added or removed line)
        lineNumber = gutterCells[0].lineNum
        // Determine side based on row class or position
        const rowClasses = row.className || ''
        if (rowClasses.includes('removed') || clickedIndex <= 1) {
          side = 'old'
        } else {
          side = 'new'
        }
        lineContent = contentCells[0]?.cell.textContent || ''
      }
    } else {
      // Unified view: old-gutter, new-gutter, content
      if (gutterCells.length >= 1) {
        // In unified, prefer new line number if available
        if (gutterCells.length >= 2) {
          side = 'new'
          lineNumber = gutterCells[1].lineNum
        } else {
          // Check position to determine old/new
          if (gutterCells[0].index === 0) {
            side = 'old'
          } else {
            side = 'new'
          }
          lineNumber = gutterCells[0].lineNum
        }
        lineContent = contentCells[contentCells.length - 1]?.cell.textContent || ''
      }
    }

    if (lineNumber && !isNaN(lineNumber)) {
      // Check if there's an existing comment for this line
      const existingComment = fileComment?.lineComments.find(
        c => c.lineNumber === lineNumber && c.side === side
      )

      // Calculate position for the input popup
      const rect = row.getBoundingClientRect()
      const x = Math.min(e.clientX, window.innerWidth - 420)
      const y = Math.min(rect.bottom + 8, window.innerHeight - 200)

      setCommentInput({
        visible: true,
        lineNumber,
        side,
        lineContent: lineContent.trim(),
        position: { x, y },
        existingComment
      })
    }
  }, [viewMode, fileComment, onAddLineComment])

  const handleBadgeClick = useCallback((comment: LineComment, e: React.MouseEvent) => {
    e.stopPropagation()

    const rect = (e.target as HTMLElement).getBoundingClientRect()
    const x = Math.min(rect.left, window.innerWidth - 420)
    const y = Math.min(rect.bottom + 8, window.innerHeight - 200)

    setCommentInput({
      visible: true,
      lineNumber: comment.lineNumber,
      side: comment.side,
      lineContent: comment.lineContent,
      position: { x, y },
      existingComment: comment
    })
  }, [])

  const handleSaveComment = useCallback((text: string) => {
    if (!commentInput) return

    if (commentInput.existingComment) {
      onUpdateLineComment?.(commentInput.existingComment.id, text)
    } else {
      onAddLineComment?.(
        commentInput.lineNumber,
        commentInput.side,
        commentInput.lineContent,
        text
      )
    }
    setCommentInput(null)
  }, [commentInput, onAddLineComment, onUpdateLineComment])

  const handleDeleteComment = useCallback(() => {
    if (commentInput?.existingComment) {
      onRemoveLineComment?.(commentInput.existingComment.id)
    }
    setCommentInput(null)
  }, [commentInput, onRemoveLineComment])

  const handleCancelComment = useCallback(() => {
    setCommentInput(null)
  }, [])

  const handleEditInlineComment = useCallback((comment: LineComment) => {
    setCommentInput({
      visible: true,
      lineNumber: comment.lineNumber,
      side: comment.side,
      lineContent: comment.lineContent,
      position: { x: window.innerWidth / 2 - 200, y: window.innerHeight / 2 - 100 },
      existingComment: comment
    })
  }, [])

  const highlightSyntax = useCallback((str: string) => {
    if (str == null) {
      return <pre style={{ margin: 0, background: 'transparent' }}>{' '}</pre>
    }
    const prismLang = mapLanguage(language)
    return (
      <Highlight theme={themes.vsDark} code={str} language={prismLang as any}>
        {({ tokens, getLineProps, getTokenProps }) => (
          <pre style={{ margin: 0, background: 'transparent' }}>
            {tokens.map((line, i) => {
              if (!line) {
                return <span key={i} style={{ display: 'block' }}>{' '}</span>
              }
              const lineProps = getLineProps({ line, key: i })
              return (
                <span key={i} {...lineProps} style={{ display: 'block' }}>
                  {line.map((token, key) => (
                    <span key={key} {...getTokenProps({ token })} />
                  ))}
                  {line.length === 0 && ' '}
                </span>
              )
            })}
          </pre>
        )}
      </Highlight>
    )
  }, [language])

  // Render line number with comment badge if exists
  const renderGutter = useCallback((lineNumber: number, side: 'old' | 'new') => {
    const comment = fileComment?.lineComments.find(
      c => c.lineNumber === lineNumber && c.side === side
    )

    return (
      <span className="gutter-with-badge">
        {lineNumber}
        {comment && (
          <CommentBadge
            comment={comment}
            onClick={(e) => handleBadgeClick(comment, e)}
          />
        )}
      </span>
    )
  }, [fileComment, handleBadgeClick])

  if (loading) {
    return (
      <div className="diff-viewer-empty">
        <div className="loading-spinner" />
        <p>Loading diff...</p>
      </div>
    )
  }

  if (!file) {
    return (
      <div className="diff-viewer-empty">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="9" y1="15" x2="15" y2="15" />
        </svg>
        <p>Select a file to view diff</p>
      </div>
    )
  }

  const sortedComments = fileComment?.lineComments
    ? [...fileComment.lineComments].sort((a, b) => a.lineNumber - b.lineNumber)
    : []

  return (
    <div className={`diff-viewer ${isApproved ? 'approved' : ''}`}>
      <div className="diff-header">
        <div className="diff-header-left">
          <span className="diff-filename">{file.path}</span>
          <span className={`diff-status ${file.staged ? 'staged' : 'unstaged'}`}>
            {file.staged ? 'Staged' : 'Unstaged'}
          </span>
        </div>
        {onToggleApproval && (
          <button
            className={`approval-btn ${isApproved ? 'approved' : ''}`}
            onClick={onToggleApproval}
            title={isApproved ? 'Unapprove this file' : 'Approve this file'}
          >
            {isApproved ? (
              <>
                <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
                  <path d="M13.78 4.22a.75.75 0 010 1.06l-7.25 7.25a.75.75 0 01-1.06 0L2.22 9.28a.75.75 0 011.06-1.06L6 10.94l6.72-6.72a.75.75 0 011.06 0z" />
                </svg>
                Approved
              </>
            ) : (
              <>
                <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
                  <path d="M8 16A8 8 0 108 0a8 8 0 000 16zm3.78-9.72a.75.75 0 00-1.06-1.06L6.75 9.19 5.28 7.72a.75.75 0 00-1.06 1.06l2 2a.75.75 0 001.06 0l4.5-4.5z" />
                </svg>
                Approve
              </>
            )}
          </button>
        )}
      </div>

      {/* File-level comment section */}
      {onFileCommentChange && (
        <div className="file-comment-section">
          <button
            className="file-comment-toggle"
            onClick={() => setShowFileComment(!showFileComment)}
          >
            <svg
              width="12"
              height="12"
              viewBox="0 0 16 16"
              fill="currentColor"
              style={{ transform: showFileComment ? 'rotate(90deg)' : 'rotate(0deg)' }}
            >
              <path d="M6.22 3.22a.75.75 0 011.06 0l4.25 4.25a.75.75 0 010 1.06l-4.25 4.25a.75.75 0 01-1.06-1.06L9.94 8 6.22 4.28a.75.75 0 010-1.06z" />
            </svg>
            {fileComment?.generalComment ? 'File note' : 'Add note about this file...'}
            {fileComment?.generalComment && (
              <span className="file-comment-indicator" />
            )}
          </button>
          {showFileComment && (
            <textarea
              className="file-comment-input"
              value={fileComment?.generalComment || ''}
              onChange={(e) => onFileCommentChange(e.target.value)}
              placeholder="Add a general note about this file's changes..."
              rows={3}
            />
          )}
        </div>
      )}

      <div
        className="diff-content"
        ref={diffContainerRef}
        onClick={handleDiffClick}
      >
        <ReactDiffViewer
          oldValue={oldContent}
          newValue={newContent}
          splitView={viewMode === 'split'}
          useDarkTheme={true}
          compareMethod={DiffMethod.WORDS}
          renderContent={highlightSyntax}
          styles={darkStyles}
          leftTitle="Before"
          rightTitle="After"
        />
      </div>

      {/* Comments panel */}
      {sortedComments.length > 0 && (
        <div className="comments-panel">
          <div className="comments-panel-header">
            <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
              <path d="M1 2.75A.75.75 0 011.75 2h12.5a.75.75 0 01.75.75v8.5a.75.75 0 01-.75.75h-3.89l-3.38 2.89a.75.75 0 01-1.22-.58V12H1.75a.75.75 0 01-.75-.75v-8.5z" />
            </svg>
            {sortedComments.length} Comment{sortedComments.length > 1 ? 's' : ''}
          </div>
          <div className="comments-panel-list">
            {sortedComments.map(comment => (
              <InlineComment
                key={comment.id}
                comment={comment}
                onEdit={handleEditInlineComment}
                onDelete={(id) => onRemoveLineComment?.(id)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Comment input popup */}
      {commentInput?.visible && (
        <CommentInput
          initialText={commentInput.existingComment?.text || ''}
          position={commentInput.position}
          onSave={handleSaveComment}
          onCancel={handleCancelComment}
          onDelete={commentInput.existingComment ? handleDeleteComment : undefined}
        />
      )}
    </div>
  )
}
