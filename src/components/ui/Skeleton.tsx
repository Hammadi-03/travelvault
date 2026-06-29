import { cn } from '@/lib/utils'

interface SkeletonProps {
  className?: string
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        'animate-pulse rounded-xl bg-zinc-200 dark:bg-zinc-800',
        className
      )}
      aria-hidden="true"
    />
  )
}

export function MediaCardSkeleton() {
  const heights = ['h-48', 'h-64', 'h-40', 'h-56', 'h-72', 'h-44']
  const height = heights[Math.floor(Math.random() * heights.length)]

  return (
    <div className="break-inside-avoid mb-3">
      <Skeleton className={cn('w-full rounded-2xl', height)} />
    </div>
  )
}

export function GallerySkeleton() {
  return (
    <div
      className="columns-2 md:columns-3 lg:columns-4 xl:columns-5 gap-3"
      aria-label="Loading gallery"
    >
      {Array.from({ length: 12 }).map((_, i) => (
        <MediaCardSkeleton key={i} />
      ))}
    </div>
  )
}

export function ProfileSkeleton() {
  return (
    <div className="flex items-center gap-3">
      <Skeleton className="size-10 rounded-full" />
      <div className="flex flex-col gap-1.5">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-3 w-20" />
      </div>
    </div>
  )
}
