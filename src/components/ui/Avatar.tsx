import { cn, getInitials } from '@/lib/utils'

interface AvatarProps {
  src?: string | null
  name: string
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  className?: string
}

const sizes = {
  xs: 'size-6 text-[10px]',
  sm: 'size-8 text-xs',
  md: 'size-10 text-sm',
  lg: 'size-14 text-lg',
  xl: 'size-20 text-2xl',
}

export function Avatar({ src, name, size = 'md', className }: AvatarProps) {
  const initials = getInitials(name)

  if (src) {
    return (
      <img
        src={src}
        alt={name}
        className={cn(
          'rounded-full object-cover shrink-0 ring-2 ring-white/50',
          sizes[size],
          className
        )}
      />
    )
  }

  // Generate a consistent color based on name
  const colors = [
    'bg-gray-600',
    'bg-gray-700',
    'bg-gray-800',
    'bg-black',
    'bg-gray-500',
    'bg-gray-900',
    'bg-slate-700',
    'bg-slate-800',
  ]
  const colorIndex =
    name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) %
    colors.length

  return (
    <span
      aria-label={name}
      className={cn(
        'inline-flex items-center justify-center rounded-full font-semibold text-white shrink-0 select-none',
        'ring-2 ring-white/50',
        colors[colorIndex],
        sizes[size],
        className
      )}
    >
      {initials}
    </span>
  )
}
