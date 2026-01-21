import { ViewMode } from '../../types/diff'
import './Header.css'

interface HeaderProps {
  repoPath: string | null
  viewMode: ViewMode
  onViewModeChange: (mode: ViewMode) => void
  onRefresh: () => void
  onSelectRepo: () => void
  loading: boolean
  commentCount?: number
  onExportContext?: () => void
  onClearComments?: () => void
  onImportReview?: () => void
}

export function Header({
  repoPath,
  viewMode,
  onViewModeChange,
  onRefresh,
  onSelectRepo,
  loading,
  commentCount = 0,
  onExportContext,
  onClearComments,
  onImportReview
}: HeaderProps) {
  return (
    <header className="header">
      <div className="header-left">
        <h1 className="header-title">Local Differ</h1>
        {repoPath && (
          <span className="header-repo" title={repoPath}>
            {repoPath.split('/').slice(-2).join('/')}
          </span>
        )}
      </div>

      <div className="header-right">
        {/* View Mode Toggle */}
        <div className="header-view-toggle">
          <button
            className="header-toggle-btn"
            data-active={viewMode === 'split'}
            onClick={() => onViewModeChange('split')}
            title="Split view (side-by-side)"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <rect x="1" y="2" width="6" height="12" rx="1" />
              <rect x="9" y="2" width="6" height="12" rx="1" />
            </svg>
            Split
          </button>
          <button
            className="header-toggle-btn"
            data-active={viewMode === 'unified'}
            onClick={() => onViewModeChange('unified')}
            title="Unified view"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <rect x="1" y="2" width="14" height="12" rx="1" />
            </svg>
            Unified
          </button>
        </div>

        {/* Import Review Button */}
        <button
          className="header-import-btn"
          onClick={onImportReview}
          disabled={!repoPath}
          title="Import review from .claude/review.json"
        >
          <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
            <path d="M2.75 14A1.75 1.75 0 011 12.25v-2.5a.75.75 0 011.5 0v2.5c0 .138.112.25.25.25h10.5a.25.25 0 00.25-.25v-2.5a.75.75 0 011.5 0v2.5A1.75 1.75 0 0113.25 14H2.75z" />
            <path d="M11.78 4.72a.75.75 0 00-1.06-1.06L8.75 5.63V1.75a.75.75 0 00-1.5 0v3.88L5.28 3.66a.75.75 0 00-1.06 1.06l3.25 3.25a.75.75 0 001.06 0l3.25-3.25z" />
          </svg>
          Import CR
        </button>

        {/* Export Button */}
        <button
          className="header-export-btn"
          onClick={onExportContext}
          disabled={!repoPath}
          title="Export context for Claude"
        >
          <svg width="14" height="14" viewBox="0 0 16 16" fill="white">
            <path d="M1 2.75A.75.75 0 011.75 2h12.5a.75.75 0 01.75.75v8.5a.75.75 0 01-.75.75h-3.89l-3.38 2.89a.75.75 0 01-1.22-.58V12H1.75a.75.75 0 01-.75-.75v-8.5z" />
          </svg>
          Export
          {commentCount > 0 && (
            <span className="header-badge">{commentCount}</span>
          )}
        </button>

        {/* Clear Comments Button */}
        {commentCount > 0 && onClearComments && (
          <button
            className="header-clear-btn"
            onClick={onClearComments}
            title="Clear all comments"
          >
            <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
              <path d="M3.72 3.72a.75.75 0 011.06 0L8 6.94l3.22-3.22a.75.75 0 111.06 1.06L9.06 8l3.22 3.22a.75.75 0 11-1.06 1.06L8 9.06l-3.22 3.22a.75.75 0 01-1.06-1.06L6.94 8 3.72 4.78a.75.75 0 010-1.06z" />
            </svg>
          </button>
        )}

        {/* Refresh Button */}
        <button
          className="header-icon-btn"
          onClick={onRefresh}
          disabled={loading || !repoPath}
          title="Refresh"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="currentColor"
            className={loading ? 'spinning' : ''}
          >
            <path d="M13.65 2.35a8 8 0 1 0 1.75 8.7.75.75 0 0 0-1.4-.5 6.5 6.5 0 1 1-1.45-7.1l-1.55.35a.75.75 0 0 0 .34 1.46l3.25-.75a.75.75 0 0 0 .56-.56l.75-3.25a.75.75 0 0 0-1.46-.34l-.35 1.55z" />
          </svg>
        </button>

        {/* Open Repo Button */}
        <button
          className="header-icon-btn"
          onClick={onSelectRepo}
          title="Open repository"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <path d="M1.75 1A1.75 1.75 0 0 0 0 2.75v10.5C0 14.216.784 15 1.75 15h12.5A1.75 1.75 0 0 0 16 13.25v-8.5A1.75 1.75 0 0 0 14.25 3H7.5a.25.25 0 0 1-.2-.1l-.9-1.2C6.07 1.26 5.55 1 5 1H1.75z" />
          </svg>
        </button>
      </div>
    </header>
  )
}
