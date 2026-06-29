import { useState, useCallback, useRef } from 'react'
import { mediaApi } from '@/lib/api'
import type { MediaItem, SearchFilters } from '@/types'

const PAGE_SIZE = 20

export function useSearch() {
  const [results, setResults] = useState<MediaItem[]>([])
  const [loading, setLoading] = useState(false)
  const [hasMore, setHasMore] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [totalCount, setTotalCount] = useState(0)
  const filtersRef = useRef<SearchFilters>({ query: '' })
  const pageRef = useRef(0)

  const search = useCallback(async (filters: SearchFilters, page = 0) => {
    filtersRef.current = filters
    pageRef.current = page
    setLoading(true)
    setError(null)
    if (page === 0) setResults([])

    try {
      const fileType = filters.fileType && filters.fileType !== 'all' ? filters.fileType : 'all'
      const { total, items } = await mediaApi.search(filters.query ?? '', fileType, page)
      const newItems = items as unknown as MediaItem[]
      setResults((prev) => (page === 0 ? newItems : [...prev, ...newItems]))
      setHasMore(newItems.length === PAGE_SIZE)
      setTotalCount(total)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed')
    } finally {
      setLoading(false)
    }
  }, [])

  const loadMore = useCallback(() => {
    if (!hasMore || loading) return
    search(filtersRef.current, pageRef.current + 1)
  }, [hasMore, loading, search])

  return { results, loading, hasMore, error, totalCount, search, loadMore }
}
