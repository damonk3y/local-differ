import { useState, useRef, useEffect, useCallback } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import './MarkdownEditor.css'

interface MarkdownEditorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  onSave?: () => void
  onCancel?: () => void
  autoFocus?: boolean
  minHeight?: number
}

export function MarkdownEditor({
  value,
  onChange,
  placeholder = 'Write your comment...',
  onSave,
  onCancel,
  autoFocus = true,
  minHeight = 80
}: MarkdownEditorProps) {
  const [showPreview, setShowPreview] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (autoFocus && textareaRef.current && !showPreview) {
      textareaRef.current.focus()
      textareaRef.current.setSelectionRange(value.length, value.length)
    }
  }, [autoFocus, showPreview])

  const insertAtCursor = useCallback((before: string, after: string = '') => {
    const textarea = textareaRef.current
    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const selectedText = value.substring(start, end)

    const newText = value.substring(0, start) + before + selectedText + after + value.substring(end)
    onChange(newText)

    // Set cursor position after insert
    setTimeout(() => {
      const newPos = start + before.length + selectedText.length
      textarea.focus()
      textarea.setSelectionRange(newPos, newPos)
    }, 0)
  }, [value, onChange])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault()
      onSave?.()
    }
    if (e.key === 'Escape') {
      e.preventDefault()
      onCancel?.()
    }
    // Tab to indent
    if (e.key === 'Tab') {
      e.preventDefault()
      insertAtCursor('  ')
    }
  }

  const toolbarActions = [
    { label: 'B', title: 'Bold (Ctrl+B)', action: () => insertAtCursor('**', '**') },
    { label: 'I', title: 'Italic (Ctrl+I)', action: () => insertAtCursor('_', '_') },
    { label: '<>', title: 'Inline code', action: () => insertAtCursor('`', '`') },
    { label: '```', title: 'Code block', action: () => insertAtCursor('```\n', '\n```') },
    { label: '•', title: 'List', action: () => insertAtCursor('- ') },
    { label: '>', title: 'Quote', action: () => insertAtCursor('> ') },
  ]

  return (
    <div className="markdown-editor">
      <div className="markdown-editor-toolbar">
        {toolbarActions.map((action, i) => (
          <button
            key={i}
            type="button"
            onClick={action.action}
            title={action.title}
            className="toolbar-btn"
          >
            {action.label}
          </button>
        ))}
        <span className="toolbar-divider" />
        <button
          type="button"
          className={`toolbar-btn preview-btn ${showPreview ? 'active' : ''}`}
          onClick={() => setShowPreview(!showPreview)}
          title="Toggle preview"
        >
          {showPreview ? 'Edit' : 'Preview'}
        </button>
      </div>

      {showPreview ? (
        <div
          className="markdown-preview"
          style={{ minHeight }}
        >
          {value ? (
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {value}
            </ReactMarkdown>
          ) : (
            <span className="preview-empty">Nothing to preview</span>
          )}
        </div>
      ) : (
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="markdown-textarea"
          style={{ minHeight }}
        />
      )}

      <div className="markdown-editor-hint">
        Supports Markdown. <kbd>Ctrl+Enter</kbd> to save, <kbd>Esc</kbd> to cancel
      </div>
    </div>
  )
}
