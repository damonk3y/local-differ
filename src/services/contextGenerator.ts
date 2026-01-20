import { FileComment, FileChange } from '../types/diff'

interface FileData {
  oldContent: string
  newContent: string
}

export function generateContextMarkdown(
  comments: FileComment[],
  fileDataMap: Map<string, FileData>
): string {
  if (comments.length === 0) {
    return '# Code Review Context\n\nNo comments have been added yet.'
  }

  const lines: string[] = ['# Code Review Context', '']

  for (const fileComment of comments) {
    const statusLabel = fileComment.staged ? 'Staged' : 'Unstaged'
    lines.push(`## File: ${fileComment.filePath} (${statusLabel})`)
    lines.push('')

    // File-level notes
    if (fileComment.generalComment) {
      lines.push('### File Notes')
      lines.push(fileComment.generalComment)
      lines.push('')
    }

    // Get diff for this file if available
    const fileKey = `${fileComment.filePath}:${fileComment.staged}`
    const fileData = fileDataMap.get(fileKey)

    if (fileData && (fileData.oldContent || fileData.newContent)) {
      lines.push('### Changes')
      lines.push('```diff')

      const diffLines = generateSimpleDiff(fileData.oldContent, fileData.newContent)
      lines.push(...diffLines)

      lines.push('```')
      lines.push('')
    }

    // Line comments
    if (fileComment.lineComments.length > 0) {
      lines.push('### Line Comments')
      lines.push('')

      // Sort comments by line number
      const sortedComments = [...fileComment.lineComments].sort(
        (a, b) => a.lineNumber - b.lineNumber
      )

      for (const comment of sortedComments) {
        const changeType = comment.side === 'new' ? 'added' : 'removed'
        lines.push(`**Line ${comment.lineNumber} (${changeType}):** ${comment.text}`)
        if (comment.lineContent) {
          lines.push(`\`\`\``)
          lines.push(comment.lineContent)
          lines.push(`\`\`\``)
        }
        lines.push('')
      }
    }

    lines.push('---')
    lines.push('')
  }

  return lines.join('\n')
}

function generateSimpleDiff(oldContent: string, newContent: string): string[] {
  const oldLines = oldContent.split('\n')
  const newLines = newContent.split('\n')
  const result: string[] = []

  // Simple line-by-line diff
  const maxLines = Math.max(oldLines.length, newLines.length)
  let i = 0
  let j = 0

  while (i < oldLines.length || j < newLines.length) {
    if (i >= oldLines.length) {
      // Remaining new lines
      result.push(`+ ${newLines[j]}`)
      j++
    } else if (j >= newLines.length) {
      // Remaining old lines
      result.push(`- ${oldLines[i]}`)
      i++
    } else if (oldLines[i] === newLines[j]) {
      // Unchanged line
      result.push(`  ${oldLines[i]}`)
      i++
      j++
    } else {
      // Changed lines - look ahead to find best match
      const oldInNew = newLines.indexOf(oldLines[i], j)
      const newInOld = oldLines.indexOf(newLines[j], i)

      if (oldInNew === -1 && newInOld === -1) {
        // Both lines changed
        result.push(`- ${oldLines[i]}`)
        result.push(`+ ${newLines[j]}`)
        i++
        j++
      } else if (oldInNew !== -1 && (newInOld === -1 || oldInNew - j < newInOld - i)) {
        // Old line exists later in new, so new lines were added
        result.push(`+ ${newLines[j]}`)
        j++
      } else {
        // New line exists later in old, so old lines were removed
        result.push(`- ${oldLines[i]}`)
        i++
      }
    }
  }

  return result
}
