import { useState, useEffect } from 'react'
import { Comment } from '@/types'

interface CommentThreadProps {
  comment: Comment
  allComments: Comment[]
  onReply: (commentId: number, content: string) => Promise<void>
  onClose: () => void
  position: { x: number; y: number }
  currentUserId?: number
}

export default function CommentThread({
  comment,
  allComments,
  onReply,
  onClose,
  position,
  currentUserId,
}: CommentThreadProps) {
  const [replyContent, setReplyContent] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Get all replies to this comment
  const replies = allComments.filter((c) => c.parent_comment_id === comment.id)

  const handleSubmitReply = async () => {
    if (!replyContent.trim()) return

    setIsSubmitting(true)
    try {
      await onReply(comment.id, replyContent)
      setReplyContent('')
    } catch (err) {
      console.error('Failed to submit reply:', err)
    } finally {
      setIsSubmitting(false)
    }
  }

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`
    return date.toLocaleDateString()
  }

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40" onClick={onClose} />

      {/* Comment Thread Popup */}
      <div
        className="fixed z-50 bg-white rounded-lg shadow-2xl border border-neutral-200 w-96 max-h-[500px] flex flex-col"
        style={{
          left: `${position.x}px`,
          top: `${position.y + 10}px`,
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-neutral-200">
          <h3 className="text-sm font-semibold text-neutral-900">Comment Thread</h3>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-neutral-600 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Selected Text */}
        {comment.selected_text && (
          <div className="p-4 bg-yellow-50 border-b border-yellow-100">
            <p className="text-xs text-neutral-500 mb-1">Selected text:</p>
            <p className="text-sm text-neutral-700 italic">"{comment.selected_text}"</p>
          </div>
        )}

        {/* Comments List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Original Comment */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center">
                <span className="text-xs font-medium text-primary-700">
                  {comment.author_name?.charAt(0) || 'U'}
                </span>
              </div>
              <div>
                <p className="text-sm font-medium text-neutral-900">{comment.author_name || 'Unknown'}</p>
                <p className="text-xs text-neutral-500">{formatTimestamp(comment.created_at)}</p>
              </div>
            </div>
            <div className="ml-10">
              <p className="text-sm text-neutral-700 whitespace-pre-wrap">{comment.content}</p>
            </div>
          </div>

          {/* Replies */}
          {replies.length > 0 && (
            <div className="ml-6 space-y-4 border-l-2 border-neutral-200 pl-4">
              {replies.map((reply) => (
                <div key={reply.id} className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-neutral-100 flex items-center justify-center">
                      <span className="text-xs font-medium text-neutral-600">
                        {reply.author_name?.charAt(0) || 'U'}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-neutral-900">{reply.author_name || 'Unknown'}</p>
                      <p className="text-xs text-neutral-500">{formatTimestamp(reply.created_at)}</p>
                    </div>
                  </div>
                  <div className="ml-9">
                    <p className="text-sm text-neutral-700 whitespace-pre-wrap">{reply.content}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Reply Input */}
        <div className="p-4 border-t border-neutral-200">
          <textarea
            value={replyContent}
            onChange={(e) => setReplyContent(e.target.value)}
            placeholder="Write a reply..."
            className="input-field w-full min-h-[60px] text-sm mb-2 resize-none"
            disabled={isSubmitting}
          />
          <div className="flex justify-end gap-2">
            <button
              onClick={onClose}
              className="btn-ghost text-sm px-4 py-2"
              disabled={isSubmitting}
            >
              Close
            </button>
            <button
              onClick={handleSubmitReply}
              disabled={!replyContent.trim() || isSubmitting}
              className="btn-primary text-sm px-4 py-2"
            >
              {isSubmitting ? 'Sending...' : 'Reply'}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
