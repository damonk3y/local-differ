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

export interface LineComment {
  id: string
  startLine: number
  endLine: number
  lineContent: string
  lineContents?: string[]
  side: 'old' | 'new'
  text: string
  createdAt: number
  updatedAt: number
}

// Storage format for localStorage persistence
export interface StoredComments {
  version: number
  comments: Record<string, FileComment>
  lastModified: number
}

export interface FileComment {
  filePath: string
  staged: boolean
  generalComment: string
  lineComments: LineComment[]
}
