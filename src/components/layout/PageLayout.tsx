import type { ReactNode } from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface PageLayoutProps {
  children: ReactNode
  className?: string
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '7xl' | 'full'
  padding?: boolean
}

const maxWidths = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  '2xl': 'max-w-2xl',
  '7xl': 'max-w-7xl',
  full: 'max-w-full',
}

export function PageLayout({
  children,
  className,
  maxWidth = '7xl',
  padding = true,
}: PageLayoutProps) {
  return (
    <motion.main
      className={cn(
        'min-h-screen pt-24',
        padding && 'px-4 sm:px-6 py-8',
        className
      )}
      style={{
        backgroundColor: '#e3cba8',
        backgroundImage: "url('/bg-texture.png')",
        backgroundRepeat: 'repeat',
        backgroundSize: '600px 600px',
      }}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30, duration: 0.3 }}
    >
      <div className={cn('mx-auto w-full', maxWidths[maxWidth])}>
        {children}
      </div>
    </motion.main>
  )
}
