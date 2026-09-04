# @waverly/design-system

Waverly's design tokens, Tailwind v4 theme, brand assets, and shadcn/ui component overrides. The package ships source (no build step); every app compiles it with its own Vite or Astro toolchain.

## Theme

For a Tailwind v4 app (with or without shadcn/ui), put this at the top of the app stylesheet:

```css
@import 'tailwindcss';
@import '@waverly/design-system/styles.css';
```

That maps every shadcn token (`--primary`, `--card`, `--sidebar-*`, `--chart-*`) to Waverly values, adds dark mode, self-hosts the fonts, and exposes the raw palette as utilities (`bg-wave-3`, `text-brand-600`, `bg-sand-100`, `shadow-md`, `font-display`). Dark mode responds to a `.dark` class or a `data-mode="dark"` attribute on any ancestor.

Apps that keep their own Tailwind theme can import the layers separately:

| Import                              | Contents                                                               |
| ----------------------------------- | ---------------------------------------------------------------------- |
| `@waverly/design-system/tokens.css` | Plain CSS custom properties for light and dark. No Tailwind.           |
| `@waverly/design-system/fonts.css`  | Figtree, Quicksand, and JetBrains Mono as self-hosted variable fonts.  |
| `@waverly/design-system/theme.css`  | `@theme` mapping plus base styles. Needs `tailwindcss` imported first. |

## Fonts

Quicksand (`font-display`) is for headings and big numbers only. Figtree (`font-sans`) is for everything else. JetBrains Mono (`font-mono`) is for code. The fonts come from Fontsource, so nothing loads from Google Fonts at runtime.

## Components (React)

```tsx
import { Button } from '@waverly/design-system/ui/button'
import { Badge } from '@waverly/design-system/ui/badge'
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@waverly/design-system/ui/card'
import { Input } from '@waverly/design-system/ui/input'
import { Logo, LogoIcon } from '@waverly/design-system/brand'
```

They keep shadcn's API and add the Waverly shape rules:

- `Button`: pill radius, `accent` (teal) variant, `secondary` is outlined, hover darkens one step, no scale on press, 3px ring focus.
- `Badge`: soft-tint tones (`brand`, `accent`, `success`, `warning`, `info`) and a `dot` prop.
- `Input`: pill, 44px tall, brand focus ring.
- `Card`: border first (no default shadow), Quicksand title.

Other shadcn components need no changes. Generate them with the shadcn CLI as usual; they pick up radius, colors, and ring from the theme. Two conventions to apply by hand: a `Tabs` list uses `rounded-full bg-muted p-1` for the segmented look, and `Dialog` content uses `rounded-2xl shadow-lg`.

## Logo

- React: `<Logo />` is the full lockup and swaps to the white wordmark in dark mode. `<LogoIcon />` is the wave mark for avatars and sidebars.
- Astro: `import Logo from '@waverly/design-system/astro/Logo.astro'` and `LogoIcon.astro` do the same.
- Favicon: `import icon from '@waverly/design-system/brand/waverly-icon.svg?url'` and point `<link rel="icon">` at it. The raw files are also exported as `@waverly/design-system/brand/*.svg`.

Use the icon at 24px or larger and never recolor its layers.

## Rules that are not code

- Sentence case. No emoji, no exclamation marks.
- One primary button per view. Teal `accent` at most once per view.
- Charts use `chart-1` through `chart-5` in order (the wave, light to deep).
