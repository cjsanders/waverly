/**
 * Shared visual config for build-time OG cards.
 *
 * Edit this file to retune generated card colors, spacing, and fonts. Both
 * the per-page endpoint (`og/[...slug].ts`) and the homepage fallback
 * (`og.png.ts`) spread this object into `astro-og-canvas`.
 *
 * Leading underscore tells Astro to skip routing for this file — it sits
 * inside `src/pages/` to be next to its consumers, but it's not a route.
 */

import type { OGImageOptions } from 'astro-og-canvas'

export const ogCardConfig = {
  // Waverly palette: brand-950 → brand-900 background, brand-500 edge, sand-50 / brand-300 text.
  bgGradient: [
    [17, 29, 41],
    [27, 47, 64],
  ],
  border: { color: [57, 124, 168], width: 2, side: 'inline-start' },
  padding: 96,
  // Quicksand Bold, instanced from the Google Fonts variable file (OFL, see Quicksand-OFL.txt).
  fonts: ['./public/fonts/Quicksand-Bold.ttf'],
  font: {
    title: {
      color: [250, 249, 246],
      size: 64,
      weight: 'Bold',
      families: ['Quicksand'],
      lineHeight: 1.1,
    },
    description: {
      color: [134, 180, 200],
      size: 32,
      weight: 'Bold',
      families: ['Quicksand'],
      lineHeight: 1.3,
    },
  },
  format: 'PNG',
} satisfies Partial<OGImageOptions>
