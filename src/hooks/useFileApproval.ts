import { useState, useCallback } from 'react'

interface ApprovalState {
  approved: boolean
  contentHash: string
}

function hashContent(content: string): string {
  let hash = 0
  for (let i = 0; i < content.length; i++) {
    const char = content.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash
  }
  return hash.toString(36)
}

function getFileKey(filePath: string, staged: boolean): string {
  return `${filePath}:${staged}`
}

export function useFileApproval() {
  const [approvals, setApprovals] = useState<Map<string, ApprovalState>>(new Map())

  const isApproved = useCallback((filePath: string, staged: boolean): boolean => {
    const key = getFileKey(filePath, staged)
    return approvals.get(key)?.approved || false
  }, [approvals])

  const approveFile = useCallback((filePath: string, staged: boolean, oldContent: string, newContent: string) => {
    setApprovals(prev => {
      const newMap = new Map(prev)
      const key = getFileKey(filePath, staged)
      const contentHash = hashContent(oldContent + newContent)
      newMap.set(key, { approved: true, contentHash })
      return newMap
    })
  }, [])

  const unapproveFile = useCallback((filePath: string, staged: boolean) => {
    setApprovals(prev => {
      const newMap = new Map(prev)
      const key = getFileKey(filePath, staged)
      newMap.delete(key)
      return newMap
    })
  }, [])

  const toggleApproval = useCallback((filePath: string, staged: boolean, oldContent: string, newContent: string) => {
    const key = getFileKey(filePath, staged)
    if (approvals.get(key)?.approved) {
      unapproveFile(filePath, staged)
    } else {
      approveFile(filePath, staged, oldContent, newContent)
    }
  }, [approvals, approveFile, unapproveFile])

  const checkAndUpdateApproval = useCallback((filePath: string, staged: boolean, oldContent: string, newContent: string): boolean => {
    const key = getFileKey(filePath, staged)
    const state = approvals.get(key)

    if (!state?.approved) return false

    const currentHash = hashContent(oldContent + newContent)
    if (state.contentHash !== currentHash) {
      // Content changed, auto-unapprove
      setApprovals(prev => {
        const newMap = new Map(prev)
        newMap.delete(key)
        return newMap
      })
      return false
    }

    return true
  }, [approvals])

  const getApprovedCount = useCallback((): number => {
    let count = 0
    approvals.forEach(state => {
      if (state.approved) count++
    })
    return count
  }, [approvals])

  const clearAllApprovals = useCallback(() => {
    setApprovals(new Map())
  }, [])

  const getApprovedFiles = useCallback((): { filePath: string; staged: boolean }[] => {
    const result: { filePath: string; staged: boolean }[] = []
    approvals.forEach((state, key) => {
      if (state.approved) {
        const [filePath, stagedStr] = key.split(':')
        // Handle file paths that might contain colons by rejoining all but the last part
        const parts = key.split(':')
        const staged = parts[parts.length - 1] === 'true'
        const path = parts.slice(0, -1).join(':')
        result.push({ filePath: path, staged })
      }
    })
    return result
  }, [approvals])

  return {
    isApproved,
    approveFile,
    unapproveFile,
    toggleApproval,
    checkAndUpdateApproval,
    getApprovedCount,
    getApprovedFiles,
    clearAllApprovals
  }
}
