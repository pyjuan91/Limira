import api from './api'
import { Comment, CommentCreate } from '@/types'

export const commentService = {
  /**
   * Get all comments for a disclosure
   */
  async getComments(disclosureId: number): Promise<Comment[]> {
    const response = await api.get<Comment[]>(`/comments/disclosures/${disclosureId}/comments`)
    return response.data
  },

  /**
   * Create a new comment on a disclosure
   */
  async createComment(disclosureId: number, data: CommentCreate): Promise<Comment> {
    const response = await api.post<Comment>(`/comments/disclosures/${disclosureId}/comments`, data)
    return response.data
  },
}

// Message types
export interface Message {
  id: number
  disclosure_id: number
  sender_id: number
  content: string
  is_read: boolean
  created_at: string
  updated_at?: string
  sender_name?: string
  sender_role?: string
}

export interface MessageCreate {
  content: string
}

export const messageService = {
  /**
   * Get all messages for a disclosure
   */
  async getMessages(disclosureId: number): Promise<Message[]> {
    const response = await api.get<Message[]>(`/messages/disclosures/${disclosureId}/messages`)
    return response.data
  },

  /**
   * Send a message in a disclosure chat
   */
  async sendMessage(disclosureId: number, data: MessageCreate): Promise<Message> {
    const response = await api.post<Message>(`/messages/disclosures/${disclosureId}/messages`, data)
    return response.data
  },

  /**
   * Mark a message as read
   */
  async markAsRead(messageId: number): Promise<Message> {
    const response = await api.patch<Message>(`/messages/messages/${messageId}`, { is_read: true })
    return response.data
  },
}
