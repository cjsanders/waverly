import { describe, expect, it } from 'bun:test'

import { docsSections, isSectionActive } from './docs-nav'

describe('docs sections', () => {
  it('marks the active use-case tab from the current path', () => {
    const onWork = docsSections('/creators/work')
    expect(onWork.map((section) => [section.label, section.isActive])).toEqual([
      ['Creators', true],
      ['Sellers', false],
      ['Team', false],
    ])
    expect(isSectionActive('/internal', '/internal/workspaces')).toBe(true)
    expect(isSectionActive('/sellers', '/creators')).toBe(false)
  })
})
