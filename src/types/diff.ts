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

// Enhanced file data for context generation
export interface FileContextData {
  oldContent: string
  newContent: string
  language: string
  status: string // A=Added, D=Deleted, M=Modified, R=Renamed
}

// Context generation options
export interface ContextOptions {
  reviewFocus?: string // User's question or focus area
  includeUncommentedFiles?: boolean // Include files without comments
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
