import { useEffect, useCallback, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X,
  Download,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Info,
  Calendar,
  FileType,
  HardDrive,
  User,
} from 'lucide-react'
import type { MediaItem } from '@/types'
import { useAuth } from '@/context/AuthContext'
import { Avatar } from '@/components/ui/Avatar'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { formatBytes, formatDuration, resolveMediaUrl, isHeicFile } from '@/lib/utils'

interface MediaViewerProps {
  item: MediaItem | null
  items: MediaItem[]
  onClose: () => void
  onDelete?: (item: MediaItem) => void
  onNavigate: (item: MediaItem) => void
}

export function MediaViewer({
  item,
  items,
  onClose,
  onDelete,
  onNavigate,
}: MediaViewerProps) {
  const { user } = useAuth()
  const [showInfo, setShowInfo] = useState(false)

  const currentIndex = item ? items.findIndex((i) => i.id === item.id) : -1
  const hasPrev = currentIndex > 0
  const hasNext = currentIndex < items.length - 1

  const goNext = useCallback(() => {
    if (hasNext) onNavigate(items[currentIndex + 1])
  }, [hasNext, currentIndex, items, onNavigate])

  const goPrev = useCallback(() => {
    if (hasPrev) onNavigate(items[currentIndex - 1])
  }, [hasPrev, currentIndex, items, onNavigate])

  useEffect(() => {
    if (!item) return
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowRight') goNext()
      if (e.key === 'ArrowLeft') goPrev()
      if (e.key === 'i') setShowInfo((v) => !v)
    }
    window.addEventListener('keydown', handleKey)
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', handleKey)
      document.body.style.overflow = ''
    }
  }, [item, onClose, goNext, goPrev])

  const handleDownload = async () => {
    if (!item) return
    // Use the resolved (proxy-safe) URL so local dev can fetch through Vite
    const downloadUrl = resolveMediaUrl(item.public_url)
    try {
      const response = await fetch(downloadUrl)
      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = item.file_name
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      window.open(downloadUrl, '_blank')
    }
  }

  const isOwner = item && user?.id === item.user_id
  const isHeic = isHeicFile(item?.mime_type)
  const resolvedUrl = resolveMediaUrl(item?.public_url)

  return (
    <AnimatePresence>
      {item && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/95"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          {/* Top bar */}
          <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between px-4 py-3 bg-gradient-to-b from-black/50 to-transparent">
            <div className="flex items-center gap-3">
              {item.uploader && (
                <>
                  <Avatar
                    src={item.uploader.avatar_url}
                    name={item.uploader.display_name}
                    size="sm"
                  />
                  <div>
                    <p className="text-sm font-medium text-white">
                      {item.uploader.display_name}
                    </p>
                    <p className="text-xs text-white/60">
                      {new Date(item.created_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </p>
                  </div>
                </>
              )}
            </div>

            <div className="flex items-center gap-1.5">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowInfo((v) => !v)}
                className="size-10 p-0 rounded-full bg-black/70 text-white/90 hover:bg-black/90 transition-colors"
                aria-label="Toggle info panel"
              >
                <Info className="size-5" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDownload}
                className="size-10 p-0 rounded-full bg-black/70 text-white/90 hover:bg-black/90 transition-colors"
                aria-label="Download"
              >
                <Download className="size-5" />
              </Button>
              {isOwner && onDelete && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    onClose()
                    onDelete(item)
                  }}
                  className="size-10 p-0 rounded-full bg-red-600 text-white hover:bg-red-700 transition-colors"
                  aria-label="Delete"
                >
                  <Trash2 className="size-5" />
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="size-10 p-0 rounded-full bg-black/70 text-white/90 hover:bg-black/90 transition-colors ml-1"
                aria-label="Close viewer"
              >
                <X className="size-5" />
              </Button>
            </div>
          </div>

          {/* Media */}
          <div
            className="relative flex items-center justify-center w-full h-full p-16 md:p-20"
            onClick={onClose}
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={item.id}
                className="relative max-w-full max-h-full"
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                onClick={(e) => e.stopPropagation()}
              >
                {item.file_type === 'image' ? (
                  isHeic ? (
                    // HEIC files cannot render in the browser — offer a download instead
                    <div className="flex flex-col items-center justify-center gap-5 p-10 rounded-2xl bg-white/5 border border-white/10">
                      <Download className="size-12 text-white/40" />
                      <div className="text-center">
                        <p className="text-sm font-semibold text-white/80 mb-1">HEIC format</p>
                        <p className="text-xs text-white/40 max-w-xs">
                          This format isn&apos;t supported by browsers. Download the file to view it in Photos or another app.
                        </p>
                      </div>
                      <a
                        href={resolvedUrl}
                        download={item.file_name}
                        className="flex items-center gap-2 rounded-full bg-white text-black text-sm font-semibold px-6 py-2.5 hover:bg-white/90 transition-colors"
                      >
                        <Download className="size-4" />
                        Download {item.file_name}
                      </a>
                    </div>
                  ) : (
                    <img
                      src={resolvedUrl}
                      alt={item.file_name}
                      className="max-w-full max-h-[85vh] object-contain rounded-xl shadow-2xl"
                      draggable={false}
                    />
                  )
                ) : (
                  <video
                    src={resolvedUrl}
                    controls
                    autoPlay
                    className="max-w-full max-h-[85vh] rounded-xl shadow-2xl"
                  />
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Navigation */}
          {hasPrev && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                goPrev()
              }}
              className="absolute left-3 top-1/2 -translate-y-1/2 z-10 size-10 rounded-full bg-black/80 border border-white/10 flex items-center justify-center text-white hover:bg-black transition-colors shadow-lg shadow-black/25"
              aria-label="Previous"
            >
              <ChevronLeft className="size-5" />
            </button>
          )}
          {hasNext && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                goNext()
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 z-10 size-10 rounded-full bg-black/80 border border-white/10 flex items-center justify-center text-white hover:bg-black transition-colors shadow-lg shadow-black/25"
              aria-label="Next"
            >
              <ChevronRight className="size-5" />
            </button>
          )}

          {/* Counter */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10">
            <span className="text-xs text-white/60 glass px-3 py-1 rounded-full">
              {currentIndex + 1} / {items.length}
            </span>
          </div>

          {/* Info panel */}
          <AnimatePresence>
            {showInfo && (
              <motion.div
                className="absolute right-0 top-0 bottom-0 w-72 glass-strong border-l border-white/10 z-10 overflow-y-auto"
                initial={{ x: 280, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: 280, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                onClick={(e) => e.stopPropagation()}
              >
                <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-sm border-b border-black/10 flex items-center justify-between px-5 py-4">
                  <h3 className="text-sm font-semibold text-zinc-900">File Info</h3>
                  <button
                    type="button"
                    onClick={() => setShowInfo(false)}
                    className="size-7 flex items-center justify-center rounded-full bg-black/5 hover:bg-black/10 transition-colors text-zinc-500 hover:text-zinc-800"
                    aria-label="Close info panel"
                  >
                    <X className="size-4" />
                  </button>
                </div>
                <div className="p-5">

                  <div className="space-y-3">
                    <InfoRow icon={<FileType className="size-3.5" />} label="Name">
                      <span className="break-all">{item.file_name}</span>
                    </InfoRow>
                    <InfoRow icon={<HardDrive className="size-3.5" />} label="Size">
                      {formatBytes(item.file_size)}
                    </InfoRow>
                    <InfoRow icon={<Calendar className="size-3.5" />} label="Uploaded">
                      {new Date(item.created_at).toLocaleString()}
                    </InfoRow>
                    {item.width && item.height && (
                      <InfoRow icon={<FileType className="size-3.5" />} label="Dimensions">
                        {item.width} × {item.height}
                      </InfoRow>
                    )}
                    {item.duration && (
                      <InfoRow icon={<FileType className="size-3.5" />} label="Duration">
                        {formatDuration(item.duration)}
                      </InfoRow>
                    )}
                    <InfoRow icon={<User className="size-3.5" />} label="Uploader">
                      <div className="flex items-center gap-1.5">
                        {item.uploader && (
                          <>
                            <Avatar
                              src={item.uploader.avatar_url}
                              name={item.uploader.display_name}
                              size="xs"
                            />
                            {item.uploader.display_name}
                          </>
                        )}
                      </div>
                    </InfoRow>
                    <div className="pt-1">
                      <Badge variant="glass">{item.mime_type}</Badge>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

function InfoRow({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="flex gap-2.5">
      <div className="text-zinc-500 mt-0.5">{icon}</div>
      <div>
        <p className="text-xs text-zinc-500 mb-0.5">{label}</p>
        <p className="text-xs text-zinc-800 break-words">{children}</p>
      </div>
    </div>
  )
}
