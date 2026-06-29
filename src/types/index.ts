export interface Profile {
  id: string
  email: string
  display_name: string
  avatar_url: string | null
  created_at: string
  updated_at: string
}

export interface MediaItem {
  id: string
  user_id: string
  file_name: string
  file_path: string
  file_type: 'image' | 'video'
  mime_type: string
  file_size: number
  width: number | null
  height: number | null
  duration: number | null
  public_url: string
  thumbnail_url: string | null
  created_at: string
  uploader?: Profile
}

export type UploadStatus = 'idle' | 'uploading' | 'success' | 'error'

export interface UploadFile {
  id: string
  file: File
  status: UploadStatus
  progress: number
  error?: string
  preview?: string
}

export interface SearchFilters {
  query: string
  fileType?: 'all' | 'image' | 'video'
  uploadedBy?: string
}
