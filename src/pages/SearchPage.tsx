import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, X, Image, Video, Grid3X3 } from 'lucide-react'
import { useSearch } from '@/hooks/useSearch'
import type { SearchFilters, MediaItem } from '@/types'
import { MasonryGrid } from '@/components/media/MasonryGrid'
import { MediaViewer } from '@/components/media/MediaViewer'
import { PageLayout } from '@/components/layout/PageLayout'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'

const FILE_TYPE_FILTERS: { value: SearchFilters['fileType']; label: string; icon: React.ReactNode }[] =
  [
    { value: 'all', label: 'All', icon: <Grid3X3 className="size-3.5" /> },
    { value: 'image', label: 'Photos', icon: <Image className="size-3.5" /> },
    { value: 'video', label: 'Videos', icon: <Video className="size-3.5" /> },
  ]

export function SearchPage() {
  const { results, loading, hasMore, totalCount, search, loadMore } = useSearch()
  const [query, setQuery] = useState('')
  const [fileType, setFileType] = useState<SearchFilters['fileType']>('all')
  const [selectedItem, setSelectedItem] = useState<MediaItem | null>(null)
  const [hasSearched, setHasSearched] = useState(false)

  const runSearch = useCallback(
    (q: string, ft: SearchFilters['fileType']) => {
      if (!q.trim() && ft === 'all') return
      setHasSearched(true)
      search({ query: q, fileType: ft }, 0)
    },
    [search]
  )

  // Debounced search on query change
  useEffect(() => {
    const timer = setTimeout(() => {
      if (query || fileType !== 'all') runSearch(query, fileType)
    }, 350)
    return () => clearTimeout(timer)
  }, [query, fileType, runSearch])

  const handleClear = () => {
    setQuery('')
    setFileType('all')
    setHasSearched(false)
  }

  return (
    <PageLayout>
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="mb-6"
      >
        <h1 className="text-3xl font-bold text-black">
          Search
        </h1>
        <p className="text-sm text-gray-600 mt-1">
          Find photos and videos by filename
        </p>
      </motion.div>

      {/* Search bar */}
      <motion.div
        className="flex flex-col sm:flex-row gap-3 mb-4"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <div className="flex-1 relative">
          <Input
            placeholder="Search by filename…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            leftIcon={<Search className="size-4" />}
            rightIcon={
              query ? (
                <button
                  onClick={() => setQuery('')}
                  className="p-0.5 rounded hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
                  aria-label="Clear search"
                >
                  <X className="size-4" />
                </button>
              ) : undefined
            }
            aria-label="Search media"
          />
        </div>
      </motion.div>

      {/* Filter pills */}
      <motion.div
        className="flex items-center gap-2 mb-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.15 }}
      >
        {FILE_TYPE_FILTERS.map(({ value, label, icon }) => (
          <button
            key={value}
            onClick={() => setFileType(value)}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium transition-all duration-150',
              fileType === value
                ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 shadow-sm'
                : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700'
            )}
          >
            {icon}
            {label}
          </button>
        ))}

        {hasSearched && (query || fileType !== 'all') && (
          <button
            onClick={handleClear}
            className="ml-auto text-xs text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors flex items-center gap-1"
          >
            <X className="size-3" />
            Clear
          </button>
        )}
      </motion.div>

      {/* Results count */}
      <AnimatePresence>
        {hasSearched && !loading && (
          <motion.p
            className="text-sm text-zinc-500 dark:text-zinc-400 mb-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {totalCount} result{totalCount !== 1 ? 's' : ''}{' '}
            {query && (
              <>
                for{' '}
                <span className="font-medium text-zinc-700 dark:text-zinc-300">
                  &ldquo;{query}&rdquo;
                </span>
              </>
            )}
          </motion.p>
        )}
      </AnimatePresence>

      {/* Results */}
      {hasSearched ? (
        <MasonryGrid
          items={results}
          loading={loading}
          hasMore={hasMore}
          onLoadMore={loadMore}
          onOpen={setSelectedItem}
          emptyMessage="No results found"
          emptyDescription="Try a different search term or file type filter."
        />
      ) : (
        <motion.div
          className="flex flex-col items-center justify-center py-24 text-center"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="size-16 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mb-4">
            <Search className="size-7 text-zinc-400" />
          </div>
          <h3 className="text-base font-medium text-zinc-700 dark:text-zinc-300 mb-1">
            Start searching
          </h3>
          <p className="text-sm text-zinc-400 dark:text-zinc-500 max-w-xs">
            Type a filename or select a filter to find media
          </p>
        </motion.div>
      )}

      <MediaViewer
        item={selectedItem}
        items={results}
        onClose={() => setSelectedItem(null)}
        onNavigate={setSelectedItem}
      />
    </PageLayout>
  )
}
