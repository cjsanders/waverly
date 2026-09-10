import { useEffect, useRef, useState } from 'react'

/** Browser-local curation survives page navigation without pretending to publish changes. */
export function useSavedProducts(tenantId: string, identity: string, defaultIds: string[]) {
  const key = `waverly.workspace.${tenantId}.${identity}.saved-products.v1`
  const defaults = useRef(defaultIds)
  const [saved, setSaved] = useState(() => new Set(defaultIds))
  const [restoredKey, setRestoredKey] = useState<string | null>(null)

  useEffect(() => {
    let ids = defaults.current
    try {
      const value: unknown = JSON.parse(window.sessionStorage.getItem(key) ?? 'null')
      if (Array.isArray(value) && value.every((id): id is string => typeof id === 'string')) {
        ids = value
      }
    } catch {
      /* Use deterministic defaults when storage is blocked or corrupt. */
    }
    setSaved(new Set(ids))
    setRestoredKey(key)
  }, [key])

  useEffect(() => {
    // Do not overwrite stored preferences with the SSR defaults before restoring them.
    if (restoredKey !== key) return
    try {
      window.sessionStorage.setItem(key, JSON.stringify([...saved]))
    } catch {
      /* Optional browser preference. */
    }
  }, [key, restoredKey, saved])
  return [saved, setSaved] as const
}
