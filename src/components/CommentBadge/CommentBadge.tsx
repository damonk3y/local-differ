import { LineComment } from '../../types/diff'
import './CommentBadge.css'

interface CommentBadgeProps {
  comment: LineComment
  onClick: (e: React.MouseEvent) => void
}

export function CommentBadge({ comment, onClick }: CommentBadgeProps) {
  return (
    <div
      className="comment-badge"
      onClick={onClick}
      title={comment.text}
    >
      <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
        <path d="M1 2.75A.75.75 0 011.75 2h12.5a.75.75 0 01.75.75v8.5a.75.75 0 01-.75.75h-3.89l-3.38 2.89a.75.75 0 01-1.22-.58V12H1.75a.75.75 0 01-.75-.75v-8.5z" />
      </svg>
    </div>
  )
}
