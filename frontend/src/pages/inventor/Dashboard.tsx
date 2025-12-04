import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { disclosureService } from '@/services/disclosureService'
import { Disclosure, DisclosureStatus } from '@/types'

export default function InventorDashboard() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [disclosures, setDisclosures] = useState<Disclosure[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    loadDisclosures()
  }, [])

  const loadDisclosures = async () => {
    try {
      const data = await disclosureService.getAll()
      setDisclosures(data)
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load disclosures')
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusBadge = (status: DisclosureStatus) => {
    const badges = {
      [DisclosureStatus.DRAFT]: 'badge-draft',
      [DisclosureStatus.AI_PROCESSING]: 'badge-processing',
      [DisclosureStatus.READY_FOR_REVIEW]: 'badge-ready',
      [DisclosureStatus.IN_REVIEW]: 'badge-approved',
      [DisclosureStatus.REVISION_REQUESTED]: 'badge-revision',
      [DisclosureStatus.APPROVED]: 'badge-approved',
    }
    return badges[status] || 'badge-draft'
  }

  const handleLogout = () => {
    logout()
    navigate('/welcome')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-primary-50/20 to-neutral-100">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-xl border-b border-neutral-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-semibold text-neutral-900 tracking-tight">Limira</h1>
            <p className="text-sm text-neutral-600 mt-1">Inventor Portal</p>
          </div>
          <div className="flex items-center gap-6">
            <div className="text-right">
              <p className="text-sm font-medium text-neutral-900">{user?.full_name || user?.email}</p>
              <p className="text-xs text-neutral-500 mt-0.5">{user?.company || 'Inventor'}</p>
            </div>
            <button onClick={handleLogout} className="btn-ghost text-sm">
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-semibold text-neutral-900 tracking-tight">My Disclosures</h2>
          <button
            onClick={() => navigate('/inventor/new-disclosure')}
            className="btn-primary"
          >
            <svg className="w-5 h-5 inline-block mr-2 -ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New Disclosure
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-6 text-sm">
            {error}
          </div>
        )}

        {isLoading ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-neutral-600">Loading disclosures...</p>
          </div>
        ) : disclosures.length === 0 ? (
          <div className="card text-center py-16">
            <div className="w-20 h-20 bg-primary-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-neutral-900 mb-2">No disclosures yet</h3>
            <p className="text-neutral-600 mb-6">Create your first disclosure to get started!</p>
            <button
              onClick={() => navigate('/inventor/new-disclosure')}
              className="btn-primary"
            >
              <svg className="w-5 h-5 inline-block mr-2 -ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Create Disclosure
            </button>
          </div>
        ) : (
          <div className="grid gap-5">
            {disclosures.map((disclosure) => (
              <div
                key={disclosure.id}
                onClick={() => navigate(`/inventor/disclosure/${disclosure.id}`)}
                className="card-hover cursor-pointer transition-all hover:shadow-lg hover:-translate-y-0.5"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-neutral-900 mb-2">{disclosure.title}</h3>
                    <div className="flex items-center gap-4 text-sm text-neutral-600">
                      <span className="flex items-center">
                        <svg className="w-4 h-4 mr-1.5 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        {new Date(disclosure.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <span className={`status-badge ${getStatusBadge(disclosure.status)}`}>
                    {disclosure.status.replace(/_/g, ' ')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
