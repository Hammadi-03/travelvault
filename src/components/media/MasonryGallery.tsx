import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { gsap } from 'gsap'
import { Play, Download, Loader2 } from 'lucide-react'
import type { MediaItem } from '@/types'
import { useAuth } from '@/context/AuthContext'
import { resolveMediaUrl, isHeicFile } from '@/lib/utils'
import './Masonry.css'

// ── responsive column hook ────────────────────────────────────────────────────
const useColumns = () => {
  const queries = ['(min-width: 1280px)', '(min-width: 900px)', '(min-width: 600px)']
  const values  = [3, 2, 2]
  const get     = () => values[queries.findIndex(q => matchMedia(q).matches)] ?? 1
  const [cols, setCols] = useState(get)

  useEffect(() => {
    const handler = () => setCols(get)
    queries.forEach(q => matchMedia(q).addEventListener('change', handler))
    return () => queries.forEach(q => matchMedia(q).removeEventListener('change', handler))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return cols
}

// ── container-width hook ──────────────────────────────────────────────────────
const useMeasure = () => {
  const ref = useRef<HTMLDivElement>(null)
  const [width, setWidth] = useState(0)

  useLayoutEffect(() => {
    if (!ref.current) return
    // Grab initial width synchronously
    setWidth(ref.current.getBoundingClientRect().width)
    const ro = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width))
    ro.observe(ref.current)
    return () => ro.disconnect()
  }, [])

  return [ref, width] as const
}

// ── internal item shape ───────────────────────────────────────────────────────
interface GridItem {
  id:     string
  img:    string
  height: number   // input ratio hint
  data:   MediaItem
  x:      number
  y:      number
  w:      number
  h:      number
}

// ── props ─────────────────────────────────────────────────────────────────────
interface MasonryProps {
  items:              MediaItem[]
  loading:            boolean
  hasMore:            boolean
  onLoadMore:         () => void
  onOpen:             (item: MediaItem) => void
  onDelete?:          (item: MediaItem) => void
  emptyMessage?:      string
  emptyDescription?:  string
  ease?:              string
  duration?:          number
  stagger?:           number
  animateFrom?:       'top' | 'bottom' | 'left' | 'right' | 'center' | 'random'
  scaleOnHover?:      boolean
  hoverScale?:        number
  blurToFocus?:       boolean
  colorShiftOnHover?: boolean
}

// ── component ─────────────────────────────────────────────────────────────────
export function MasonryGallery({
  items,
  loading,
  hasMore,
  onLoadMore,
  onOpen,
  onDelete,
  emptyMessage      = 'No media yet',
  emptyDescription  = 'Upload some photos or videos to get started.',
  ease              = 'power3.out',
  duration          = 0.6,
  stagger           = 0.05,
  animateFrom       = 'bottom',
  scaleOnHover      = true,
  hoverScale        = 0.95,
  blurToFocus       = true,
  colorShiftOnHover = false,
}: MasonryProps) {
  const { user }                     = useAuth()
  const columns                      = useColumns()
  const [containerRef, width]        = useMeasure()
  const hasMounted                   = useRef(false)
  const animatedIds                  = useRef(new Set<string>())

  // Convert MediaItem[] → layout-ready items
  const rawItems = useMemo(() =>
    items.map(item => {
      const img = resolveMediaUrl(item.thumbnail_url || item.public_url)
      let layoutH = 800
      if (item.width && item.height && item.width > 0) {
        layoutH = Math.min(Math.max((item.height / item.width) * 900, 400), 1800)
      }
      return { id: item.id, img, height: layoutH, data: item }
    }),
    [items]
  )

  // Compute absolute layout positions
  const grid = useMemo<GridItem[]>(() => {
    if (!width) return []
    const colHeights  = new Array(columns).fill(0)
    const colW        = width / columns

    return rawItems.map(child => {
      const col = colHeights.indexOf(Math.min(...colHeights))
      const x   = colW * col
      const h   = child.height / 2          // pixel height on screen
      const y   = colHeights[col]
      colHeights[col] += h
      return { ...child, x, y, w: colW, h }
    })
  }, [columns, rawItems, width])

  // Container height = tallest column
  const containerHeight = useMemo(
    () => (grid.length ? Math.max(...grid.map(i => i.y + i.h)) : 0),
    [grid]
  )

  // ── GSAP: animate new items in ────────────────────────────────────────────
  useLayoutEffect(() => {
    if (!grid.length) return

    grid.forEach((item, index) => {
      const sel = `[data-key="${item.id}"]`

      // Reposition existing animated items (column reflow)
      if (animatedIds.current.has(item.id)) {
        gsap.to(sel, {
          x: item.x, y: item.y, width: item.w, height: item.h,
          duration, ease, overwrite: 'auto',
        })
        return
      }

      // First-time entry animation — start from off-screen
      let fromX = item.x, fromY = item.y
      let dir   = animateFrom as string
      if (dir === 'random') {
        const dirs = ['top', 'bottom', 'left', 'right']
        dir = dirs[Math.floor(Math.random() * dirs.length)]
      }
      if (dir === 'top')    fromY = -200
      if (dir === 'bottom') fromY = window.innerHeight + 200
      if (dir === 'left')   fromX = -200
      if (dir === 'right')  fromX = window.innerWidth + 200

      gsap.fromTo(sel,
        {
          opacity: 0,
          x: fromX, y: fromY,
          width: item.w, height: item.h,
          ...(blurToFocus ? { filter: 'blur(10px)' } : {}),
        },
        {
          opacity: 1,
          x: item.x, y: item.y,
          width: item.w, height: item.h,
          ...(blurToFocus ? { filter: 'blur(0px)' } : {}),
          duration: 0.8, ease: 'power3.out',
          delay: hasMounted.current ? 0 : index * stagger,
        }
      )

      animatedIds.current.add(item.id)
    })

    hasMounted.current = true
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [grid])

  // ── Hover handlers ────────────────────────────────────────────────────────
  const onEnter = (item: GridItem) => {
    if (scaleOnHover)      gsap.to(`[data-key="${item.id}"]`, { scale: hoverScale, duration: 0.3, ease: 'power2.out' })
    if (colorShiftOnHover) gsap.to(`[data-key="${item.id}"] .masonry-color-overlay`, { opacity: 0.3, duration: 0.3 })
  }
  const onLeave = (item: GridItem) => {
    if (scaleOnHover)      gsap.to(`[data-key="${item.id}"]`, { scale: 1, duration: 0.3, ease: 'power2.out' })
    if (colorShiftOnHover) gsap.to(`[data-key="${item.id}"] .masonry-color-overlay`, { opacity: 0, duration: 0.3 })
  }

  // ── Infinite scroll sentinel ──────────────────────────────────────────────
  const sentinelRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!sentinelRef.current) return
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting && hasMore && !loading) onLoadMore() },
      { rootMargin: '400px' }
    )
    observer.observe(sentinelRef.current)
    return () => observer.disconnect()
  }, [hasMore, loading, onLoadMore])

  // ── Render ────────────────────────────────────────────────────────────────

  // Loading skeleton (initial load, no items yet)
  if (loading && items.length === 0) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '80px 0' }}>
        <Loader2 size={32} color="#aaa" style={{ animation: 'spin 1s linear infinite' }} />
      </div>
    )
  }

  // Empty state
  if (!loading && items.length === 0) {
    return (
      <div className="masonry-empty">
        <p style={{ fontWeight: 700, fontSize: 17, marginBottom: 8 }}>{emptyMessage}</p>
        <p style={{ fontSize: 13 }}>{emptyDescription}</p>
      </div>
    )
  }

  return (
    <>
      {/* Masonry container — items are absolutely positioned inside */}
      <div
        ref={containerRef}
        className="masonry-list"
        style={{ height: containerHeight || undefined }}
      >
        {grid.map(item => {
          const mediaItem = item.data
          const isHeic    = isHeicFile(mediaItem.mime_type)
          const isVideo   = mediaItem.file_type === 'video'
          const isOwner   = user?.id == mediaItem.user_id

          return (
            <div
              key={item.id}
              data-key={item.id}
              className="masonry-item"
              style={{
                // CSS gives initial visible position; GSAP overrides for animation.
                // Items start visible so there's no blank flash.
                left: item.x,
                top:  item.y,
                width:  item.w,
                height: item.h,
              }}
              onClick={() => onOpen(mediaItem)}
              onMouseEnter={() => onEnter(item)}
              onMouseLeave={() => onLeave(item)}
            >
              <div className="masonry-item-inner">
                {/* Media */}
                {isHeic ? (
                  <div className="masonry-item-heic">
                    <div className="masonry-item-heic-icon"><Download size={22} /></div>
                    <span className="masonry-item-heic-label">HEIC Image</span>
                    <span className="masonry-item-heic-sublabel">Click to download</span>
                  </div>
                ) : (
                  <img
                    src={item.img}
                    alt={mediaItem.file_name}
                    loading="lazy"
                    className="masonry-item-img"
                  />
                )}

                {colorShiftOnHover && <div className="masonry-color-overlay" />}

                {/* Type badge */}
                <div className="masonry-badge">{isVideo ? 'Video' : 'Photo'}</div>

                {/* Video play button */}
                {isVideo && (
                  <div className="masonry-play-btn">
                    <Play size={20} fill="white" color="white" />
                  </div>
                )}

                {/* Info bar */}
                <div className="masonry-info">
                  <div className="masonry-info-text">
                    <p className="masonry-info-name">
                      {mediaItem.uploader?.display_name ?? 'Unknown'}
                    </p>
                    {mediaItem.location && (
                      <p className="masonry-info-location">📍 {mediaItem.location}</p>
                    )}
                  </div>
                  {isOwner && onDelete && (
                    <button
                      type="button"
                      className="masonry-delete-btn"
                      onClick={e => { e.stopPropagation(); onDelete(mediaItem) }}
                    >
                      Delete
                    </button>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <div ref={sentinelRef} style={{ height: 1 }} />

      {/* Load-more spinner */}
      {loading && items.length > 0 && (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '32px 0' }}>
          <Loader2 size={28} color="#999" style={{ animation: 'spin 1s linear infinite' }} />
        </div>
      )}
    </>
  )
}
