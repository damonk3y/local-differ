import { useState, useEffect, useRef } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism'
import './ContextModal.css'

interface ContextModalProps {
  markdown: string
  onClose: () => void
  onClear?: () => void
  reviewFocus?: string
  onReviewFocusChange?: (value: string) => void
}

export function ContextModal({ markdown, onClose, onClear, reviewFocus, onReviewFocusChange }: ContextModalProps) {
  const [copied, setCopied] = useState(false)
  const [viewMode, setViewMode] = useState<'rendered' | 'raw'>('rendered')
  const contentRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(markdown)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  return (
    <div className="context-modal-backdrop" onClick={handleBackdropClick}>
      <div className="context-modal">
        <div className="context-modal-header">
          <h2>Code Review Context</h2>
          <div className="context-modal-actions">
            {onClear && (
              <button
                className="clear-all-btn"
                onClick={() => {
                  onClear()
                  onClose()
                }}
              >
                <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
                  <path d="M11 1.75V3h2.25a.75.75 0 010 1.5H2.75a.75.75 0 010-1.5H5V1.75C5 .784 5.784 0 6.75 0h2.5C10.216 0 11 .784 11 1.75zM4.496 6.675a.75.75 0 10-1.492.15l.66 6.6A1.75 1.75 0 005.405 15h5.19c.9 0 1.652-.681 1.741-1.576l.66-6.6a.75.75 0 00-1.492-.149l-.66 6.6a.25.25 0 01-.249.225h-5.19a.25.25 0 01-.249-.225l-.66-6.6z" />
                  <path d="M6.5 1.75a.25.25 0 01.25-.25h2.5a.25.25 0 01.25.25V3h-3V1.75z" />
                </svg>
                Clear All
              </button>
            )}
            <div className="view-toggle">
              <button
                className={`toggle-btn ${viewMode === 'rendered' ? 'active' : ''}`}
                onClick={() => setViewMode('rendered')}
              >
                Preview
              </button>
              <button
                className={`toggle-btn ${viewMode === 'raw' ? 'active' : ''}`}
                onClick={() => setViewMode('raw')}
              >
                Raw
              </button>
            </div>
            <button
              className={`copy-btn ${copied ? 'copied' : ''}`}
              onClick={handleCopy}
            >
              {copied ? (
                <>
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
                    <path d="M13.78 4.22a.75.75 0 010 1.06l-7.25 7.25a.75.75 0 01-1.06 0L2.22 9.28a.75.75 0 011.06-1.06L6 10.94l6.72-6.72a.75.75 0 011.06 0z" />
                  </svg>
                  Copied!
                </>
              ) : (
                <>
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
                    <path d="M0 6.75C0 5.784.784 5 1.75 5h1.5a.75.75 0 010 1.5h-1.5a.25.25 0 00-.25.25v7.5c0 .138.112.25.25.25h7.5a.25.25 0 00.25-.25v-1.5a.75.75 0 011.5 0v1.5A1.75 1.75 0 019.25 16h-7.5A1.75 1.75 0 010 14.25v-7.5z" />
                    <path d="M5 1.75C5 .784 5.784 0 6.75 0h7.5C15.216 0 16 .784 16 1.75v7.5A1.75 1.75 0 0114.25 11h-7.5A1.75 1.75 0 015 9.25v-7.5zm1.75-.25a.25.25 0 00-.25.25v7.5c0 .138.112.25.25.25h7.5a.25.25 0 00.25-.25v-7.5a.25.25 0 00-.25-.25h-7.5z" />
                  </svg>
                  Copy
                </>
              )}
            </button>
            <button className="close-btn" onClick={onClose} title="Close (Esc)">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                <path d="M3.72 3.72a.75.75 0 011.06 0L8 6.94l3.22-3.22a.75.75 0 111.06 1.06L9.06 8l3.22 3.22a.75.75 0 11-1.06 1.06L8 9.06l-3.22 3.22a.75.75 0 01-1.06-1.06L6.94 8 3.72 4.78a.75.75 0 010-1.06z" />
              </svg>
            </button>
          </div>
        </div>
        {onReviewFocusChange && (
          <div className="review-focus-section">
            <label htmlFor="review-focus">
              <strong>Review Focus</strong>
              <span className="review-focus-hint">What would you like Claude to focus on?</span>
            </label>
            <textarea
              ref={textareaRef}
              id="review-focus"
              className="review-focus-input"
              placeholder="e.g., Check for security vulnerabilities, Review error handling, Validate the API design..."
              value={reviewFocus || ''}
              onChange={(e) => onReviewFocusChange(e.target.value)}
              rows={2}
            />
          </div>
        )}
        <div className="context-modal-body" ref={contentRef}>
          {viewMode === 'rendered' ? (
            <div className="rendered-markdown">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  code({ node, className, children, ...props }) {
                    const match = /language-(\w+)/.exec(className || '')
                    const inline = !match
                    return !inline ? (
                      <SyntaxHighlighter
                        style={vscDarkPlus}
                        language={match[1]}
                        PreTag="div"
                        customStyle={{
                          margin: 0,
                          borderRadius: '6px',
                          fontSize: '13px'
                        }}
                      >
                        {String(children).replace(/\n$/, '')}
                      </SyntaxHighlighter>
                    ) : (
                      <code className={className} {...props}>
                        {children}
                      </code>
                    )
                  }
                }}
              >
                {markdown}
              </ReactMarkdown>
            </div>
          ) : (
            <pre className="raw-markdown">{markdown}</pre>
          )}
        </div>
      </div>
    </div>
  )
}
