import { FileComment, FileContextData, ContextOptions } from '../types/diff'

interface DiffHunk {
  oldStart: number
  oldCount: number
  newStart: number
  newCount: number
  lines: DiffLine[]
}

interface DiffLine {
  type: 'context' | 'add' | 'remove'
  content: string
  oldLineNum?: number
  newLineNum?: number
}

interface StructuralChange {
  type: 'function' | 'class' | 'interface' | 'type' | 'const' | 'export'
  name: string
  action: 'added' | 'removed' | 'modified'
}

interface DiffStats {
  oldLines: number
  newLines: number
  addedLines: number
  removedLines: number
  changedPercent: number
  isMajorRewrite: boolean
}

const STATUS_LABELS: Record<string, string> = {
  'A': 'Added',
  'D': 'Deleted',
  'M': 'Modified',
  'R': 'Renamed',
  'C': 'Copied',
  'U': 'Unmerged',
  'T': 'Type changed',
}

function getStatusLabel(status: string): string {
  return STATUS_LABELS[status] || status
}

/**
 * Calculate diff statistics to determine if this is a major rewrite
 */
function calculateDiffStats(oldContent: string, newContent: string): DiffStats {
  const oldLines = oldContent ? oldContent.split('\n').length : 0
  const newLines = newContent ? newContent.split('\n').length : 0

  const changes = computeDiff(
    oldContent ? oldContent.split('\n') : [],
    newContent ? newContent.split('\n') : []
  )

  let addedLines = 0
  let removedLines = 0

  for (const change of changes) {
    if (change.type === 'insert') addedLines++
    if (change.type === 'delete') removedLines++
  }

  const totalChanged = addedLines + removedLines
  const maxLines = Math.max(oldLines, newLines, 1)
  const changedPercent = (totalChanged / maxLines) * 100

  // Consider it a major rewrite if:
  // - More than 60% of lines changed, OR
  // - File grew/shrunk by more than 3x
  const sizeRatio = oldLines > 0 ? newLines / oldLines : newLines
  const isMajorRewrite = changedPercent > 60 || sizeRatio > 3 || sizeRatio < 0.33

  return { oldLines, newLines, addedLines, removedLines, changedPercent, isMajorRewrite }
}

/**
 * Extract structural elements (functions, classes, interfaces) from code
 */
function extractStructuralElements(content: string, language: string): Map<string, string> {
  const elements = new Map<string, string>()

  if (!content) return elements

  const lines = content.split('\n')

  // Patterns for different structural elements
  const patterns = [
    // TypeScript/JavaScript
    { regex: /^(?:export\s+)?(?:async\s+)?function\s+(\w+)/, type: 'function' },
    { regex: /^(?:export\s+)?const\s+(\w+)\s*=\s*(?:async\s+)?\(/, type: 'function' },
    { regex: /^(?:export\s+)?const\s+(\w+)\s*=\s*(?:async\s+)?function/, type: 'function' },
    { regex: /^(?:export\s+)?class\s+(\w+)/, type: 'class' },
    { regex: /^(?:export\s+)?interface\s+(\w+)/, type: 'interface' },
    { regex: /^(?:export\s+)?type\s+(\w+)\s*=/, type: 'type' },
    { regex: /^(?:export\s+)?enum\s+(\w+)/, type: 'enum' },
    // Rust
    { regex: /^(?:pub\s+)?fn\s+(\w+)/, type: 'function' },
    { regex: /^(?:pub\s+)?struct\s+(\w+)/, type: 'struct' },
    { regex: /^(?:pub\s+)?enum\s+(\w+)/, type: 'enum' },
    { regex: /^(?:pub\s+)?trait\s+(\w+)/, type: 'trait' },
    { regex: /^impl(?:<[^>]+>)?\s+(\w+)/, type: 'impl' },
    // Python
    { regex: /^(?:async\s+)?def\s+(\w+)/, type: 'function' },
    { regex: /^class\s+(\w+)/, type: 'class' },
    // Go
    { regex: /^func\s+(?:\([^)]+\)\s+)?(\w+)/, type: 'function' },
    { regex: /^type\s+(\w+)\s+struct/, type: 'struct' },
    { regex: /^type\s+(\w+)\s+interface/, type: 'interface' },
  ]

  for (const line of lines) {
    const trimmed = line.trim()
    for (const { regex, type } of patterns) {
      const match = trimmed.match(regex)
      if (match) {
        elements.set(match[1], type)
        break
      }
    }
  }

  return elements
}

/**
 * Compare structural elements between old and new content
 */
function getStructuralChanges(oldContent: string, newContent: string, language: string): StructuralChange[] {
  const oldElements = extractStructuralElements(oldContent, language)
  const newElements = extractStructuralElements(newContent, language)
  const changes: StructuralChange[] = []

  // Find removed and modified elements
  for (const [name, type] of oldElements) {
    if (!newElements.has(name)) {
      changes.push({ type: type as StructuralChange['type'], name, action: 'removed' })
    }
  }

  // Find added elements
  for (const [name, type] of newElements) {
    if (!oldElements.has(name)) {
      changes.push({ type: type as StructuralChange['type'], name, action: 'added' })
    }
  }

  return changes
}

/**
 * Generate unified diff with hunks
 */
function generateUnifiedDiff(oldContent: string, newContent: string, contextLines = 3): DiffHunk[] {
  const oldLines = oldContent.split('\n')
  const newLines = newContent.split('\n')
  const changes = computeDiff(oldLines, newLines)
  return createHunks(changes, oldLines, newLines, contextLines)
}

interface DiffChange {
  type: 'equal' | 'insert' | 'delete'
  oldIdx: number
  newIdx: number
  line: string
}

/**
 * LCS-based diff algorithm
 */
function computeDiff(oldLines: string[], newLines: string[]): DiffChange[] {
  const m = oldLines.length
  const n = newLines.length

  const dp: number[][] = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0))

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (oldLines[i - 1] === newLines[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1])
      }
    }
  }

  const changes: DiffChange[] = []
  let i = m, j = n

  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && oldLines[i - 1] === newLines[j - 1]) {
      changes.unshift({ type: 'equal', oldIdx: i - 1, newIdx: j - 1, line: oldLines[i - 1] })
      i--
      j--
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      changes.unshift({ type: 'insert', oldIdx: i - 1, newIdx: j - 1, line: newLines[j - 1] })
      j--
    } else {
      changes.unshift({ type: 'delete', oldIdx: i - 1, newIdx: -1, line: oldLines[i - 1] })
      i--
    }
  }

  return changes
}

/**
 * Group diff changes into hunks with surrounding context
 */
function createHunks(changes: DiffChange[], oldLines: string[], newLines: string[], contextLines: number): DiffHunk[] {
  const hunks: DiffHunk[] = []

  const changeIndices: number[] = []
  changes.forEach((c, idx) => {
    if (c.type !== 'equal') changeIndices.push(idx)
  })

  if (changeIndices.length === 0) return hunks

  let hunkStart = Math.max(0, changeIndices[0] - contextLines)
  let hunkEnd = Math.min(changes.length - 1, changeIndices[0] + contextLines)

  const hunkRanges: Array<[number, number]> = []

  for (let i = 1; i < changeIndices.length; i++) {
    const nextStart = Math.max(0, changeIndices[i] - contextLines)
    const nextEnd = Math.min(changes.length - 1, changeIndices[i] + contextLines)

    if (nextStart <= hunkEnd + 1) {
      hunkEnd = nextEnd
    } else {
      hunkRanges.push([hunkStart, hunkEnd])
      hunkStart = nextStart
      hunkEnd = nextEnd
    }
  }
  hunkRanges.push([hunkStart, hunkEnd])

  for (const [start, end] of hunkRanges) {
    const hunkChanges = changes.slice(start, end + 1)

    let oldLineNum = 1
    let newLineNum = 1

    for (let i = 0; i < start; i++) {
      if (changes[i].type === 'equal' || changes[i].type === 'delete') oldLineNum++
      if (changes[i].type === 'equal' || changes[i].type === 'insert') newLineNum++
    }

    const oldStart = oldLineNum
    const newStart = newLineNum
    let oldCount = 0
    let newCount = 0

    const lines: DiffLine[] = []

    for (const change of hunkChanges) {
      if (change.type === 'equal') {
        lines.push({ type: 'context', content: change.line, oldLineNum, newLineNum })
        oldLineNum++
        newLineNum++
        oldCount++
        newCount++
      } else if (change.type === 'delete') {
        lines.push({ type: 'remove', content: change.line, oldLineNum })
        oldLineNum++
        oldCount++
      } else if (change.type === 'insert') {
        lines.push({ type: 'add', content: change.line, newLineNum })
        newLineNum++
        newCount++
      }
    }

    hunks.push({ oldStart, oldCount, newStart, newCount, lines })
  }

  return hunks
}

/**
 * Format a hunk as clean diff text (new line numbers only for additions)
 */
function formatHunk(hunk: DiffHunk): string[] {
  const lines: string[] = []
  lines.push(`@@ -${hunk.oldStart},${hunk.oldCount} +${hunk.newStart},${hunk.newCount} @@`)

  for (const line of hunk.lines) {
    if (line.type === 'add') {
      lines.push(`${String(line.newLineNum).padStart(4)} + ${line.content}`)
    } else if (line.type === 'remove') {
      lines.push(`     - ${line.content}`)
    } else {
      lines.push(`${String(line.newLineNum).padStart(4)}   ${line.content}`)
    }
  }

  return lines
}

/**
 * Get lines around a specific line number from content
 */
function getContextAroundLine(content: string, lineNum: number, contextSize = 2): string[] {
  const lines = content.split('\n')
  const start = Math.max(0, lineNum - 1 - contextSize)
  const end = Math.min(lines.length, lineNum + contextSize)

  const result: string[] = []
  for (let i = start; i < end; i++) {
    const num = i + 1
    const marker = num === lineNum ? '>' : ' '
    result.push(`${marker} ${String(num).padStart(4)} | ${lines[i]}`)
  }
  return result
}

/**
 * Format structural changes as a readable list
 */
function formatStructuralChanges(changes: StructuralChange[]): string[] {
  if (changes.length === 0) return []

  const lines: string[] = ['### Structural Changes', '']

  const added = changes.filter(c => c.action === 'added')
  const removed = changes.filter(c => c.action === 'removed')

  if (removed.length > 0) {
    lines.push(`**Removed:** ${removed.map(c => `\`${c.name}\` (${c.type})`).join(', ')}`)
  }
  if (added.length > 0) {
    lines.push(`**Added:** ${added.map(c => `\`${c.name}\` (${c.type})`).join(', ')}`)
  }

  lines.push('')
  return lines
}

export function generateContextMarkdown(
  comments: FileComment[],
  fileDataMap: Map<string, FileContextData>,
  options: ContextOptions = {}
): string {
  const { reviewFocus } = options

  const allFiles: Array<{ comment: FileComment | null; data: FileContextData | null; key: string }> = []

  for (const comment of comments) {
    const key = `${comment.filePath}:${comment.staged}`
    const data = fileDataMap.get(key) || null
    allFiles.push({ comment, data, key })
  }

  if (allFiles.length === 0) {
    return '# Code Review Context\n\nNo files to review.'
  }

  const lines: string[] = [
    '# Code Review Context',
    '',
    '> **Instructions:** Please review the code changes and comments below. Your goal is to **fix the issues described** in the comments. Enter **plan mode** first to analyze the changes and create an implementation plan before making any modifications.',
    '',
  ]

  // Summary table
  lines.push('## Summary')
  lines.push('')
  lines.push('| File | Status | Stage | Comments | Language |')
  lines.push('|------|--------|-------|----------|----------|')

  for (const { comment, data, key } of allFiles) {
    const [filePath, stagedStr] = key.split(':')
    const staged = stagedStr === 'true'
    const status = data?.status ? getStatusLabel(data.status) : 'Unknown'
    const stage = staged ? 'Staged' : 'Unstaged'
    const commentCount = comment?.lineComments.length || 0
    const generalNote = comment?.generalComment ? 1 : 0
    const totalComments = commentCount + generalNote
    const language = data?.language || 'text'

    lines.push(`| \`${filePath}\` | ${status} | ${stage} | ${totalComments} | ${language} |`)
  }
  lines.push('')

  if (reviewFocus) {
    lines.push('## Review Focus')
    lines.push('')
    lines.push(reviewFocus)
    lines.push('')
  }

  lines.push('---')
  lines.push('')

  // File sections
  for (const { comment, data, key } of allFiles) {
    const [filePath, stagedStr] = key.split(':')
    const staged = stagedStr === 'true'
    const status = data?.status ? getStatusLabel(data.status) : ''
    const statusStr = status ? ` (${status})` : ''
    const stageStr = staged ? 'Staged' : 'Unstaged'
    const language = data?.language || 'text'

    // Calculate diff stats
    const stats = data ? calculateDiffStats(data.oldContent, data.newContent) : null

    // Build header with stats
    let header = `## ${filePath}${statusStr}`
    if (stats && stats.isMajorRewrite) {
      header += ' - **Major Rewrite**'
    }
    lines.push(header)

    // Metadata line
    let metaLine = `**Stage:** ${stageStr} | **Language:** ${language}`
    if (stats) {
      metaLine += ` | **Lines:** ${stats.oldLines} → ${stats.newLines}`
      if (stats.addedLines > 0) metaLine += ` (+${stats.addedLines})`
      if (stats.removedLines > 0) metaLine += ` (-${stats.removedLines})`
    }
    lines.push(metaLine)
    lines.push('')

    // File-level notes
    if (comment?.generalComment) {
      lines.push('### Notes')
      lines.push(comment.generalComment)
      lines.push('')
    }

    // Generate content based on whether it's a major rewrite or normal change
    if (data && (data.oldContent || data.newContent)) {
      const lineComments = comment?.lineComments || []

      if (stats?.isMajorRewrite) {
        // Major rewrite: show structural changes + key sections
        const structuralChanges = getStructuralChanges(data.oldContent, data.newContent, language)
        if (structuralChanges.length > 0) {
          lines.push(...formatStructuralChanges(structuralChanges))
        }

        // For major rewrites, show the new file content with line numbers
        // but only if it's not too large (< 100 lines), otherwise summarize
        const newLines = data.newContent.split('\n')

        if (newLines.length <= 100) {
          lines.push('### New Content')
          lines.push(`\`\`\`${language}`)
          newLines.forEach((line, idx) => {
            lines.push(`${String(idx + 1).padStart(4)} | ${line}`)
          })
          lines.push('```')
          lines.push('')
        } else {
          lines.push('### Content Preview')
          lines.push(`*File has ${newLines.length} lines. Showing first 50 lines:*`)
          lines.push(`\`\`\`${language}`)
          newLines.slice(0, 50).forEach((line, idx) => {
            lines.push(`${String(idx + 1).padStart(4)} | ${line}`)
          })
          lines.push('```')
          lines.push(`*... ${newLines.length - 50} more lines*`)
          lines.push('')
        }

        // Show comments with context from new content
        if (lineComments.length > 0) {
          lines.push('### Comments')
          lines.push('')
          for (const lc of lineComments.sort((a, b) => a.startLine - b.startLine)) {
            const lineLabel = lc.startLine === lc.endLine
              ? `Line ${lc.startLine}`
              : `Lines ${lc.startLine}-${lc.endLine}`
            lines.push(`**${lineLabel}:** ${lc.text}`)
            lines.push('```')
            const contextContent = lc.side === 'new' ? data.newContent : data.oldContent
            lines.push(...getContextAroundLine(contextContent, lc.startLine))
            lines.push('```')
            lines.push('')
          }
        }
      } else {
        // Normal change: show hunked diff
        const hunks = generateUnifiedDiff(data.oldContent, data.newContent)

        if (hunks.length === 0 && data.newContent && !data.oldContent) {
          // New file
          lines.push('### New File')
          lines.push(`\`\`\`${language}`)
          const contentLines = data.newContent.split('\n')
          contentLines.forEach((line, idx) => {
            lines.push(`${String(idx + 1).padStart(4)} | ${line}`)
          })
          lines.push('```')
          lines.push('')
        } else if (hunks.length > 0) {
          lines.push('### Changes')
          lines.push('')

          for (const hunk of hunks) {
            lines.push('```diff')
            lines.push(...formatHunk(hunk))
            lines.push('```')

            // Find comments in this hunk range
            const hunkNewEnd = hunk.newStart + hunk.newCount - 1
            const hunkComments = lineComments.filter(lc => {
              if (lc.side === 'new') {
                return lc.startLine >= hunk.newStart && lc.startLine <= hunkNewEnd
              }
              const hunkOldEnd = hunk.oldStart + hunk.oldCount - 1
              return lc.startLine >= hunk.oldStart && lc.startLine <= hunkOldEnd
            }).sort((a, b) => a.startLine - b.startLine)

            for (const lc of hunkComments) {
              const lineLabel = lc.startLine === lc.endLine
                ? `Line ${lc.startLine}`
                : `Lines ${lc.startLine}-${lc.endLine}`
              const sideLabel = lc.side === 'new' ? '' : ' (removed)'
              lines.push(`> **${lineLabel}${sideLabel}:** ${lc.text}`)
              lines.push('')
            }
          }

          // Comments outside of hunks
          const allHunkRanges = hunks.map(h => ({
            oldStart: h.oldStart,
            oldEnd: h.oldStart + h.oldCount - 1,
            newStart: h.newStart,
            newEnd: h.newStart + h.newCount - 1
          }))

          const uncoveredComments = lineComments.filter(lc => {
            return !allHunkRanges.some(range => {
              if (lc.side === 'new') {
                return lc.startLine >= range.newStart && lc.startLine <= range.newEnd
              }
              return lc.startLine >= range.oldStart && lc.startLine <= range.oldEnd
            })
          })

          if (uncoveredComments.length > 0) {
            lines.push('### Other Comments')
            lines.push('')
            for (const lc of uncoveredComments.sort((a, b) => a.startLine - b.startLine)) {
              const lineLabel = lc.startLine === lc.endLine
                ? `Line ${lc.startLine}`
                : `Lines ${lc.startLine}-${lc.endLine}`
              lines.push(`**${lineLabel}:** ${lc.text}`)
              const contextContent = lc.side === 'new' ? data.newContent : data.oldContent
              if (contextContent) {
                lines.push('```')
                lines.push(...getContextAroundLine(contextContent, lc.startLine))
                lines.push('```')
              }
              lines.push('')
            }
          }
        }
      }
    } else if (comment && comment.lineComments.length > 0) {
      // No file data but have comments
      lines.push('### Comments')
      for (const lc of comment.lineComments.sort((a, b) => a.startLine - b.startLine)) {
        const lineLabel = lc.startLine === lc.endLine
          ? `Line ${lc.startLine}`
          : `Lines ${lc.startLine}-${lc.endLine}`
        lines.push(`**${lineLabel}:** ${lc.text}`)
        if (lc.lineContents && lc.lineContents.length > 0) {
          lines.push('```')
          lines.push(lc.lineContents.join('\n'))
          lines.push('```')
        }
        lines.push('')
      }
    }

    lines.push('---')
    lines.push('')
  }

  return lines.join('\n')
}
