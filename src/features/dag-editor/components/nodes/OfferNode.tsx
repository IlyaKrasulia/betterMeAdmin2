import { memo } from 'react'
import { Handle, Position } from 'reactflow'
import type { NodeProps } from 'reactflow'
import { useTheme } from 'styled-components'
import styled from 'styled-components'
import { Gift, Calendar, ExternalLink, Eye } from 'lucide-react'
import type { OfferNodeData, QualificationTier } from '@shared/types/dag.types'
import { useDagStore } from '../../store/dag.store'

const TIER: Record<QualificationTier, { color: string; lightBg: string; darkBg: string }> = {
  Hot:          { color: '#DC2626', lightBg: '#FEF2F2', darkBg: '#DC262622' },
  Warm:         { color: '#2563EB', lightBg: '#EFF6FF', darkBg: '#2563EB22' },
  Cold:         { color: '#0284C7', lightBg: '#F0F9FF', darkBg: '#0284C722' },
  Disqualified: { color: '#64748B', lightBg: '#F1F5F9', darkBg: '#64748B22' },
}

function encodeNodeData(data: OfferNodeData): string {
  return btoa(unescape(encodeURIComponent(JSON.stringify(data))))
}

export const OfferNode = memo(function OfferNode({ id, data, selected }: NodeProps<OfferNodeData>) {
  const theme = useTheme() as any
  const accent = theme.colors.nodeOffer
  const isEntry = useDagStore((s) => s.entryNodeId === id)
  const tier = data.tier ? TIER[data.tier] : null

  const handlePreview = (e: React.MouseEvent) => {
    e.stopPropagation()
    window.open(`/offer-preview?data=${encodeNodeData(data)}`, '_blank', 'noopener,noreferrer')
  }

  return (
    <>
      <Handle type="target" position={Position.Left}
        style={{ width: 10, height: 10, background: accent, border: '2px solid white', left: -5 }} />

      {isEntry && <EntryPill $color={accent}>● Entry</EntryPill>}

      <Card $selected={!!selected} $accent={accent}>
        <AccentStrip $accent={accent} />
        <Inner>
          <TypeRow>
            <TypeIcon $color={accent}><Gift size={11} strokeWidth={2.5} /></TypeIcon>
            <TypeLabel $color={accent}>Offer</TypeLabel>
            {data.calendarUrl && (
              <Pill $bg={`${accent}18`} $color={accent}>
                <Calendar size={8} />calendar
              </Pill>
            )}
            {tier && (
              <TierBadge
                $lightBg={tier.lightBg}
                $darkBg={tier.darkBg}
                $color={tier.color}
                $isDark={theme.mode === 'dark'}
              >
                {data.tier}
              </TierBadge>
            )}
          </TypeRow>

          <InternalName>{data.name || 'Untitled offer'}</InternalName>
          <Headline>{data.headline || 'Headline'}</Headline>
          {data.body && <BodyText>{data.body}</BodyText>}

          <CtaRow>
            <CtaBtn $color={accent}>
              {data.calendarUrl
                ? <><Calendar size={9} />{data.ctaText || 'Book a call'}</>
                : <><ExternalLink size={9} />{data.ctaText || 'Get Started'}</>
              }
            </CtaBtn>
            <PreviewBtn onClick={handlePreview} title="Preview offer">
              <Eye size={9} />
              Preview
            </PreviewBtn>
          </CtaRow>
        </Inner>
      </Card>
    </>
  )
})

const Card = styled.div<{ $selected: boolean; $accent: string }>`
  position: relative;
  background: ${({ theme }) => theme.colors.bgSurface};
  border: 1.5px solid ${({ $selected, $accent, theme }) => $selected ? $accent : theme.colors.border};
  border-radius: 14px;
  min-width: 248px;
  max-width: 282px;
  overflow: hidden;
  box-shadow: ${({ $selected, $accent, theme }) =>
    $selected
      ? `0 0 0 4px ${$accent}30, 0 8px 24px ${$accent}20, ${theme.shadows.md}`
      : theme.shadows.sm};
  cursor: pointer;
  will-change: transform, box-shadow;
  transition:
    transform 0.18s cubic-bezier(0.34, 1.4, 0.64, 1),
    box-shadow 0.18s ease,
    border-color 0.15s ease;

  &:hover {
    transform: translateY(-3px);
    border-color: ${({ $accent }) => $accent};
    box-shadow: ${({ $accent, theme }) =>
      `0 0 0 3px ${$accent}22, 0 12px 28px ${$accent}18, ${theme.shadows.md}`};
  }
`

const AccentStrip = styled.div<{ $accent: string }>`
  width: 100%;
  height: 3px;
  background: linear-gradient(90deg, ${({ $accent }) => $accent}, ${({ $accent }) => $accent}88);
`

const Inner = styled.div`
  padding: 10px 12px 11px;
  display: flex;
  flex-direction: column;
  gap: 6px;
`

const TypeRow = styled.div`
  display: flex;
  align-items: center;
  gap: 5px;
`

const TypeIcon = styled.span<{ $color: string }>`
  display: flex;
  color: ${({ $color }) => $color};
`

const TypeLabel = styled.span<{ $color: string }>`
  font-size: 10px;
  font-weight: 700;
  color: ${({ $color }) => $color};
  text-transform: uppercase;
  letter-spacing: 0.7px;
  flex: 1;
`

const Pill = styled.span<{ $bg: string; $color: string }>`
  display: inline-flex;
  align-items: center;
  gap: 3px;
  padding: 1px 6px;
  border-radius: 20px;
  background: ${({ $bg }) => $bg};
  color: ${({ $color }) => $color};
  font-size: 9px;
  font-weight: 600;
`


const InternalName = styled.p`
  font-size: 9.5px;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.textTertiary};
  text-transform: uppercase;
  letter-spacing: 0.5px;
`

const Headline = styled.p`
  font-size: 13px;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.textPrimary};
  line-height: 1.35;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
`

const BodyText = styled.p`
  font-size: 11px;
  color: ${({ theme }) => theme.colors.textSecondary};
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
`

const CtaRow = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  padding-top: 6px;
  border-top: 1px solid ${({ theme }) => theme.colors.border};
`

const CtaBtn = styled.span<{ $color: string }>`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 10px;
  font-weight: 600;
  background: ${({ $color }) => $color};
  color: white;
  padding: 3px 10px;
  border-radius: 20px;
`

const PreviewBtn = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 3px;
  font-size: 9px;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.textTertiary};
  background: ${({ theme }) => theme.colors.bgElevated};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 20px;
  padding: 2px 8px;
  cursor: pointer;
  margin-left: auto;
  transition: color 0.12s, border-color 0.12s;

  &:hover {
    color: ${({ theme }) => theme.colors.textPrimary};
    border-color: ${({ theme }) => theme.colors.textSecondary};
  }
`

const TierBadge = styled.span<{ $lightBg: string; $darkBg: string; $color: string; $isDark: boolean }>`
  display: inline-flex;
  align-items: center;
  padding: 2px 7px;
  border-radius: 20px;
  background: ${({ $lightBg, $darkBg, $isDark }) => $isDark ? $darkBg : $lightBg};
  color: ${({ $color }) => $color};
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.3px;
  white-space: nowrap;
`

const EntryPill = styled.div<{ $color: string }>`
  position: absolute;
  top: -20px;
  left: 0;
  background: ${({ $color }) => $color};
  color: white;
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.5px;
  padding: 2px 8px;
  border-radius: 6px 6px 0 0;
  pointer-events: none;
`
