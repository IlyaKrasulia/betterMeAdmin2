import { memo } from 'react'
import { Handle, Position } from 'reactflow'
import type { NodeProps } from 'reactflow'
import { useTheme } from 'styled-components'
import styled from 'styled-components'
import { HelpCircle, Zap } from 'lucide-react'
import type { QuestionNodeData } from '@shared/types/dag.types'
import { AnswerType } from '@shared/types/dag.types'
import { useDagStore } from '../../store/dag.store'

export const QuestionNode = memo(function QuestionNode({ id, data, selected }: NodeProps<QuestionNodeData>) {
  const theme = useTheme()
  const accent = theme.colors.nodeQuestion
  const isEntry = useDagStore((s) => s.entryNodeId === id)

  const options = data.options ?? []
  const visible = options.slice(0, 3)
  const extra = options.length - 3
  const hasScoreDelta = options.some((o) => o.scoreDelta !== 0)
  const isSlider = data.answerType === AnswerType.Slider
  const isText = data.answerType === AnswerType.Text

  return (
    <>
      <Handle type="target" position={Position.Left}
        style={{ width: 10, height: 10, background: accent, border: '2px solid white', left: -5 }} />

      {isEntry && <EntryPill $color={accent}>● Entry</EntryPill>}

      <Card $selected={!!selected} $accent={accent}>
        <AccentStrip $accent={accent} />
        <Inner>
          <TypeRow>
            <TypeIcon $color={accent}><HelpCircle size={11} strokeWidth={2.5} /></TypeIcon>
            <TypeLabel $color={accent}>Question</TypeLabel>
            {hasScoreDelta && (
              <Pill $bg={`${accent}18`} $color={accent}>
                <Zap size={8} />scored
              </Pill>
            )}
          </TypeRow>

          <Title>{data.title || 'Untitled question'}</Title>

          {isText && (
            <TextPreview>
              <TextLine />
              <TextLine style={{ width: '65%' }} />
            </TextPreview>
          )}

          {isSlider && (
            <SliderWrap>
              <Track><Thumb $color={accent} /></Track>
              <MinMax><span>{data.min ?? 0}</span><span>{data.max ?? 10}</span></MinMax>
            </SliderWrap>
          )}

          {!isText && !isSlider && options.length > 0 && (
            <Chips>
              {visible.map((opt) => (
                <Chip key={opt.id} $color={accent} title={opt.label}>
                  {opt.label}
                  {opt.scoreDelta !== 0 && (
                    <Delta $pos={opt.scoreDelta > 0}>{opt.scoreDelta > 0 ? '+' : ''}{opt.scoreDelta}</Delta>
                  )}
                </Chip>
              ))}
              {extra > 0 && <Chip $color={accent}>+{extra}</Chip>}
            </Chips>
          )}

          <Footer>
            <AttrCode>@{data.attributeKey || '…'}</AttrCode>
            {data.answerType && <Meta>{data.answerType}</Meta>}
          </Footer>
        </Inner>
      </Card>

      <Handle type="source" position={Position.Right}
        style={{ width: 10, height: 10, background: accent, border: '2px solid white', right: -5 }} />
    </>
  )
})

// ─── Shared base ─────────────────────────────────────────────────────────────

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
  flex-shrink: 0;
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

const Chips = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
`

const Chip = styled.span<{ $color: string }>`
  display: inline-flex;
  align-items: center;
  gap: 3px;
  padding: 2px 7px;
  background: ${({ $color }) => $color}12;
  border: 1px solid ${({ $color }) => $color}30;
  border-radius: 20px;
  font-size: 10px;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.textSecondary};
  white-space: nowrap;
  max-width: 120px;
  overflow: hidden;
  text-overflow: ellipsis;
`

const Delta = styled.span<{ $pos: boolean }>`
  font-size: 9px;
  font-weight: 700;
  color: ${({ $pos }) => ($pos ? '#10B981' : '#EF4444')};
`

const TextPreview = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 7px 8px;
  background: ${({ theme }) => theme.colors.bgElevated};
  border-radius: 7px;
  border: 1px dashed ${({ theme }) => theme.colors.border};
`

const TextLine = styled.div`
  height: 5px;
  width: 100%;
  background: ${({ theme }) => theme.colors.border};
  border-radius: 3px;
`

const SliderWrap = styled.div`
  padding: 7px 8px;
  background: ${({ theme }) => theme.colors.bgElevated};
  border-radius: 7px;
`

const Track = styled.div`
  position: relative;
  height: 4px;
  background: ${({ theme }) => theme.colors.border};
  border-radius: 2px;
  margin-bottom: 4px;
`

const Thumb = styled.div<{ $color: string }>`
  position: absolute;
  left: 33%;
  top: 50%;
  transform: translate(-50%, -50%);
  width: 11px;
  height: 11px;
  border-radius: 50%;
  background: ${({ $color }) => $color};
  border: 2px solid white;
  box-shadow: 0 1px 4px rgba(0,0,0,0.15);
`

const MinMax = styled.div`
  display: flex;
  justify-content: space-between;
  font-size: 9px;
  color: ${({ theme }) => theme.colors.textTertiary};
`

const Footer = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: 7px;
  border-top: 1px solid ${({ theme }) => theme.colors.border};
`

const AttrCode = styled.code`
  font-size: 10px;
  color: ${({ theme }) => theme.colors.textTertiary};
  background: ${({ theme }) => theme.colors.bgElevated};
  padding: 1px 5px;
  border-radius: 4px;
`

const Meta = styled.span`
  font-size: 10px;
  color: ${({ theme }) => theme.colors.textTertiary};
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
