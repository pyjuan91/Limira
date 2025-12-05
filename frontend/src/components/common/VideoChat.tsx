import { useState, useRef, useEffect } from 'react'
import { videoSessionService, VideoSession } from '@/services/videoSessionService'

interface VideoChatProps {
  disclosureId: number
}

export default function VideoChat({ disclosureId }: VideoChatProps) {
  const [isInCall, setIsInCall] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [currentSession, setCurrentSession] = useState<VideoSession | null>(null)
  const [transcript, setTranscript] = useState('')
  const [sessions, setSessions] = useState<VideoSession[]>([])
  const [isLoadingSessions, setIsLoadingSessions] = useState(true)
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false)

  const localVideoRef = useRef<HTMLVideoElement>(null)
  const mediaStreamRef = useRef<MediaStream | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])

  // Simple speech recognition (Web Speech API)
  const recognitionRef = useRef<any>(null)

  useEffect(() => {
    loadSessions()
  }, [disclosureId])

  const loadSessions = async () => {
    try {
      const data = await videoSessionService.getSessions(disclosureId)
      setSessions(data)
    } catch (err: any) {
      console.error('Failed to load sessions:', err)
    } finally {
      setIsLoadingSessions(false)
    }
  }

  const startCall = async () => {
    try {
      // Get user media (camera + microphone)
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      })

      mediaStreamRef.current = stream

      // Display local video
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream
      }

      // Create video session
      const session = await videoSessionService.createSession({ disclosure_id: disclosureId })
      setCurrentSession(session)
      setIsInCall(true)

      // Start recording
      startRecording(stream)
    } catch (err: any) {
      alert('Failed to start call: ' + err.message)
    }
  }

  const startRecording = (stream: MediaStream) => {
    try {
      // Start audio recording for transcription
      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder
      audioChunksRef.current = []

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }

      mediaRecorder.start(1000) // Collect data every second
      setIsRecording(true)

      // Start speech recognition if available
      if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
        const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition
        const recognition = new SpeechRecognition()
        recognition.continuous = true
        recognition.interimResults = true
        recognition.lang = 'en-US'

        recognition.onresult = (event: any) => {
          let interimTranscript = ''
          let finalTranscript = ''

          for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript
            if (event.results[i].isFinal) {
              finalTranscript += transcript + ' '
            } else {
              interimTranscript += transcript
            }
          }

          if (finalTranscript) {
            setTranscript((prev) => prev + finalTranscript)
          }
        }

        recognition.start()
        recognitionRef.current = recognition
      }
    } catch (err: any) {
      console.error('Failed to start recording:', err)
    }
  }

  const endCall = async () => {
    try {
      setIsGeneratingSummary(true)

      // Stop recording
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop()
      }

      // Stop speech recognition
      if (recognitionRef.current) {
        recognitionRef.current.stop()
        recognitionRef.current = null
      }

      // Stop media stream
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((track) => track.stop())
        mediaStreamRef.current = null
      }

      // End session and get AI summary
      if (currentSession) {
        const updatedSession = await videoSessionService.endSession(currentSession.id, {
          transcript_text: transcript || 'No transcript available',
          session_metadata: {
            duration_seconds: Math.floor((Date.now() - new Date(currentSession.started_at).getTime()) / 1000),
          },
        })

        // Update current session with AI summary
        setCurrentSession(updatedSession)
        await loadSessions()
      }

      setIsInCall(false)
      setIsRecording(false)
    } catch (err: any) {
      alert('Failed to end call: ' + err.message)
    } finally {
      setIsGeneratingSummary(false)
    }
  }

  const formatDuration = (startedAt: string, endedAt?: string) => {
    const start = new Date(startedAt)
    const end = endedAt ? new Date(endedAt) : new Date()
    const duration = Math.floor((end.getTime() - start.getTime()) / 1000)

    const hours = Math.floor(duration / 3600)
    const minutes = Math.floor((duration % 3600) / 60)
    const seconds = duration % 60

    if (hours > 0) {
      return `${hours}h ${minutes}m ${seconds}s`
    } else if (minutes > 0) {
      return `${minutes}m ${seconds}s`
    } else {
      return `${seconds}s`
    }
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="mb-4 pb-3 border-b border-neutral-200">
        <h2 className="text-lg font-semibold text-neutral-900 mb-1">Video Meeting</h2>
        <p className="text-sm text-neutral-600">Collaborate with AI-powered note-taking</p>
      </div>

      {!isInCall ? (
        <>
          {/* Start Call */}
          <div className="mb-6">
            <div className="p-8 border-2 border-dashed border-neutral-300 rounded-xl text-center">
              <div className="text-5xl mb-3">📹</div>
              <h3 className="text-lg font-medium text-neutral-900 mb-2">Start Video Meeting</h3>
              <p className="text-sm text-neutral-600 mb-4">
                Start a video call with the other party. AI will automatically transcribe and summarize your discussion.
              </p>
              <button onClick={startCall} className="btn-primary">
                <svg className="w-5 h-5 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                  />
                </svg>
                Start Call
              </button>
            </div>
          </div>

          {/* Previous Sessions */}
          <div className="flex-1 overflow-y-auto">
            <h3 className="text-sm font-semibold text-neutral-900 mb-3">Previous Meetings</h3>
            {isLoadingSessions ? (
              <div className="text-center py-8">
                <div className="w-8 h-8 border-4 border-navy-200 border-t-navy-700 rounded-full animate-spin mx-auto mb-2"></div>
                <p className="text-sm text-neutral-600">Loading sessions...</p>
              </div>
            ) : sessions.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-neutral-500">No previous meetings</p>
              </div>
            ) : (
              <div className="space-y-3">
                {sessions.map((session) => (
                  <div key={session.id} className="card p-4 hover:border-navy-300 transition-colors">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">📹</span>
                        <div>
                          <p className="text-sm font-medium text-neutral-900">
                            {new Date(session.started_at).toLocaleString()}
                          </p>
                          <p className="text-xs text-neutral-500">
                            Duration: {formatDuration(session.started_at, session.ended_at)}
                          </p>
                        </div>
                      </div>
                      {session.ended_at && (
                        <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded">Completed</span>
                      )}
                    </div>

                    {session.ai_summary && (
                      <div className="mt-3 p-3 bg-navy-50 rounded-lg">
                        <p className="text-xs font-semibold text-navy-900 mb-1">AI Summary</p>
                        <p className="text-sm text-navy-700 whitespace-pre-line">{session.ai_summary}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      ) : (
        <>
          {/* In Call */}
          <div className="flex-1 flex flex-col">
            {/* Video Display */}
            <div className="mb-4 relative bg-black rounded-xl overflow-hidden" style={{ height: '400px' }}>
              <video ref={localVideoRef} autoPlay muted className="w-full h-full object-cover" />
              <div className="absolute bottom-4 left-4 px-3 py-1.5 bg-black/70 text-white text-sm rounded-lg flex items-center gap-2">
                {isRecording && (
                  <>
                    <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                    Recording
                  </>
                )}
              </div>
            </div>

            {/* Live Transcript */}
            <div className="flex-1 overflow-y-auto mb-4 p-4 bg-neutral-50 rounded-xl border border-neutral-200">
              <h4 className="text-sm font-semibold text-neutral-900 mb-2">Live Transcript</h4>
              {transcript ? (
                <p className="text-sm text-neutral-700 whitespace-pre-line">{transcript}</p>
              ) : (
                <p className="text-sm text-neutral-400 italic">Transcript will appear here as you speak...</p>
              )}
            </div>

            {/* Call Controls */}
            <div className="flex items-center justify-center gap-4">
              <button
                onClick={endCall}
                disabled={isGeneratingSummary}
                className="bg-red-600 hover:bg-red-700 disabled:bg-neutral-300 text-white px-6 py-3 rounded-xl flex items-center gap-2 font-medium transition-colors"
              >
                {isGeneratingSummary ? (
                  <>
                    <svg
                      className="animate-spin h-5 w-5 text-white"
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
                    Generating Summary...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                    End Call & Generate Summary
                  </>
                )}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
