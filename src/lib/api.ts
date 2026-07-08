/**
 * HTTP client for the Laravel + Breeze + Sanctum API.
 * Uses Bearer token auth (token stored in localStorage).
 * The Vite dev server proxies all requests to Laravel at 127.0.0.1:8000
 * so there are zero CORS issues.
 */

// ── Token storage ─────────────────────────────────────────────
const TOKEN_KEY = 'tv_token'

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token)
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY)
}

// ── Base URL ──────────────────────────────────────────────────
// In dev, VITE_API_URL is empty and the Vite proxy forwards /api/* to Laravel.
// In production, set VITE_API_URL to your Laravel origin (e.g. https://api.murjanlab.my.id)
// so requests resolve correctly without a proxy.
const API_BASE = (import.meta.env.VITE_API_URL as string | undefined)?.trim().replace(/\/$/, '') ?? ''

// ── Core fetch ────────────────────────────────────────────────
async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken()

  const headers: Record<string, string> = {
    Accept: 'application/json',
    ...(options.headers as Record<string, string>),
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  // Only set Content-Type for JSON — not FormData
  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json'
  }

  const res = await fetch(API_BASE ? `${API_BASE}/${path}` : `/${path}`, { ...options, headers })

  if (!res.ok) {
    let message = `Request failed: ${res.status}`
    try {
      const err = await res.json()
      if (err.errors) {
        const first = Object.values(err.errors as Record<string, string[]>)[0]
        message = Array.isArray(first) ? first[0] : String(first)
      } else {
        message = err.message ?? message
      }
    } catch { /* ignore */ }
    throw new Error(message)
  }

  if (res.status === 204) return undefined as T
  return res.json() as Promise<T>
}

// ── Auth ──────────────────────────────────────────────────────
export const authApi = {
  register: async (email: string, password: string, displayName: string) => {
    const data = await request<{ token: string; user: UserResponse }>('api/register', {
      method: 'POST',
      body: JSON.stringify({
        display_name:          displayName,
        email,
        password,
        password_confirmation: password,
      }),
    })
    setToken(data.token)
    return data.user
  },

  login: async (email: string, password: string) => {
    const data = await request<{ token: string; user: UserResponse }>('api/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    })
    setToken(data.token)
    return data.user
  },

  logout: async () => {
    await request<void>('api/logout', { method: 'POST' }).catch(() => {})
    clearToken()
  },

  me: () => request<UserResponse>('api/user'),

  forgotPassword: (email: string) =>
    request<{ status: string }>('api/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }),
}

// ── Profile ───────────────────────────────────────────────────
export const profileApi = {
  update: (updates: Partial<Pick<UserResponse, 'display_name' | 'avatar_url'>>) =>
    request<UserResponse>('api/profile', {
      method: 'PUT',
      body: JSON.stringify(updates),
    }),

  uploadAvatar: (file: File) => {
    const form = new FormData()
    form.append('avatar', file)
    return request<{ avatar_url: string }>('api/profile/avatar', {
      method: 'POST',
      body: form,
    })
  },
}

// ── Media ─────────────────────────────────────────────────────
export const mediaApi = {
  list: (page: number) =>
    request<MediaItemResponse[]>(`api/media?page=${page}`),

  search: (q: string, fileType: string, page: number) =>
    request<{ total: number; items: MediaItemResponse[] }>(
      `api/media/search?q=${encodeURIComponent(q)}&file_type=${fileType}&page=${page}`,
    ),

  upload: (
    file: File,
    meta: { width?: number | null; height?: number | null; duration?: number | null; location?: string | null },
    onProgress?: (pct: number) => void,
  ): Promise<MediaItemResponse> => {
    return new Promise((resolve, reject) => {
      const token = getToken()
      const form  = new FormData()
      form.append('file', file)
      if (meta.width    != null) form.append('width',    String(meta.width))
      if (meta.height   != null) form.append('height',   String(meta.height))
      if (meta.duration != null) form.append('duration', String(meta.duration))
      if (meta.location)         form.append('location', meta.location)

      const xhr = new XMLHttpRequest()
      xhr.open('POST', `${API_BASE}/api/media`)
      xhr.setRequestHeader('Accept', 'application/json')
      if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`)

      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable && onProgress) {
          onProgress(Math.round((e.loaded / e.total) * 100))
        }
      })

      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try { resolve(JSON.parse(xhr.responseText)) }
          catch { reject(new Error('Invalid response from server')) }
        } else {
          let message = `Upload failed: ${xhr.status}`
          try {
            const err = JSON.parse(xhr.responseText)
            message = err.message ?? message
          } catch { /* ignore */ }
          reject(new Error(message))
        }
      })

      xhr.addEventListener('error', () => reject(new Error('Network error during upload')))
      xhr.send(form)
    })
  },

  delete: (id: string) =>
    request<{ message: string }>(`api/media/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    }),
}

// ── Response types ────────────────────────────────────────────
export interface UserResponse {
  id: string
  email: string
  display_name: string
  avatar_url: string | null
  created_at: string
  updated_at: string
}

export interface MediaItemResponse {
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
  location: string | null
  created_at: string
  uploader?: {
    id: string
    display_name: string
    avatar_url: string | null
    email: string
  }
}
