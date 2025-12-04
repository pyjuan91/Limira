import { useState, useEffect, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { disclosureService } from '@/services/disclosureService'
import { commentService } from '@/services/commentService'
import { Disclosure, Comment } from '@/types'

// Helper function to generate AI patent template from disclosure
const generatePatentTemplate = (disclosure: Disclosure): string => {
  const content = disclosure.content

  return `PATENT APPLICATION

Title: ${disclosure.title}

BACKGROUND OF THE INVENTION

Field of the Invention
[AI Generated] This invention relates to ${content.technical_details || 'the field of technology'}. More particularly, it relates to innovative solutions for ${content.problem || 'technical challenges in the industry'}.

Description of Related Art
${content.prior_art || '[AI Generated] Prior art in this field has addressed similar problems through various approaches, but limitations remain in terms of efficiency, cost, and scalability.'}

SUMMARY OF THE INVENTION

Brief Summary
[AI Generated] The present invention provides a novel solution to ${content.problem || 'existing technical problems'} through ${content.solution || 'innovative technical means'}.

The invention achieves the following advantages:
${content.advantages || '[AI Generated] 1. Improved efficiency\n2. Reduced cost\n3. Enhanced scalability\n4. Better user experience'}

DETAILED DESCRIPTION OF THE INVENTION

Technical Problem
${content.problem || '[AI Generated] The technical problem addressed by this invention involves...'}

Technical Solution
${content.solution || '[AI Generated] The present invention solves the aforementioned problem by...'}

Technical Details
${content.technical_details || '[AI Generated] The invention comprises the following technical components and features...'}

Advantages and Effects
${content.advantages || '[AI Generated] The present invention provides significant advantages over prior art...'}

CLAIMS

1. [AI Generated] A method/system/apparatus for ${disclosure.title.toLowerCase()}, comprising:
   (a) [technical feature 1]
   (b) [technical feature 2]
   (c) [technical feature 3]

2. [AI Generated] The method/system/apparatus of claim 1, wherein...

3. [AI Generated] The method/system/apparatus of claim 1 or 2, further comprising...

ABSTRACT

[AI Generated] The present invention relates to ${disclosure.title.toLowerCase()}. The invention addresses ${content.problem || 'technical challenges'} by providing ${content.solution || 'innovative solutions'}, resulting in ${content.advantages || 'significant improvements'}.

---
[End of AI Generated Patent Draft]
[Last updated: ${new Date().toLocaleString()}]
`
}

export default function InventorDisclosureDetail() {
  const { id } = useParams<{ id: string }>()
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const [disclosure, setDisclosure] = useState<Disclosure | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  // Patent draft (read-only)
  const [patentDraft, setPatentDraft] = useState('')

  // Text selection for commenting
  const [selectedText, setSelectedText] = useState('')
  const [showCommentDialog, setShowCommentDialog] = useState(false)
  const [commentContent, setCommentContent] = useState('')

  // Chat with attorney
  const [comments, setComments] = useState<Comment[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [isSendingMessage, setIsSendingMessage] = useState(false)
  const chatEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (id) {
      loadDisclosure()
      loadComments()
    }
  }, [id])

  useEffect(() => {
    // Scroll to bottom when new messages arrive
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [comments])

  const loadDisclosure = async () => {
    if (!id) return

    try {
      const data = await disclosureService.getById(parseInt(id))
      setDisclosure(data)

      // Generate AI patent template
      const template = generatePatentTemplate(data)
      setPatentDraft(template)
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load disclosure')
    } finally {
      setIsLoading(false)
    }
  }

  const loadComments = async () => {
    if (!id) return

    try {
      const data = await commentService.getComments(parseInt(id))
      setComments(data)
    } catch (err: any) {
      console.error('Failed to load comments:', err)
    }
  }

  const handleTextSelection = () => {
    const selection = window.getSelection()
    const text = selection?.toString().trim()

    if (text && text.length > 0) {
      setSelectedText(text)
      setShowCommentDialog(true)
    }
  }

  const handleAddComment = async () => {
    if (!commentContent.trim() || !id) return

    try {
      const fullComment = selectedText
        ? `[Comment on: "${selectedText}"]\n\n${commentContent}`
        : commentContent

      await commentService.createComment(parseInt(id), {
        content: fullComment,
      })

      // Reload comments
      await loadComments()

      // Reset
      setCommentContent('')
      setSelectedText('')
      setShowCommentDialog(false)
    } catch (err: any) {
      alert('Failed to add comment: ' + (err.response?.data?.detail || 'Unknown error'))
    }
  }

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !id) return

    setIsSendingMessage(true)
    try {
      await commentService.createComment(parseInt(id), {
        content: newMessage,
      })

      // Reload comments
      await loadComments()

      // Reset
      setNewMessage('')
    } catch (err: any) {
      alert('Failed to send message: ' + (err.response?.data?.detail || 'Unknown error'))
    } finally {
      setIsSendingMessage(false)
    }
  }

  const handleLogout = () => {
    logout()
    navigate('/welcome')
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-neutral-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-neutral-600">Loading disclosure...</p>
        </div>
      </div>
    )
  }

  if (error || !disclosure) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-neutral-50">
        <div className="text-center">
          <div className="w-20 h-20 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-neutral-900 mb-2">Error</h3>
          <p className="text-neutral-600 mb-6">{error || 'Disclosure not found'}</p>
          <button onClick={() => navigate('/inventor/dashboard')} className="btn-primary">
            Back to Dashboard
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-neutral-50 via-primary-50/20 to-neutral-100">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-xl border-b border-neutral-200 flex-shrink-0">
        <div className="max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/inventor/dashboard')}
              className="text-neutral-600 hover:text-neutral-900 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </button>
            <div>
              <h1 className="text-xl font-semibold text-neutral-900">{disclosure.title}</h1>
              <p className="text-xs text-neutral-500 mt-0.5">Patent Draft Review</p>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <div className="text-right">
              <p className="text-sm font-medium text-neutral-900">{user?.full_name || user?.email}</p>
              <p className="text-xs text-neutral-500 mt-0.5">Inventor</p>
            </div>
            <button onClick={handleLogout} className="btn-ghost text-sm">
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Content - Two Panel Layout */}
      <main className="flex-1 overflow-hidden max-w-[1800px] mx-auto w-full px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full">

          {/* Left Panel - Patent Draft (Read-Only with Selection) */}
          <div className="card flex flex-col overflow-hidden">
            <div className="flex items-center justify-between pb-4 border-b border-neutral-200 flex-shrink-0">
              <h2 className="text-lg font-semibold text-neutral-900">Patent Draft</h2>
              <span className="text-xs text-neutral-500 bg-neutral-100 px-3 py-1 rounded-full">
                Read-Only
              </span>
            </div>

            {/* Patent Draft Viewer */}
            <div
              className="flex-1 overflow-y-auto bg-white rounded-lg border border-neutral-200 p-6 mt-4"
              onMouseUp={handleTextSelection}
            >
              <pre className="whitespace-pre-wrap font-mono text-sm text-neutral-700 leading-relaxed select-text">
                {patentDraft}
              </pre>
            </div>

            {/* Comment on Selection Dialog */}
            {showCommentDialog && (
              <div className="mt-4 p-4 bg-primary-50 rounded-lg border border-primary-200 flex-shrink-0">
                <div className="flex items-start justify-between mb-2">
                  <p className="text-sm font-medium text-neutral-900">Add Comment on Selection</p>
                  <button
                    onClick={() => {
                      setShowCommentDialog(false)
                      setSelectedText('')
                      setCommentContent('')
                    }}
                    className="text-neutral-400 hover:text-neutral-600"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <div className="mb-3 p-2 bg-white rounded border border-neutral-200">
                  <p className="text-xs text-neutral-500 mb-1">Selected text:</p>
                  <p className="text-sm text-neutral-700 italic">"{selectedText}"</p>
                </div>
                <textarea
                  value={commentContent}
                  onChange={(e) => setCommentContent(e.target.value)}
                  placeholder="Enter your comment..."
                  className="input-field w-full min-h-[80px] text-sm mb-2"
                />
                <button
                  onClick={handleAddComment}
                  disabled={!commentContent.trim()}
                  className="btn-primary w-full text-sm"
                >
                  Add Comment
                </button>
              </div>
            )}
          </div>

          {/* Right Panel - Chat with Attorney */}
          <div className="card flex flex-col overflow-hidden">
            <div className="flex items-center justify-between pb-4 border-b border-neutral-200 flex-shrink-0">
              <h2 className="text-lg font-semibold text-neutral-900">Discussion with Attorney</h2>
              <span className="text-xs text-neutral-500">
                {comments.length} message{comments.length !== 1 ? 's' : ''}
              </span>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto space-y-4 mt-4 mb-4">
              {comments.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                  </div>
                  <p className="text-neutral-600 text-sm">No messages yet</p>
                  <p className="text-neutral-500 text-xs mt-1">Start a conversation with your attorney</p>
                </div>
              ) : (
                comments.map((comment) => {
                  const isCurrentUser = comment.author_id === user?.id
                  return (
                    <div
                      key={comment.id}
                      className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[75%] rounded-2xl px-4 py-3 ${
                          isCurrentUser
                            ? 'bg-primary-600 text-white'
                            : 'bg-neutral-100 text-neutral-900'
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <p className={`text-xs font-medium ${isCurrentUser ? 'text-primary-100' : 'text-neutral-600'}`}>
                            {comment.author_name || 'Unknown'}
                          </p>
                          <span className={`text-xs ${isCurrentUser ? 'text-primary-200' : 'text-neutral-500'}`}>
                            {formatTimestamp(comment.created_at)}
                          </span>
                        </div>
                        <p className="text-sm whitespace-pre-wrap break-words">{comment.content}</p>
                      </div>
                    </div>
                  )
                })
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Message Input */}
            <div className="border-t border-neutral-200 pt-4 flex-shrink-0">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      handleSendMessage()
                    }
                  }}
                  placeholder="Type a message..."
                  className="input-field flex-1"
                  disabled={isSendingMessage}
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!newMessage.trim() || isSendingMessage}
                  className="btn-primary px-6"
                >
                  {isSendingMessage ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
