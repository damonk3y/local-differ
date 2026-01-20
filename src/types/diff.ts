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
  lineNumber: number
  lineContent: string
  side: 'old' | 'new'
  text: string
}

export interface FileComment {
  filePath: string
  staged: boolean
  generalComment: string
  lineComments: LineComment[]
}
