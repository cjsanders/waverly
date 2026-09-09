import { useSyncExternalStore } from 'react'

const subscribe = () => () => {}

/** False during SSR and the matching hydration pass, then true in the live browser. */
export function useHydrated() {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  )
}
