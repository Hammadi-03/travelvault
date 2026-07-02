import { useState, useCallback } from 'react'
import { mediaApi } from '@/lib/api'
import { useAuth } from '@/context/AuthContext'
import {
  generateId,
  getImageDimensions,
  getVideoDuration,
  isImageFile,
  isVideoFile,
  ACCEPTED_TYPES,
  MAX_FILE_SIZE,
} from '@/lib/utils'
import type { UploadFile } from '@/types'
import toast from 'react-hot-toast'

export function useUpload(onSuccess?: () => void) {
  const { user } = useAuth()
  const [files, setFiles] = useState<UploadFile[]>([])
  const [uploading, setUploading] = useState(false)
  const [location, setLocation] = useState('')

  const addFiles = useCallback((newFiles: File[]) => {
    const validated = newFiles.filter((file) => {
      if (!ACCEPTED_TYPES.includes(file.type)) {
        toast.error(`${file.name}: Unsupported file type`)
        return false
      }
      if (file.size > MAX_FILE_SIZE) {
        toast.error(`${file.name}: File too large (max 500 MB)`)
        return false
      }
      return true
    })

    const uploadFiles: UploadFile[] = validated.map((file) => ({
      id: generateId(),
      file,
      status: 'idle',
      progress: 0,
      preview: isImageFile(file.type) ? URL.createObjectURL(file) : undefined,
    }))

    setFiles((prev) => [...prev, ...uploadFiles])
  }, [])

  const removeFile = useCallback((id: string) => {
    setFiles((prev) => {
      const file = prev.find((f) => f.id === id)
      if (file?.preview) URL.revokeObjectURL(file.preview)
      return prev.filter((f) => f.id !== id)
    })
  }, [])

  const uploadAll = useCallback(async () => {
    if (!user) return
    const pending = files.filter((f) => f.status === 'idle' || f.status === 'error')
    if (!pending.length) return

    setUploading(true)

    for (const uploadFile of pending) {
      setFiles((prev) =>
        prev.map((f) =>
          f.id === uploadFile.id ? { ...f, status: 'uploading', progress: 0 } : f,
        ),
      )

      try {
        const { file } = uploadFile
        const dimensions = isImageFile(file.type) ? await getImageDimensions(file) : null
        const duration   = isVideoFile(file.type)  ? await getVideoDuration(file)   : null

        await mediaApi.upload(
          file,
          {
            width:    dimensions?.width  ?? null,
            height:   dimensions?.height ?? null,
            duration: duration           ?? null,
            location: location || null,
          },
          (pct) => {
            setFiles((prev) =>
              prev.map((f) =>
                f.id === uploadFile.id ? { ...f, progress: pct } : f,
              ),
            )
          },
        )

        setFiles((prev) =>
          prev.map((f) =>
            f.id === uploadFile.id ? { ...f, status: 'success', progress: 100 } : f,
          ),
        )
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Upload failed'
        setFiles((prev) =>
          prev.map((f) =>
            f.id === uploadFile.id ? { ...f, status: 'error', error: message, progress: 0 } : f,
          ),
        )
        toast.error(`Failed to upload ${uploadFile.file.name}`)
      }
    }

    setUploading(false)

    const successCount = files.filter((f) => f.status !== 'error').length
    if (successCount > 0) {
      toast.success(`${pending.length} file${pending.length > 1 ? 's' : ''} uploaded!`)
      onSuccess?.()
    }
  }, [user, files, onSuccess])

  const clearCompleted = useCallback(() => {
    setFiles((prev) => {
      prev
        .filter((f) => f.status === 'success' && f.preview)
        .forEach((f) => URL.revokeObjectURL(f.preview!))
      return prev.filter((f) => f.status !== 'success')
    })
  }, [])

  const clearAll = useCallback(() => {
    setFiles((prev) => {
      prev.filter((f) => f.preview).forEach((f) => URL.revokeObjectURL(f.preview!))
      return []
    })
  }, [])

  return {
    files,
    uploading,
    location,
    setLocation,
    addFiles,
    removeFile,
    uploadAll,
    clearCompleted,
    clearAll,
  }
}
