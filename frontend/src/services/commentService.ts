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
