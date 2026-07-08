/**
 * useMedia hook — unit tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import type { UserResponse } from '@/lib/api'

// ── mock AuthContext so useMedia can be rendered without a real provider ──────
const mockUser: UserResponse = {
  id: 'u1',
  email: 'user@example.com',
  display_name: 'Test User',
  avatar_url: null,
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
}

let currentUser: UserResponse | null = mockUser

vi.mock('@/context/AuthContext', () => ({
  useAuth: () => ({ user: currentUser }),
}))

// import after mock is registered
const { useMedia } = await import('@/hooks/useMedia')
const api = await import('@/lib/api')

const makeItem = (id: string, userId = 'u1') => ({
  id,
  user_id: userId,
  file_name: `file-${id}.jpg`,
  file_path: `${userId}/file-${id}.jpg`,
  file_type: 'image' as const,
  mime_type: 'image/jpeg',
  file_size: 2048,
  width: 1920,
  height: 1080,
  duration: null,
  public_url: `https://cdn.example.com/${id}.jpg`,
  thumbnail_url: `https://cdn.example.com/${id}.jpg`,
  location: null,
  created_at: '2026-01-01T00:00:00Z',
})

describe('useMedia', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    currentUser = mockUser
  })

  it('starts with empty items and loading=false', () => {
    const { result } = renderHook(() => useMedia())
    expect(result.current.items).toEqual([])
    expect(result.current.loading).toBe(false)
  })

  it('fetches and populates items', async () => {
    const items = [makeItem('1'), makeItem('2')]
    vi.spyOn(api.mediaApi, 'list').mockResolvedValue(items)

    const { result } = renderHook(() => useMedia())

    await act(async () => { await result.current.fetchPage(0) })

    expect(result.current.items).toHaveLength(2)
    expect(result.current.loading).toBe(false)
  })

  it('appends items when loading the next page', async () => {
    const page0 = Array.from({ length: 20 }, (_, i) => makeItem(String(i)))
    const page1 = [makeItem('20')]

    vi.spyOn(api.mediaApi, 'list')
      .mockResolvedValueOnce(page0)
      .mockResolvedValueOnce(page1)

    const { result } = renderHook(() => useMedia())

    await act(async () => { await result.current.fetchPage(0) })
    await act(async () => { await result.current.loadMore() })

    expect(result.current.items).toHaveLength(21)
  })

  it('sets hasMore=false when fewer than PAGE_SIZE items returned', async () => {
    vi.spyOn(api.mediaApi, 'list').mockResolvedValue([makeItem('1')])

    const { result } = renderHook(() => useMedia())

    await act(async () => { await result.current.fetchPage(0) })
    expect(result.current.hasMore).toBe(false)
  })

  it('sets error on API failure', async () => {
    vi.spyOn(api.mediaApi, 'list').mockRejectedValue(new Error('Request failed: 500'))

    const { result } = renderHook(() => useMedia())

    await act(async () => { await result.current.fetchPage(0) })

    await waitFor(() => expect(result.current.error).toBe('Request failed: 500'))
  })

  it('refresh resets to page 0 and replaces items', async () => {
    const initial = [makeItem('old')]
    const refreshed = [makeItem('new')]

    vi.spyOn(api.mediaApi, 'list')
      .mockResolvedValueOnce(initial)
      .mockResolvedValueOnce(refreshed)

    const { result } = renderHook(() => useMedia())

    await act(async () => { await result.current.fetchPage(0) })
    expect(result.current.items[0].id).toBe('old')

    await act(async () => { await result.current.refresh() })
    expect(result.current.items).toHaveLength(1)
    expect(result.current.items[0].id).toBe('new')
  })

  it('deleteItem removes item from state', async () => {
    vi.spyOn(api.mediaApi, 'list').mockResolvedValue([makeItem('1'), makeItem('2')])
    vi.spyOn(api.mediaApi, 'delete').mockResolvedValue({ message: 'Deleted.' })

    const { result } = renderHook(() => useMedia())

    await act(async () => { await result.current.fetchPage(0) })
    await act(async () => { await result.current.deleteItem(makeItem('1')) })

    expect(result.current.items.find((i) => i.id === '1')).toBeUndefined()
    expect(result.current.items).toHaveLength(1)
  })

  it('deleteItem throws when item belongs to another user', async () => {
    vi.spyOn(api.mediaApi, 'list').mockResolvedValue([makeItem('1', 'other-user')])

    const { result } = renderHook(() => useMedia())

    await act(async () => { await result.current.fetchPage(0) })

    await expect(
      act(async () => { await result.current.deleteItem(makeItem('1', 'other-user')) }),
    ).rejects.toThrow('Unauthorized')
  })

  it('deleteItem throws when user is null', async () => {
    currentUser = null

    const { result } = renderHook(() => useMedia())

    await expect(
      act(async () => { await result.current.deleteItem(makeItem('1')) }),
    ).rejects.toThrow('Unauthorized')
  })
})
