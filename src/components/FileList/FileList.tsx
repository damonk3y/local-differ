import { ChangedFile } from '../../types/diff'
import './FileList.css'

interface FileListProps {
  files: ChangedFile[]
  selectedFile: ChangedFile | null
  onSelectFile: (file: ChangedFile) => void
  isFileApproved?: (filePath: string, staged: boolean) => boolean
}

function getStatusLabel(status: string): string {
  switch (status) {
    case 'A': return 'Added'
    case 'M': return 'Modified'
    case 'D': return 'Deleted'
    case 'R': return 'Renamed'
    case 'C': return 'Copied'
    default: return status
  }
}

function getStatusClass(status: string): string {
  switch (status) {
    case 'A': return 'status-added'
    case 'M': return 'status-modified'
    case 'D': return 'status-deleted'
    default: return 'status-other'
  }
}

export function FileList({ files, selectedFile, onSelectFile, isFileApproved }: FileListProps) {
  // Sort files: non-approved first, then approved
  const sortByApproval = (fileList: ChangedFile[]) => {
    return [...fileList].sort((a, b) => {
      const aApproved = isFileApproved?.(a.path, a.staged) || false
      const bApproved = isFileApproved?.(b.path, b.staged) || false
      if (aApproved === bApproved) return 0
      return aApproved ? 1 : -1  // Non-approved first
    })
  }

  const stagedFiles = sortByApproval(files.filter(f => f.staged))
  const unstagedFiles = sortByApproval(files.filter(f => !f.staged))

  const renderFileItem = (file: ChangedFile) => {
    const isSelected = selectedFile?.path === file.path && selectedFile?.staged === file.staged
    const isApproved = isFileApproved?.(file.path, file.staged) || false
    const fileName = file.path.split('/').pop()
    const dirPath = file.path.split('/').slice(0, -1).join('/')

    return (
      <div
        key={`${file.staged ? 'staged' : 'unstaged'}-${file.path}`}
        className={`file-item ${isSelected ? 'selected' : ''} ${isApproved ? 'approved' : ''}`}
        onClick={() => onSelectFile(file)}
      >
        <span className={`status-badge ${getStatusClass(file.status)}`}>
          {file.status}
        </span>
        <div className="file-info">
          <span className="file-name">
            {fileName}
            {isApproved && (
              <svg className="approved-icon" width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
                <path d="M13.78 4.22a.75.75 0 010 1.06l-7.25 7.25a.75.75 0 01-1.06 0L2.22 9.28a.75.75 0 011.06-1.06L6 10.94l6.72-6.72a.75.75 0 011.06 0z" />
              </svg>
            )}
          </span>
          {dirPath && <span className="file-path">{dirPath}/</span>}
        </div>
      </div>
    )
  }

  if (files.length === 0) {
    return (
      <div className="file-list empty">
        <p>No changes detected</p>
      </div>
    )
  }

  return (
    <div className="file-list">
      {unstagedFiles.length > 0 && (
        <div className="file-section">
          <h3 className="section-header">
            Unstaged Changes
            <span className="count">{unstagedFiles.length}</span>
          </h3>
          {unstagedFiles.map(renderFileItem)}
        </div>
      )}

      {stagedFiles.length > 0 && (
        <div className="file-section">
          <h3 className="section-header">
            Staged Changes
            <span className="count">{stagedFiles.length}</span>
          </h3>
          {stagedFiles.map(renderFileItem)}
        </div>
      )}
    </div>
  )
}
