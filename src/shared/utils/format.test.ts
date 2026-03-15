import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { formatDate, formatNumber } from '@shared/utils/format'

// ─── formatDate ───────────────────────────────────────────────────────────────

describe('formatDate', () => {
  const FIXED_NOW = new Date('2026-03-14T12:00:00Z')

  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(FIXED_NOW)
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('returns "Today" for a date on the same day', () => {
    expect(formatDate('2026-03-14T08:00:00Z')).toBe('Today')
  })

  it('returns "Yesterday" for a date one day ago', () => {
    expect(formatDate('2026-03-13T08:00:00Z')).toBe('Yesterday')
  })

  it('returns "N days ago" for dates 2–6 days ago', () => {
    expect(formatDate('2026-03-12T08:00:00Z')).toBe('2 days ago')
    expect(formatDate('2026-03-08T08:00:00Z')).toBe('6 days ago')
  })

  it('returns "N weeks ago" for dates 7–29 days ago', () => {
    expect(formatDate('2026-03-07T08:00:00Z')).toBe('1 weeks ago')
    expect(formatDate('2026-02-22T08:00:00Z')).toBe('2 weeks ago')
  })

  it('returns a localised absolute date for dates 30+ days ago', () => {
    const result = formatDate('2026-01-01T00:00:00Z')
    expect(result).toMatch(/Jan/)
  })

  it('returns a formatted date for future dates (not a negative count)', () => {
    const result = formatDate('2026-03-20T12:00:00Z')
    // Future date should not return "Today", "Yesterday", or "N days ago"
    expect(result).not.toMatch(/ago/)
    expect(result).not.toBe('Today')
    expect(result).not.toBe('Yesterday')
  })
})

// ─── formatNumber ─────────────────────────────────────────────────────────────

describe('formatNumber', () => {
  it('returns the number as a string for values below 1000', () => {
    expect(formatNumber(0)).toBe('0')
    expect(formatNumber(999)).toBe('999')
  })

  it('returns "1K" (not "1.0K") for exactly 1000', () => {
    expect(formatNumber(1_000)).toBe('1K')
  })

  it('returns abbreviated K values without trailing zeros', () => {
    expect(formatNumber(1_500)).toBe('1.5K')
    expect(formatNumber(2_000)).toBe('2K')
    expect(formatNumber(999_900)).toBe('999.9K')
  })

  it('returns "1M" (not "1.0M") for exactly 1 000 000', () => {
    expect(formatNumber(1_000_000)).toBe('1M')
  })

  it('returns abbreviated M values without trailing zeros', () => {
    expect(formatNumber(1_500_000)).toBe('1.5M')
    expect(formatNumber(2_000_000)).toBe('2M')
  })
})
