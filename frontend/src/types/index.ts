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

export enum DisclosureType {
  NEW_DISCLOSURE = 'NEW_DISCLOSURE',
  PATENT_REVIEW = 'PATENT_REVIEW',
}

export interface DisclosureContent {
  problem?: string
  solution?: string
  technical_details?: string
  advantages?: string
  prior_art?: string
  [key: string]: any
}

export interface PatentAnalysis {
  summary?: string
  technical_assessment?: {
    innovation_level?: string
    technical_complexity?: string
    key_innovations?: string[]
    technical_field?: string
    implementation_difficulty?: string
  }
  commercial_value?: {
    market_potential?: string
    potential_applications?: string[]
    competitive_advantage?: string
    estimated_value_assessment?: string
    reasoning?: string
  }
  prior_art_landscape?: {
    novelty_assessment?: string
    similar_technologies?: string[]
    differentiation_factors?: string[]
  }
  strategic_insights?: {
    licensing_potential?: string
    enforcement_strength?: string
    portfolio_fit?: string
    recommended_actions?: string[]
  }
  claims_analysis?: {
    total_claims?: number
    independent_claims?: number
    claim_scope?: string
    key_limitations?: string[]
  }
  risk_assessment?: {
    invalidation_risk?: string
    design_around_difficulty?: string
    potential_challenges?: string[]
  }
}

export interface Disclosure {
  id: number
  title: string
  status: DisclosureStatus
  disclosure_type: DisclosureType
  inventor_id: number
  assigned_lawyer_id?: number
  content: DisclosureContent
  patent_number?: string
  patent_file_id?: number
  ai_analysis?: PatentAnalysis
  created_at: string
  updated_at?: string
}

export interface DisclosureCreate {
  title: string
  disclosure_type?: DisclosureType
  content: DisclosureContent
  assigned_lawyer_id?: number
  patent_number?: string
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
