import { describe, expect, test } from 'vitest'
import { formatDate, formatReportDate } from './formatters'

describe('reporting date formatters', () => {
  // Noon UTC on Aug 15 is Aug 16 in time zones east of UTC+12, and still Aug 15 in the US.
  const networkAnchor = Date.UTC(2026, 7, 15, 12)

  test('formatDate uses the UTC calendar day', () => {
    expect(formatDate(networkAnchor)).toBe('Aug 15')
  })

  test('formatReportDate uses the UTC calendar day', () => {
    expect(formatReportDate(networkAnchor)).toBe('Aug 15, 2026')
  })

  test('an early UTC morning stays on that UTC day', () => {
    const earlyUtc = Date.UTC(2026, 7, 16, 2, 0, 0)
    expect(formatDate(earlyUtc)).toBe('Aug 16')
    expect(formatReportDate(earlyUtc)).toBe('Aug 16, 2026')
  })
})
