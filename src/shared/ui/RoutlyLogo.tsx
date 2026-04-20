import styled from 'styled-components'

interface RoutlyLogoProps {
  size?: 'sm' | 'md' | 'lg'
  /** Override icon background — defaults to the app accent (#6366F1) */
  iconColor?: string
  /** Override text color — defaults to theme textPrimary */
  textColor?: string
  /** Adds a soft accent glow behind the icon */
  glow?: boolean
  className?: string
}

const ICON_SIZES = { sm: 20, md: 27, lg: 28 } as const
const TEXT_SIZES = { sm: 14, md: 18, lg: 19 } as const
const RADII      = { sm: 5,  md: 7,  lg: 7  } as const

/**
 * Routly brand logo — icon + wordmark.
 * Drop-in for both the landing page and the admin engine.
 */
export function RoutlyLogo({
  size = 'md',
  iconColor = '#6366F1',
  textColor,
  glow = false,
  className,
}: RoutlyLogoProps) {
  const px = ICON_SIZES[size]
  const rx = RADII[size]

  return (
    <Wrap className={className}>
      {/* ── Icon: two flow-nodes converging into one ────────────────── */}
      <IconWrap $glow={glow}>
      <svg
        width={px}
        height={px}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        {/* Background tile */}
        <rect width="24" height="24" rx={rx} fill={iconColor} />

        {/* Top-left node */}
        <circle cx="7.5" cy="7.5" r="2.2" fill="white" />
        {/* Bottom-left node */}
        <circle cx="7.5" cy="16.5" r="2.2" fill="white" />
        {/* Right (merged) node */}
        <circle cx="17"  cy="12"   r="2.2" fill="white" />

        {/* Top arm: top-left → right */}
        <path
          d="M9.7 7.5 C13 7.5 13 12 14.8 12"
          stroke="rgba(255,255,255,0.65)"
          strokeWidth="1.6"
          strokeLinecap="round"
          fill="none"
        />
        {/* Bottom arm: bottom-left → right */}
        <path
          d="M9.7 16.5 C13 16.5 13 12 14.8 12"
          stroke="rgba(255,255,255,0.65)"
          strokeWidth="1.6"
          strokeLinecap="round"
          fill="none"
        />
      </svg>
      </IconWrap>

      {/* ── Wordmark ────────────────────────────────────────────────── */}
      <Word $size={TEXT_SIZES[size]} $color={textColor}>
        Routly
      </Word>
    </Wrap>
  )
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const Wrap = styled.div`
  display: flex;
  align-items: center;
  gap: 9px;
  user-select: none;
  flex-shrink: 0;
`

const IconWrap = styled.div<{ $glow: boolean }>`
  display: flex;
  align-items: center;
  flex-shrink: 0;
  filter: ${({ $glow }) =>
    $glow ? 'drop-shadow(0 0 10px rgba(99,102,241,0.5))' : 'none'};
  transition: filter 0.2s ease;
`

const Word = styled.span<{ $size: number; $color?: string }>`
  font-size: ${({ $size }) => $size}px;
  font-weight: 700;
  letter-spacing: -0.4px;
  color: ${({ $color, theme }) => $color ?? theme.colors.textPrimary};
  line-height: 1;
`
