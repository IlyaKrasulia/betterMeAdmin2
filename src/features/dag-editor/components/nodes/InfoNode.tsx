import { memo } from 'react'
import { Handle, Position } from 'reactflow'
import type { NodeProps } from 'reactflow'
import { useTheme } from 'styled-components'
import styled from 'styled-components'
import { Info } from 'lucide-react'
import type { InfoNodeData } from '@shared/types/dag.types'
import { useDagStore } from '../../store/dag.store'

export const InfoNode = memo(function InfoNode({ id, data, selected }: NodeProps<InfoNodeData>) {
  const theme = useTheme()
  const accent = theme.colors.nodeInfo
  const isEntry = useDagStore((s) => s.entryNodeId === id)

  return (
    <>
      <Handle type="target" position={Position.Left}
        style={{ width: 10, height: 10, background: accent, border: '2px solid white', left: -5 }} />

      {isEntry && <EntryPill $color={accent}>● Entry</EntryPill>}

      <Card $selected={!!selected} $accent={accent}>
        <AccentStrip $accent={accent} />
        <Inner>
          <TypeRow>
            <TypeIcon $color={accent}><Info size={11} strokeWidth={2.5} /></TypeIcon>
            <TypeLabel $color={accent}>Info screen</TypeLabel>
          </TypeRow>

          {data.mediaUrl ? (
            <Thumbnail src={data.mediaUrl} alt="" />
          ) : (
            <IconBox $color={accent}>🌟</IconBox>
          )}

          <Title>{data.title || 'Untitled'}</Title>
          {data.body && <Body>{data.body}</Body>}
        </Inner>
      </Card>

      <Handle type="source" position={Position.Right}
        style={{ width: 10, height: 10, background: accent, border: '2px solid white', right: -5 }} />
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
  gap: 8px;
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
`

const Thumbnail = styled.img`
  width: 100%;
  height: 58px;
  object-fit: cover;
  border-radius: 8px;
`

const IconBox = styled.div<{ $color: string }>`
  width: 100%;
  height: 48px;
  background: ${({ $color }) => $color}12;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
`

const Title = styled.p`
  font-size: 13px;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.textPrimary};
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
`

const Body = styled.p`
  font-size: 11px;
  color: ${({ theme }) => theme.colors.textSecondary};
  line-height: 1.45;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
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
