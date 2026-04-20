import { useEffect, useState } from 'react'
import styled from 'styled-components'
import { ExternalLink, ArrowRight } from 'lucide-react'
import type { SessionRedirect } from '@shared/types/api.types'

// ─── Tier config ──────────────────────────────────────────────────────────────

type TierConfig = {
  label: string
  accentColor: string
  badgeBg: string
  badgeColor: string
}

const TIERS: Record<string, TierConfig> = {
  Hot:          { label: 'High priority',    accentColor: '#EF4444', badgeBg: '#FEF2F2', badgeColor: '#B91C1C' },
  Warm:         { label: 'Great fit',        accentColor: '#3B82F6', badgeBg: '#EFF6FF', badgeColor: '#1D4ED8' },
  Cold:         { label: 'Qualified lead',   accentColor: '#0EA5E9', badgeBg: '#F0F9FF', badgeColor: '#0369A1' },
  Disqualified: { label: 'Thank you',        accentColor: '#94A3B8', badgeBg: '#F8FAFC', badgeColor: '#475569' },
}

const DEFAULT_TIER = TIERS['Cold']

// ─── Component ────────────────────────────────────────────────────────────────

interface RedirectStepProps {
  title: string
  description?: string
  redirect: SessionRedirect
}

export function RedirectStep({ title, description, redirect }: RedirectStepProps) {
  const tier = TIERS[redirect.tier] ?? DEFAULT_TIER
  const total = redirect.autoRedirectAfterSeconds ?? 0
  const hasAutoRedirect = total > 0 && !!redirect.redirectUrl
  const [remaining, setRemaining] = useState(total)

  useEffect(() => {
    if (!hasAutoRedirect) return
    const interval = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(interval)
          window.location.href = redirect.redirectUrl!
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [hasAutoRedirect, redirect.redirectUrl])

  const links = redirect.links ?? []
  const progressPct = total > 0 ? Math.round(((total - remaining) / total) * 100) : 0

  return (
    <Wrapper>
      {/* ── Main card ── */}
      <Card>
        <AccentBar $color={tier.accentColor} />

        <CardBody>
          <TierBadge $bg={tier.badgeBg} $color={tier.badgeColor}>
            {tier.label}
          </TierBadge>

          <CardTitle>{title}</CardTitle>

          {description && <CardDesc>{description}</CardDesc>}

          {hasAutoRedirect && (
            <CountdownArea>
              <CountdownText>
                Redirecting in <strong>{remaining}s</strong>
              </CountdownText>
              <CountdownTrack>
                <CountdownFill
                  style={{ width: `${progressPct}%` }}
                  $color={tier.accentColor}
                />
              </CountdownTrack>
            </CountdownArea>
          )}

          {!hasAutoRedirect && redirect.redirectUrl && (
            <RedirectButton
              $color={tier.accentColor}
              onClick={() => window.open(redirect.redirectUrl!, '_blank', 'noopener,noreferrer')}
            >
              Continue
              <ArrowRight size={15} />
            </RedirectButton>
          )}
        </CardBody>
      </Card>

      {/* ── Resource links ── */}
      {links.length > 0 && (
        <LinksSection>
          <LinksLabel>Resources for you</LinksLabel>
          {links.map((link, i) => (
            <LinkCard
              key={i}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
            >
              <LinkIconWrap>
                <ExternalLink size={13} />
              </LinkIconWrap>
              <LinkLabel>{link.label}</LinkLabel>
              <ArrowRight size={13} color="currentColor" style={{ flexShrink: 0, opacity: 0.4 }} />
            </LinkCard>
          ))}
        </LinksSection>
      )}
    </Wrapper>
  )
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
  width: 100%;
`

const Card = styled.div`
  width: 100%;
  background: ${({ theme }) => theme.colors.bgSurface};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.xl};
  overflow: hidden;
`

const AccentBar = styled.div<{ $color: string }>`
  height: 4px;
  background: ${({ $color }) => $color};
  width: 100%;
`

const CardBody = styled.div`
  padding: 32px;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 16px;

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    padding: 24px 20px;
  }
`

const TierBadge = styled.div<{ $bg: string; $color: string }>`
  display: inline-flex;
  align-items: center;
  padding: 4px 12px;
  border-radius: ${({ theme }) => theme.radii.full};
  background: ${({ $bg }) => $bg};
  color: ${({ $color }) => $color};
  font-size: ${({ theme }) => theme.typography.sizes.xs};
  font-weight: ${({ theme }) => theme.typography.weights.semibold};
  letter-spacing: 0.04em;
  text-transform: uppercase;
`

const CardTitle = styled.h2`
  font-size: ${({ theme }) => theme.typography.sizes.xxl};
  font-weight: ${({ theme }) => theme.typography.weights.bold};
  color: ${({ theme }) => theme.colors.textPrimary};
  line-height: ${({ theme }) => theme.typography.lineHeights.tight};

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    font-size: ${({ theme }) => theme.typography.sizes.xl};
  }
`

const CardDesc = styled.p`
  font-size: ${({ theme }) => theme.typography.sizes.md};
  color: ${({ theme }) => theme.colors.textSecondary};
  line-height: ${({ theme }) => theme.typography.lineHeights.relaxed};
  max-width: 400px;

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    font-size: ${({ theme }) => theme.typography.sizes.sm};
  }
`

const CountdownArea = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  width: 100%;
  max-width: 260px;
`

const CountdownText = styled.p`
  font-size: ${({ theme }) => theme.typography.sizes.sm};
  color: ${({ theme }) => theme.colors.textTertiary};

  strong {
    color: ${({ theme }) => theme.colors.textPrimary};
    font-weight: ${({ theme }) => theme.typography.weights.semibold};
  }
`

const CountdownTrack = styled.div`
  width: 100%;
  height: 3px;
  background: ${({ theme }) => theme.colors.border};
  border-radius: 2px;
  overflow: hidden;
`

const CountdownFill = styled.div<{ $color: string }>`
  height: 100%;
  background: ${({ $color }) => $color};
  border-radius: 2px;
  transition: width 0.9s linear;
`

const RedirectButton = styled.button<{ $color: string }>`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 11px 28px;
  border-radius: ${({ theme }) => theme.radii.md};
  background: ${({ $color }) => $color};
  border: none;
  color: white;
  font-size: ${({ theme }) => theme.typography.sizes.md};
  font-weight: ${({ theme }) => theme.typography.weights.semibold};
  cursor: pointer;
  font-family: ${({ theme }) => theme.typography.fontFamily};
  transition: opacity 0.15s;

  &:hover {
    opacity: 0.88;
  }
`

const LinksSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`

const LinksLabel = styled.p`
  font-size: ${({ theme }) => theme.typography.sizes.xs};
  font-weight: ${({ theme }) => theme.typography.weights.semibold};
  color: ${({ theme }) => theme.colors.textTertiary};
  text-transform: uppercase;
  letter-spacing: 0.06em;
  padding-left: 2px;
  margin-bottom: 2px;
`

const LinkCard = styled.a`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 13px 16px;
  background: ${({ theme }) => theme.colors.bgSurface};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.lg};
  text-decoration: none;
  color: ${({ theme }) => theme.colors.textPrimary};
  transition: border-color 0.15s, background 0.15s;

  &:hover {
    border-color: ${({ theme }) => theme.colors.accent};
    background: ${({ theme }) => theme.colors.bgElevated};
  }
`

const LinkIconWrap = styled.div`
  flex-shrink: 0;
  width: 28px;
  height: 28px;
  border-radius: ${({ theme }) => theme.radii.sm};
  background: ${({ theme }) => theme.colors.bgElevated};
  border: 1px solid ${({ theme }) => theme.colors.border};
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${({ theme }) => theme.colors.textSecondary};
`

const LinkLabel = styled.span`
  flex: 1;
  font-size: ${({ theme }) => theme.typography.sizes.sm};
  font-weight: ${({ theme }) => theme.typography.weights.medium};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`
