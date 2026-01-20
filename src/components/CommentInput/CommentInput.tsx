import { useState, useEffect, useRef } from 'react'
import './CommentInput.css'

interface CommentInputProps {
  initialText?: string
  position: { x: number; y: number }
  onSave: (text: string) => void
  onCancel: () => void
  onDelete?: () => void
}

export function CommentInput({
  initialText = '',
  position,
  onSave,
  onCancel,
  onDelete
}: CommentInputProps) {
  const [text, setText] = useState(initialText)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    textareaRef.current?.focus()
    textareaRef.current?.select()
  }, [])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onCancel()
      } else if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
        if (text.trim()) {
          onSave(text.trim())
        }
      }
    }

    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        onCancel()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    document.addEventListener('mousedown', handleClickOutside)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [text, onSave, onCancel])

  const handleSave = () => {
    if (text.trim()) {
      onSave(text.trim())
    }
  }

  return (
    <div
      ref={containerRef}
      className="comment-input-container"
      style={{ top: position.y, left: position.x }}
    >
      <textarea
        ref={textareaRef}
        className="comment-textarea"
        value={text}
        onChange={e => setText(e.target.value)}
        placeholder="Add a comment..."
        rows={3}
      />
      <div className="comment-input-actions">
        <div className="comment-input-left">
          {onDelete && (
            <button className="comment-btn delete" onClick={onDelete}>
              Delete
            </button>
          )}
        </div>
        <div className="comment-input-right">
          <button className="comment-btn cancel" onClick={onCancel}>
            Cancel
          </button>
          <button
            className="comment-btn save"
            onClick={handleSave}
            disabled={!text.trim()}
          >
            Save
          </button>
        </div>
      </div>
      <div className="comment-input-hint">
        <kbd>Ctrl</kbd>+<kbd>Enter</kbd> to save, <kbd>Esc</kbd> to cancel
      </div>
    </div>
  )
}
