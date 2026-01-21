import { useState, useEffect, useRef } from 'react'
import { MarkdownEditor } from '../MarkdownEditor/MarkdownEditor'
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
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        onCancel()
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [onCancel])

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
      <MarkdownEditor
        value={text}
        onChange={setText}
        placeholder="Add a comment..."
        onSave={handleSave}
        onCancel={onCancel}
        minHeight={60}
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
    </div>
  )
}
