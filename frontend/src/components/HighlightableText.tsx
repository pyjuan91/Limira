import { useState, useEffect, useRef } from 'react'
import { Comment } from '@/types'

interface TextSegment {
  text: string
  commentId?: number
  isHighlight: boolean
  start: number
  end: number
}

interface HighlightableTextProps {
  text: string
  comments: Comment[]
  onTextSelect: (text: string, start: number, end: number) => void
  onHighlightClick: (commentId: number, position: { x: number; y: number }) => void
  className?: string
}

export default function HighlightableText({
  text,
  comments,
  onTextSelect,
  onHighlightClick,
  className = '',
}: HighlightableTextProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  // Convert text and comments into segments with highlights
  const getTextSegments = (): TextSegment[] => {
    // Get only top-level comments with text selection (not replies)
    const highlightComments = comments.filter(
      (c) => c.selected_text && c.selection_start != null && c.selection_end != null && !c.parent_comment_id
    )

    if (highlightComments.length === 0) {
      return [{ text, commentId: undefined, isHighlight: false, start: 0, end: text.length }]
    }

    // Sort comments by start position
    const sortedComments = [...highlightComments].sort((a, b) => a.selection_start! - b.selection_start!)

    const segments: TextSegment[] = []
    let currentPos = 0

    for (const comment of sortedComments) {
      const start = comment.selection_start!
      const end = comment.selection_end!

      // Add non-highlighted text before this comment
      if (currentPos < start) {
        segments.push({
          text: text.substring(currentPos, start),
          commentId: undefined,
          isHighlight: false,
          start: currentPos,
          end: start,
        })
      }

      // Add highlighted text
      segments.push({
        text: text.substring(start, end),
        commentId: comment.id,
        isHighlight: true,
        start,
        end,
      })

      currentPos = end
    }

    // Add remaining text
    if (currentPos < text.length) {
      segments.push({
        text: text.substring(currentPos),
        commentId: undefined,
        isHighlight: false,
        start: currentPos,
        end: text.length,
      })
    }

    return segments
  }

  const handleMouseUp = () => {
    const selection = window.getSelection()
    const selectedText = selection?.toString().trim()

    if (!selectedText || selectedText.length === 0) return

    // Get selection position in the text
    if (!containerRef.current) return

    const range = selection?.getRangeAt(0)
    if (!range) return

    // Calculate start and end positions relative to the container
    const preSelectionRange = range.cloneRange()
    preSelectionRange.selectNodeContents(containerRef.current)
    preSelectionRange.setEnd(range.startContainer, range.startOffset)
    const start = preSelectionRange.toString().length

    const end = start + selectedText.length

    onTextSelect(selectedText, start, end)

    // Clear selection
    selection?.removeAllRanges()
  }

  const handleHighlightClick = (commentId: number, event: React.MouseEvent) => {
    const rect = (event.target as HTMLElement).getBoundingClientRect()
    onHighlightClick(commentId, {
      x: rect.left,
      y: rect.bottom + window.scrollY,
    })
  }

  const segments = getTextSegments()

  return (
    <div
      ref={containerRef}
      className={`whitespace-pre-wrap select-text ${className}`}
      onMouseUp={handleMouseUp}
    >
      {segments.map((segment, index) =>
        segment.isHighlight ? (
          <span
            key={index}
            className="bg-yellow-200 cursor-pointer hover:bg-yellow-300 transition-colors"
            onClick={(e) => handleHighlightClick(segment.commentId!, e)}
            title="Click to view comments"
          >
            {segment.text}
          </span>
        ) : (
          <span key={index}>{segment.text}</span>
        )
      )}
    </div>
  )
}
