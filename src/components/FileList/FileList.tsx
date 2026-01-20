import { ChangedFile } from '../../types/diff'
import './FileList.css'

interface FileListProps {
  files: ChangedFile[]
  selectedFile: ChangedFile | null
  onSelectFile: (file: ChangedFile) => void
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

export function FileList({ files, selectedFile, onSelectFile }: FileListProps) {
  const stagedFiles = files.filter(f => f.staged)
  const unstagedFiles = files.filter(f => !f.staged)

  const renderFileItem = (file: ChangedFile) => {
    const isSelected = selectedFile?.path === file.path && selectedFile?.staged === file.staged
    const fileName = file.path.split('/').pop()
    const dirPath = file.path.split('/').slice(0, -1).join('/')

    return (
      <div
        key={`${file.staged ? 'staged' : 'unstaged'}-${file.path}`}
        className={`file-item ${isSelected ? 'selected' : ''}`}
        onClick={() => onSelectFile(file)}
      >
        <span className={`status-badge ${getStatusClass(file.status)}`}>
          {file.status}
        </span>
        <div className="file-info">
          <span className="file-name">{fileName}</span>
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
      {stagedFiles.length > 0 && (
        <div className="file-section">
          <h3 className="section-header">
            Staged Changes
            <span className="count">{stagedFiles.length}</span>
          </h3>
          {stagedFiles.map(renderFileItem)}
        </div>
      )}

      {unstagedFiles.length > 0 && (
        <div className="file-section">
          <h3 className="section-header">
            Unstaged Changes
            <span className="count">{unstagedFiles.length}</span>
          </h3>
          {unstagedFiles.map(renderFileItem)}
        </div>
      )}
    </div>
  )
}
