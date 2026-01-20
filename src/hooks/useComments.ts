import { useState, useCallback } from 'react'
import { FileComment, LineComment } from '../types/diff'

function generateId(): string {
  return Math.random().toString(36).substring(2, 9)
}

function getFileKey(filePath: string, staged: boolean): string {
  return `${filePath}:${staged}`
}

export function useComments() {
  const [comments, setComments] = useState<Map<string, FileComment>>(new Map())

  const getFileComments = useCallback((filePath: string, staged: boolean): FileComment | undefined => {
    return comments.get(getFileKey(filePath, staged))
  }, [comments])

  const addLineComment = useCallback((
    filePath: string,
    staged: boolean,
    lineNumber: number,
    side: 'old' | 'new',
    lineContent: string,
    text: string
  ) => {
    setComments(prev => {
      const newMap = new Map(prev)
      const key = getFileKey(filePath, staged)
      const existing = newMap.get(key)

      const newComment: LineComment = {
        id: generateId(),
        lineNumber,
        lineContent,
        side,
        text
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
            c.id === commentId ? { ...c, text: newText } : c
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
