// Waverly badge: soft-tint backgrounds, optional status dot, brand/accent/success/warning/info tones.
import type * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '../../lib/utils'

const badgeVariants = cva(
  'inline-flex items-center gap-1.5 rounded-full px-2.5 py-[3px] text-xs font-medium whitespace-nowrap',
  {
    variants: {
      variant: {
        default: 'bg-muted text-muted-foreground',
        brand: 'bg-accent text-accent-foreground',
        accent: 'bg-teal-100 text-teal-600 dark:bg-brand-teal/20 dark:text-teal-300',
        success: 'bg-success-foreground text-success',
        warning: 'bg-warning-foreground text-warning',
        destructive: 'bg-destructive/15 text-destructive',
        info: 'bg-info-foreground text-info',
        outline: 'border border-border text-foreground',
      },
    },
    defaultVariants: { variant: 'default' },
  },
)

type BadgeProps = React.ComponentProps<'span'> &
  VariantProps<typeof badgeVariants> & {
    /** Prefix the label with a small dot in the badge's text color. */
    dot?: boolean
  }

function Badge({ className, variant = 'default', dot, children, ...props }: BadgeProps) {
  return (
    <span
      data-slot="badge"
      data-variant={variant}
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    >
      {dot && <span aria-hidden className="size-1.5 rounded-full bg-current" />}
      {children}
    </span>
  )
}

export { Badge, badgeVariants }
export type { BadgeProps }
