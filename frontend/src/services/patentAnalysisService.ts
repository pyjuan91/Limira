import api from './api'

export interface TechnicalAssessment {
  innovation_level: string
  technical_complexity: string
  key_innovations: string[]
  technical_field: string
  implementation_difficulty: string
}

export interface CommercialValue {
  market_potential: string
  potential_applications: string[]
  competitive_advantage: string
  estimated_value_assessment: string
  reasoning: string
}

export interface PriorArtLandscape {
  novelty_assessment: string
  similar_technologies: string[]
  differentiation_factors: string[]
}

export interface StrategicInsights {
  licensing_potential: string
  enforcement_strength: string
  portfolio_fit: string
  recommended_actions: string[]
}

export interface ClaimsAnalysis {
  total_claims: number
  independent_claims: number
  claim_scope: string
  key_limitations: string[]
}

export interface RiskAssessment {
  invalidation_risk: string
  design_around_difficulty: string
  potential_challenges: string[]
}

export interface PatentAnalysis {
  summary: string
  technical_assessment: TechnicalAssessment
  commercial_value: CommercialValue
  prior_art_landscape: PriorArtLandscape
  strategic_insights: StrategicInsights
  claims_analysis: ClaimsAnalysis
  risk_assessment: RiskAssessment
}

export interface PatentAnalysisResponse {
  filename: string
  patent_number?: string
  file_size: number
  extracted_text_length: number
  analysis: PatentAnalysis
}

export const patentAnalysisService = {
  /**
   * Analyze a patent PDF file
   */
  async analyzePatent(file: File, patentNumber?: string): Promise<PatentAnalysisResponse> {
    const formData = new FormData()
    formData.append('file', file)
    if (patentNumber) {
      formData.append('patent_number', patentNumber)
    }

    const response = await api.post<PatentAnalysisResponse>(
      '/patent-analysis/analyze',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    )
    return response.data
  },

  /**
   * Get a quick summary of a patent (faster, less detailed)
   */
  async quickSummary(file: File): Promise<{ filename: string; summary: string }> {
    const formData = new FormData()
    formData.append('file', file)

    const response = await api.post<{ filename: string; summary: string }>(
      '/patent-analysis/quick-summary',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    )
    return response.data
  },
}
