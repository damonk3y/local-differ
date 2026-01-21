import { useState, useRef, useCallback, useEffect, useLayoutEffect } from 'react'
import { createPortal } from 'react-dom'
import ReactDiffViewer, { DiffMethod } from 'react-diff-viewer-continued'
import { Highlight, themes } from 'prism-react-renderer'
import { ViewMode, ChangedFile, FileComment, LineComment } from '../../types/diff'
import { CommentInput } from '../CommentInput/CommentInput'
import { InlineComment } from '../InlineComment/InlineComment'
import { InlineCommentRow } from '../InlineCommentRow/InlineCommentRow'
import { CommentBadge } from '../CommentBadge/CommentBadge'
import { useCommentNavigation } from '../../hooks/useCommentNavigation'
import './DiffViewer.css'

interface DiffViewerProps {
  file: ChangedFile | null
  oldContent: string
  newContent: string
  language: string
  viewMode: ViewMode
  loading: boolean
  fileComment?: FileComment
  onAddLineComment?: (startLine: number, endLine: number, side: 'old' | 'new', lineContent: string, lineContents: string[], text: string) => void
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
  // Multi-line selection data
  endLine?: number
  lineContents?: string[]
}

interface LineSelection {
  startLine: number
  endLine: number
  side: 'old' | 'new'
  lines: Array<{ lineNumber: number; content: string }>
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

// Helper to find row by line number in the diff table
function findRowByLineNumber(
  container: HTMLElement,
  lineNumber: number,
  side: 'old' | 'new',
  viewMode: ViewMode
): HTMLTableRowElement | null {
  const rows = container.querySelectorAll('table tbody tr')

  for (const row of rows) {
    const cells = row.querySelectorAll('td')
    const gutterCells: { lineNum: number; index: number }[] = []

    cells.forEach((cell, index) => {
      const text = cell.textContent?.trim() || ''
      const num = parseInt(text, 10)
      if (!isNaN(num) && text === String(num)) {
        gutterCells.push({ lineNum: num, index })
      }
    })

    if (viewMode === 'split') {
      // Split view: first gutter is old, second is new
      if (side === 'old' && gutterCells[0]?.lineNum === lineNumber) {
        return row as HTMLTableRowElement
      }
      if (side === 'new' && gutterCells[1]?.lineNum === lineNumber) {
        return row as HTMLTableRowElement
      }
    } else {
      // Unified view
      if (gutterCells.some(g => g.lineNum === lineNumber)) {
        return row as HTMLTableRowElement
      }
    }
  }

  return null
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
  const [inlineCommentContainers, setInlineCommentContainers] = useState<Map<string, HTMLTableRowElement>>(new Map())
  const [lineSelection, setLineSelection] = useState<LineSelection | null>(null)
  const [isSelecting, setIsSelecting] = useState(false)
  const diffContainerRef = useRef<HTMLDivElement>(null)
  const commentVersionRef = useRef(0)
  const selectionStartRef = useRef<{ line: number; side: 'old' | 'new'; content: string } | null>(null)

  // Sort comments for navigation
  const sortedComments = fileComment?.lineComments
    ? [...fileComment.lineComments].sort((a, b) => a.startLine - b.startLine)
    : []

  // Comment navigation with keyboard
  const { focusedComment } = useCommentNavigation({
    comments: sortedComments,
    onEditComment: (comment) => {
      setCommentInput({
        visible: true,
        lineNumber: comment.startLine,
        side: comment.side,
        lineContent: comment.lineContent,
        position: { x: window.innerWidth / 2 - 200, y: window.innerHeight / 2 - 100 },
        existingComment: comment
      })
    },
    enabled: !commentInput?.visible // Disable when comment input is open
  })

  // Helper to extract line info from a row click/event
  const extractLineInfo = useCallback((target: HTMLElement, preferredSide?: 'old' | 'new'): {
    lineNumber: number | null
    side: 'old' | 'new'
    lineContent: string
    row: HTMLTableRowElement | null
  } => {
    const row = target.closest('tr') as HTMLTableRowElement | null
    if (!row) return { lineNumber: null, side: 'new', lineContent: '', row: null }

    const cells = row.querySelectorAll('td')
    if (cells.length === 0) return { lineNumber: null, side: 'new', lineContent: '', row }

    let lineNumber: number | null = null
    let side: 'old' | 'new' = preferredSide || 'new'
    let lineContent = ''

    const gutterCells: { cell: Element; lineNum: number; index: number }[] = []
    const contentCells: { cell: Element; index: number }[] = []

    cells.forEach((cell, index) => {
      const text = cell.textContent?.trim() || ''
      const num = parseInt(text, 10)
      if (!isNaN(num) && text === String(num)) {
        gutterCells.push({ cell, lineNum: num, index })
      } else if (text.length > 0 || cell.querySelector('pre')) {
        contentCells.push({ cell, index })
      }
    })

    const clickedCell = target.closest('td')
    const clickedIndex = clickedCell ? Array.from(cells).indexOf(clickedCell) : -1

    if (viewMode === 'split') {
      if (gutterCells.length >= 2) {
        const secondGutterIndex = gutterCells[1]?.index || cells.length
        if (preferredSide === 'old' || (!preferredSide && clickedIndex < secondGutterIndex)) {
          side = 'old'
          lineNumber = gutterCells[0]?.lineNum || null
          const contentAfterFirst = contentCells.find(c => c.index > gutterCells[0].index && c.index < secondGutterIndex)
          lineContent = contentAfterFirst?.cell.textContent || ''
        } else {
          side = 'new'
          lineNumber = gutterCells[1]?.lineNum || null
          const contentAfterSecond = contentCells.find(c => c.index > secondGutterIndex)
          lineContent = contentAfterSecond?.cell.textContent || ''
        }
      } else if (gutterCells.length === 1) {
        lineNumber = gutterCells[0].lineNum
        const rowClasses = row.className || ''
        if (rowClasses.includes('removed') || clickedIndex <= 1) {
          side = preferredSide || 'old'
        } else {
          side = preferredSide || 'new'
        }
        lineContent = contentCells[0]?.cell.textContent || ''
      }
    } else {
      if (gutterCells.length >= 1) {
        if (gutterCells.length >= 2) {
          side = preferredSide || 'new'
          lineNumber = side === 'new' ? gutterCells[1].lineNum : gutterCells[0].lineNum
        } else {
          if (gutterCells[0].index === 0) {
            side = preferredSide || 'old'
          } else {
            side = preferredSide || 'new'
          }
          lineNumber = gutterCells[0].lineNum
        }
        lineContent = contentCells[contentCells.length - 1]?.cell.textContent || ''
      }
    }

    return { lineNumber, side, lineContent: lineContent.trim(), row }
  }, [viewMode])

  // Mouse down - start selection
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (!onAddLineComment) return
    const target = e.target as HTMLElement

    // Ignore clicks on badges, inputs, and inline comments
    if (target.closest('.comment-badge') || target.closest('.comment-input-container') || target.closest('.inline-comment-row-container')) {
      return
    }

    const { lineNumber, side, lineContent } = extractLineInfo(target)
    if (!lineNumber) return

    // Start selection
    selectionStartRef.current = { line: lineNumber, side, content: lineContent }
    setIsSelecting(true)
    setLineSelection({
      startLine: lineNumber,
      endLine: lineNumber,
      side,
      lines: [{ lineNumber, content: lineContent }]
    })

    // Prevent text selection
    e.preventDefault()
  }, [onAddLineComment, extractLineInfo])

  // Mouse move - extend selection
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isSelecting || !selectionStartRef.current) return

    const target = e.target as HTMLElement
    const { lineNumber, lineContent } = extractLineInfo(target, selectionStartRef.current.side)

    if (!lineNumber) return

    const startLine = selectionStartRef.current.line
    const side = selectionStartRef.current.side
    const minLine = Math.min(startLine, lineNumber)
    const maxLine = Math.max(startLine, lineNumber)

    // Build lines array (we'll fill in content when finalizing)
    const lines: Array<{ lineNumber: number; content: string }> = []
    for (let ln = minLine; ln <= maxLine; ln++) {
      lines.push({ lineNumber: ln, content: '' })
    }

    setLineSelection({
      startLine: minLine,
      endLine: maxLine,
      side,
      lines
    })
  }, [isSelecting, extractLineInfo])

  // Mouse up - finalize selection and open comment input
  const handleMouseUp = useCallback((e: React.MouseEvent) => {
    if (!isSelecting || !lineSelection) {
      setIsSelecting(false)
      return
    }

    setIsSelecting(false)

    // Check if there's an existing comment for this range
    const existingComment = fileComment?.lineComments.find(
      c => c.startLine <= lineSelection.startLine &&
           c.endLine >= lineSelection.endLine &&
           c.side === lineSelection.side
    )

    // Collect line contents for the selection
    const lineContents: string[] = []
    const container = diffContainerRef.current
    if (container) {
      for (let ln = lineSelection.startLine; ln <= lineSelection.endLine; ln++) {
        const row = findRowByLineNumber(container, ln, lineSelection.side, viewMode)
        if (row) {
          const info = extractLineInfo(row.querySelector('td') || row, lineSelection.side)
          lineContents.push(info.lineContent)
        }
      }
    }

    // Calculate position
    const rect = (e.target as HTMLElement).closest('tr')?.getBoundingClientRect()
    const x = Math.min(e.clientX, window.innerWidth - 420)
    const y = Math.min((rect?.bottom || e.clientY) + 8, window.innerHeight - 200)

    setCommentInput({
      visible: true,
      lineNumber: lineSelection.startLine,
      endLine: lineSelection.endLine,
      side: lineSelection.side,
      lineContent: lineContents[0] || '',
      lineContents,
      position: { x, y },
      existingComment
    })

    // Clear selection
    setLineSelection(null)
    selectionStartRef.current = null
  }, [isSelecting, lineSelection, fileComment, viewMode, extractLineInfo])

  // Handle click on diff (for single line when no drag)
  const handleDiffClick = useCallback((e: React.MouseEvent) => {
    // This is now handled by mousedown/mouseup
    // Only handle badge clicks here
    const target = e.target as HTMLElement
    if (target.closest('.comment-badge')) {
      // Badge clicks are handled by the badge component
      return
    }
  }, [])

  const handleBadgeClick = useCallback((comment: LineComment, e: React.MouseEvent) => {
    e.stopPropagation()

    const rect = (e.target as HTMLElement).getBoundingClientRect()
    const x = Math.min(rect.left, window.innerWidth - 420)
    const y = Math.min(rect.bottom + 8, window.innerHeight - 200)

    setCommentInput({
      visible: true,
      lineNumber: comment.startLine,
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
      const endLine = commentInput.endLine ?? commentInput.lineNumber
      const lineContents = commentInput.lineContents ?? [commentInput.lineContent]
      onAddLineComment?.(
        commentInput.lineNumber,
        endLine,
        commentInput.side,
        commentInput.lineContent,
        lineContents,
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
      lineNumber: comment.startLine,
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
              const { key: lineKey, ...lineProps } = getLineProps({ line })
              return (
                <span key={lineKey ?? i} {...lineProps} style={{ display: 'block' }}>
                  {line.map((token, tokenIndex) => {
                    const { key: tokenKey, ...tokenProps } = getTokenProps({ token })
                    return <span key={tokenKey ?? tokenIndex} {...tokenProps} />
                  })}
                  {line.length === 0 && ' '}
                </span>
              )
            })}
          </pre>
        )}
      </Highlight>
    )
  }, [language])

  // Highlight selected rows during multi-line selection
  useEffect(() => {
    if (!diffContainerRef.current) return

    // Clear previous selection highlights
    const prevSelected = diffContainerRef.current.querySelectorAll('.selecting, .selection-start, .selection-end')
    prevSelected.forEach(el => {
      el.classList.remove('selecting', 'selection-start', 'selection-end')
    })

    if (!lineSelection || !isSelecting) return

    // Highlight rows in the selection range
    for (let ln = lineSelection.startLine; ln <= lineSelection.endLine; ln++) {
      const row = findRowByLineNumber(diffContainerRef.current, ln, lineSelection.side, viewMode)
      if (row) {
        row.classList.add('selecting')
        if (ln === lineSelection.startLine) {
          row.classList.add('selection-start')
        }
        if (ln === lineSelection.endLine) {
          row.classList.add('selection-end')
        }
      }
    }
  }, [lineSelection, isSelecting, viewMode])

  // Inject inline comment rows after diff renders
  useLayoutEffect(() => {
    if (!diffContainerRef.current || !fileComment?.lineComments.length) {
      // Clean up any existing injected rows
      const existingRows = diffContainerRef.current?.querySelectorAll('.inline-comment-row-container')
      existingRows?.forEach(row => row.remove())
      setInlineCommentContainers(new Map())
      return
    }

    const container = diffContainerRef.current
    const newContainers = new Map<string, HTMLTableRowElement>()

    // Remove old injected rows
    const existingRows = container.querySelectorAll('.inline-comment-row-container')
    existingRows.forEach(row => row.remove())

    // Get colspan based on view mode
    const colspan = viewMode === 'split' ? 5 : 3

    // Inject a row after each commented line
    for (const comment of fileComment.lineComments) {
      const targetRow = findRowByLineNumber(container, comment.endLine, comment.side, viewMode)

      if (targetRow) {
        // Create a container row for the portal
        const commentRow = document.createElement('tr')
        commentRow.className = 'inline-comment-row-container'
        commentRow.setAttribute('data-comment-id', comment.id)

        const cell = document.createElement('td')
        cell.colSpan = colspan
        cell.style.padding = '0'
        commentRow.appendChild(cell)

        targetRow.after(commentRow)
        newContainers.set(comment.id, commentRow)
      }
    }

    setInlineCommentContainers(newContainers)
    commentVersionRef.current += 1
  }, [fileComment?.lineComments, viewMode, oldContent, newContent])

  // Handle inline comment edit
  const handleInlineCommentEdit = useCallback((commentId: string, newText: string) => {
    onUpdateLineComment?.(commentId, newText)
  }, [onUpdateLineComment])

  // Handle inline comment delete
  const handleInlineCommentDelete = useCallback((commentId: string) => {
    onRemoveLineComment?.(commentId)
  }, [onRemoveLineComment])

  // Render line number with comment badge if exists
  const renderGutter = useCallback((lineNumber: number, side: 'old' | 'new') => {
    const comment = fileComment?.lineComments.find(
      c => c.startLine <= lineNumber && c.endLine >= lineNumber && c.side === side
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
        className={`diff-content ${isSelecting ? 'selecting' : ''}`}
        ref={diffContainerRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={() => {
          if (isSelecting) {
            setIsSelecting(false)
            setLineSelection(null)
            selectionStartRef.current = null
          }
        }}
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

      {/* Render inline comment rows via portals */}
      {fileComment?.lineComments.map(comment => {
        const containerRow = inlineCommentContainers.get(comment.id)
        const cell = containerRow?.querySelector('td')
        if (!cell) return null

        return createPortal(
          <InlineCommentRow
            key={comment.id}
            comment={comment}
            colspan={viewMode === 'split' ? 5 : 3}
            isFocused={focusedComment?.id === comment.id}
            onEdit={handleInlineCommentEdit}
            onDelete={handleInlineCommentDelete}
          />,
          cell
        )
      })}
    </div>
  )
}
