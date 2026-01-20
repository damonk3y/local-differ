import { LineComment } from '../../types/diff'
import './InlineComment.css'

interface InlineCommentProps {
  comment: LineComment
  onEdit: (comment: LineComment) => void
  onDelete: (commentId: string) => void
}

export function InlineComment({ comment, onEdit, onDelete }: InlineCommentProps) {
  return (
    <div className="inline-comment">
      <div className="inline-comment-header">
        <span className="inline-comment-line">
          Line {comment.lineNumber}
          <span className={`inline-comment-side ${comment.side}`}>
            {comment.side === 'new' ? 'added' : 'removed'}
          </span>
        </span>
        <div className="inline-comment-actions">
          <button
            className="inline-comment-btn edit"
            onClick={() => onEdit(comment)}
            title="Edit comment"
          >
            <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
              <path d="M11.013 1.427a1.75 1.75 0 012.474 0l1.086 1.086a1.75 1.75 0 010 2.474l-8.61 8.61c-.21.21-.47.364-.756.445l-3.251.93a.75.75 0 01-.927-.928l.929-3.25a1.75 1.75 0 01.445-.758l8.61-8.61zm1.414 1.06a.25.25 0 00-.354 0L10.811 3.75l1.439 1.44 1.263-1.263a.25.25 0 000-.354l-1.086-1.086zM11.189 6.25L9.75 4.81l-6.286 6.287a.25.25 0 00-.064.108l-.558 1.953 1.953-.558a.249.249 0 00.108-.064l6.286-6.286z" />
            </svg>
          </button>
          <button
            className="inline-comment-btn delete"
            onClick={() => onDelete(comment.id)}
            title="Delete comment"
          >
            <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
              <path d="M3.72 3.72a.75.75 0 011.06 0L8 6.94l3.22-3.22a.75.75 0 111.06 1.06L9.06 8l3.22 3.22a.75.75 0 11-1.06 1.06L8 9.06l-3.22 3.22a.75.75 0 01-1.06-1.06L6.94 8 3.72 4.78a.75.75 0 010-1.06z" />
            </svg>
          </button>
        </div>
      </div>
      {comment.lineContent && (
        <div className="inline-comment-code">
          <code>{comment.lineContent}</code>
        </div>
      )}
      <div className="inline-comment-text">{comment.text}</div>
    </div>
  )
}
