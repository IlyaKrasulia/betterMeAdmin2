/**
 * Formats an ISO date string as a human-readable relative label.
 * Future dates fall through to the absolute date format.
 */
export function formatDate(iso: string): string {
  const date = new Date(iso)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))

  if (days === 0) return 'Today'
  if (days === 1) return 'Yesterday'
  if (days > 1 && days < 7) return `${days} days ago`
  if (days >= 7 && days < 30) return `${Math.floor(days / 7)} weeks ago`

  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

/**
 * Abbreviates large numbers with K/M suffixes and trims trailing decimal zeros.
 * e.g. 1000 → "1K", 1500 → "1.5K", 1_000_000 → "1M"
 */
export function formatNumber(n: number): string {
  if (n >= 1_000_000) {
    const val = (n / 1_000_000).toFixed(1)
    return `${parseFloat(val)}M`
  }
  if (n >= 1_000) {
    const val = (n / 1_000).toFixed(1)
    return `${parseFloat(val)}K`
  }
  return n.toString()
}
