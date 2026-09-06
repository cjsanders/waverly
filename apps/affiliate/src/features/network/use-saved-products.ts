import { useEffect, useState } from 'react'

/** Browser-local demo curation survives page navigation without pretending to publish changes. */
export function useSavedProducts(identity: string, defaultIds: string[]) {
  const key = `waverly.demo.${identity}.saved-products.v1`
  const [saved, setSaved] = useState<Set<string>>(() => {
    try {
      const value: unknown = JSON.parse(window.sessionStorage.getItem(key) ?? 'null')
      if (Array.isArray(value) && value.every((id): id is string => typeof id === 'string')) {
        return new Set(value)
      }
    } catch {
      /* Use deterministic defaults when storage is blocked or corrupt. */
    }
    return new Set(defaultIds)
  })
  useEffect(() => {
    try {
      window.sessionStorage.setItem(key, JSON.stringify([...saved]))
    } catch {
      /* Optional demo preference. */
    }
  }, [key, saved])
  return [saved, setSaved] as const
}
