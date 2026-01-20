import { exec } from 'child_process'
import { promisify } from 'util'
import * as fs from 'fs/promises'
import * as path from 'path'

const execAsync = promisify(exec)

export class GitService {
  private repoPath: string

  constructor(repoPath: string) {
    this.repoPath = repoPath
  }

  async isGitRepo(): Promise<boolean> {
    try {
      await this.exec('git rev-parse --is-inside-work-tree')
      return true
    } catch {
      return false
    }
  }

  async getFullDiff(): Promise<{ staged: string; unstaged: string }> {
    const [staged, unstaged] = await Promise.all([
      this.exec('git diff --cached'),
      this.exec('git diff')
    ])
    return { staged, unstaged }
  }

  async getChangedFiles(): Promise<{
    staged: Array<{ status: string; path: string }>
    unstaged: Array<{ status: string; path: string }>
  }> {
    const [stagedOutput, unstagedOutput] = await Promise.all([
      this.exec('git diff --cached --name-status'),
      this.exec('git diff --name-status')
    ])

    return {
      staged: this.parseNameStatus(stagedOutput),
      unstaged: this.parseNameStatus(unstagedOutput)
    }
  }

  async getFileContent(filePath: string, ref: string = 'HEAD'): Promise<string> {
    try {
      if (ref === 'working') {
        return await fs.readFile(path.join(this.repoPath, filePath), 'utf-8')
      }
      if (ref === 'index') {
        return await this.exec(`git show :"${filePath}"`)
      }
      return await this.exec(`git show ${ref}:"${filePath}"`)
    } catch {
      return ''
    }
  }

  async getFileDiff(filePath: string, staged: boolean = false): Promise<string> {
    const flag = staged ? '--cached' : ''
    return this.exec(`git diff ${flag} -- "${filePath}"`)
  }

  private async exec(command: string): Promise<string> {
    try {
      const { stdout } = await execAsync(command, {
        cwd: this.repoPath,
        maxBuffer: 10 * 1024 * 1024
      })
      return stdout
    } catch (error) {
      if (error instanceof Error && 'stdout' in error) {
        return (error as { stdout: string }).stdout || ''
      }
      throw error
    }
  }

  private parseNameStatus(output: string): Array<{ status: string; path: string }> {
    return output
      .trim()
      .split('\n')
      .filter(Boolean)
      .map(line => {
        const [status, ...pathParts] = line.split('\t')
        return { status, path: pathParts.join('\t') }
      })
  }
}
