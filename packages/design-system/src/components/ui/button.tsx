// Waverly button: pill shape by default (workspace radius can override), teal accent, outlined secondary, hover darkens one
// step, no scale on press, 3px focus ring. Keeps the shadcn/ui API.
import type * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { Slot } from 'radix-ui'

import { cn } from '../../lib/utils'

const buttonVariants = cva(
  'inline-flex shrink-0 items-center justify-center gap-2 rounded-[var(--control-radius,999px)] text-sm font-medium whitespace-nowrap transition-colors duration-150 ease-out outline-none focus-visible:ring-[3px] focus-visible:ring-ring/30 disabled:pointer-events-none disabled:opacity-45 aria-invalid:border-destructive [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*="size-"])]:size-4',
  {
    variants: {
      variant: {
        default:
          'bg-primary text-primary-foreground hover:bg-[var(--primary-hover,var(--brand-700))] active:bg-[var(--primary-active,var(--brand-800))]',
        accent: 'bg-brand-teal text-brand-teal-foreground hover:bg-teal-500 active:bg-teal-600',
        secondary:
          'border border-input bg-transparent text-foreground hover:bg-muted active:bg-secondary',
        ghost: 'text-accent-foreground hover:bg-accent active:bg-accent',
        destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
        link: 'text-primary underline-offset-[3px] hover:underline',
      },
      size: {
        sm: 'h-8 px-3.5 text-xs',
        default: 'h-[var(--control-height,2.5rem)] px-[var(--control-padding,1.25rem)]',
        lg: 'h-12 px-[26px] text-base',
        icon: 'size-[var(--control-height,2.5rem)]',
        'icon-sm': 'size-8',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
)

type ButtonProps = React.ComponentProps<'button'> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }

function Button({
  className,
  variant = 'default',
  size = 'default',
  asChild = false,
  ...props
}: ButtonProps) {
  const Comp = asChild ? Slot.Root : 'button'

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
export type { ButtonProps }
