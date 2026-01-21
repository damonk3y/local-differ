import { useState, useEffect, useCallback } from 'react'
import { LineComment } from '../types/diff'

interface UseCommentNavigationOptions {
  comments: LineComment[]
  onEditComment?: (comment: LineComment) => void
  enabled?: boolean
}

export function useCommentNavigation({
  comments,
  onEditComment,
  enabled = true
}: UseCommentNavigationOptions) {
  const [focusedIndex, setFocusedIndex] = useState(-1)

  const focusedComment = focusedIndex >= 0 && focusedIndex < comments.length
    ? comments[focusedIndex]
    : null

  // Reset focus when comments change
  useEffect(() => {
    if (comments.length === 0) {
      setFocusedIndex(-1)
    } else if (focusedIndex >= comments.length) {
      setFocusedIndex(comments.length - 1)
    }
  }, [comments.length, focusedIndex])

  const navigateNext = useCallback(() => {
    if (comments.length === 0) return
    setFocusedIndex(prev => {
      if (prev < 0) return 0
      return Math.min(prev + 1, comments.length - 1)
    })
  }, [comments.length])

  const navigatePrev = useCallback(() => {
    if (comments.length === 0) return
    setFocusedIndex(prev => {
      if (prev < 0) return comments.length - 1
      return Math.max(prev - 1, 0)
    })
  }, [comments.length])

  const editFocused = useCallback(() => {
    if (focusedComment && onEditComment) {
      onEditComment(focusedComment)
    }
  }, [focusedComment, onEditComment])

  const clearFocus = useCallback(() => {
    setFocusedIndex(-1)
  }, [])

  // Keyboard event handler
  useEffect(() => {
    if (!enabled) return

    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't handle when typing in inputs
      if (
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLInputElement ||
        (e.target as HTMLElement).isContentEditable
      ) {
        return
      }

      // j or ArrowDown - next comment
      if (e.key === 'j' || e.key === 'ArrowDown') {
        if (comments.length > 0) {
          e.preventDefault()
          navigateNext()
        }
      }

      // k or ArrowUp - previous comment
      if (e.key === 'k' || e.key === 'ArrowUp') {
        if (comments.length > 0) {
          e.preventDefault()
          navigatePrev()
        }
      }

      // e - edit focused comment
      if (e.key === 'e' && focusedComment) {
        e.preventDefault()
        editFocused()
      }

      // Escape - clear focus
      if (e.key === 'Escape' && focusedIndex >= 0) {
        e.preventDefault()
        clearFocus()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [enabled, comments.length, focusedComment, focusedIndex, navigateNext, navigatePrev, editFocused, clearFocus])

  // Scroll focused comment into view
  useEffect(() => {
    if (focusedComment) {
      const element = document.querySelector(`[data-comment-id="${focusedComment.id}"]`)
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }
    }
  }, [focusedComment])

  return {
    focusedComment,
    focusedIndex,
    setFocusedIndex,
    navigateNext,
    navigatePrev,
    editFocused,
    clearFocus
  }
}
