import { memo } from 'react'
import { Handle, Position } from 'reactflow'
import type { NodeProps } from 'reactflow'
import styled from 'styled-components'
import { CornerRightUp, Clock, Link2 } from 'lucide-react'
import type { RedirectNodeData, QualificationTier } from '@shared/types/dag.types'
import { useDagStore } from '../../store/dag.store'

const ACCENT = '#EF4444'

const TIER: Record<QualificationTier, { color: string; lightBg: string; darkBg: string }> = {
  Hot:          { color: '#DC2626', lightBg: '#FEF2F2', darkBg: '#DC262622' },
  Warm:         { color: '#2563EB', lightBg: '#EFF6FF', darkBg: '#2563EB22' },
  Cold:         { color: '#0284C7', lightBg: '#F0F9FF', darkBg: '#0284C722' },
  Disqualified: { color: '#64748B', lightBg: '#F1F5F9', darkBg: '#64748B22' },
}

export const RedirectNode = memo(function RedirectNode({ id, data, selected }: NodeProps<RedirectNodeData>) {
  const isEntry = useDagStore((s) => s.entryNodeId === id)
  const tier = TIER[data.tier] ?? TIER.Cold

  return (
    <>
      <Handle type="target" position={Position.Left}
        style={{ width: 10, height: 10, background: ACCENT, border: '2px solid white', left: -5 }} />

      {isEntry && <EntryPill>● Entry</EntryPill>}

      <Card $selected={!!selected}>
        <AccentStrip />
        <Inner>
          <TypeRow>
            <TypeIcon><CornerRightUp size={11} strokeWidth={2.5} /></TypeIcon>
            <TypeLabel>Redirect</TypeLabel>
            <TierBadge $lightBg={tier.lightBg} $darkBg={tier.darkBg} $color={tier.color}>
              {data.tier}
            </TierBadge>
          </TypeRow>

          <Title>{data.title || 'Redirect screen'}</Title>
          {data.description && <Body>{data.description}</Body>}

          <Footer>
            {data.autoRedirectAfterSeconds && data.autoRedirectAfterSeconds > 0 && (
              <MetaItem>
                <Clock size={9} />
                {data.autoRedirectAfterSeconds}s
              </MetaItem>
            )}
            {data.links.length > 0 && (
              <MetaItem>
                <Link2 size={9} />
                {data.links.length} link{data.links.length !== 1 ? 's' : ''}
              </MetaItem>
            )}
            <TerminalTag>terminal</TerminalTag>
          </Footer>
        </Inner>
      </Card>
    </>
  )
})

const Card = styled.div<{ $selected: boolean }>`
  position: relative;
  background: ${({ theme }) => theme.colors.bgSurface};
  border: 1.5px solid ${({ $selected, theme }) => $selected ? ACCENT : theme.colors.border};
  border-radius: 14px;
  min-width: 248px;
  max-width: 282px;
  overflow: hidden;
  box-shadow: ${({ $selected, theme }) =>
    $selected
      ? `0 0 0 4px ${ACCENT}30, 0 8px 24px ${ACCENT}20, ${theme.shadows.md}`
      : theme.shadows.sm};
  cursor: pointer;
  will-change: transform, box-shadow;
  transition:
    transform 0.18s cubic-bezier(0.34, 1.4, 0.64, 1),
    box-shadow 0.18s ease,
    border-color 0.15s ease;

  &:hover {
    transform: translateY(-3px);
    border-color: ${ACCENT};
    box-shadow: 0 0 0 3px ${ACCENT}22, 0 12px 28px ${ACCENT}18, ${({ theme }) => theme.shadows.md};
  }
`

const AccentStrip = styled.div`
  width: 100%;
  height: 3px;
  background: linear-gradient(90deg, ${ACCENT}, ${ACCENT}88);
`

const Inner = styled.div`
  padding: 10px 12px 11px;
  display: flex;
  flex-direction: column;
  gap: 7px;
`

const TypeRow = styled.div`
  display: flex;
  align-items: center;
  gap: 5px;
`

const TypeIcon = styled.span`
  display: flex;
  color: ${ACCENT};
`

const TypeLabel = styled.span`
  font-size: 10px;
  font-weight: 700;
  color: ${ACCENT};
  text-transform: uppercase;
  letter-spacing: 0.7px;
  flex: 1;
`

const TierBadge = styled.span<{ $lightBg: string; $darkBg: string; $color: string }>`
  display: inline-flex;
  align-items: center;
  padding: 2px 7px;
  border-radius: 20px;
  background: ${({ $lightBg, $darkBg, theme }) =>
    (theme as any).mode === 'dark' ? $darkBg : $lightBg};
  color: ${({ $color }) => $color};
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.3px;
  white-space: nowrap;
`

const Title = styled.p`
  font-size: 13px;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.textPrimary};
  line-height: 1.35;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
`

const Body = styled.p`
  font-size: 11px;
  color: ${({ theme }) => theme.colors.textSecondary};
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
`

const Footer = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding-top: 7px;
  border-top: 1px solid ${({ theme }) => theme.colors.border};
`

const MetaItem = styled.div`
  display: flex;
  align-items: center;
  gap: 3px;
  font-size: 9.5px;
  color: ${({ theme }) => theme.colors.textTertiary};
`

const TerminalTag = styled.span`
  margin-left: auto;
  font-size: 9px;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.textTertiary};
  text-transform: uppercase;
  letter-spacing: 0.5px;
  background: ${({ theme }) => theme.colors.bgElevated};
  padding: 1px 6px;
  border-radius: 4px;
`

const EntryPill = styled.div`
  position: absolute;
  top: -20px;
  left: 0;
  background: ${ACCENT};
  color: white;
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.5px;
  padding: 2px 8px;
  border-radius: 6px 6px 0 0;
  pointer-events: none;
`
