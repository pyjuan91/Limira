import { useState, useEffect, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { disclosureService } from '@/services/disclosureService'
import { chatService, ChatMessage as APIChatMessage } from '@/services/chatService'
import { commentService, messageService, Message } from '@/services/commentService'
import { draftService, PatentDraft } from '@/services/draftService'
import { Disclosure, DisclosureStatus, DisclosureType, Comment } from '@/types'
import HighlightableText from '@/components/HighlightableText'
import CommentThread from '@/components/CommentThread'
import Sidebar, { SidebarTool } from '@/components/layout/Sidebar'
import SharedFiles from '@/components/common/SharedFiles'
import PatentAnalysis from '@/components/common/PatentAnalysis'
import VideoChat from '@/components/common/VideoChat'

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

interface ChatMessage {
  id: number
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

export default function LawyerDisclosureDetail() {
  const { id } = useParams<{ id: string }>()
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const [disclosure, setDisclosure] = useState<Disclosure | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  // Sidebar navigation
  const [activeTool, setActiveTool] = useState<SidebarTool>('draft')

  // Document editor state
  const [draft, setDraft] = useState<PatentDraft | null>(null)
  const [patentDraft, setPatentDraft] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Edit/Comment mode toggle
  const [isEditMode, setIsEditMode] = useState(true)

  // Comments with text selection
  const [comments, setComments] = useState<Comment[]>([])
  const [selectedText, setSelectedText] = useState('')
  const [selectionStart, setSelectionStart] = useState<number | null>(null)
  const [selectionEnd, setSelectionEnd] = useState<number | null>(null)
  const [showCommentDialog, setShowCommentDialog] = useState(false)
  const [commentContent, setCommentContent] = useState('')

  // Comment thread popup
  const [activeCommentId, setActiveCommentId] = useState<number | null>(null)
  const [commentThreadPosition, setCommentThreadPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 })

  // AI Chat state
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 1,
      role: 'assistant',
      content: "Hello! I'm your AI patent assistant. I can help you with:\n\n• Patent drafting guidance\n• Legal terminology and best practices\n• Prior art research\n• Claim structure optimization\n\nHow can I assist you today?",
      timestamp: new Date(),
    },
  ])
  const [inputMessage, setInputMessage] = useState('')
  const [isAiTyping, setIsAiTyping] = useState(false)
  const chatEndRef = useRef<HTMLDivElement>(null)

  // Inventor Chat state (using real messages from database)
  const [inventorMessages, setInventorMessages] = useState<Message[]>([])
  const [inventorInputMessage, setInventorInputMessage] = useState('')
  const [isSendingInventorMessage, setIsSendingInventorMessage] = useState(false)
  const inventorChatEndRef = useRef<HTMLDivElement>(null)

  // Patent Review AI Analysis state
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysisError, setAnalysisError] = useState('')

  useEffect(() => {
    if (id) {
      loadDisclosure()
      loadInventorMessages()
      loadComments()

      // Poll for new messages and comments every 5 seconds
      const pollingInterval = setInterval(() => {
        loadInventorMessages()
        loadComments()
      }, 5000)

      // Cleanup interval on unmount
      return () => {
        clearInterval(pollingInterval)
      }
    }
  }, [id])

  // Auto-save draft after user stops typing (debounced save)
  useEffect(() => {
    if (!draft || !patentDraft) return

    // Don't auto-save if textarea is focused (user is actively typing)
    if (document.activeElement === textareaRef.current) {
      // Set up debounced save: save 3 seconds after user stops typing
      const saveTimeout = setTimeout(() => {
        handleSaveDocument()
      }, 3000)

      return () => clearTimeout(saveTimeout)
    }
  }, [patentDraft, draft])

  useEffect(() => {
    // Scroll to bottom when new messages arrive
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    // Scroll to bottom when new inventor messages arrive
    inventorChatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [inventorMessages])

  const loadDisclosure = async () => {
    if (!id) return

    try {
      const data = await disclosureService.getById(parseInt(id))
      setDisclosure(data)

      // Try to load existing draft from database
      try {
        const draftData = await draftService.getDraft(parseInt(id))
        setDraft(draftData)

        // Use full_text if available, otherwise generate template
        if (draftData.full_text) {
          setPatentDraft(draftData.full_text)
        } else {
          const template = generatePatentTemplate(data)
          setPatentDraft(template)
        }
      } catch (draftErr) {
        // If draft doesn't exist, generate template
        const template = generatePatentTemplate(data)
        setPatentDraft(template)
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load disclosure')
    } finally {
      setIsLoading(false)
    }
  }

  const loadInventorMessages = async () => {
    if (!id) return

    try {
      const data = await messageService.getMessages(parseInt(id))
      setInventorMessages(data)
    } catch (err: any) {
      console.error('Failed to load messages:', err)
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

  const handleTextSelection = (text: string, start: number, end: number) => {
    setSelectedText(text)
    setSelectionStart(start)
    setSelectionEnd(end)
    setShowCommentDialog(true)
  }

  const handleAddComment = async () => {
    if (!commentContent.trim() || !id) return

    try {
      await commentService.createComment(parseInt(id), {
        content: commentContent,
        selected_text: selectedText || undefined,
        selection_start: selectionStart ?? undefined,
        selection_end: selectionEnd ?? undefined,
      })

      // Reload comments
      await loadComments()

      // Reset
      setCommentContent('')
      setSelectedText('')
      setSelectionStart(null)
      setSelectionEnd(null)
      setShowCommentDialog(false)
    } catch (err: any) {
      alert('Failed to add comment: ' + (err.response?.data?.detail || 'Unknown error'))
    }
  }

  const handleHighlightClick = (commentId: number, position: { x: number; y: number }) => {
    setActiveCommentId(commentId)
    setCommentThreadPosition(position)
  }

  const handleReplyToComment = async (parentCommentId: number, content: string) => {
    if (!id) return

    try {
      await commentService.createComment(parseInt(id), {
        content,
        parent_comment_id: parentCommentId,
      })

      // Reload comments
      await loadComments()
    } catch (err: any) {
      throw new Error(err.response?.data?.detail || 'Failed to add reply')
    }
  }

  const activeComment = activeCommentId ? comments.find((c) => c.id === activeCommentId) : null

  const handleSaveDocument = async () => {
    if (!draft) return

    setIsSaving(true)
    try {
      // Save cursor position
      const cursorPosition = textareaRef.current?.selectionStart || 0

      await draftService.updateFullText(draft.id, patentDraft)
      setLastSaved(new Date())

      // Restore cursor position after save
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.selectionStart = cursorPosition
          textareaRef.current.selectionEnd = cursorPosition
        }
      }, 0)
    } catch (err: any) {
      alert('Failed to save document: ' + (err.response?.data?.detail || 'Unknown error'))
    } finally {
      setIsSaving(false)
    }
  }

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return

    // Add user message
    const userMessage: ChatMessage = {
      id: messages.length + 1,
      role: 'user',
      content: inputMessage,
      timestamp: new Date(),
    }
    setMessages(prev => [...prev, userMessage])
    setInputMessage('')
    setIsAiTyping(true)

    try {
      // Convert to API format (exclude id and timestamp)
      const apiMessages: APIChatMessage[] = [...messages, userMessage].map(msg => ({
        role: msg.role,
        content: msg.content,
      }))

      // Call real AI API with disclosure context
      const disclosureId = id ? parseInt(id) : undefined
      const responseText = await chatService.sendMessage(apiMessages, disclosureId)

      const aiMessage: ChatMessage = {
        id: messages.length + 2,
        role: 'assistant',
        content: responseText,
        timestamp: new Date(),
      }

      setMessages(prev => [...prev, aiMessage])
    } catch (error: any) {
      console.error('Chat error:', error)

      // Show error message to user
      const errorMessage: ChatMessage = {
        id: messages.length + 2,
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again later.',
        timestamp: new Date(),
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsAiTyping(false)
    }
  }

  const handleSendInventorMessage = async () => {
    if (!inventorInputMessage.trim() || !id) return

    setIsSendingInventorMessage(true)
    try {
      await messageService.sendMessage(parseInt(id), {
        content: inventorInputMessage,
      })

      // Reload messages
      await loadInventorMessages()

      // Reset
      setInventorInputMessage('')
    } catch (err: any) {
      alert('Failed to send message: ' + (err.response?.data?.detail || 'Unknown error'))
    } finally {
      setIsSendingInventorMessage(false)
    }
  }

  const handleLogout = () => {
    logout()
    navigate('/welcome')
  }

  const handleAnalyzePatent = async () => {
    if (!id) return

    setIsAnalyzing(true)
    setAnalysisError('')

    try {
      await disclosureService.analyzePatent(parseInt(id))
      // Reload disclosure to get the analysis results
      await loadDisclosure()
    } catch (err: any) {
      setAnalysisError(err.response?.data?.detail || 'Failed to analyze patent')
    } finally {
      setIsAnalyzing(false)
    }
  }

  const getStatusBadge = (status: DisclosureStatus) => {
    const badges = {
      [DisclosureStatus.DRAFT]: 'badge-draft',
      [DisclosureStatus.AI_PROCESSING]: 'badge-processing',
      [DisclosureStatus.READY_FOR_REVIEW]: 'badge-ready',
      [DisclosureStatus.IN_REVIEW]: 'badge-approved',
      [DisclosureStatus.REVISION_REQUESTED]: 'badge-revision',
      [DisclosureStatus.APPROVED]: 'badge-approved',
    }
    return badges[status] || 'badge-draft'
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-navy-50/20 to-neutral-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-navy-200 border-t-navy-700 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-neutral-600">Loading disclosure...</p>
        </div>
      </div>
    )
  }

  if (error || !disclosure) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-navy-50/20 to-neutral-100 flex items-center justify-center">
        <div className="card max-w-md text-center">
          <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-neutral-900 mb-2">Error Loading Disclosure</h3>
          <p className="text-neutral-600 mb-6">{error || 'Disclosure not found'}</p>
          <button onClick={() => navigate('/lawyer/dashboard')} className="btn-primary">
            Back to Dashboard
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-navy-50/20 to-neutral-100 flex flex-col">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-xl border-b border-neutral-200 flex-shrink-0">
        <div className="px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            {/* Left: Back button and title */}
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/lawyer/dashboard')}
                className="p-2 hover:bg-neutral-100 rounded-xl transition-colors"
                title="Back to Dashboard"
              >
                <svg className="w-6 h-6 text-neutral-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-xl font-semibold text-neutral-900">{disclosure.title}</h1>
                  <span className={`status-badge ${getStatusBadge(disclosure.status)}`}>
                    {disclosure.status.replace(/_/g, ' ')}
                  </span>
                </div>
                <p className="text-sm text-neutral-600 mt-1">
                  Case ID: #{disclosure.id} • Created {new Date(disclosure.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>

            {/* Right: User info and logout */}
            <div className="flex items-center gap-6">
              <div className="text-right">
                <p className="text-sm font-medium text-neutral-900">{user?.full_name || user?.email}</p>
                <p className="text-xs text-neutral-500 mt-0.5">Patent Attorney</p>
              </div>
              <button onClick={handleLogout} className="btn-ghost text-sm">
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content with Sidebar */}
      <main className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <Sidebar
          activeTool={activeTool}
          onToolChange={setActiveTool}
          availableTools={['draft', 'ai-chat', 'discussion', 'files', 'patent-analysis', 'video-chat']}
        />

        {/* Content Area */}
        <div className="flex-1 overflow-auto p-6">
          <div className="max-w-7xl mx-auto h-full">
            {/* Render content based on active tool */}
            {activeTool === 'draft' && (
              <>
                {/* PATENT_REVIEW type: Show PDF viewer and AI Analysis */}
                {disclosure?.disclosure_type === DisclosureType.PATENT_REVIEW ? (
                  <div className="h-full flex gap-4">
                    {/* PDF Viewer */}
                    <div className="flex-1 card flex flex-col overflow-hidden">
                      <div className="flex items-center justify-between mb-3 pb-2 border-b border-neutral-200">
                        <div className="flex items-center gap-3">
                          <h2 className="text-sm font-medium text-neutral-700">Patent Document</h2>
                          {disclosure.patent_number && (
                            <span className="text-xs text-neutral-500">• {disclosure.patent_number}</span>
                          )}
                        </div>
                      </div>
                      <div className="flex-1 bg-neutral-100 rounded-lg overflow-hidden">
                        {disclosure.patent_file_id ? (
                          <iframe
                            src={`${import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1'}/files/${disclosure.patent_file_id}/preview`}
                            className="w-full h-full"
                            title="Patent PDF"
                          />
                        ) : (
                          <div className="flex items-center justify-center h-full text-neutral-500">
                            <p>No patent file uploaded</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* AI Analysis Panel */}
                    <div className="w-96 card flex flex-col overflow-hidden">
                      <div className="flex items-center justify-between mb-3 pb-2 border-b border-neutral-200">
                        <h2 className="text-sm font-medium text-neutral-700">AI Analysis</h2>
                        <button
                          onClick={handleAnalyzePatent}
                          disabled={isAnalyzing || !disclosure.patent_file_id}
                          className="btn-primary text-xs py-1.5 px-3"
                        >
                          {isAnalyzing ? (
                            <>
                              <svg className="animate-spin -ml-1 mr-1.5 h-3 w-3 text-white inline" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                              Analyzing...
                            </>
                          ) : disclosure.ai_analysis ? (
                            'Re-analyze'
                          ) : (
                            'Analyze Patent'
                          )}
                        </button>
                      </div>

                      {analysisError && (
                        <div className="mb-3 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
                          {analysisError}
                        </div>
                      )}

                      <div className="flex-1 overflow-y-auto">
                        {disclosure.ai_analysis ? (
                          <div className="space-y-4 text-sm">
                            {/* Summary */}
                            {disclosure.ai_analysis.summary && (
                              <div>
                                <h3 className="font-medium text-neutral-900 mb-1">Summary</h3>
                                <p className="text-neutral-600">{disclosure.ai_analysis.summary}</p>
                              </div>
                            )}

                            {/* Technical Assessment */}
                            {disclosure.ai_analysis.technical_assessment && (
                              <div>
                                <h3 className="font-medium text-neutral-900 mb-2">Technical Assessment</h3>
                                <div className="space-y-2">
                                  {disclosure.ai_analysis.technical_assessment.innovation_level && (
                                    <div className="p-2 bg-neutral-50 rounded">
                                      <p className="text-xs text-neutral-500 mb-1">Innovation Level</p>
                                      <p className="text-neutral-700">{disclosure.ai_analysis.technical_assessment.innovation_level}</p>
                                    </div>
                                  )}
                                  {disclosure.ai_analysis.technical_assessment.technical_complexity && (
                                    <div className="p-2 bg-neutral-50 rounded">
                                      <p className="text-xs text-neutral-500 mb-1">Technical Complexity</p>
                                      <p className="text-neutral-700">{disclosure.ai_analysis.technical_assessment.technical_complexity}</p>
                                    </div>
                                  )}
                                  {disclosure.ai_analysis.technical_assessment.key_innovations && disclosure.ai_analysis.technical_assessment.key_innovations.length > 0 && (
                                    <div className="p-2 bg-neutral-50 rounded">
                                      <p className="text-xs text-neutral-500 mb-1">Key Innovations</p>
                                      <ul className="list-disc list-inside text-neutral-700">
                                        {disclosure.ai_analysis.technical_assessment.key_innovations.map((item, idx) => (
                                          <li key={idx}>{item}</li>
                                        ))}
                                      </ul>
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}

                            {/* Commercial Value */}
                            {disclosure.ai_analysis.commercial_value && (
                              <div>
                                <h3 className="font-medium text-neutral-900 mb-2">Commercial Value</h3>
                                <div className="space-y-2">
                                  {disclosure.ai_analysis.commercial_value.market_potential && (
                                    <div className="p-2 bg-neutral-50 rounded">
                                      <p className="text-xs text-neutral-500 mb-1">Market Potential</p>
                                      <p className="text-neutral-700">{disclosure.ai_analysis.commercial_value.market_potential}</p>
                                    </div>
                                  )}
                                  {disclosure.ai_analysis.commercial_value.competitive_advantage && (
                                    <div className="p-2 bg-neutral-50 rounded">
                                      <p className="text-xs text-neutral-500 mb-1">Competitive Advantage</p>
                                      <p className="text-neutral-700">{disclosure.ai_analysis.commercial_value.competitive_advantage}</p>
                                    </div>
                                  )}
                                  {disclosure.ai_analysis.commercial_value.estimated_value_assessment && (
                                    <div className="p-2 bg-neutral-50 rounded">
                                      <p className="text-xs text-neutral-500 mb-1">Value Assessment</p>
                                      <p className="text-neutral-700">{disclosure.ai_analysis.commercial_value.estimated_value_assessment}</p>
                                      {disclosure.ai_analysis.commercial_value.reasoning && (
                                        <p className="text-neutral-600 mt-1 text-xs italic">{disclosure.ai_analysis.commercial_value.reasoning}</p>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}

                            {/* Claims Analysis */}
                            {disclosure.ai_analysis.claims_analysis && (
                              <div>
                                <h3 className="font-medium text-neutral-900 mb-2">Claims Analysis</h3>
                                <div className="space-y-2">
                                  <div className="p-2 bg-neutral-50 rounded">
                                    <p className="text-xs text-neutral-500 mb-1">Claim Scope</p>
                                    <p className="text-neutral-700">{disclosure.ai_analysis.claims_analysis.claim_scope || 'N/A'}</p>
                                  </div>
                                  {disclosure.ai_analysis.claims_analysis.key_limitations && disclosure.ai_analysis.claims_analysis.key_limitations.length > 0 && (
                                    <div className="p-2 bg-neutral-50 rounded">
                                      <p className="text-xs text-neutral-500 mb-1">Key Limitations</p>
                                      <ul className="list-disc list-inside text-neutral-700">
                                        {disclosure.ai_analysis.claims_analysis.key_limitations.map((item, idx) => (
                                          <li key={idx}>{item}</li>
                                        ))}
                                      </ul>
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}

                            {/* Risk Assessment */}
                            {disclosure.ai_analysis.risk_assessment && (
                              <div>
                                <h3 className="font-medium text-neutral-900 mb-2">Risk Assessment</h3>
                                <div className="space-y-2">
                                  {disclosure.ai_analysis.risk_assessment.invalidation_risk && (
                                    <div className="p-2 bg-red-50 rounded">
                                      <p className="text-xs text-red-500 mb-1">Invalidation Risk</p>
                                      <p className="text-red-700">{disclosure.ai_analysis.risk_assessment.invalidation_risk}</p>
                                    </div>
                                  )}
                                  {disclosure.ai_analysis.risk_assessment.potential_challenges && disclosure.ai_analysis.risk_assessment.potential_challenges.length > 0 && (
                                    <div className="p-2 bg-red-50 rounded">
                                      <p className="text-xs text-red-500 mb-1">Potential Challenges</p>
                                      <ul className="list-disc list-inside text-red-700">
                                        {disclosure.ai_analysis.risk_assessment.potential_challenges.map((item, idx) => (
                                          <li key={idx}>{item}</li>
                                        ))}
                                      </ul>
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}

                            {/* Strategic Insights */}
                            {disclosure.ai_analysis.strategic_insights && (
                              <div>
                                <h3 className="font-medium text-neutral-900 mb-2">Strategic Insights</h3>
                                <div className="space-y-2">
                                  {disclosure.ai_analysis.strategic_insights.licensing_potential && (
                                    <div className="p-2 bg-emerald-50 rounded">
                                      <p className="text-xs text-emerald-500 mb-1">Licensing Potential</p>
                                      <p className="text-emerald-700">{disclosure.ai_analysis.strategic_insights.licensing_potential}</p>
                                    </div>
                                  )}
                                  {disclosure.ai_analysis.strategic_insights.recommended_actions && disclosure.ai_analysis.strategic_insights.recommended_actions.length > 0 && (
                                    <div className="p-2 bg-emerald-50 rounded">
                                      <p className="text-xs text-emerald-500 mb-1">Recommended Actions</p>
                                      <ul className="list-disc list-inside text-emerald-700">
                                        {disclosure.ai_analysis.strategic_insights.recommended_actions.map((item, idx) => (
                                          <li key={idx}>{item}</li>
                                        ))}
                                      </ul>
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="flex flex-col items-center justify-center h-full text-center py-8">
                            <svg className="w-12 h-12 text-neutral-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                            <p className="text-neutral-500 text-sm mb-1">No analysis yet</p>
                            <p className="text-neutral-400 text-xs">Click "Analyze Patent" to generate AI analysis</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  /* NEW_DISCLOSURE type: Show draft editor */
                  <div className="card h-full flex flex-col">
                    <div className="flex items-center justify-between mb-3 pb-2 border-b border-neutral-200">
                      <div className="flex items-center gap-3">
                        <h2 className="text-sm font-medium text-neutral-700">Patent Draft</h2>
                        {lastSaved && isEditMode && (
                          <span className="text-xs text-neutral-400">• Saved {lastSaved.toLocaleTimeString()}</span>
                        )}

                        {/* Mode Toggle */}
                        <div className="flex items-center gap-1 bg-neutral-100 rounded-lg p-1">
                          <button
                            onClick={() => {
                              setIsEditMode(true)
                              setShowCommentDialog(false)
                            }}
                            className={`px-3 py-1 text-xs rounded transition-colors ${
                              isEditMode
                                ? 'bg-white text-navy-700 font-medium shadow-sm'
                                : 'text-neutral-600 hover:text-neutral-900'
                            }`}
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => setIsEditMode(false)}
                            className={`px-3 py-1 text-xs rounded transition-colors ${
                              !isEditMode
                                ? 'bg-white text-navy-700 font-medium shadow-sm'
                                : 'text-neutral-600 hover:text-neutral-900'
                            }`}
                          >
                            Comment
                          </button>
                        </div>
                      </div>

                      {isEditMode && (
                        <button
                          onClick={handleSaveDocument}
                          disabled={isSaving}
                          className="btn-primary text-xs py-1.5 px-3"
                        >
                          {isSaving ? (
                            <>
                              <svg
                                className="animate-spin -ml-1 mr-1.5 h-3 w-3 text-white inline"
                                fill="none"
                                viewBox="0 0 24 24"
                              >
                                <circle
                                  className="opacity-25"
                                  cx="12"
                                  cy="12"
                                  r="10"
                                  stroke="currentColor"
                                  strokeWidth="4"
                                ></circle>
                                <path
                                  className="opacity-75"
                                  fill="currentColor"
                                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                ></path>
                              </svg>
                              Saving...
                            </>
                          ) : (
                            'Save'
                          )}
                        </button>
                      )}
                    </div>

                    {/* Document Editor / Comment View */}
                    {isEditMode ? (
                      <div className="flex-1 overflow-hidden">
                        <textarea
                          ref={textareaRef}
                          value={patentDraft}
                          onChange={(e) => setPatentDraft(e.target.value)}
                          className="w-full h-full px-6 py-4 bg-white border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-navy-500 focus:border-transparent resize-none font-mono text-sm leading-relaxed"
                          style={{
                            fontFamily: "'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', monospace",
                          }}
                          placeholder="Start editing the patent draft..."
                        />
                      </div>
                    ) : (
                      <div className="flex-1 overflow-y-auto">
                        <div className="px-6 py-4 bg-white border border-neutral-200 rounded-xl">
                          <HighlightableText
                            text={patentDraft}
                            comments={comments}
                            onTextSelect={handleTextSelection}
                            onHighlightClick={handleHighlightClick}
                            className="font-mono text-sm text-neutral-700 leading-relaxed"
                          />
                        </div>

                        {/* Comment on Selection Dialog */}
                        {showCommentDialog && (
                          <div className="mt-4 p-4 bg-primary-50 rounded-lg border border-primary-200">
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
                    )}
                  </div>
                )}
              </>
            )}

            {/* AI Chat Assistant */}
            {activeTool === 'ai-chat' && (
              <div className="card h-full flex flex-col overflow-hidden">
                <div className="flex items-center justify-between mb-3 pb-2 border-b border-neutral-200 flex-shrink-0">
                  <h2 className="text-sm font-medium text-neutral-700">Drafting Assistant</h2>
                </div>

                {/* Chat Messages - Scrollable */}
                <div className="flex-1 overflow-y-auto mb-4 space-y-3 pr-2 min-h-0">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                          message.role === 'user' ? 'bg-navy-700 text-white' : 'bg-neutral-100 text-neutral-900'
                        }`}
                      >
                        <p className="text-sm whitespace-pre-line">{message.content}</p>
                        <p className={`text-xs mt-1 ${message.role === 'user' ? 'text-navy-200' : 'text-neutral-500'}`}>
                          {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  ))}

                  {isAiTyping && (
                    <div className="flex justify-start">
                      <div className="bg-neutral-100 text-neutral-900 rounded-2xl px-4 py-3">
                        <div className="flex gap-1">
                          <div
                            className="w-2 h-2 bg-neutral-400 rounded-full animate-bounce"
                            style={{ animationDelay: '0ms' }}
                          ></div>
                          <div
                            className="w-2 h-2 bg-neutral-400 rounded-full animate-bounce"
                            style={{ animationDelay: '150ms' }}
                          ></div>
                          <div
                            className="w-2 h-2 bg-neutral-400 rounded-full animate-bounce"
                            style={{ animationDelay: '300ms' }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={chatEndRef} />
                </div>

                {/* Chat Input - Fixed at bottom */}
                <div className="border-t border-neutral-200 pt-4 flex-shrink-0">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={inputMessage}
                      onChange={(e) => setInputMessage(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                      placeholder="Ask about patent drafting, legal terms, or research..."
                      className="flex-1 px-4 py-2.5 border border-neutral-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                      disabled={isAiTyping}
                    />
                    <button
                      onClick={handleSendMessage}
                      disabled={isAiTyping || !inputMessage.trim()}
                      className="bg-purple-600 hover:bg-purple-700 disabled:bg-neutral-300 disabled:cursor-not-allowed text-white px-4 py-2.5 rounded-xl transition-colors"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                        />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Inventor Discussion */}
            {activeTool === 'discussion' && (
              <div className="card h-full flex flex-col overflow-hidden">
                <div className="flex items-center justify-between mb-3 pb-2 border-b border-neutral-200 flex-shrink-0">
                  <div className="flex items-center gap-2">
                    <h2 className="text-sm font-medium text-neutral-700">Discussion</h2>
                    <span className="text-xs text-neutral-400">• with Inventor</span>
                  </div>
                </div>

                {/* Chat Messages - Scrollable */}
                <div className="flex-1 overflow-y-auto mb-4 space-y-3 pr-2 min-h-0">
                  {inventorMessages.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-neutral-500 text-sm">No messages yet</p>
                      <p className="text-neutral-400 text-xs mt-1">Start a conversation with the inventor</p>
                    </div>
                  ) : (
                    inventorMessages.map((message) => {
                      const isCurrentUser = message.sender_id === user?.id
                      return (
                        <div
                          key={message.id}
                          className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                              isCurrentUser ? 'bg-emerald-600 text-white' : 'bg-neutral-100 text-neutral-900'
                            }`}
                          >
                            <div className="flex items-center gap-2 mb-1">
                              <p
                                className={`text-xs font-medium ${
                                  isCurrentUser ? 'text-emerald-100' : 'text-neutral-600'
                                }`}
                              >
                                {message.sender_name || 'Unknown'}
                              </p>
                              <p className={`text-xs ${isCurrentUser ? 'text-emerald-200' : 'text-neutral-500'}`}>
                                {new Date(message.created_at).toLocaleTimeString([], {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </p>
                            </div>
                            <p className="text-sm whitespace-pre-line">{message.content}</p>
                          </div>
                        </div>
                      )
                    })
                  )}
                  <div ref={inventorChatEndRef} />
                </div>

                {/* Chat Input - Fixed at bottom */}
                <div className="border-t border-neutral-200 pt-4 flex-shrink-0">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={inventorInputMessage}
                      onChange={(e) => setInventorInputMessage(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSendInventorMessage()}
                      placeholder="Ask the inventor about the disclosure..."
                      className="flex-1 px-4 py-2.5 border border-neutral-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm"
                    />
                    <button
                      onClick={handleSendInventorMessage}
                      disabled={!inventorInputMessage.trim() || isSendingInventorMessage}
                      className="bg-emerald-600 hover:bg-emerald-700 disabled:bg-neutral-300 disabled:cursor-not-allowed text-white px-4 py-2.5 rounded-xl transition-colors"
                    >
                      {isSendingInventorMessage ? (
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                          />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Shared Files */}
            {activeTool === 'files' && id && (
              <div className="card h-full p-6">
                <SharedFiles disclosureId={parseInt(id)} />
              </div>
            )}

            {/* Patent Analysis */}
            {activeTool === 'patent-analysis' && (
              <div className="card h-full p-6">
                <PatentAnalysis />
              </div>
            )}

            {/* Video Chat */}
            {activeTool === 'video-chat' && id && (
              <div className="card h-full p-6">
                <VideoChat disclosureId={parseInt(id)} />
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Comment Thread Popup */}
      {activeComment && (
        <CommentThread
          comment={activeComment}
          allComments={comments}
          onReply={handleReplyToComment}
          onClose={() => setActiveCommentId(null)}
          position={commentThreadPosition}
          currentUserId={user?.id}
        />
      )}
    </div>
  )
}
