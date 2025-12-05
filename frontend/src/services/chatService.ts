import api from './api'

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

export interface ChatRequest {
  messages: ChatMessage[]
  system_prompt?: string
  disclosure_id?: number
}

export interface ChatResponse {
  response: string
}

export const chatService = {
  /**
   * Send a message to the AI drafting assistant
   * @param messages - Array of conversation history
   * @param disclosureId - Optional disclosure ID to include draft and file context
   * @param systemPrompt - Optional system prompt to customize assistant behavior
   * @returns AI response text
   */
  async sendMessage(messages: ChatMessage[], disclosureId?: number, systemPrompt?: string): Promise<string> {
    const response = await api.post<ChatResponse>('/chat/assistant', {
      messages,
      system_prompt: systemPrompt,
      disclosure_id: disclosureId,
    })
    return response.data.response
  },
}
