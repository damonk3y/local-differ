import { useState, useCallback, useEffect, useRef } from 'react'
import { FileComment, LineComment, StoredComments } from '../types/diff'

const STORAGE_KEY = 'local-differ-comments'
const STORAGE_VERSION = 2

function generateId(): string {
  return Math.random().toString(36).substring(2, 9)
}

function getFileKey(filePath: string, staged: boolean): string {
  return `${filePath}:${staged}`
}

// Migrate old comment format (lineNumber) to new format (startLine/endLine)
function migrateComment(comment: any): LineComment {
  if ('lineNumber' in comment && !('startLine' in comment)) {
    return {
      id: comment.id,
      startLine: comment.lineNumber,
      endLine: comment.lineNumber,
      lineContent: comment.lineContent,
      lineContents: [comment.lineContent],
      side: comment.side,
      text: comment.text,
      createdAt: comment.createdAt || Date.now(),
      updatedAt: comment.updatedAt || Date.now()
    }
  }
  return comment as LineComment
}

function migrateFileComment(fc: any): FileComment {
  return {
    ...fc,
    lineComments: fc.lineComments.map(migrateComment)
  }
}

function loadFromStorage(): Map<string, FileComment> {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) return new Map()

    const data: StoredComments = JSON.parse(stored)

    // Handle version migrations
    if (data.version < STORAGE_VERSION) {
      const migratedComments: Record<string, FileComment> = {}
      for (const [key, fc] of Object.entries(data.comments)) {
        migratedComments[key] = migrateFileComment(fc)
      }
      return new Map(Object.entries(migratedComments))
    }

    return new Map(Object.entries(data.comments))
  } catch (e) {
    console.error('Failed to load comments from storage:', e)
    return new Map()
  }
}

function saveToStorage(comments: Map<string, FileComment>): void {
  try {
    const data: StoredComments = {
      version: STORAGE_VERSION,
      comments: Object.fromEntries(comments),
      lastModified: Date.now()
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  } catch (e) {
    console.error('Failed to save comments to storage:', e)
  }
}

export function useComments() {
  const [comments, setComments] = useState<Map<string, FileComment>>(() => loadFromStorage())
  const saveTimeoutRef = useRef<number | null>(null)

  // Debounced save to localStorage
  useEffect(() => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
    }

    saveTimeoutRef.current = window.setTimeout(() => {
      saveToStorage(comments)
    }, 500)

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
    }
  }, [comments])

  const getFileComments = useCallback((filePath: string, staged: boolean): FileComment | undefined => {
    return comments.get(getFileKey(filePath, staged))
  }, [comments])

  const addLineComment = useCallback((
    filePath: string,
    staged: boolean,
    startLine: number,
    endLine: number,
    side: 'old' | 'new',
    lineContent: string,
    lineContents: string[],
    text: string
  ) => {
    const now = Date.now()
    setComments(prev => {
      const newMap = new Map(prev)
      const key = getFileKey(filePath, staged)
      const existing = newMap.get(key)

      const newComment: LineComment = {
        id: generateId(),
        startLine,
        endLine,
        lineContent,
        lineContents,
        side,
        text,
        createdAt: now,
        updatedAt: now
      }

      if (existing) {
        newMap.set(key, {
          ...existing,
          lineComments: [...existing.lineComments, newComment]
        })
      } else {
        newMap.set(key, {
          filePath,
          staged,
          generalComment: '',
          lineComments: [newComment]
        })
      }

      return newMap
    })
  }, [])

  const updateLineComment = useCallback((
    filePath: string,
    staged: boolean,
    commentId: string,
    newText: string
  ) => {
    setComments(prev => {
      const newMap = new Map(prev)
      const key = getFileKey(filePath, staged)
      const existing = newMap.get(key)

      if (existing) {
        newMap.set(key, {
          ...existing,
          lineComments: existing.lineComments.map(c =>
            c.id === commentId ? { ...c, text: newText, updatedAt: Date.now() } : c
          )
        })
      }

      return newMap
    })
  }, [])

  const removeLineComment = useCallback((filePath: string, staged: boolean, commentId: string) => {
    setComments(prev => {
      const newMap = new Map(prev)
      const key = getFileKey(filePath, staged)
      const existing = newMap.get(key)

      if (existing) {
        const newLineComments = existing.lineComments.filter(c => c.id !== commentId)

        if (newLineComments.length === 0 && !existing.generalComment) {
          newMap.delete(key)
        } else {
          newMap.set(key, {
            ...existing,
            lineComments: newLineComments
          })
        }
      }

      return newMap
    })
  }, [])

  const setFileComment = useCallback((filePath: string, staged: boolean, text: string) => {
    setComments(prev => {
      const newMap = new Map(prev)
      const key = getFileKey(filePath, staged)
      const existing = newMap.get(key)

      if (existing) {
        if (!text && existing.lineComments.length === 0) {
          newMap.delete(key)
        } else {
          newMap.set(key, {
            ...existing,
            generalComment: text
          })
        }
      } else if (text) {
        newMap.set(key, {
          filePath,
          staged,
          generalComment: text,
          lineComments: []
        })
      }

      return newMap
    })
  }, [])

  const getAllComments = useCallback((): FileComment[] => {
    return Array.from(comments.values())
  }, [comments])

  const getTotalCommentCount = useCallback((): number => {
    let count = 0
    comments.forEach(fc => {
      if (fc.generalComment) count++
      count += fc.lineComments.length
    })
    return count
  }, [comments])

  const clearAllComments = useCallback(() => {
    setComments(new Map())
    localStorage.removeItem(STORAGE_KEY)
  }, [])

  return {
    getFileComments,
    addLineComment,
    updateLineComment,
    removeLineComment,
    setFileComment,
    getAllComments,
    getTotalCommentCount,
    clearAllComments
  }
}
