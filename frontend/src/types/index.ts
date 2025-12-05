// User types
export enum UserRole {
  INVENTOR = 'INVENTOR',
  LAWYER = 'LAWYER',
  ADMIN = 'ADMIN',
}

export interface User {
  id: number
  email: string
  role: UserRole
  full_name?: string
  company?: string
  created_at: string
}

export interface LoginRequest {
  email: string
  password: string
}

export interface SignupRequest {
  email: string
  password: string
  role: UserRole
  full_name?: string
  company?: string
}

export interface AuthResponse {
  access_token: string
  refresh_token: string
  token_type: string
  user: User
}

// Disclosure types
export enum DisclosureStatus {
  DRAFT = 'DRAFT',
  AI_PROCESSING = 'AI_PROCESSING',
  READY_FOR_REVIEW = 'READY_FOR_REVIEW',
  IN_REVIEW = 'IN_REVIEW',
  REVISION_REQUESTED = 'REVISION_REQUESTED',
  APPROVED = 'APPROVED',
}

export interface DisclosureContent {
  problem?: string
  solution?: string
  technical_details?: string
  advantages?: string
  prior_art?: string
  [key: string]: any
}

export interface Disclosure {
  id: number
  title: string
  status: DisclosureStatus
  inventor_id: number
  assigned_lawyer_id?: number
  content: DisclosureContent
  created_at: string
  updated_at?: string
}

export interface DisclosureCreate {
  title: string
  content: DisclosureContent
  assigned_lawyer_id?: number
}

// Patent Draft types
export enum AIProcessingStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
}

export interface PatentDraft {
  id: number
  disclosure_id: number
  ai_processing_status: AIProcessingStatus
  sections: {
    background?: string
    summary?: string
    detailed_description?: string
    claims?: string[]
    abstract?: string
  }
  figure_index: Record<string, any>
  ai_model_used?: string
  processing_error?: string
  generated_at: string
  updated_at?: string
}

// Comment types
export interface Comment {
  id: number
  disclosure_id: number
  author_id: number
  content: string
  parent_comment_id?: number
  created_at: string
  updated_at?: string
  author_name?: string
  author_role?: string

  // Text selection fields
  selected_text?: string
  selection_start?: number
  selection_end?: number
}

export interface CommentCreate {
  content: string
  parent_comment_id?: number

  // Text selection fields (optional)
  selected_text?: string
  selection_start?: number
  selection_end?: number
}

// Thread comment with replies
export interface CommentThread extends Comment {
  replies: CommentThread[]
}

// File types
export enum FileType {
  DRAWING = 'DRAWING',
  DOCUMENT = 'DOCUMENT',
  IMAGE = 'IMAGE',
}

export interface FileMetadata {
  id: number
  disclosure_id: number
  file_type: FileType
  original_filename: string
  file_extension: string
  file_size: number
  uploaded_at: string
}

// API response types
export interface ApiError {
  detail: string
}
