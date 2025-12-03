import { useState, useEffect, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { disclosureService } from '@/services/disclosureService'
import { chatService, ChatMessage as APIChatMessage } from '@/services/chatService'
import { Disclosure, DisclosureStatus } from '@/types'

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

  // Document editor state
  const [patentDraft, setPatentDraft] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)

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

  // Inventor Chat state
  const [inventorMessages, setInventorMessages] = useState<ChatMessage[]>([
    {
      id: 1,
      role: 'assistant', // inventor's message
      content: "Hi! I'm the inventor. Feel free to ask me any questions about the invention disclosure. I'm here to provide clarifications and additional details.",
      timestamp: new Date(),
    },
  ])
  const [inventorInputMessage, setInventorInputMessage] = useState('')
  const inventorChatEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (id) {
      loadDisclosure()
    }
  }, [id])

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

      // Generate AI patent template
      const template = generatePatentTemplate(data)
      setPatentDraft(template)
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load disclosure')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSaveDocument = async () => {
    setIsSaving(true)

    // Simulate API call to save document
    await new Promise(resolve => setTimeout(resolve, 1000))

    setLastSaved(new Date())
    setIsSaving(false)
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

      // Call real AI API
      const responseText = await chatService.sendMessage(apiMessages)

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
    if (!inventorInputMessage.trim()) return

    // Add attorney's message
    const attorneyMessage: ChatMessage = {
      id: inventorMessages.length + 1,
      role: 'user',
      content: inventorInputMessage,
      timestamp: new Date(),
    }
    setInventorMessages(prev => [...prev, attorneyMessage])
    setInventorInputMessage('')

    // Simulate inventor response (fake data)
    await new Promise(resolve => setTimeout(resolve, 2000))

    const inventorResponses = [
      "Thank you for your question. Let me provide more details about that aspect of the invention...",
      "That's a great point. The key technical feature here is designed to address scalability concerns we identified during development.",
      "Yes, we've conducted preliminary testing and the results show significant improvement over existing solutions. I can share the test data if needed.",
      "The prior art in this field typically uses method A, but our approach with method B provides better efficiency and lower costs.",
      "I'd be happy to clarify that section. The technical implementation involves three main components that work together...",
      "We chose this approach after evaluating several alternatives. The main advantage is the reduced complexity while maintaining performance.",
    ]

    const randomResponse = inventorResponses[Math.floor(Math.random() * inventorResponses.length)]

    const inventorMessage: ChatMessage = {
      id: inventorMessages.length + 2,
      role: 'assistant', // inventor
      content: randomResponse,
      timestamp: new Date(),
    }

    setInventorMessages(prev => [...prev, inventorMessage])
  }

  const handleLogout = () => {
    logout()
    navigate('/welcome')
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
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-navy-50/20 to-neutral-100">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-xl border-b border-neutral-200">
        <div className="max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8 py-4">
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

      {/* Main Content with 3-widget layout */}
      <main className="max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-2 grid-rows-2 gap-6 h-[calc(100vh-180px)]">
          {/* Left Widget - Document Editor */}
          <div className="col-span-1 row-span-2">
            <div className="card h-full flex flex-col">
              <div className="flex items-center justify-between mb-3 pb-2 border-b border-neutral-200">
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-medium text-neutral-700">Patent Draft</h2>
                  {lastSaved && (
                    <span className="text-xs text-neutral-400">
                      • Saved {lastSaved.toLocaleTimeString()}
                    </span>
                  )}
                </div>
                <button
                  onClick={handleSaveDocument}
                  disabled={isSaving}
                  className="btn-primary text-xs py-1.5 px-3"
                >
                  {isSaving ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-1.5 h-3 w-3 text-white inline" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Saving...
                    </>
                  ) : (
                    'Save'
                  )}
                </button>
              </div>

              {/* Document Editor */}
              <div className="flex-1 overflow-hidden">
                <textarea
                  value={patentDraft}
                  onChange={(e) => setPatentDraft(e.target.value)}
                  className="w-full h-full px-6 py-4 bg-white border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-navy-500 focus:border-transparent resize-none font-mono text-sm leading-relaxed"
                  style={{
                    fontFamily: "'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', monospace",
                  }}
                  placeholder="Start editing the patent draft..."
                />
              </div>
            </div>
          </div>

          {/* Top Right Widget - AI Chat Assistant */}
          <div className="col-span-1">
            <div className="card h-full flex flex-col overflow-hidden">
              {/* Header - Fixed */}
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
                        message.role === 'user'
                          ? 'bg-navy-700 text-white'
                          : 'bg-neutral-100 text-neutral-900'
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
                        <div className="w-2 h-2 bg-neutral-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                        <div className="w-2 h-2 bg-neutral-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                        <div className="w-2 h-2 bg-neutral-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
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
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Right Widget - Inventor Chat */}
          <div className="col-span-1">
            <div className="card h-full flex flex-col overflow-hidden">
              {/* Header - Fixed */}
              <div className="flex items-center justify-between mb-3 pb-2 border-b border-neutral-200 flex-shrink-0">
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-medium text-neutral-700">Discussion</h2>
                  <span className="text-xs text-neutral-400">
                    • {disclosure?.user_name || 'Inventor'}
                  </span>
                </div>
              </div>

              {/* Chat Messages - Scrollable */}
              <div className="flex-1 overflow-y-auto mb-4 space-y-3 pr-2 min-h-0">
                {inventorMessages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                        message.role === 'user'
                          ? 'bg-emerald-600 text-white'
                          : 'bg-neutral-100 text-neutral-900'
                      }`}
                    >
                      <p className="text-sm whitespace-pre-line">{message.content}</p>
                      <p className={`text-xs mt-1 ${message.role === 'user' ? 'text-emerald-100' : 'text-neutral-500'}`}>
                        {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                ))}
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
                    disabled={!inventorInputMessage.trim()}
                    className="bg-emerald-600 hover:bg-emerald-700 disabled:bg-neutral-300 disabled:cursor-not-allowed text-white px-4 py-2.5 rounded-xl transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
