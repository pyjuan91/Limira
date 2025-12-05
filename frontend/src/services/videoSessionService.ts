import api from './api'

export interface VideoSession {
  id: number
  disclosure_id: number
  participants: number[]
  transcript_text?: string
  ai_summary?: string
  session_metadata?: Record<string, any>
  started_at: string
  ended_at?: string
}

export interface VideoSessionCreate {
  disclosure_id: number
}

export interface VideoSessionUpdate {
  transcript_text?: string
  session_metadata?: Record<string, any>
}

export interface VideoSessionEnd {
  transcript_text: string
  session_metadata?: Record<string, any>
}

export const videoSessionService = {
  /**
   * Create a new video session
   */
  async createSession(data: VideoSessionCreate): Promise<VideoSession> {
    const response = await api.post<VideoSession>('/video-sessions/create', data)
    return response.data
  },

  /**
   * Get all video sessions for a disclosure
   */
  async getSessions(disclosureId: number): Promise<VideoSession[]> {
    const response = await api.get<VideoSession[]>(`/video-sessions/disclosure/${disclosureId}`)
    return response.data
  },

  /**
   * Get a specific video session
   */
  async getSession(sessionId: number): Promise<VideoSession> {
    const response = await api.get<VideoSession>(`/video-sessions/${sessionId}`)
    return response.data
  },

  /**
   * Update a video session
   */
  async updateSession(sessionId: number, data: VideoSessionUpdate): Promise<VideoSession> {
    const response = await api.patch<VideoSession>(`/video-sessions/${sessionId}`, data)
    return response.data
  },

  /**
   * End a video session and generate AI summary
   */
  async endSession(sessionId: number, data: VideoSessionEnd): Promise<VideoSession> {
    const response = await api.post<VideoSession>(`/video-sessions/${sessionId}/end`, data)
    return response.data
  },

  /**
   * Delete a video session
   */
  async deleteSession(sessionId: number): Promise<void> {
    await api.delete(`/video-sessions/${sessionId}`)
  },
}
