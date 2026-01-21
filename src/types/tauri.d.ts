export interface Settings {
  projectPath: string | null
}

export interface RepoResult {
  success: boolean
  path?: string
  error?: string
}

export interface FileStatus {
  status: string
  path: string
}

export interface ChangedFiles {
  staged: FileStatus[]
  unstaged: FileStatus[]
}

export interface DiffResult {
  staged: string
  unstaged: string
}
