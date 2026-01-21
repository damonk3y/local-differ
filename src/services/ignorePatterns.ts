/**
 * Simple ignore pattern matching for .ldignore files
 * Supports:
 * - Exact file/directory names
 * - Glob patterns with * wildcard
 * - Directory patterns ending with /
 * - Comments starting with #
 */

export function parseIgnorePatterns(content: string): string[] {
  return content
    .split('\n')
    .map(line => line.trim())
    .filter(line => line && !line.startsWith('#'))
}

// Escape all special regex characters including *
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

export function matchesIgnorePattern(filePath: string, pattern: string): boolean {
  // Normalize pattern - remove trailing slash
  const normalizedPattern = pattern.replace(/\/$/, '')

  // Direct match
  if (filePath === normalizedPattern) {
    return true
  }

  // Directory prefix match (e.g., ".claude" or ".claude/" matches ".claude/foo/bar")
  if (filePath.startsWith(normalizedPattern + '/')) {
    return true
  }

  // Glob pattern with * (e.g., "*.skill")
  if (pattern.includes('*')) {
    const regex = new RegExp(
      '^' + escapeRegex(pattern).replace(/\\\*/g, '.*') + '$'
    )
    // Match against full path and also just the filename
    const fileName = filePath.split('/').pop() || ''
    return regex.test(filePath) || regex.test(fileName)
  }

  return false
}

export function shouldIgnoreFile(filePath: string, patterns: string[]): boolean {
  return patterns.some(pattern => matchesIgnorePattern(filePath, pattern))
}
