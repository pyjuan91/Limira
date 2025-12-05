import { useState, useRef } from 'react'
import { patentAnalysisService, PatentAnalysisResponse } from '@/services/patentAnalysisService'

export default function PatentAnalysis() {
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysis, setAnalysis] = useState<PatentAnalysisResponse | null>(null)
  const [patentNumber, setPatentNumber] = useState('')
  const [error, setError] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (selectedFile: File | null) => {
    if (!selectedFile) return

    setIsAnalyzing(true)
    setError('')
    setAnalysis(null)

    try {
      const result = await patentAnalysisService.analyzePatent(selectedFile, patentNumber || undefined)
      setAnalysis(result)
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message || 'Failed to analyze patent')
    } finally {
      setIsAnalyzing(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const getValueColor = (assessment: string) => {
    if (assessment?.toLowerCase().includes('undervalued')) return 'text-green-600 bg-green-50'
    if (assessment?.toLowerCase().includes('overvalued')) return 'text-red-600 bg-red-50'
    return 'text-blue-600 bg-blue-50'
  }

  const getBadgeColor = (level: string) => {
    const l = level?.toLowerCase() || ''
    if (l.includes('high') || l.includes('revolutionary') || l.includes('strong')) {
      return 'bg-emerald-100 text-emerald-700'
    }
    if (l.includes('medium') || l.includes('moderate') || l.includes('significant')) {
      return 'bg-amber-100 text-amber-700'
    }
    return 'bg-neutral-100 text-neutral-700'
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="mb-6 pb-4 border-b border-neutral-200">
        <h2 className="text-xl font-semibold text-neutral-900 mb-2">Patent Analysis</h2>
        <p className="text-sm text-neutral-600">
          Upload a patent PDF from Google Patents for AI-powered analysis and valuation insights
        </p>
      </div>

      {/* Upload Section */}
      {!analysis && (
        <div className="mb-6">
          <div className="mb-4">
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Patent Number (optional)
            </label>
            <input
              type="text"
              value={patentNumber}
              onChange={(e) => setPatentNumber(e.target.value)}
              placeholder="e.g., US1234567"
              className="input-field w-full max-w-md"
              disabled={isAnalyzing}
            />
          </div>

          <div className="p-8 border-2 border-dashed border-neutral-300 rounded-xl text-center hover:border-navy-400 hover:bg-neutral-50 transition-colors">
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf"
              onChange={(e) => handleFileSelect(e.target.files?.[0] || null)}
              className="hidden"
              disabled={isAnalyzing}
            />
            <div className="text-5xl mb-3">📄</div>
            <h3 className="text-lg font-medium text-neutral-900 mb-2">Upload Patent PDF</h3>
            <p className="text-sm text-neutral-600 mb-4">
              Select a PDF file from Google Patents or other sources
            </p>
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isAnalyzing}
              className="btn-primary"
            >
              {isAnalyzing ? (
                <>
                  <svg
                    className="animate-spin -ml-1 mr-2 h-4 w-4 text-white inline"
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
                  Analyzing... This may take 30-60 seconds
                </>
              ) : (
                'Select PDF File'
              )}
            </button>
            <p className="text-xs text-neutral-400 mt-3">PDF files up to 50MB</p>
          </div>

          {error && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}
        </div>
      )}

      {/* Analysis Results */}
      {analysis && (
        <div className="flex-1 overflow-y-auto">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-neutral-900">{analysis.filename}</h3>
              {analysis.patent_number && (
                <p className="text-sm text-neutral-600">Patent: {analysis.patent_number}</p>
              )}
            </div>
            <button onClick={() => setAnalysis(null)} className="btn-ghost text-sm">
              Analyze Another
            </button>
          </div>

          <div className="space-y-6">
            {/* Summary */}
            <div className="card p-4 bg-navy-50 border-navy-200">
              <h4 className="text-sm font-semibold text-navy-900 mb-2">Summary</h4>
              <p className="text-sm text-navy-700 leading-relaxed">{analysis.analysis.summary}</p>
            </div>

            {/* Value Assessment - Highlighted */}
            <div className={`card p-5 border-2 ${getValueColor(analysis.analysis.commercial_value.estimated_value_assessment)}`}>
              <div className="flex items-start justify-between mb-3">
                <h4 className="text-lg font-bold">Value Assessment</h4>
                <span className="px-3 py-1 rounded-full text-sm font-semibold bg-white shadow-sm">
                  {analysis.analysis.commercial_value.estimated_value_assessment}
                </span>
              </div>
              <p className="text-sm leading-relaxed mb-3">
                {analysis.analysis.commercial_value.reasoning}
              </p>
              <div className="flex items-center gap-2 text-sm">
                <span className="font-medium">Market Potential:</span>
                <span className={`px-2 py-0.5 rounded ${getBadgeColor(analysis.analysis.commercial_value.market_potential)}`}>
                  {analysis.analysis.commercial_value.market_potential}
                </span>
              </div>
            </div>

            {/* Technical Assessment */}
            <div className="card p-4">
              <h4 className="text-sm font-semibold text-neutral-900 mb-3">Technical Assessment</h4>
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div>
                  <p className="text-xs text-neutral-500 mb-1">Innovation Level</p>
                  <span className={`px-2 py-1 rounded text-sm ${getBadgeColor(analysis.analysis.technical_assessment.innovation_level)}`}>
                    {analysis.analysis.technical_assessment.innovation_level}
                  </span>
                </div>
                <div>
                  <p className="text-xs text-neutral-500 mb-1">Technical Complexity</p>
                  <span className={`px-2 py-1 rounded text-sm ${getBadgeColor(analysis.analysis.technical_assessment.technical_complexity)}`}>
                    {analysis.analysis.technical_assessment.technical_complexity}
                  </span>
                </div>
                <div>
                  <p className="text-xs text-neutral-500 mb-1">Implementation</p>
                  <span className={`px-2 py-1 rounded text-sm ${getBadgeColor(analysis.analysis.technical_assessment.implementation_difficulty)}`}>
                    {analysis.analysis.technical_assessment.implementation_difficulty}
                  </span>
                </div>
                <div>
                  <p className="text-xs text-neutral-500 mb-1">Technical Field</p>
                  <p className="text-sm text-neutral-700">
                    {analysis.analysis.technical_assessment.technical_field}
                  </p>
                </div>
              </div>
              <div>
                <p className="text-xs text-neutral-500 mb-2">Key Innovations</p>
                <ul className="list-disc list-inside text-sm text-neutral-700 space-y-1">
                  {analysis.analysis.technical_assessment.key_innovations.map((innovation, idx) => (
                    <li key={idx}>{innovation}</li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Commercial Applications */}
            <div className="card p-4">
              <h4 className="text-sm font-semibold text-neutral-900 mb-2">Potential Applications</h4>
              <ul className="list-disc list-inside text-sm text-neutral-700 space-y-1">
                {analysis.analysis.commercial_value.potential_applications.map((app, idx) => (
                  <li key={idx}>{app}</li>
                ))}
              </ul>
              <div className="mt-3 pt-3 border-t border-neutral-200">
                <p className="text-xs text-neutral-500 mb-1">Competitive Advantage</p>
                <p className="text-sm text-neutral-700">
                  {analysis.analysis.commercial_value.competitive_advantage}
                </p>
              </div>
            </div>

            {/* Strategic Insights */}
            <div className="card p-4">
              <h4 className="text-sm font-semibold text-neutral-900 mb-3">Strategic Insights</h4>
              <div className="grid grid-cols-3 gap-3 mb-3">
                <div>
                  <p className="text-xs text-neutral-500 mb-1">Licensing Potential</p>
                  <span className={`px-2 py-1 rounded text-sm ${getBadgeColor(analysis.analysis.strategic_insights.licensing_potential)}`}>
                    {analysis.analysis.strategic_insights.licensing_potential}
                  </span>
                </div>
                <div>
                  <p className="text-xs text-neutral-500 mb-1">Enforcement</p>
                  <span className={`px-2 py-1 rounded text-sm ${getBadgeColor(analysis.analysis.strategic_insights.enforcement_strength)}`}>
                    {analysis.analysis.strategic_insights.enforcement_strength}
                  </span>
                </div>
                <div>
                  <p className="text-xs text-neutral-500 mb-1">Portfolio Fit</p>
                  <p className="text-sm text-neutral-700">
                    {analysis.analysis.strategic_insights.portfolio_fit}
                  </p>
                </div>
              </div>
              <div>
                <p className="text-xs text-neutral-500 mb-2">Recommended Actions</p>
                <ul className="list-disc list-inside text-sm text-neutral-700 space-y-1">
                  {analysis.analysis.strategic_insights.recommended_actions.map((action, idx) => (
                    <li key={idx}>{action}</li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Claims Analysis */}
            <div className="card p-4">
              <h4 className="text-sm font-semibold text-neutral-900 mb-3">Claims Analysis</h4>
              <div className="grid grid-cols-3 gap-3 mb-3">
                <div>
                  <p className="text-xs text-neutral-500 mb-1">Total Claims</p>
                  <p className="text-lg font-semibold text-neutral-900">
                    {analysis.analysis.claims_analysis.total_claims}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-neutral-500 mb-1">Independent Claims</p>
                  <p className="text-lg font-semibold text-neutral-900">
                    {analysis.analysis.claims_analysis.independent_claims}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-neutral-500 mb-1">Claim Scope</p>
                  <span className={`px-2 py-1 rounded text-sm ${getBadgeColor(analysis.analysis.claims_analysis.claim_scope)}`}>
                    {analysis.analysis.claims_analysis.claim_scope}
                  </span>
                </div>
              </div>
              {analysis.analysis.claims_analysis.key_limitations.length > 0 && (
                <div>
                  <p className="text-xs text-neutral-500 mb-2">Key Limitations</p>
                  <ul className="list-disc list-inside text-sm text-neutral-700 space-y-1">
                    {analysis.analysis.claims_analysis.key_limitations.map((limitation, idx) => (
                      <li key={idx}>{limitation}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Risk Assessment */}
            <div className="card p-4 bg-amber-50 border-amber-200">
              <h4 className="text-sm font-semibold text-amber-900 mb-3">Risk Assessment</h4>
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div>
                  <p className="text-xs text-amber-700 mb-1">Invalidation Risk</p>
                  <span className={`px-2 py-1 rounded text-sm ${getBadgeColor(analysis.analysis.risk_assessment.invalidation_risk)}`}>
                    {analysis.analysis.risk_assessment.invalidation_risk}
                  </span>
                </div>
                <div>
                  <p className="text-xs text-amber-700 mb-1">Design-Around Difficulty</p>
                  <span className={`px-2 py-1 rounded text-sm ${getBadgeColor(analysis.analysis.risk_assessment.design_around_difficulty)}`}>
                    {analysis.analysis.risk_assessment.design_around_difficulty}
                  </span>
                </div>
              </div>
              {analysis.analysis.risk_assessment.potential_challenges.length > 0 && (
                <div>
                  <p className="text-xs text-amber-700 mb-2">Potential Challenges</p>
                  <ul className="list-disc list-inside text-sm text-amber-900 space-y-1">
                    {analysis.analysis.risk_assessment.potential_challenges.map((challenge, idx) => (
                      <li key={idx}>{challenge}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Prior Art Landscape */}
            <div className="card p-4">
              <h4 className="text-sm font-semibold text-neutral-900 mb-3">Prior Art Landscape</h4>
              <div className="mb-3">
                <p className="text-xs text-neutral-500 mb-1">Novelty Assessment</p>
                <span className={`px-2 py-1 rounded text-sm ${getBadgeColor(analysis.analysis.prior_art_landscape.novelty_assessment)}`}>
                  {analysis.analysis.prior_art_landscape.novelty_assessment}
                </span>
              </div>
              {analysis.analysis.prior_art_landscape.similar_technologies.length > 0 && (
                <div className="mb-3">
                  <p className="text-xs text-neutral-500 mb-2">Similar Technologies</p>
                  <ul className="list-disc list-inside text-sm text-neutral-700 space-y-1">
                    {analysis.analysis.prior_art_landscape.similar_technologies.map((tech, idx) => (
                      <li key={idx}>{tech}</li>
                    ))}
                  </ul>
                </div>
              )}
              {analysis.analysis.prior_art_landscape.differentiation_factors.length > 0 && (
                <div>
                  <p className="text-xs text-neutral-500 mb-2">Differentiation Factors</p>
                  <ul className="list-disc list-inside text-sm text-neutral-700 space-y-1">
                    {analysis.analysis.prior_art_landscape.differentiation_factors.map((factor, idx) => (
                      <li key={idx}>{factor}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
