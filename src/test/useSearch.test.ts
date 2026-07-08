/**
 * useSearch hook — unit tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { useSearch } from '@/hooks/useSearch'
import * as api from '@/lib/api'

const makeItem = (id: string) => ({
  id,
  user_id: 'u1',
  file_name: `photo-${id}.jpg`,
  file_path: `u1/photo-${id}.jpg`,
  file_type: 'image' as const,
  mime_type: 'image/jpeg',
  file_size: 1024,
  width: 800,
  height: 600,
  duration: null,
  public_url: `https://cdn.example.com/${id}.jpg`,
  thumbnail_url: `https://cdn.example.com/${id}.jpg`,
  location: null,
  created_at: '2026-01-01T00:00:00Z',
})

describe('useSearch', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('starts with empty results and loading=false', () => {
    const { result } = renderHook(() => useSearch())
    expect(result.current.results).toEqual([])
    expect(result.current.loading).toBe(false)
    expect(result.current.totalCount).toBe(0)
  })

  it('sets loading=true while fetching', async () => {
    let resolve!: (v: { total: number; items: typeof api.MediaItemResponse[] }) => void
    vi.spyOn(api.mediaApi, 'search').mockReturnValue(
      new Promise((r) => { resolve = r as typeof resolve }),
    )
    const { result } = renderHook(() => useSearch())

    act(() => {
      result.current.search({ query: 'bali' }, 0)
    })

    expect(result.current.loading).toBe(true)

    await act(async () => {
      resolve!({ total: 0, items: [] })
    })
  })

  it('populates results on success', async () => {
    const items = [makeItem('1'), makeItem('2')]
    vi.spyOn(api.mediaApi, 'search').mockResolvedValue({ total: 2, items })

    const { result } = renderHook(() => useSearch())

    await act(async () => {
      await result.current.search({ query: 'beach' }, 0)
    })

    expect(result.current.results).toHaveLength(2)
    expect(result.current.totalCount).toBe(2)
    expect(result.current.loading).toBe(false)
  })

  it('resets results on page=0 search', async () => {
    const first = [makeItem('1')]
    const second = [makeItem('2')]
    const spy = vi.spyOn(api.mediaApi, 'search')
      .mockResolvedValueOnce({ total: 1, items: first })
      .mockResolvedValueOnce({ total: 1, items: second })

    const { result } = renderHook(() => useSearch())

    await act(async () => { await result.current.search({ query: 'a' }, 0) })
    expect(result.current.results[0].id).toBe('1')

    await act(async () => { await result.current.search({ query: 'b' }, 0) })
    expect(result.current.results).toHaveLength(1)
    expect(result.current.results[0].id).toBe('2')

    expect(spy).toHaveBeenCalledTimes(2)
  })

  it('appends results on page>0 (infinite scroll)', async () => {
    const page0 = Array.from({ length: 20 }, (_, i) => makeItem(String(i)))
    const page1 = [makeItem('20')]

    vi.spyOn(api.mediaApi, 'search')
      .mockResolvedValueOnce({ total: 21, items: page0 })
      .mockResolvedValueOnce({ total: 21, items: page1 })

    const { result } = renderHook(() => useSearch())

    await act(async () => { await result.current.search({ query: 'x' }, 0) })
    expect(result.current.hasMore).toBe(true)

    await act(async () => { await result.current.loadMore() })
    expect(result.current.results).toHaveLength(21)
  })

  it('sets hasMore=false when fewer than PAGE_SIZE items returned', async () => {
    vi.spyOn(api.mediaApi, 'search').mockResolvedValue({ total: 3, items: [makeItem('1'), makeItem('2'), makeItem('3')] })

    const { result } = renderHook(() => useSearch())

    await act(async () => { await result.current.search({ query: 'x' }, 0) })
    expect(result.current.hasMore).toBe(false)
  })

  it('sets error on API failure', async () => {
    vi.spyOn(api.mediaApi, 'search').mockRejectedValue(new Error('Request failed: 500'))

    const { result } = renderHook(() => useSearch())

    await act(async () => { await result.current.search({ query: 'fail' }, 0) })

    await waitFor(() => expect(result.current.error).toBe('Request failed: 500'))
    expect(result.current.loading).toBe(false)
  })

  it('passes fileType=all when filter is "all"', async () => {
    const spy = vi.spyOn(api.mediaApi, 'search').mockResolvedValue({ total: 0, items: [] })

    const { result } = renderHook(() => useSearch())
    await act(async () => { await result.current.search({ query: 'x', fileType: 'all' }, 0) })

    expect(spy).toHaveBeenCalledWith('x', 'all', 0)
  })

  it('passes fileType=image when filter is "image"', async () => {
    const spy = vi.spyOn(api.mediaApi, 'search').mockResolvedValue({ total: 0, items: [] })

    const { result } = renderHook(() => useSearch())
    await act(async () => { await result.current.search({ query: 'x', fileType: 'image' }, 0) })

    expect(spy).toHaveBeenCalledWith('x', 'image', 0)
  })

  it('loadMore does nothing when hasMore=false', async () => {
    const spy = vi.spyOn(api.mediaApi, 'search').mockResolvedValue({ total: 1, items: [makeItem('1')] })

    const { result } = renderHook(() => useSearch())
    await act(async () => { await result.current.search({ query: 'x' }, 0) })

    // hasMore is false (only 1 item, page size is 20)
    const callCount = spy.mock.calls.length
    act(() => { result.current.loadMore() })
    expect(spy).toHaveBeenCalledTimes(callCount) // no new call
  })
})
