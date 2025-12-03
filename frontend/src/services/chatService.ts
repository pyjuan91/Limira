import api from './api'

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

export interface ChatRequest {
  messages: ChatMessage[]
  system_prompt?: string
}

export interface ChatResponse {
  response: string
}

export const chatService = {
  /**
   * Send a message to the AI drafting assistant
   * @param messages - Array of conversation history
   * @param systemPrompt - Optional system prompt to customize assistant behavior
   * @returns AI response text
   */
  async sendMessage(messages: ChatMessage[], systemPrompt?: string): Promise<string> {
    const response = await api.post<ChatResponse>('/chat/assistant', {
      messages,
      system_prompt: systemPrompt,
    })
    return response.data.response
  },
}
