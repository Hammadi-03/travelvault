import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface ProgressBarProps {
  value: number // 0–100
  className?: string
  color?: 'blue' | 'green' | 'red' | 'amber'
  showLabel?: boolean
  size?: 'sm' | 'md'
}

const colors = {
  blue: 'bg-blue-500',
  green: 'bg-emerald-500',
  red: 'bg-red-500',
  amber: 'bg-amber-500',
}

export function ProgressBar({
  value,
  className,
  color = 'blue',
  showLabel = false,
  size = 'sm',
}: ProgressBarProps) {
  const clamped = Math.min(100, Math.max(0, value))

  return (
    <div className={cn('w-full', className)}>
      {showLabel && (
        <div className="flex justify-between text-xs text-zinc-500 mb-1">
          <span>Uploading</span>
          <span>{Math.round(clamped)}%</span>
        </div>
      )}
      <div
        className={cn(
          'w-full bg-zinc-200 dark:bg-zinc-700 rounded-full overflow-hidden',
          size === 'sm' ? 'h-1' : 'h-2'
        )}
        role="progressbar"
        aria-valuenow={clamped}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <motion.div
          className={cn('h-full rounded-full', colors[color])}
          initial={{ width: 0 }}
          animate={{ width: `${clamped}%` }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
        />
      </div>
    </div>
  )
}
