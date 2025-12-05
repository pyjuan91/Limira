import api from './api'
import { FileMetadata } from '@/types'

export interface FileUploadResponse extends FileMetadata {
  s3_key?: string
  s3_bucket?: string
}

export const fileService = {
  /**
   * Get all files for a disclosure
   */
  async getFiles(disclosureId: number): Promise<FileMetadata[]> {
    const response = await api.get<FileMetadata[]>(`/files/disclosure/${disclosureId}/files`)
    return response.data
  },

  /**
   * Upload a file to a disclosure
   */
  async uploadFile(disclosureId: number, file: File): Promise<FileUploadResponse> {
    const formData = new FormData()
    formData.append('file', file)

    const response = await api.post<FileUploadResponse>(
      `/files/upload/${disclosureId}`,
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
   * Download a file
   */
  async downloadFile(fileId: number): Promise<Blob> {
    const response = await api.get(`/files/${fileId}/download`, {
      responseType: 'blob',
    })
    return response.data
  },

  /**
   * Delete a file
   */
  async deleteFile(fileId: number): Promise<void> {
    await api.delete(`/files/${fileId}`)
  },

  /**
   * Get download URL for a file
   */
  getDownloadUrl(fileId: number): string {
    return `/api/files/${fileId}/download`
  },
}
