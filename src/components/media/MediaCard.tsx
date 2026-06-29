import { useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Play, User } from 'lucide-react'
import type { MediaItem } from '@/types'
import { useAuth } from '@/context/AuthContext'
import { formatBytes } from '@/lib/utils'
import { cn } from '@/lib/utils'

interface MediaCardProps {
  item: MediaItem
  onOpen: (item: MediaItem) => void
  onDelete?: (item: MediaItem) => void
  index?: number
}

export function MediaCard({ item, onOpen, onDelete, index = 0 }: MediaCardProps) {
  const { user } = useAuth()
  const [imageLoaded, setImageLoaded] = useState(false)
  const [imageError, setImageError] = useState(false)

  const isOwner = user?.id === item.user_id
  const isVideo = item.file_type === 'video'
  const thumbUrl = item.thumbnail_url || item.public_url

  const handleDelete = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation()
      onDelete?.(item)
    },
    [item, onDelete]
  )

  return (
    <motion.div
      className="break-inside-avoid mb-6 group relative"
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{
        type: 'spring',
        stiffness: 300,
        damping: 25,
        delay: Math.min(index * 0.03, 0.3),
      }}
      layout
    >
      <div
        className="relative overflow-hidden rounded-[32px] cursor-pointer border border-black/10 bg-white shadow-sm"
        onClick={() => onOpen(item)}
        role="button"
        tabIndex={0}
        aria-label={`Open ${item.file_name}`}
        onKeyDown={(e) => e.key === 'Enter' && onOpen(item)}
      >
        <div className="absolute top-5 left-5 z-10 rounded-full bg-black/90 px-4 py-2 text-xs font-semibold uppercase tracking-[0.25em] text-white shadow-lg shadow-black/20">
          {isVideo ? 'Video' : 'Photo'}
        </div>

        {!imageError ? (
          <img
            src={thumbUrl}
            alt={item.file_name}
            loading="lazy"
            onLoad={() => setImageLoaded(true)}
            onError={() => setImageError(true)}
            className={cn(
              'aspect-[4/5] w-full object-cover transition-all duration-500',
              'group-hover:scale-[1.01]',
              imageLoaded ? 'opacity-100' : 'opacity-0'
            )}
          />
        ) : (
          <div className="aspect-[4/5] w-full flex items-center justify-center bg-gray-300">
            <User className="size-8 text-gray-500" />
          </div>
        )}

        {!imageLoaded && !imageError && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/90">
            <div className="size-12 rounded-full border-2 border-gray-200 animate-pulse" />
          </div>
        )}

        {isVideo && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="size-14 rounded-full bg-black/85 flex items-center justify-center shadow-xl shadow-black/25">
              <Play className="size-6 text-white" />
            </div>
          </div>
        )}

        <div className="absolute bottom-5 left-5 right-5 opacity-100">
          <div className="flex items-center justify-between gap-3 rounded-full bg-white/90 border border-black/10 px-4 py-3 backdrop-blur-sm">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-black truncate">
                {item.file_name}
              </p>
              <p className="text-xs text-gray-500 truncate">
                {formatBytes(item.file_size)}
              </p>
            </div>
            {isOwner && onDelete && (
              <button
                type="button"
                onClick={handleDelete}
                className="rounded-full bg-black/95 px-3 py-2 text-xs font-semibold text-white hover:bg-black"
              >
                Delete
              </button>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  )
}
