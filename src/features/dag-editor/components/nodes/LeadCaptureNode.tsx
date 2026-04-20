import { memo } from 'react'
import { Handle, Position } from 'reactflow'
import type { NodeProps } from 'reactflow'
import styled from 'styled-components'
import { ClipboardList, Check } from 'lucide-react'
import type { LeadCaptureNodeData } from '@shared/types/dag.types'
import { useDagStore } from '../../store/dag.store'

const ACCENT = '#3B82F6'

const FIELD_LABELS: Record<string, string> = {
  FullName: 'Full Name', Email: 'Email', Phone: 'Phone',
  CompanyName: 'Company', JobTitle: 'Job Title',
  CompanySize: 'Company Size', Website: 'Website',
}

export const LeadCaptureNode = memo(function LeadCaptureNode({ id, data, selected }: NodeProps<LeadCaptureNodeData>) {
  const isEntry = useDagStore((s) => s.entryNodeId === id)
  const visible = (data.fields ?? []).slice(0, 4)
  const extra = (data.fields ?? []).length - 4

  return (
    <>
      <Handle type="target" position={Position.Left}
        style={{ width: 10, height: 10, background: ACCENT, border: '2px solid white', left: -5 }} />

      {isEntry && <EntryPill>● Entry</EntryPill>}

      <Card $selected={!!selected}>
        <AccentStrip />
        <Inner>
          <TypeRow>
            <TypeIcon><ClipboardList size={11} strokeWidth={2.5} /></TypeIcon>
            <TypeLabel>Lead Capture</TypeLabel>
            {!data.isRequired && (
              <Pill>optional</Pill>
            )}
          </TypeRow>

          <Title>{data.title || 'Contact form'}</Title>

          <Chips>
            {visible.map((f, i) => (
              <Chip key={i} $required={f.isRequired}>
                {f.isRequired && <Check size={8} strokeWidth={3} />}
                {FIELD_LABELS[f.fieldType] ?? f.fieldType}
              </Chip>
            ))}
            {extra > 0 && <Chip $required={false}>+{extra} more</Chip>}
            {(data.fields ?? []).length === 0 && <EmptyHint>No fields</EmptyHint>}
          </Chips>
        </Inner>
      </Card>

      <Handle type="source" position={Position.Right}
        style={{ width: 10, height: 10, background: ACCENT, border: '2px solid white', right: -5 }} />
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
  gap: 8px;
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

const Pill = styled.span`
  display: inline-flex;
  align-items: center;
  padding: 1px 6px;
  border-radius: 20px;
  background: ${ACCENT}18;
  color: ${ACCENT};
  font-size: 9px;
  font-weight: 600;
`

const Title = styled.p`
  font-size: 13px;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.textPrimary};
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
`

const Chips = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
`

const Chip = styled.span<{ $required: boolean }>`
  display: inline-flex;
  align-items: center;
  gap: 3px;
  padding: 2px 7px;
  background: ${ACCENT}12;
  border: 1px solid ${({ $required }) => $required ? `${ACCENT}45` : `${ACCENT}22`};
  border-radius: 20px;
  font-size: 10px;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.textSecondary};

  svg { color: ${ACCENT}; flex-shrink: 0; }
`

const EmptyHint = styled.span`
  font-size: 10px;
  color: ${({ theme }) => theme.colors.textTertiary};
  font-style: italic;
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
