import type { ClassValue } from 'clsx'
import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

/** Compose class names with Tailwind conflict resolution. The last argument wins. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
