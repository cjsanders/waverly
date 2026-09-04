// Waverly logo components for React apps. The SVGs are bundled as hashed assets; nothing needs
// copying into `public/`. Astro apps use `@waverly/design-system/astro/Logo.astro` instead.
import { cn } from '../../lib/utils'
import iconSrc from '../../brand/waverly-icon.svg?url'
import logoWhiteSrc from '../../brand/waverly-logo-white.svg?url'
import logoSrc from '../../brand/waverly-logo.svg?url'

/** Full lockup (3192×475, ~6.7:1). Swaps to the white wordmark in dark mode. */
export function Logo({ className, height = 24 }: { className?: string; height?: number }) {
  return (
    <span className={cn('inline-flex shrink-0', className)} style={{ height }}>
      <img src={logoSrc} alt="Waverly" className="h-full w-auto dark:hidden" />
      <img src={logoWhiteSrc} alt="Waverly" className="hidden h-full w-auto dark:inline" />
    </span>
  )
}

/** Wave mark alone (869×464, ~1.87:1). `size` sets height; width follows. Use at 24px or larger; never recolor the layers. */
export function LogoIcon({ className, size = 32 }: { className?: string; size?: number }) {
  return (
    <img
      src={iconSrc}
      alt=""
      aria-hidden
      height={size}
      style={{ height: size }}
      className={cn('w-auto shrink-0', className)}
    />
  )
}

export { iconSrc as logoIconSrc, logoSrc, logoWhiteSrc }
