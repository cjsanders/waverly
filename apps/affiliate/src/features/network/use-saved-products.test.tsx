import { act, renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, test, vi } from 'vitest'

import { useSavedProducts } from './use-saved-products'

const storageKey = (tenantId: string, identity: string) =>
  `waverly.workspace.${tenantId}.${identity}.saved-products.v1`

describe('useSavedProducts', () => {
  beforeEach(() => {
    window.sessionStorage.clear()
  })

  test('restores a saved selection without overwriting it with server defaults', async () => {
    const key = storageKey('tenant-a', 'publisher')
    window.sessionStorage.setItem(key, JSON.stringify(['saved']))
    const setItem = vi.spyOn(Storage.prototype, 'setItem')

    const { result } = renderHook(() =>
      useSavedProducts('tenant-a', 'publisher', ['server-default']),
    )

    await waitFor(() => expect([...result.current[0]]).toEqual(['saved']))
    expect(setItem).not.toHaveBeenCalledWith(key, JSON.stringify(['server-default']))
    expect(window.sessionStorage.getItem(key)).toBe(JSON.stringify(['saved']))
  })

  test('persists updates for the current tenant and identity', async () => {
    const { result } = renderHook(() => useSavedProducts('tenant-a', 'creator', ['first']))

    await waitFor(() =>
      expect(window.sessionStorage.getItem(storageKey('tenant-a', 'creator'))).toBe(
        JSON.stringify(['first']),
      ),
    )

    act(() => result.current[1](new Set(['second', 'third'])))

    await waitFor(() =>
      expect(window.sessionStorage.getItem(storageKey('tenant-a', 'creator'))).toBe(
        JSON.stringify(['second', 'third']),
      ),
    )
  })

  test('keeps selections isolated when the workspace identity changes', async () => {
    const brandKey = storageKey('tenant-a', 'brand')
    const creatorKey = storageKey('tenant-a', 'creator')
    window.sessionStorage.setItem(brandKey, JSON.stringify(['brand-item']))
    window.sessionStorage.setItem(creatorKey, JSON.stringify(['creator-item']))
    const setItem = vi.spyOn(Storage.prototype, 'setItem')

    const { result, rerender } = renderHook(
      ({ identity }) => useSavedProducts('tenant-a', identity, ['default']),
      { initialProps: { identity: 'brand' } },
    )

    await waitFor(() => expect([...result.current[0]]).toEqual(['brand-item']))
    rerender({ identity: 'creator' })
    await waitFor(() => expect([...result.current[0]]).toEqual(['creator-item']))

    expect(setItem).not.toHaveBeenCalledWith(creatorKey, JSON.stringify(['brand-item']))
    expect(window.sessionStorage.getItem(brandKey)).toBe(JSON.stringify(['brand-item']))
  })

  test('keeps selections isolated when the tenant changes', async () => {
    const firstKey = storageKey('tenant-a', 'creator')
    const secondKey = storageKey('tenant-b', 'creator')
    window.sessionStorage.setItem(firstKey, JSON.stringify(['first-tenant-item']))
    window.sessionStorage.setItem(secondKey, JSON.stringify(['second-tenant-item']))
    const setItem = vi.spyOn(Storage.prototype, 'setItem')

    const { result, rerender } = renderHook(
      ({ tenantId }) => useSavedProducts(tenantId, 'creator', ['default']),
      { initialProps: { tenantId: 'tenant-a' } },
    )

    await waitFor(() => expect([...result.current[0]]).toEqual(['first-tenant-item']))
    rerender({ tenantId: 'tenant-b' })
    await waitFor(() => expect([...result.current[0]]).toEqual(['second-tenant-item']))

    expect(setItem).not.toHaveBeenCalledWith(secondKey, JSON.stringify(['first-tenant-item']))

    act(() => result.current[1](new Set(['updated-second-tenant-item'])))
    await waitFor(() =>
      expect(window.sessionStorage.getItem(secondKey)).toBe(
        JSON.stringify(['updated-second-tenant-item']),
      ),
    )
    expect(window.sessionStorage.getItem(firstKey)).toBe(JSON.stringify(['first-tenant-item']))
  })

  test('falls back to defaults when storage is corrupt', async () => {
    window.sessionStorage.setItem(storageKey('tenant-a', 'operator'), '{not-json')

    const { result } = renderHook(() =>
      useSavedProducts('tenant-a', 'operator', ['default-one', 'default-two']),
    )

    await waitFor(() => expect([...result.current[0]]).toEqual(['default-one', 'default-two']))
    expect(window.sessionStorage.getItem(storageKey('tenant-a', 'operator'))).toBe(
      JSON.stringify(['default-one', 'default-two']),
    )
  })
})
