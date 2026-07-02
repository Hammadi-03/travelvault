import { useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Upload,
  X,
  CheckCircle,
  AlertCircle,
  FileImage,
  FileVideo,
  CloudUpload,
  Trash2,
} from 'lucide-react'
import { MapPin } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useUpload } from '@/hooks/useUpload'
import { PageLayout } from '@/components/layout/PageLayout'
import { Button } from '@/components/ui/Button'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { Badge } from '@/components/ui/Badge'
import { formatBytes, ACCEPTED_TYPES } from '@/lib/utils'
import { cn } from '@/lib/utils'

export function UploadPage() {
  const navigate = useNavigate()
  const { files, uploading, location, setLocation, addFiles, removeFile, uploadAll, clearCompleted, clearAll } =
    useUpload(() => navigate('/gallery'))

  const onDrop = useCallback(
    (accepted: File[]) => {
      addFiles(accepted)
    },
    [addFiles]
  )

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: ACCEPTED_TYPES.reduce((acc, type) => ({ ...acc, [type]: [] }), {}),
    multiple: true,
  })

  const pendingCount = files.filter((f) => f.status === 'idle' || f.status === 'error').length
  const successCount = files.filter((f) => f.status === 'success').length

  return (
    <PageLayout maxWidth="2xl">
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="mb-6 mt-12 text-center"
      >
        <h1 className="text-3xl font-bold text-black">
          Upload media
        </h1>
        <p className="text-sm text-gray-600 mt-1">
          Add photos and videos to the group vault
        </p>
      </motion.div>

      {/* Dropzone */}
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1, type: 'spring', stiffness: 300, damping: 28 }}
      >
        <div
          {...getRootProps()}
          className={cn(
            'relative border-2 border-dashed rounded-2xl p-10 text-center transition-all duration-200 cursor-pointer',
            'hover:border-gray-400 hover:bg-gray-50',
            isDragActive
              ? 'border-black bg-gray-100 scale-[1.01]'
              : 'border-gray-300 bg-white'
          )}
        >
          <input {...getInputProps()} aria-label="Upload files" />

          <motion.div
            animate={isDragActive ? { scale: 1.1, rotate: -5 } : { scale: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 400, damping: 20 }}
            className="inline-flex"
          >
            <div className="size-14 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mb-4">
              <CloudUpload
                className={cn(
                  'size-7 transition-colors',
                  isDragActive ? 'text-blue-500' : 'text-zinc-400'
                )}
              />
            </div>
          </motion.div>

          <p className="text-base font-medium text-zinc-700 dark:text-zinc-300">
            {isDragActive ? 'Drop files here' : 'Drag & drop files here'}
          </p>
          <p className="text-sm text-zinc-400 dark:text-zinc-500 mt-1 mb-4">
            or click to browse
          </p>

          <div className="flex flex-wrap items-center justify-center gap-2">
            {['JPG', 'PNG', 'HEIC', 'MP4'].map((fmt) => (
              <Badge key={fmt} variant="default">
                {fmt}
              </Badge>
            ))}
            <Badge variant="default">Max 500 MB</Badge>
          </div>
        </div>
      </motion.div>

      {/* Location input */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="mt-4"
      >
        <div className="flex items-center gap-2 border border-gray-200 rounded-2xl px-4 py-3 bg-white focus-within:border-black transition-colors">
          <MapPin className="size-4 text-gray-400 shrink-0" />
          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Add a place (e.g. Bali, Indonesia)"
            className="flex-1 text-sm text-black placeholder-gray-400 outline-none bg-transparent"
          />
        </div>
      </motion.div>

      {/* File list */}
      <AnimatePresence>
        {files.length > 0 && (
          <motion.div
            className="mt-4 space-y-2"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ type: 'spring', stiffness: 300, damping: 28 }}
          >
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                {files.length} file{files.length !== 1 ? 's' : ''} selected
              </p>
              <button
                onClick={clearAll}
                className="text-xs text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
              >
                Clear all
              </button>
            </div>

            {files.map((file) => {
              const isImage = file.file.type.startsWith('image/')
              return (
                <motion.div
                  key={file.id}
                  className="flex items-center gap-3 p-3 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 shadow-sm"
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 12, height: 0, marginTop: 0, padding: 0 }}
                  layout
                >
                  {/* Preview or icon */}
                  <div className="shrink-0 size-12 rounded-lg overflow-hidden bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
                    {file.preview ? (
                      <img
                        src={file.preview}
                        alt={file.file.name}
                        className="w-full h-full object-cover"
                      />
                    ) : isImage ? (
                      <FileImage className="size-5 text-zinc-400" />
                    ) : (
                      <FileVideo className="size-5 text-zinc-400" />
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200 truncate">
                      {file.file.name}
                    </p>
                    <p className="text-xs text-zinc-400 dark:text-zinc-500">
                      {formatBytes(file.file.size)}
                    </p>
                    {file.status === 'uploading' && (
                      <ProgressBar value={file.progress} className="mt-1.5" />
                    )}
                    {file.error && (
                      <p className="text-xs text-red-500 mt-0.5">{file.error}</p>
                    )}
                  </div>

                  {/* Status */}
                  <div className="shrink-0">
                    {file.status === 'success' && (
                      <CheckCircle className="size-5 text-emerald-500" />
                    )}
                    {file.status === 'error' && (
                      <AlertCircle className="size-5 text-red-500" />
                    )}
                    {(file.status === 'idle' || file.status === 'uploading') && (
                      <button
                        onClick={() => removeFile(file.id)}
                        disabled={file.status === 'uploading'}
                        className="size-7 flex items-center justify-center rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors disabled:opacity-30"
                        aria-label="Remove file"
                      >
                        <X className="size-4" />
                      </button>
                    )}
                  </div>
                </motion.div>
              )
            })}

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              {successCount > 0 && (
                <Button variant="secondary" size="sm" onClick={clearCompleted} icon={<Trash2 className="size-3.5" />}>
                  Clear uploaded
                </Button>
              )}
              <Button
                className="flex-1"
                loading={uploading}
                disabled={pendingCount === 0}
                onClick={uploadAll}
                icon={<Upload className="size-4" />}
                size="lg"
              >
                Upload {pendingCount > 0 ? `${pendingCount} file${pendingCount !== 1 ? 's' : ''}` : ''}
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </PageLayout>
  )
}
