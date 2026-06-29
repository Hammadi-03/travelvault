import { useState, useCallback, useRef } from 'react'
import { mediaApi } from '@/lib/api'
import type { MediaItem } from '@/types'
import { useAuth } from '@/context/AuthContext'

const PAGE_SIZE = 20

export function useMedia() {
  const { user } = useAuth()
  const [items, setItems] = useState<MediaItem[]>([])
  const [loading, setLoading] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const pageRef = useRef(0)
  const loadingRef = useRef(false)

  const fetchPage = useCallback(async (page: number, reset = false) => {
    if (loadingRef.current) return
    loadingRef.current = true
    setLoading(true)
    setError(null)

    try {
      const data = await mediaApi.list(page)
      const newItems = data as unknown as MediaItem[]
      setItems((prev) => (reset ? newItems : [...prev, ...newItems]))
      setHasMore(newItems.length === PAGE_SIZE)
      pageRef.current = page
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load media')
    } finally {
      setLoading(false)
      loadingRef.current = false
    }
  }, [])

  const loadMore = useCallback(() => {
    if (!hasMore || loading) return
    fetchPage(pageRef.current + 1)
  }, [hasMore, loading, fetchPage])

  const refresh = useCallback(() => {
    pageRef.current = 0
    setHasMore(true)
    fetchPage(0, true)
  }, [fetchPage])

  const deleteItem = useCallback(
    async (item: MediaItem) => {
      if (!user || item.user_id !== user.id) throw new Error('Unauthorized')
      await mediaApi.delete(item.id)
      setItems((prev) => prev.filter((m) => m.id !== item.id))
    },
    [user],
  )

  return { items, loading, hasMore, error, fetchPage, loadMore, refresh, deleteItem }
}
