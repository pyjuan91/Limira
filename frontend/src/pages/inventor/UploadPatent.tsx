import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { disclosureService } from '@/services/disclosureService'
import { fileService } from '@/services/fileService'
import { User, DisclosureType } from '@/types'

export default function UploadPatent() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [title, setTitle] = useState('')
  const [patentNumber, setPatentNumber] = useState('')
  const [selectedLawyer, setSelectedLawyer] = useState<number | null>(null)
  const [lawyers, setLawyers] = useState<User[]>([])
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [uploadProgress, setUploadProgress] = useState(0)

  useEffect(() => {
    loadLawyers()
  }, [])

  const loadLawyers = async () => {
    try {
      const data = await disclosureService.getLawyers()
      setLawyers(data)
    } catch (err) {
      console.error('Failed to load lawyers:', err)
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.type !== 'application/pdf') {
        setError('Please select a PDF file')
        return
      }
      if (file.size > 50 * 1024 * 1024) {
        setError('File size must be less than 50MB')
        return
      }
      setSelectedFile(file)
      setError('')

      // Auto-fill title from filename if empty
      if (!title) {
        const nameWithoutExt = file.name.replace(/\.pdf$/i, '')
        setTitle(nameWithoutExt)
      }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) {
      setError('Please enter a title')
      return
    }
    if (!selectedFile) {
      setError('Please select a patent PDF file')
      return
    }

    setIsSubmitting(true)
    setError('')

    try {
      // Step 1: Create the PATENT_REVIEW disclosure
      setUploadProgress(10)
      const disclosure = await disclosureService.create({
        title: title.trim(),
        disclosure_type: DisclosureType.PATENT_REVIEW,
        content: {},
        assigned_lawyer_id: selectedLawyer || undefined,
        patent_number: patentNumber.trim() || undefined,
      })

      // Step 2: Upload the patent PDF
      setUploadProgress(30)
      const uploadedFile = await fileService.uploadFile(disclosure.id, selectedFile)

      // Step 3: Set the patent file
      setUploadProgress(70)
      await disclosureService.setPatentFile(disclosure.id, uploadedFile.id)

      setUploadProgress(100)

      // Navigate to the disclosure detail page
      navigate(`/inventor/disclosure/${disclosure.id}`)
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to upload patent')
      setUploadProgress(0)
    } finally {
      setIsSubmitting(false)
    }
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
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/inventor/dashboard')}
              className="text-neutral-600 hover:text-neutral-900 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </button>
            <div>
              <h1 className="text-2xl font-semibold text-neutral-900 tracking-tight">Upload Existing Document</h1>
              <p className="text-sm text-neutral-600 mt-1">Submit a document for review and discussion</p>
            </div>
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
      <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="card">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
                {error}
              </div>
            )}

            {/* Patent Title */}
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-neutral-700 mb-2">
                Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="input-field w-full"
                placeholder="Enter the title"
                required
              />
            </div>

            {/* Patent Number */}
            {/* <div>
              <label htmlFor="patentNumber" className="block text-sm font-medium text-neutral-700 mb-2">
                Patent Number <span className="text-neutral-400">(optional)</span>
              </label>
              <input
                type="text"
                id="patentNumber"
                value={patentNumber}
                onChange={(e) => setPatentNumber(e.target.value)}
                className="input-field w-full"
                placeholder="e.g., US10,123,456 or EP1234567"
              />
            </div> */}

            {/* File Upload */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                PDF <span className="text-red-500">*</span>
              </label>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileSelect}
                accept=".pdf"
                className="hidden"
              />
              <div
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
                  selectedFile
                    ? 'border-primary-300 bg-primary-50'
                    : 'border-neutral-300 hover:border-primary-400 hover:bg-neutral-50'
                }`}
              >
                {selectedFile ? (
                  <div className="flex items-center justify-center gap-3">
                    <svg className="w-8 h-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div className="text-left">
                      <p className="font-medium text-neutral-900">{selectedFile.name}</p>
                      <p className="text-sm text-neutral-500">
                        {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                ) : (
                  <>
                    <svg className="w-12 h-12 text-neutral-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    <p className="text-neutral-600 mb-1">Click to upload PDF</p>
                    <p className="text-sm text-neutral-400">PDF files up to 50MB</p>
                  </>
                )}
              </div>
            </div>

            {/* Lawyer Selection */}
            <div>
              <label htmlFor="lawyer" className="block text-sm font-medium text-neutral-700 mb-2">
                Assign Attorney <span className="text-neutral-400">(optional)</span>
              </label>
              <select
                id="lawyer"
                value={selectedLawyer || ''}
                onChange={(e) => setSelectedLawyer(e.target.value ? parseInt(e.target.value) : null)}
                className="input-field w-full"
              >
                <option value="">Select an attorney...</option>
                {lawyers.map((lawyer) => (
                  <option key={lawyer.id} value={lawyer.id}>
                    {lawyer.full_name || lawyer.email}
                  </option>
                ))}
              </select>
              <p className="text-xs text-neutral-500 mt-1">
                You can assign an attorney now or do it later
              </p>
            </div>

            {/* Progress Bar */}
            {isSubmitting && uploadProgress > 0 && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm text-neutral-600">
                  <span>Uploading...</span>
                  <span>{uploadProgress}%</span>
                </div>
                <div className="w-full bg-neutral-200 rounded-full h-2">
                  <div
                    className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            )}

            {/* Submit Button */}
            <div className="flex gap-4 pt-4">
              <button
                type="button"
                onClick={() => navigate('/inventor/dashboard')}
                className="btn-secondary flex-1"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn-primary flex-1"
                disabled={isSubmitting || !title.trim() || !selectedFile}
              >
                {isSubmitting ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Uploading...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    Upload Document
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  )
}
