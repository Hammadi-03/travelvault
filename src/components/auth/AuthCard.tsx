import type { ReactNode } from 'react'
import { motion } from 'framer-motion'
import { Mountain } from 'lucide-react'
import { Link } from 'react-router-dom'

interface AuthCardProps {
  title: string
  description: string
  children: ReactNode
  footer?: ReactNode
}

export function AuthCard({ title, description, children, footer }: AuthCardProps) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white px-4">
      {/* Background blobs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
        <div className="absolute -top-40 -right-40 size-96 bg-gray-200/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 size-96 bg-gray-300/20 rounded-full blur-3xl" />
      </div>

      <motion.div
        className="relative w-full max-w-sm"
        initial={{ opacity: 0, y: 24, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 28 }}
      >
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <Link to="/" className="group">
            <div className="size-12 rounded-2xl bg-black flex items-center justify-center shadow-xl shadow-black/30 group-hover:shadow-black/50 transition-shadow duration-300 mb-4">
              <Mountain className="size-6 text-white" />
            </div>
          </Link>
          <h1 className="text-xl font-semibold text-black text-center">
            {title}
          </h1>
          <p className="text-sm text-gray-600 text-center mt-1 max-w-xs">
            {description}
          </p>
        </div>

        {/* Card */}
        <div className="glass-strong rounded-2xl p-6 shadow-xl shadow-black/5">
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="mt-5 text-center text-sm text-gray-600">
            {footer}
          </div>
        )}
      </motion.div>
    </div>
  )
}
