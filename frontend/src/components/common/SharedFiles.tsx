import { useState, useRef, useEffect } from 'react'
import { FileMetadata, FileType } from '@/types'
import { fileService } from '@/services/fileService'

interface SharedFilesProps {
  disclosureId: number
}

export default function SharedFiles({ disclosureId }: SharedFilesProps) {
  const [files, setFiles] = useState<FileMetadata[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    loadFiles()
  }, [disclosureId])

  const loadFiles = async () => {
    try {
      const data = await fileService.getFiles(disclosureId)
      setFiles(data)
    } catch (err: any) {
      console.error('Failed to load files:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleFileSelect = async (selectedFiles: FileList | null) => {
    if (!selectedFiles || selectedFiles.length === 0) return

    setIsUploading(true)
    setUploadProgress(0)

    try {
      // Upload files one by one
      for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i]
        await fileService.uploadFile(disclosureId, file)
        setUploadProgress(((i + 1) / selectedFiles.length) * 100)
      }

      // Reload files
      await loadFiles()
    } catch (err: any) {
      alert('Failed to upload file: ' + (err.response?.data?.detail || err.message || 'Unknown error'))
    } finally {
      setIsUploading(false)
      setUploadProgress(0)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleDownload = async (file: FileMetadata) => {
    try {
      const blob = await fileService.downloadFile(file.id)
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = file.original_filename
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (err: any) {
      alert('Failed to download file: ' + (err.response?.data?.detail || err.message || 'Unknown error'))
    }
  }

  const handleDelete = async (file: FileMetadata) => {
    if (!confirm(`Are you sure you want to delete "${file.original_filename}"?`)) return

    try {
      await fileService.deleteFile(file.id)
      await loadFiles()
    } catch (err: any) {
      alert('Failed to delete file: ' + (err.response?.data?.detail || err.message || 'Unknown error'))
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    handleFileSelect(e.dataTransfer.files)
  }

  const getFileIcon = (file: FileMetadata) => {
    const ext = file.file_extension.toLowerCase()

    if (['.pdf'].includes(ext)) return '📄'
    if (['.png', '.jpg', '.jpeg', '.gif', '.svg'].includes(ext)) return '🖼️'
    if (['.docx', '.doc'].includes(ext)) return '📝'
    return '📎'
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-navy-200 border-t-navy-700 rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-neutral-600 text-sm">Loading files...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="mb-4 pb-3 border-b border-neutral-200">
        <h2 className="text-lg font-semibold text-neutral-900 mb-2">Shared Files</h2>
        <p className="text-sm text-neutral-600">Upload and manage documents, drawings, and images</p>
      </div>

      {/* Upload Area */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`mb-4 p-6 border-2 border-dashed rounded-xl transition-colors ${
          isDragging
            ? 'border-navy-500 bg-navy-50'
            : 'border-neutral-300 hover:border-navy-400 hover:bg-neutral-50'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          onChange={(e) => handleFileSelect(e.target.files)}
          className="hidden"
          accept=".pdf,.png,.jpg,.jpeg,.docx,.doc"
        />
        <div className="text-center">
          <div className="text-4xl mb-2">📁</div>
          <p className="text-sm font-medium text-neutral-700 mb-1">
            {isDragging ? 'Drop files here' : 'Drag & drop files here'}
          </p>
          <p className="text-xs text-neutral-500 mb-3">or</p>
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="btn-primary text-sm"
          >
            {isUploading ? 'Uploading...' : 'Browse Files'}
          </button>
          <p className="text-xs text-neutral-400 mt-2">PDF, PNG, JPG, DOCX (Max 10MB)</p>
        </div>

        {/* Upload Progress */}
        {isUploading && (
          <div className="mt-4">
            <div className="w-full bg-neutral-200 rounded-full h-2">
              <div
                className="bg-navy-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              ></div>
            </div>
            <p className="text-xs text-neutral-600 mt-1 text-center">{uploadProgress.toFixed(0)}%</p>
          </div>
        )}
      </div>

      {/* Files List */}
      <div className="flex-1 overflow-y-auto">
        {files.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-3 opacity-50">📂</div>
            <p className="text-neutral-500">No files uploaded yet</p>
            <p className="text-xs text-neutral-400 mt-1">Upload files to share with the team</p>
          </div>
        ) : (
          <div className="space-y-2">
            {files.map((file) => (
              <div
                key={file.id}
                className="p-3 bg-white border border-neutral-200 rounded-lg hover:border-navy-300 hover:shadow-sm transition-all group"
              >
                <div className="flex items-start gap-3">
                  {/* File Icon */}
                  <div className="text-3xl flex-shrink-0">{getFileIcon(file)}</div>

                  {/* File Info */}
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-medium text-neutral-900 truncate">
                      {file.original_filename}
                    </h4>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-neutral-500">{formatFileSize(file.file_size)}</span>
                      <span className="text-neutral-300">•</span>
                      <span className="text-xs text-neutral-500">
                        {new Date(file.uploaded_at).toLocaleDateString()}
                      </span>
                      <span className="text-neutral-300">•</span>
                      <span className="text-xs px-2 py-0.5 bg-neutral-100 text-neutral-600 rounded">
                        {file.file_type}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => handleDownload(file)}
                      className="p-2 hover:bg-navy-50 rounded-lg transition-colors"
                      title="Download"
                    >
                      <svg className="w-4 h-4 text-navy-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleDelete(file)}
                      className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete"
                    >
                      <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
