export interface ChangedFile {
  status: string
  path: string
  staged: boolean
}

export interface FileChange {
  oldContent: string
  newContent: string
  language: string
}

export type ViewMode = 'split' | 'unified'
