import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { disclosureService } from '@/services/disclosureService'
import { DisclosureContent, User } from '@/types'

export default function NewDisclosure() {
  const { user: _user } = useAuth()  // Prefix with _ to indicate intentionally unused
  const navigate = useNavigate()

  const [title, setTitle] = useState('')
  const [problem, setProblem] = useState('')
  const [solution, setSolution] = useState('')
  const [technicalDetails, setTechnicalDetails] = useState('')
  const [advantages, setAdvantages] = useState('')
  const [priorArt, setPriorArt] = useState('')
  const [selectedLawyerId, setSelectedLawyerId] = useState<number | ''>('')

  const [lawyers, setLawyers] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingLawyers, setIsLoadingLawyers] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    loadLawyers()
  }, [])

  const loadLawyers = async () => {
    try {
      const data = await disclosureService.getLawyers()
      setLawyers(data)
    } catch (err: any) {
      console.error('Failed to load lawyers:', err)
    } finally {
      setIsLoadingLawyers(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    const content: DisclosureContent = {
      problem,
      solution,
      technical_details: technicalDetails,
      advantages,
      prior_art: priorArt,
    }

    try {
      await disclosureService.create({
        title,
        content,
        assigned_lawyer_id: selectedLawyerId || undefined,
      })
      navigate('/inventor/dashboard')
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to create disclosure')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-primary-50/20 to-neutral-100">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-xl border-b border-neutral-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-semibold text-neutral-900">New Disclosure</h1>
            <p className="text-sm text-neutral-600 mt-1">Create a new invention disclosure</p>
          </div>
          <button
            type="button"
            onClick={() => navigate('/inventor/dashboard')}
            className="btn-ghost text-sm"
          >
            Cancel
          </button>
        </div>
      </header>

      {/* Form */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <form onSubmit={handleSubmit} className="card space-y-8">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
              {error}
            </div>
          )}

          {/* Title */}
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-neutral-700 mb-2">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              id="title"
              type="text"
              required
              className="input-field"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Brief, descriptive title of your invention"
              maxLength={200}
            />
            <p className="text-xs text-neutral-500 mt-1">
              e.g., "AI-Powered Document Analysis System"
            </p>
          </div>

          {/* Lawyer Selection */}
          <div>
            <label htmlFor="lawyer" className="block text-sm font-medium text-neutral-700 mb-2">
              Assign to Patent Attorney (Optional)
            </label>
            <select
              id="lawyer"
              className="input-field"
              value={selectedLawyerId}
              onChange={(e) => setSelectedLawyerId(e.target.value === '' ? '' : Number(e.target.value))}
              disabled={isLoadingLawyers}
            >
              <option value="">-- Select a lawyer (optional) --</option>
              {lawyers.map((lawyer) => (
                <option key={lawyer.id} value={lawyer.id}>
                  {lawyer.full_name || lawyer.email} {lawyer.company && `(${lawyer.company})`}
                </option>
              ))}
            </select>
            <p className="text-xs text-neutral-500 mt-1">
              If selected, the disclosure will be sent directly to the attorney for review
            </p>
          </div>

          {/* Problem */}
          <div>
            <label htmlFor="problem" className="block text-sm font-medium text-neutral-700 mb-2">
              Problem / Background
            </label>
            <textarea
              id="problem"
              className="input-field min-h-[120px]"
              value={problem}
              onChange={(e) => setProblem(e.target.value)}
              placeholder="What problem does this invention solve? What is the current state of the art?"
              rows={6}
            />
          </div>

          {/* Solution */}
          <div>
            <label htmlFor="solution" className="block text-sm font-medium text-neutral-700 mb-2">
              Solution / Innovation
            </label>
            <textarea
              id="solution"
              className="input-field min-h-[120px]"
              value={solution}
              onChange={(e) => setSolution(e.target.value)}
              placeholder="How does your invention solve this problem? What makes it unique?"
              rows={6}
            />
          </div>

          {/* Technical Details */}
          <div>
            <label htmlFor="technicalDetails" className="block text-sm font-medium text-neutral-700 mb-2">
              Technical Details
            </label>
            <textarea
              id="technicalDetails"
              className="input-field min-h-[150px]"
              value={technicalDetails}
              onChange={(e) => setTechnicalDetails(e.target.value)}
              placeholder="Describe the technical implementation, components, methods, algorithms, etc."
              rows={8}
            />
          </div>

          {/* Advantages */}
          <div>
            <label htmlFor="advantages" className="block text-sm font-medium text-neutral-700 mb-2">
              Advantages & Benefits
            </label>
            <textarea
              id="advantages"
              className="input-field min-h-[100px]"
              value={advantages}
              onChange={(e) => setAdvantages(e.target.value)}
              placeholder="What are the key advantages over existing solutions?"
              rows={5}
            />
          </div>

          {/* Prior Art */}
          <div>
            <label htmlFor="priorArt" className="block text-sm font-medium text-neutral-700 mb-2">
              Prior Art / Existing Solutions
            </label>
            <textarea
              id="priorArt"
              className="input-field min-h-[100px]"
              value={priorArt}
              onChange={(e) => setPriorArt(e.target.value)}
              placeholder="Are you aware of any similar inventions or prior art?"
              rows={5}
            />
          </div>

          {/* Submit Buttons */}
          <div className="flex justify-end gap-4 pt-6 border-t border-neutral-200">
            <button
              type="button"
              onClick={() => navigate('/inventor/dashboard')}
              className="btn-ghost"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={isLoading || !title.trim()}
            >
              {isLoading ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Creating...
                </span>
              ) : (
                'Create Disclosure'
              )}
            </button>
          </div>
        </form>
      </main>
    </div>
  )
}
