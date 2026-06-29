import { useState, useRef } from 'react'
import { motion } from 'framer-motion'
import { Camera, Check, Loader2, User, Mail, Edit2 } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { profileApi } from '@/lib/api'
import { PageLayout } from '@/components/layout/PageLayout'
import { Avatar } from '@/components/ui/Avatar'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import toast from 'react-hot-toast'

export function ProfilePage() {
  const { user, profile, updateProfile } = useAuth()
  const [displayName, setDisplayName] = useState(profile?.display_name || '')
  const [saving, setSaving] = useState(false)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [saved, setSaved] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!displayName.trim()) return
    setSaving(true)
    try {
      await updateProfile({ display_name: displayName.trim() })
      setSaved(true)
      toast.success('Profile updated!')
      setTimeout(() => setSaved(false), 2500)
    } catch {
      toast.error('Failed to update profile.')
    } finally {
      setSaving(false)
    }
  }

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !user) return

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file.')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Avatar must be under 5 MB.')
      return
    }

    setUploadingAvatar(true)
    try {
      const { avatar_url } = await profileApi.uploadAvatar(file)
      await updateProfile({ avatar_url })
      toast.success('Avatar updated!')
    } catch {
      toast.error('Failed to upload avatar.')
    } finally {
      setUploadingAvatar(false)
      // Reset file input
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  if (!profile) return null

  return (
    <PageLayout maxWidth="md">
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="mb-8"
      >
        <h1 className="text-3xl font-bold text-black">
          Profile
        </h1>
        <p className="text-sm text-gray-600 mt-1">
          Manage your account settings
        </p>
      </motion.div>

      <motion.div
        className="space-y-6"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, type: 'spring', stiffness: 300, damping: 28 }}
      >
        {/* Avatar section */}
        <div className="glass-strong rounded-2xl p-6">
          <h2 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-4 flex items-center gap-2">
            <User className="size-4 text-zinc-400" />
            Profile photo
          </h2>

          <div className="flex items-center gap-5">
            <div className="relative">
              <Avatar
                src={profile.avatar_url}
                name={profile.display_name}
                size="xl"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingAvatar}
                className="absolute -bottom-1 -right-1 size-8 rounded-full bg-blue-600 hover:bg-blue-500 flex items-center justify-center shadow-lg transition-colors disabled:opacity-50"
                aria-label="Change avatar"
              >
                {uploadingAvatar ? (
                  <Loader2 className="size-4 text-white animate-spin" />
                ) : (
                  <Camera className="size-4 text-white" />
                )}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                className="sr-only"
                aria-label="Upload avatar"
              />
            </div>

            <div>
              <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
                {profile.display_name}
              </p>
              <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-0.5">
                {profile.email}
              </p>
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingAvatar}
                className="text-xs text-blue-600 dark:text-blue-400 hover:underline mt-1.5 disabled:opacity-50 flex items-center gap-1"
              >
                <Edit2 className="size-3" />
                Change photo
              </button>
            </div>
          </div>
        </div>

        {/* Info section */}
        <div className="glass-strong rounded-2xl p-6">
          <h2 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-4 flex items-center gap-2">
            <Mail className="size-4 text-zinc-400" />
            Account info
          </h2>

          <form onSubmit={handleSave} className="space-y-4">
            <Input
              label="Display name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Your name"
              leftIcon={<User className="size-4" />}
              required
            />

            <Input
              label="Email"
              value={profile.email}
              disabled
              leftIcon={<Mail className="size-4" />}
              hint="Email cannot be changed"
            />

            <div className="pt-2">
              <Button
                type="submit"
                loading={saving}
                disabled={displayName.trim() === profile.display_name}
                icon={saved ? <Check className="size-4" /> : undefined}
                className="w-full sm:w-auto"
              >
                {saved ? 'Saved!' : 'Save changes'}
              </Button>
            </div>
          </form>
        </div>

        {/* Account details */}
        <div className="glass-strong rounded-2xl p-6">
          <h2 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-4">
            Account details
          </h2>
          <dl className="space-y-3">
            <div className="flex justify-between items-center">
              <dt className="text-xs text-zinc-400 dark:text-zinc-500">Member since</dt>
              <dd className="text-xs text-zinc-600 dark:text-zinc-300 font-medium">
                {new Date(profile.created_at).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </dd>
            </div>
            <div className="flex justify-between items-center">
              <dt className="text-xs text-zinc-400 dark:text-zinc-500">User ID</dt>
              <dd className="text-xs text-zinc-600 dark:text-zinc-300 font-mono">
                {String(user?.id).slice(0, 8)}…
              </dd>
            </div>
          </dl>
        </div>
      </motion.div>
    </PageLayout>
  )
}
