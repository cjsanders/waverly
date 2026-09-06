import { useState, type CSSProperties } from 'react'

import { cn } from '../../lib/utils'

/** Fixed geometry keeps source images from determining table and list row sizes. */
export function Thumbnail({
  src,
  alt,
  size = 'md',
  fit = 'contain',
  className,
}: {
  src: string
  alt: string
  size?: 'sm' | 'md' | 'lg'
  fit?: CSSProperties['objectFit']
  className?: string
}) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null)
  const pixels = { sm: 40, md: 48, lg: 64 }[size]
  const initials = alt
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word[0])
    .join('')
    .toUpperCase()

  return (
    <span
      data-slot="thumbnail"
      className={cn(
        'inline-flex shrink-0 items-center justify-center overflow-hidden rounded-md border border-border text-xs font-semibold text-muted-foreground',
        src && failedSrc !== src ? 'bg-[var(--media-background)]' : 'bg-muted',
        className,
      )}
      style={{ width: pixels, height: pixels }}
    >
      {src && failedSrc !== src ? (
        <img
          src={src}
          alt={alt}
          width={pixels}
          height={pixels}
          loading="lazy"
          decoding="async"
          onError={() => setFailedSrc(src)}
          style={{ width: '100%', height: '100%', objectFit: fit }}
        />
      ) : (
        <>
          <span aria-hidden="true">{initials || '—'}</span>
          <span className="sr-only">{alt ? `${alt}: image unavailable` : 'Image unavailable'}</span>
        </>
      )}
    </span>
  )
}
