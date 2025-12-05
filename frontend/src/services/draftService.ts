import api from './api'

export interface PatentDraft {
  id: number
  disclosure_id: number
  ai_processing_status: string
  sections: Record<string, any>
  full_text?: string
  figure_index: Record<string, any>
  ai_model_used?: string
  processing_error?: string
  generated_at: string
  updated_at?: string
}

export const draftService = {
  /**
   * Get patent draft for a disclosure
   */
  async getDraft(disclosureId: number): Promise<PatentDraft> {
    const response = await api.get<PatentDraft>(`/drafts/${disclosureId}`)
    return response.data
  },

  /**
   * Update full text of patent draft
   */
  async updateFullText(draftId: number, fullText: string): Promise<PatentDraft> {
    const response = await api.patch<PatentDraft>(`/drafts/${draftId}/full-text`, {
      full_text: fullText,
    })
    return response.data
  },
}
