import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Strips the production API origin from a storage URL so the Vite dev-server
 * proxy can forward it to Laravel at 127.0.0.1:8000.
 * e.g. "https://api.murjanlab.my.id/storage/9/file.heic" → "/storage/9/file.heic"
 * In production VITE_API_URL is set, so URLs already point at the right host.
 */
const API_ORIGIN = (import.meta.env.VITE_API_URL as string | undefined)?.trim().replace(/\/$/, '') ?? ''

export function resolveMediaUrl(url: string | null | undefined): string {
  if (!url) return ''
  // In production the full URL is correct as-is
  if (API_ORIGIN) return url
  // In dev: strip the production origin so the proxy takes over
  try {
    const parsed = new URL(url)
    return parsed.pathname + parsed.search
  } catch {
    return url
  }
}

/** Returns true for HEIC/HEIF files — browsers cannot render these natively */
export function isHeicFile(mimeType: string | null | undefined): boolean {
  if (!mimeType) return false
  const m = mimeType.toLowerCase()
  return m === 'image/heic' || m === 'image/heif'
}


export function formatBytes(bytes: number, decimals = 2): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i]
}

export function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export function generateId(): string {
  return Math.random().toString(36).substring(2, 9)
}

export const ACCEPTED_IMAGE_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/heic',
  'image/heif',
]

export const ACCEPTED_VIDEO_TYPES = ['video/mp4', 'video/quicktime']

export const ACCEPTED_TYPES = [...ACCEPTED_IMAGE_TYPES, ...ACCEPTED_VIDEO_TYPES]

export const MAX_FILE_SIZE = 500 * 1024 * 1024 // 500 MB

export function isImageFile(mimeType: string): boolean {
  return ACCEPTED_IMAGE_TYPES.includes(mimeType)
}

export function isVideoFile(mimeType: string): boolean {
  return ACCEPTED_VIDEO_TYPES.includes(mimeType)
}

export async function getImageDimensions(
  file: File
): Promise<{ width: number; height: number } | null> {
  if (!isImageFile(file.type)) return null
  return new Promise((resolve) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      URL.revokeObjectURL(url)
      resolve({ width: img.naturalWidth, height: img.naturalHeight })
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      resolve(null)
    }
    img.src = url
  })
}

export async function getVideoDuration(file: File): Promise<number | null> {
  if (!isVideoFile(file.type)) return null
  return new Promise((resolve) => {
    const video = document.createElement('video')
    const url = URL.createObjectURL(file)
    video.onloadedmetadata = () => {
      URL.revokeObjectURL(url)
      resolve(video.duration)
    }
    video.onerror = () => {
      URL.revokeObjectURL(url)
      resolve(null)
    }
    video.src = url
  })
}
