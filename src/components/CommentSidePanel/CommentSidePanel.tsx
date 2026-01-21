import { useState, useEffect, useRef } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { LineComment, FileComment } from '../../types/diff'
import { MarkdownEditor } from '../MarkdownEditor/MarkdownEditor'
import './CommentSidePanel.css'

interface CodeContext {
  lines: Array<{
    lineNum: number
    content: string
    isTarget: boolean
  }>
  language: string
}

interface CommentSidePanelProps {
  isOpen: boolean
  mode: 'add' | 'edit'
  filePath: string
  codeContext: CodeContext | null
  targetLines: { start: number; end: number; side: 'old' | 'new' }
  existingComment?: LineComment
  allComments: LineComment[]
  onSave: (text: string) => void
  onDelete?: () => void
  onClose: () => void
  onEditComment: (comment: LineComment) => void
  onDeleteComment: (commentId: string) => void
}

export function CommentSidePanel({
  isOpen,
  mode,
  filePath,
  codeContext,
  targetLines,
  existingComment,
  allComments,
  onSave,
  onDelete,
  onClose,
  onEditComment,
  onDeleteComment
}: CommentSidePanelProps) {
  const [text, setText] = useState(existingComment?.text || '')
  const panelRef = useRef<HTMLDivElement>(null)

  // Reset text when editing different comment
  useEffect(() => {
    setText(existingComment?.text || '')
  }, [existingComment])

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  const handleSave = () => {
    if (text.trim()) {
      onSave(text.trim())
      setText('')
    }
  }

  const lineLabel = targetLines.start === targetLines.end
    ? `Line ${targetLines.start}`
    : `Lines ${targetLines.start}-${targetLines.end}`

  const sideLabel = targetLines.side === 'new' ? 'added' : 'removed'

  // Sort comments by line number
  const sortedComments = [...allComments].sort((a, b) => a.startLine - b.startLine)

  return (
    <>
      {/* Backdrop */}
      <div
        className={`comment-panel-backdrop ${isOpen ? 'open' : ''}`}
        onClick={onClose}
      />

      {/* Panel */}
      <div
        ref={panelRef}
        className={`comment-side-panel ${isOpen ? 'open' : ''}`}
      >
        {/* Header */}
        <div className="comment-panel-header">
          <div className="comment-panel-title">
            <h3>{mode === 'add' ? 'Add Comment' : 'Edit Comment'}</h3>
            <span className="comment-panel-file" title={filePath}>
              {filePath.split('/').pop()}
            </span>
          </div>
          <button className="comment-panel-close" onClick={onClose} title="Close (Esc)">
            <svg width="20" height="20" viewBox="0 0 16 16" fill="currentColor">
              <path d="M3.72 3.72a.75.75 0 011.06 0L8 6.94l3.22-3.22a.75.75 0 111.06 1.06L9.06 8l3.22 3.22a.75.75 0 11-1.06 1.06L8 9.06l-3.22 3.22a.75.75 0 01-1.06-1.06L6.94 8 3.72 4.78a.75.75 0 010-1.06z" />
            </svg>
          </button>
        </div>

        {/* Code Context */}
        {codeContext && codeContext.lines.length > 0 && (
          <div className="comment-panel-context">
            <div className="context-header">
              <span className="context-label">{lineLabel}</span>
              <span className={`context-side ${targetLines.side}`}>{sideLabel}</span>
            </div>
            <div className="context-code">
              <pre>
                <code>
                  {codeContext.lines.map((line, idx) => (
                    <div
                      key={idx}
                      className={`context-line ${line.isTarget ? 'target' : ''}`}
                    >
                      <span className="line-num">{line.lineNum}</span>
                      <span className="line-content">{line.content || ' '}</span>
                    </div>
                  ))}
                </code>
              </pre>
            </div>
          </div>
        )}

        {/* Editor */}
        <div className="comment-panel-editor">
          <MarkdownEditor
            value={text}
            onChange={setText}
            placeholder="Write your comment... (Markdown supported)"
            onSave={handleSave}
            onCancel={onClose}
            minHeight={150}
          />
          <div className="comment-panel-actions">
            {mode === 'edit' && onDelete && (
              <button className="panel-btn delete" onClick={onDelete}>
                <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
                  <path d="M11 1.75V3h2.25a.75.75 0 010 1.5H2.75a.75.75 0 010-1.5H5V1.75C5 .784 5.784 0 6.75 0h2.5C10.216 0 11 .784 11 1.75zM4.496 6.675a.75.75 0 10-1.492.15l.66 6.6A1.75 1.75 0 005.405 15h5.19c.9 0 1.652-.681 1.741-1.576l.66-6.6a.75.75 0 00-1.492-.149l-.66 6.6a.25.25 0 01-.249.225h-5.19a.25.25 0 01-.249-.225l-.66-6.6zM6.5 1.75V3h3V1.75a.25.25 0 00-.25-.25h-2.5a.25.25 0 00-.25.25z" />
                </svg>
                Delete
              </button>
            )}
            <div className="panel-btn-group">
              <button className="panel-btn cancel" onClick={onClose}>
                Cancel
              </button>
              <button
                className="panel-btn save"
                onClick={handleSave}
                disabled={!text.trim()}
              >
                {mode === 'add' ? 'Add Comment' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>

        {/* Existing Comments for this file */}
        {sortedComments.length > 0 && (
          <div className="comment-panel-existing">
            <div className="existing-header">
              <h4>Comments in this file</h4>
              <span className="comment-count">{sortedComments.length}</span>
            </div>
            <div className="existing-list">
              {sortedComments.map(comment => (
                <div
                  key={comment.id}
                  className={`existing-comment ${existingComment?.id === comment.id ? 'current' : ''}`}
                >
                  <div className="existing-comment-header">
                    <span className="existing-line">
                      {comment.startLine === comment.endLine
                        ? `Line ${comment.startLine}`
                        : `Lines ${comment.startLine}-${comment.endLine}`}
                    </span>
                    <span className={`existing-side ${comment.side}`}>
                      {comment.side === 'new' ? 'added' : 'removed'}
                    </span>
                    <div className="existing-actions">
                      <button
                        className="existing-btn"
                        onClick={() => onEditComment(comment)}
                        title="Edit"
                      >
                        <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
                          <path d="M11.013 1.427a1.75 1.75 0 012.474 0l1.086 1.086a1.75 1.75 0 010 2.474l-8.61 8.61c-.21.21-.47.364-.756.445l-3.251.93a.75.75 0 01-.927-.928l.929-3.25a1.75 1.75 0 01.445-.758l8.61-8.61zm1.414 1.06a.25.25 0 00-.354 0L10.811 3.75l1.439 1.44 1.263-1.263a.25.25 0 000-.354l-1.086-1.086zM11.189 6.25L9.75 4.81l-6.286 6.287a.25.25 0 00-.064.108l-.558 1.953 1.953-.558a.249.249 0 00.108-.064l6.286-6.286z" />
                        </svg>
                      </button>
                      <button
                        className="existing-btn delete"
                        onClick={() => onDeleteComment(comment.id)}
                        title="Delete"
                      >
                        <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
                          <path d="M3.72 3.72a.75.75 0 011.06 0L8 6.94l3.22-3.22a.75.75 0 111.06 1.06L9.06 8l3.22 3.22a.75.75 0 11-1.06 1.06L8 9.06l-3.22 3.22a.75.75 0 01-1.06-1.06L6.94 8 3.72 4.78a.75.75 0 010-1.06z" />
                        </svg>
                      </button>
                    </div>
                  </div>
                  {comment.lineContent && (
                    <div className="existing-code">
                      <code>{comment.lineContent}</code>
                    </div>
                  )}
                  <div className="existing-text">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {comment.text}
                    </ReactMarkdown>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  )
}
