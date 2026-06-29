import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Mail, Lock, User, Eye, EyeOff } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { AuthCard } from '@/components/auth/AuthCard'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'

export function SignUpPage() {
  const { signUp } = useAuth()
  const navigate = useNavigate()
  const [displayName, setDisplayName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!displayName.trim() || !email || !password || !confirm) {
      setError('Please fill in all fields.')
      return
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }
    if (password !== confirm) {
      setError('Passwords do not match.')
      return
    }

    setLoading(true)
    try {
      await signUp(email, password, displayName.trim())
      setSuccess(true)
      setTimeout(() => navigate('/gallery'), 2000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create account.')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <AuthCard
        title="Account created!"
        description="Welcome to TravelVault. Redirecting you to the gallery…"
      >
        <div className="flex flex-col items-center py-4 gap-3">
          <motion.div
            className="size-14 rounded-2xl bg-green-100 flex items-center justify-center"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 400, damping: 20 }}
          >
            <svg className="size-7 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </motion.div>
          <p className="text-sm text-gray-500">Taking you to your vault…</p>
        </div>
      </AuthCard>
    )
  }

  return (
    <AuthCard
      title="Create an account"
      description="Join your friends on TravelVault"
      footer={
        <span>
          Already have an account?{' '}
          <Link to="/login" className="text-black hover:underline font-medium">
            Sign in
          </Link>
        </span>
      }
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
        {error && (
          <motion.div
            className="px-3.5 py-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-600"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            role="alert"
          >
            {error}
          </motion.div>
        )}

        <Input
          label="Display name"
          type="text"
          placeholder="Alex Johnson"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          leftIcon={<User className="size-4" />}
          autoComplete="name"
          required
        />

        <Input
          label="Email"
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          leftIcon={<Mail className="size-4" />}
          autoComplete="email"
          required
        />

        <Input
          label="Password"
          type={showPassword ? 'text' : 'password'}
          placeholder="Min. 8 characters"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          leftIcon={<Lock className="size-4" />}
          rightIcon={
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="p-0.5 rounded hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          }
          autoComplete="new-password"
          hint="At least 8 characters"
          required
        />

        <Input
          label="Confirm password"
          type={showPassword ? 'text' : 'password'}
          placeholder="Re-enter your password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          leftIcon={<Lock className="size-4" />}
          autoComplete="new-password"
          error={confirm && password !== confirm ? 'Passwords do not match' : ''}
          required
        />

        <Button type="submit" loading={loading} className="w-full mt-1" size="lg">
          Create account
        </Button>
      </form>
    </AuthCard>
  )
}
