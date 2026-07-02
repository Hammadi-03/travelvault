import { useEffect, useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import { RefreshCw, Plus } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useMedia } from '@/hooks/useMedia'
import type { MediaItem } from '@/types'
import { MasonryGrid } from '@/components/media/MasonryGrid'
import { MediaViewer } from '@/components/media/MediaViewer'
import { PageLayout } from '@/components/layout/PageLayout'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import toast from 'react-hot-toast'

export function GalleryPage() {
  const { items, loading, hasMore, fetchPage, loadMore, refresh, deleteItem } = useMedia()
  const [selectedItem, setSelectedItem] = useState<MediaItem | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<MediaItem | null>(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    fetchPage(0, true)
  }, [fetchPage])

  const handleDelete = useCallback(async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await deleteItem(deleteTarget)
      toast.success('Deleted successfully')
      setDeleteTarget(null)
      if (selectedItem?.id === deleteTarget.id) setSelectedItem(null)
    } catch {
      toast.error('Failed to delete. Try again.')
    } finally {
      setDeleting(false)
    }
  }, [deleteTarget, deleteItem, selectedItem])

  return (
    <PageLayout>
      {/* Header */}
      <motion.div
        className="flex flex-col gap-4 mb-10 mt-10"
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
      >
        <div className="max-w-2xl">
          <p className="text-xs uppercase tracking-[0.35em] text-gray-500 mb-2">
            TravelVault
          </p>
          <h1 className="text-5xl font-bold text-black leading-tight">
            Gallery
          </h1>
          <p className="text-base text-gray-600 mt-4">
            Browse your collection in a calm, monochrome layout with large scrollable images.
          </p>
        </div>
      </motion.div>

      <MasonryGrid
        items={items}
        loading={loading}
        hasMore={hasMore}
        onLoadMore={loadMore}
        onOpen={setSelectedItem}
        onDelete={setDeleteTarget}
        emptyMessage="No photos or videos yet"
        emptyDescription="Be the first to upload memories from your trip!"
      />

      {/* Fullscreen viewer */}
      <MediaViewer
        item={selectedItem}
        items={items}
        onClose={() => setSelectedItem(null)}
        onDelete={setDeleteTarget}
        onNavigate={setSelectedItem}
      />

      {/* Delete confirmation */}
      <Modal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Delete media"
        description="This will permanently remove the file. This action cannot be undone."
        size="sm"
      >
        <div className="flex gap-3 mt-2">
          <Button
            variant="secondary"
            className="flex-1"
            onClick={() => setDeleteTarget(null)}
          >
            Cancel
          </Button>
          <Button
            variant="danger"
            className="flex-1"
            loading={deleting}
            onClick={handleDelete}
          >
            Delete
          </Button>
        </div>
      </Modal>
    </PageLayout>
  )
}
