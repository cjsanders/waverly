export const DOCS_SECTIONS = [
  { label: 'Creators', href: '/creators' },
  { label: 'Sellers', href: '/sellers' },
  { label: 'Internal', href: '/internal' },
] as const

export function isSectionActive(href: string, currentSlug: string): boolean {
  return currentSlug === href || currentSlug.startsWith(`${href}/`)
}

export function docsSections(currentSlug: string) {
  return DOCS_SECTIONS.map((section) => ({
    label: section.label,
    href: section.href,
    isActive: isSectionActive(section.href, currentSlug),
  }))
}
