import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { disclosureService } from '@/services/disclosureService'
import { Disclosure, DisclosureStatus } from '@/types'

export default function LawyerDashboard() {
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

  const pendingReviews = disclosures.filter(
    (d) => d.status === DisclosureStatus.READY_FOR_REVIEW || d.status === DisclosureStatus.IN_REVIEW
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-navy-50/20 to-neutral-100">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-xl border-b border-neutral-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-semibold text-neutral-900 tracking-tight">Limira</h1>
            <p className="text-sm text-navy-700 mt-1 font-medium">Patent Attorney Portal</p>
          </div>
          <div className="flex items-center gap-6">
            <div className="text-right">
              <p className="text-sm font-medium text-neutral-900">{user?.full_name || user?.email}</p>
              <p className="text-xs text-neutral-500 mt-0.5">Patent Attorney</p>
            </div>
            <button onClick={handleLogout} className="btn-ghost text-sm">
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="card group">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-neutral-600">Assigned Cases</h3>
                <p className="text-4xl font-semibold text-neutral-900 mt-3 tracking-tight">{disclosures.length}</p>
              </div>
              <div className="w-14 h-14 bg-navy-100 rounded-2xl flex items-center justify-center group-hover:bg-navy-700 transition-colors">
                <svg className="w-7 h-7 text-navy-700 group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
            </div>
          </div>
          <div className="card group">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-neutral-600">Pending Reviews</h3>
                <p className="text-4xl font-semibold text-amber-600 mt-3 tracking-tight">{pendingReviews.length}</p>
              </div>
              <div className="w-14 h-14 bg-amber-100 rounded-2xl flex items-center justify-center group-hover:bg-amber-500 transition-colors">
                <svg className="w-7 h-7 text-amber-600 group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>
          <div className="card group">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-neutral-600">Approved</h3>
                <p className="text-4xl font-semibold text-emerald-600 mt-3 tracking-tight">
                  {disclosures.filter((d) => d.status === DisclosureStatus.APPROVED).length}
                </p>
              </div>
              <div className="w-14 h-14 bg-emerald-100 rounded-2xl flex items-center justify-center group-hover:bg-emerald-600 transition-colors">
                <svg className="w-7 h-7 text-emerald-600 group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        <h2 className="text-2xl font-semibold text-neutral-900 mb-8 tracking-tight">Assigned Disclosures</h2>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-6 text-sm">
            {error}
          </div>
        )}

        {isLoading ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 border-4 border-navy-200 border-t-navy-700 rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-neutral-600">Loading disclosures...</p>
          </div>
        ) : disclosures.length === 0 ? (
          <div className="card text-center py-16">
            <div className="w-20 h-20 bg-navy-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-navy-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-neutral-900 mb-2">No assigned disclosures yet</h3>
            <p className="text-neutral-600">You'll see patent applications here once they're assigned to you.</p>
          </div>
        ) : (
          <div className="grid gap-5">
            {disclosures.map((disclosure) => (
              <div key={disclosure.id} className="card-hover">
                <div className="flex justify-between items-start gap-6">
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="text-lg font-semibold text-neutral-900">{disclosure.title}</h3>
                      <span className={`status-badge ${getStatusBadge(disclosure.status)}`}>
                        {disclosure.status.replace(/_/g, ' ')}
                      </span>
                    </div>
                    <div className="flex items-center gap-6 text-sm text-neutral-600">
                      <span className="flex items-center">
                        <svg className="w-4 h-4 mr-1.5 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        {new Date(disclosure.created_at).toLocaleDateString()}
                      </span>
                      <span className="flex items-center">
                        <svg className="w-4 h-4 mr-1.5 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                        </svg>
                        ID: #{disclosure.id}
                      </span>
                    </div>
                    {(disclosure.status === DisclosureStatus.READY_FOR_REVIEW ||
                      disclosure.status === DisclosureStatus.IN_REVIEW) && (
                      <button className="mt-4 bg-navy-700 hover:bg-navy-800 text-white px-5 py-2.5 rounded-xl font-medium text-sm transition-all duration-200 hover:scale-[1.02] active:scale-95">
                        Review Draft
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
