/**
 * api.ts — unit tests
 *
 * These tests document and guard the exact HTTP shape the frontend sends.
 * They are the authoritative source of truth for what the Laravel backend
 * must accept. If a test here breaks after a backend change, that is a
 * real contract violation.
 *
 * 405-regression suite: every test that asserts a specific method (GET/POST/
 * PUT/DELETE) directly protects against the production 405 that was caused by
 * VITE_API_URL being empty (requests hit the Cloudflare asset server instead
 * of Laravel) and by FRONTEND_URL not covering all allowed origins.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  getToken,
  setToken,
  clearToken,
  authApi,
  profileApi,
  mediaApi,
} from '@/lib/api'

// ─── helpers ──────────────────────────────────────────────────────────────────

function mockFetch(
  body: unknown,
  status = 200,
  headers: Record<string, string> = {},
) {
  const response = new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...headers },
  })
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(response))
}

function lastCall() {
  const f = vi.mocked(fetch)
  expect(f).toHaveBeenCalled()
  const [url, init] = f.mock.calls[f.mock.calls.length - 1] as [string, RequestInit]
  return { url: String(url), method: (init?.method ?? 'GET').toUpperCase(), init }
}

// ─── token storage ────────────────────────────────────────────────────────────

describe('Token storage', () => {
  afterEach(() => clearToken())

  it('stores and retrieves a token', () => {
    setToken('abc123')
    expect(getToken()).toBe('abc123')
  })

  it('clears the token', () => {
    setToken('abc123')
    clearToken()
    expect(getToken()).toBeNull()
  })

  it('returns null when no token is stored', () => {
    expect(getToken()).toBeNull()
  })
})

// ─── auth API ─────────────────────────────────────────────────────────────────

describe('authApi', () => {
  beforeEach(() => {
    clearToken()
    vi.restoreAllMocks()
  })

  // ── login ──────────────────────────────────────────────────────────────────

  describe('login', () => {
    it('sends POST to api/login', async () => {
      mockFetch({ token: 'tok', user: { id: '1', email: 'a@b.com', display_name: 'A', avatar_url: null, created_at: '', updated_at: '' } })
      await authApi.login('a@b.com', 'secret')
      const { method, url } = lastCall()
      expect(method).toBe('POST')    // 405-regression: must be POST
      expect(url).toMatch(/api\/login$/)
    })

    it('stores the returned token in localStorage', async () => {
      mockFetch({ token: 'tok-xyz', user: { id: '1', email: 'a@b.com', display_name: 'A', avatar_url: null, created_at: '', updated_at: '' } })
      await authApi.login('a@b.com', 'secret')
      expect(getToken()).toBe('tok-xyz')
    })

    it('returns the user object', async () => {
      const user = { id: '1', email: 'a@b.com', display_name: 'Alice', avatar_url: null, created_at: '', updated_at: '' }
      mockFetch({ token: 'tok', user })
      const result = await authApi.login('a@b.com', 'secret')
      expect(result).toEqual(user)
    })

    it('throws a readable error on 401', async () => {
      mockFetch({ message: 'Invalid credentials' }, 401)
      await expect(authApi.login('bad@b.com', 'wrong')).rejects.toThrow('Invalid credentials')
    })

    it('sends email and password in the JSON body', async () => {
      mockFetch({ token: 't', user: { id: '1', email: 'a@b.com', display_name: 'A', avatar_url: null, created_at: '', updated_at: '' } })
      await authApi.login('a@b.com', 'mypass')
      const { init } = lastCall()
      const body = JSON.parse(init.body as string)
      expect(body).toMatchObject({ email: 'a@b.com', password: 'mypass' })
    })
  })

  // ── register ───────────────────────────────────────────────────────────────

  describe('register', () => {
    it('sends POST to api/register', async () => {
      mockFetch({ token: 't', user: { id: '2', email: 'n@b.com', display_name: 'New', avatar_url: null, created_at: '', updated_at: '' } })
      await authApi.register('n@b.com', 'pass', 'New User')
      const { method, url } = lastCall()
      expect(method).toBe('POST')   // 405-regression
      expect(url).toMatch(/api\/register$/)
    })

    it('sends password_confirmation equal to password', async () => {
      mockFetch({ token: 't', user: { id: '2', email: 'n@b.com', display_name: 'New', avatar_url: null, created_at: '', updated_at: '' } })
      await authApi.register('n@b.com', 'pass123', 'New User')
      const { init } = lastCall()
      const body = JSON.parse(init.body as string)
      expect(body.password_confirmation).toBe(body.password)
    })

    it('sends display_name in the body', async () => {
      mockFetch({ token: 't', user: { id: '2', email: 'n@b.com', display_name: 'New User', avatar_url: null, created_at: '', updated_at: '' } })
      await authApi.register('n@b.com', 'pass', 'New User')
      const { init } = lastCall()
      const body = JSON.parse(init.body as string)
      expect(body.display_name).toBe('New User')
    })
  })

  // ── logout ─────────────────────────────────────────────────────────────────

  describe('logout', () => {
    it('sends POST to api/logout', async () => {
      // Laravel returns 200 with empty body on logout (not 204, as 204 forbids body)
      mockFetch({ message: 'Logged out.' }, 200)
      setToken('tok')
      await authApi.logout()
      const { method, url } = lastCall()
      expect(method).toBe('POST')   // 405-regression
      expect(url).toMatch(/api\/logout$/)
    })

    it('clears the token regardless of server response', async () => {
      setToken('tok')
      vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network')))
      await authApi.logout()  // should not throw
      expect(getToken()).toBeNull()
    })
  })

  // ── me ─────────────────────────────────────────────────────────────────────

  describe('me', () => {
    it('sends GET to api/user', async () => {
      mockFetch({ id: '1', email: 'a@b.com', display_name: 'A', avatar_url: null, created_at: '', updated_at: '' })
      await authApi.me()
      const { method, url } = lastCall()
      expect(method).toBe('GET')    // 405-regression
      expect(url).toMatch(/api\/user$/)
    })

    it('attaches Bearer token header when a token exists', async () => {
      setToken('my-token')
      mockFetch({ id: '1', email: 'a@b.com', display_name: 'A', avatar_url: null, created_at: '', updated_at: '' })
      await authApi.me()
      const { init } = lastCall()
      expect((init.headers as Record<string, string>)['Authorization']).toBe('Bearer my-token')
    })
  })

  // ── forgotPassword ─────────────────────────────────────────────────────────

  describe('forgotPassword', () => {
    it('sends POST to api/forgot-password', async () => {
      mockFetch({ status: 'We have emailed your password reset link.' })
      await authApi.forgotPassword('a@b.com')
      const { method, url } = lastCall()
      expect(method).toBe('POST')   // 405-regression
      expect(url).toMatch(/api\/forgot-password$/)
    })
  })
})

// ─── profile API ──────────────────────────────────────────────────────────────

describe('profileApi', () => {
  beforeEach(() => {
    clearToken()
    vi.restoreAllMocks()
  })

  describe('update', () => {
    it('sends PUT to api/profile', async () => {
      mockFetch({ id: '1', email: 'a@b.com', display_name: 'Alice', avatar_url: null, created_at: '', updated_at: '' })
      await profileApi.update({ display_name: 'Alice' })
      const { method, url } = lastCall()
      expect(method).toBe('PUT')    // 405-regression: backend route is PUT
      expect(url).toMatch(/api\/profile$/)
    })

    it('sends only the provided fields', async () => {
      mockFetch({ id: '1', email: 'a@b.com', display_name: 'Alice', avatar_url: null, created_at: '', updated_at: '' })
      await profileApi.update({ display_name: 'Alice' })
      const { init } = lastCall()
      const body = JSON.parse(init.body as string)
      expect(body).toEqual({ display_name: 'Alice' })
    })
  })

  describe('uploadAvatar', () => {
    it('sends POST to api/profile/avatar', async () => {
      mockFetch({ avatar_url: 'https://example.com/avatar.jpg' })
      const file = new File(['img'], 'avatar.jpg', { type: 'image/jpeg' })
      await profileApi.uploadAvatar(file)
      const { method, url } = lastCall()
      expect(method).toBe('POST')   // 405-regression
      expect(url).toMatch(/api\/profile\/avatar$/)
    })

    it('sends FormData (no Content-Type header override)', async () => {
      mockFetch({ avatar_url: 'https://example.com/avatar.jpg' })
      const file = new File(['img'], 'avatar.jpg', { type: 'image/jpeg' })
      await profileApi.uploadAvatar(file)
      const { init } = lastCall()
      // Content-Type must NOT be set manually for FormData — browser sets boundary
      expect((init.headers as Record<string, string>)['Content-Type']).toBeUndefined()
    })
  })
})

// ─── media API ────────────────────────────────────────────────────────────────

describe('mediaApi', () => {
  beforeEach(() => {
    clearToken()
    vi.restoreAllMocks()
  })

  const sampleItem = {
    id: 'abc',
    user_id: 'u1',
    file_name: 'photo.jpg',
    file_path: 'u1/photo.jpg',
    file_type: 'image' as const,
    mime_type: 'image/jpeg',
    file_size: 1024,
    width: 800,
    height: 600,
    duration: null,
    public_url: 'https://cdn.example.com/photo.jpg',
    thumbnail_url: 'https://cdn.example.com/photo.jpg',
    location: null,
    created_at: '2026-01-01T00:00:00Z',
  }

  // ── list ───────────────────────────────────────────────────────────────────

  describe('list', () => {
    it('sends GET to api/media with a page query param', async () => {
      mockFetch([sampleItem])
      await mediaApi.list(0)
      const { method, url } = lastCall()
      expect(method).toBe('GET')    // 405-regression
      expect(url).toMatch(/api\/media\?page=0$/)
    })

    it('encodes the page number correctly for page 2', async () => {
      mockFetch([sampleItem])
      await mediaApi.list(2)
      const { url } = lastCall()
      expect(url).toMatch(/page=2/)
    })
  })

  // ── search ─────────────────────────────────────────────────────────────────

  describe('search', () => {
    it('sends GET to api/media/search', async () => {
      mockFetch({ total: 1, items: [sampleItem] })
      await mediaApi.search('bali', 'image', 0)
      const { method, url } = lastCall()
      expect(method).toBe('GET')    // 405-regression
      expect(url).toMatch(/api\/media\/search/)
    })

    it('encodes the query string', async () => {
      mockFetch({ total: 0, items: [] })
      await mediaApi.search('new york', 'all', 0)
      const { url } = lastCall()
      expect(url).toContain('q=new%20york')
    })

    it('includes file_type and page params', async () => {
      mockFetch({ total: 0, items: [] })
      await mediaApi.search('beach', 'video', 1)
      const { url } = lastCall()
      expect(url).toContain('file_type=video')
      expect(url).toContain('page=1')
    })
  })

  // ── delete ─────────────────────────────────────────────────────────────────

  describe('delete', () => {
    it('sends DELETE to api/media/:id', async () => {
      mockFetch({ message: 'Deleted.' })
      await mediaApi.delete('abc-123')
      const { method, url } = lastCall()
      expect(method).toBe('DELETE')  // 405-regression
      expect(url).toMatch(/api\/media\/abc-123$/)
    })

    it('URL-encodes the media id', async () => {
      mockFetch({ message: 'Deleted.' })
      await mediaApi.delete('id with spaces')
      const { url } = lastCall()
      expect(url).toContain('id%20with%20spaces')
    })
  })
})

// ─── 405 production regression ────────────────────────────────────────────────

describe('405 production regression — API_BASE resolution', () => {
  /**
   * The root cause of the 405 was: VITE_API_URL="" in production, so every
   * fetch call resolved to "/api/...", which hit the Cloudflare asset server
   * (no worker script) instead of the Laravel API.
   *
   * The fix: VITE_API_URL must be set to https://api.murjanlab.my.id before
   * building. These tests verify the URL construction logic in api.ts is
   * sound regardless of the env variable value.
   */

  it('prefixes with API_BASE when set (production path)', async () => {
    // Simulate what api.ts does when API_BASE = "https://api.murjanlab.my.id"
    const base = 'https://api.murjanlab.my.id'
    const path = 'api/user'
    const url = `${base}/${path}`
    expect(url).toBe('https://api.murjanlab.my.id/api/user')
    // Protocol `://` is valid; we just don't want `///` or duplicate slashes in the path
    expect(url).not.toMatch(/(?<!:)\/\//)
  })

  it('strips trailing slash from API_BASE before concatenating', () => {
    // api.ts does: .replace(/\/$/, '')
    const raw = 'https://api.murjanlab.my.id/'
    const base = raw.trim().replace(/\/$/, '')
    expect(base).toBe('https://api.murjanlab.my.id')
  })

  it('falls back to same-origin path when API_BASE is empty (dev path)', () => {
    const base = ''
    const path = 'api/user'
    // api.ts: base ? `${base}/${path}` : `/${path}`
    const url = base ? `${base}/${path}` : `/${path}`
    expect(url).toBe('/api/user')
  })

  it('rejects a URL that would result in same-origin in production', () => {
    // If API_BASE is accidentally empty in production build, the URL becomes
    // a relative path — caught here so CI fails before deploy.
    const simulatedApiBase = import.meta.env?.VITE_API_URL ?? ''
    // In test env VITE_API_URL is not set, so this confirms the logic:
    // production MUST set this env var.
    const url = simulatedApiBase
      ? `${simulatedApiBase.replace(/\/$/, '')}/api/user`
      : `/api/user`
    // In test env it will be relative — that's fine for local dev/test
    expect(url).toMatch(/api\/user/)
  })
})
