// Waverly input: 44px tall, themeable control radius, brand focus ring.
import type * as React from 'react'

import { cn } from '../../lib/utils'

function Input({ className, type, ...props }: React.ComponentProps<'input'>) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        'flex h-[var(--control-height,2.75rem)] w-full rounded-[var(--control-radius,999px)] border border-input bg-card px-[var(--control-padding,1rem)] text-sm text-foreground shadow-none transition-[box-shadow,border-color] duration-150 ease-out outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/30 disabled:cursor-not-allowed disabled:opacity-45 aria-invalid:border-destructive file:border-0 file:bg-transparent file:text-sm file:font-medium',
        className,
      )}
      {...props}
    />
  )
}

export { Input }
