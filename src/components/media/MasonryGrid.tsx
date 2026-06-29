import { useEffect, useRef, useCallback } from 'react'
import { useInView } from 'react-intersection-observer'
import { motion } from 'framer-motion'
import type { MediaItem } from '@/types'
import { MediaCard } from './MediaCard'
import { GallerySkeleton } from '@/components/ui/Skeleton'
import { ImageOff } from 'lucide-react'

interface MasonryGridProps {
  items: MediaItem[]
  loading: boolean
  hasMore: boolean
  onLoadMore: () => void
  onOpen: (item: MediaItem) => void
  onDelete?: (item: MediaItem) => void
  emptyMessage?: string
  emptyDescription?: string
}

export function MasonryGrid({
  items,
  loading,
  hasMore,
  onLoadMore,
  onOpen,
  onDelete,
  emptyMessage = 'No media yet',
  emptyDescription = 'Upload some photos or videos to get started.',
}: MasonryGridProps) {
  const { ref: sentinelRef, inView } = useInView({
    threshold: 0,
    rootMargin: '200px',
  })

  const didMount = useRef(false)

  useEffect(() => {
    if (!didMount.current) {
      didMount.current = true
      return
    }
    if (inView && hasMore && !loading) {
      onLoadMore()
    }
  }, [inView, hasMore, loading, onLoadMore])

  if (!loading && items.length === 0) {
    return (
      <motion.div
        className="flex flex-col items-center justify-center py-24 text-center"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      >
        <div className="size-16 rounded-2xl bg-gray-200 flex items-center justify-center mb-4">
          <ImageOff className="size-7 text-gray-400" />
        </div>
        <h3 className="text-base font-medium text-gray-700 mb-1">
          {emptyMessage}
        </h3>
        <p className="text-sm text-gray-500 max-w-xs">
          {emptyDescription}
        </p>
      </motion.div>
    )
  }

  return (
    <div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {items.map((item, index) => (
          <MediaCard
            key={item.id}
            item={item}
            onOpen={onOpen}
            onDelete={onDelete}
            index={index}
          />
        ))}
      </div>

      {/* Loading more */}
      {loading && items.length > 0 && (
        <div className="mt-6">
          <GallerySkeleton />
        </div>
      )}

      {/* Initial loading */}
      {loading && items.length === 0 && <GallerySkeleton />}

      {/* Infinite scroll sentinel */}
      {hasMore && <div ref={sentinelRef} className="h-4" aria-hidden="true" />}

      {/* End of results */}
      {!hasMore && items.length > 0 && (
        <div className="text-center py-8">
          <p className="text-xs text-gray-500">
            {items.length} item{items.length !== 1 ? 's' : ''} total
          </p>
        </div>
      )}
    </div>
  )
}
