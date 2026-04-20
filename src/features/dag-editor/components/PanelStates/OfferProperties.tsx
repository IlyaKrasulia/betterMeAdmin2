import type { Node } from 'reactflow'
import styled from 'styled-components'
import { Calendar, X, Info } from 'lucide-react'

import { Input } from '@shared/ui/Input'
import { Select } from '@shared/ui/Select'
import { Button } from '@shared/ui/Button'
import { useDagStore } from '../../store/dag.store'
import type { DagNodeData, OfferNodeData, QualificationTier, CalendarProvider } from '@shared/types/dag.types'

// ─── Tier config ──────────────────────────────────────────────────────────────

type TierConfig = { label: string; desc: string; color: string }

const TIERS: { tier: QualificationTier; config: TierConfig }[] = [
  { tier: 'Hot',          config: { label: 'Hot',          desc: 'Ready to close',        color: '#DC2626' } },
  { tier: 'Warm',         config: { label: 'Warm',         desc: 'Good fit, nurture',     color: '#2563EB' } },
  { tier: 'Cold',         config: { label: 'Cold',         desc: 'Qualified, low intent', color: '#0284C7' } },
  { tier: 'Disqualified', config: { label: 'Disqualified', desc: 'Not a fit',             color: '#64748B' } },
]

const CALENDAR_PROVIDERS: { value: CalendarProvider; label: string }[] = [
  { value: 'Calendly', label: 'Calendly' },
  { value: 'CalCom',   label: 'Cal.com' },
  { value: 'HubSpot',  label: 'HubSpot' },
  { value: 'Custom',   label: 'Custom' },
]

export function OfferProperties({ node }: { node: Node<DagNodeData> }) {
  const updateNodeData = useDagStore((s) => s.updateNodeData)
  const data = node.data as OfferNodeData

  const update = (patch: Partial<OfferNodeData>) =>
    updateNodeData(node.id, patch as Partial<DagNodeData>)

  const removeCalendar = () =>
    update({ calendarUrl: '', calendarProvider: 'None' as CalendarProvider, ctaUrl: undefined })

  const hasCalendar = !!data.calendarUrl

  return (
    <>
      {/* ── Tier ── */}
      <FieldGroup>
        <GroupLabel>Qualification tier</GroupLabel>
        <TierGrid>
          {TIERS.map(({ tier, config }) => {
            const active = data.tier === tier
            return (
              <TierButton
                key={tier}
                $active={active}
                $color={config.color}
                onClick={() => update({ tier: active ? undefined : tier })}
              >
                <TierDot $color={config.color} $active={active} />
                <TierText>
                  <TierName $color={config.color} $active={active}>{config.label}</TierName>
                  <TierDesc>{config.desc}</TierDesc>
                </TierText>
              </TierButton>
            )
          })}
        </TierGrid>
      </FieldGroup>

      {/* ── Internal label ── */}
      <FieldGroup>
        <GroupLabel>Internal label</GroupLabel>
        <Input
          label="Offer name (builder only)"
          value={data.name}
          onChange={(e) => update({ name: e.target.value })}
          placeholder="e.g. Enterprise Demo Offer"
        />
        <HintText>This name is shown only in the builder — never to leads.</HintText>
      </FieldGroup>

      {/* ── Lead-facing content ── */}
      <FieldGroup>
        <GroupLabel>Lead-facing content</GroupLabel>
        <Input
          label="Headline"
          value={data.headline}
          onChange={(e) => update({ headline: e.target.value })}
          placeholder="e.g. Ready to talk to our team?"
        />
        <HintText>
          Supports <code>{'{{token}}'}</code> substitution — e.g.{' '}
          <code>{'{{lead_name}}'}</code>, <code>{'{{lead_company}}'}</code>.
        </HintText>
        <Textarea
          placeholder="Body copy shown below the headline..."
          value={data.body}
          rows={3}
          onChange={(e) => update({ body: e.target.value })}
        />
        <Input
          label="Image URL (optional)"
          value={data.imageUrl ?? ''}
          onChange={(e) => update({ imageUrl: e.target.value || undefined })}
          placeholder="https://..."
        />
      </FieldGroup>

      {/* ── Call to action ── */}
      <FieldGroup>
        <GroupLabel>Call to action</GroupLabel>
        <Input
          label="CTA button text"
          value={data.ctaText}
          onChange={(e) => update({ ctaText: e.target.value })}
          placeholder="e.g. Book a call"
        />
        {!hasCalendar && (
          <Input
            label="CTA URL"
            value={data.ctaUrl ?? ''}
            onChange={(e) => update({ ctaUrl: e.target.value || undefined })}
            placeholder="https://..."
          />
        )}
      </FieldGroup>

      {/* ── Calendar booking ── */}
      <FieldGroup>
        <SectionHeader>
          <CalendarIconWrap>
            <Calendar size={13} />
          </CalendarIconWrap>
          <GroupLabel style={{ margin: 0 }}>Calendar booking</GroupLabel>
        </SectionHeader>

        <Select
          label="Provider"
          value={data.calendarProvider ?? 'None'}
          onChange={(e) =>
            update({ calendarProvider: e.target.value as CalendarProvider })
          }
          options={[
            { value: 'None', label: 'None (no calendar embed)' },
            ...CALENDAR_PROVIDERS,
          ]}
        />

        {data.calendarProvider && data.calendarProvider !== 'None' && (
          <>
            <CalendarUrlRow>
              <Input
                label="Calendar URL"
                value={data.calendarUrl ?? ''}
                onChange={(e) =>
                  update({ calendarUrl: e.target.value, ctaUrl: undefined })
                }
                placeholder={
                  data.calendarProvider === 'Calendly'
                    ? 'https://calendly.com/yourname'
                    : data.calendarProvider === 'CalCom'
                    ? 'https://cal.com/yourname'
                    : 'https://...'
                }
              />
              {hasCalendar && (
                <RemoveCalendarBtn
                  variant="ghost"
                  size="sm"
                  onClick={removeCalendar}
                  title="Remove calendar link"
                >
                  <X size={13} />
                </RemoveCalendarBtn>
              )}
            </CalendarUrlRow>

            {hasCalendar && (
              <InfoBox>
                <Info size={12} />
                Leads see an embedded booking widget. The CTA URL field is hidden while calendar is set.
              </InfoBox>
            )}
          </>
        )}
      </FieldGroup>

    </>
  )
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const FieldGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
`

const GroupLabel = styled.p`
  font-size: ${({ theme }) => theme.typography.sizes.xs};
  font-weight: ${({ theme }) => theme.typography.weights.semibold};
  color: ${({ theme }) => theme.colors.textTertiary};
  text-transform: uppercase;
  letter-spacing: 0.7px;
`

const HintText = styled.p`
  font-size: ${({ theme }) => theme.typography.sizes.xs};
  color: ${({ theme }) => theme.colors.textTertiary};
  line-height: 1.5;

  code {
    font-family: monospace;
    background: ${({ theme }) => theme.colors.bgElevated};
    padding: 0 3px;
    border-radius: 3px;
    font-size: 10px;
  }
`

const TierGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  grid-auto-rows: 1fr;
  gap: 6px;
`

const TierButton = styled.button<{ $active: boolean; $color: string }>`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  width: 100%;
  box-sizing: border-box;
  border-radius: ${({ theme }) => theme.radii.md};
  border: 1px solid ${({ $active, $color, theme }) =>
    $active ? $color : theme.colors.border};
  background: ${({ $active, $color, theme }) =>
    $active
      ? (theme as any).mode === 'dark' ? `${$color}18` : `${$color}08`
      : theme.colors.bgElevated};
  cursor: pointer;
  text-align: left;
  transition: border-color 0.12s, background 0.12s;

  &:hover {
    border-color: ${({ $color }) => $color};
    background: ${({ $color, theme }) =>
      (theme as any).mode === 'dark' ? `${$color}14` : `${$color}06`};
  }
`

const TierDot = styled.span<{ $color: string; $active: boolean }>`
  flex-shrink: 0;
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: ${({ $color, $active }) => $active ? $color : 'transparent'};
  border: 1.5px solid ${({ $color, $active, theme }) =>
    $active ? $color : theme.colors.textTertiary};
  transition: background 0.12s, border-color 0.12s;
`

const TierText = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1px;
  min-width: 0;
`

const TierName = styled.span<{ $color: string; $active: boolean }>`
  font-size: 11.5px;
  font-weight: ${({ theme }) => theme.typography.weights.semibold};
  color: ${({ $active, $color, theme }) =>
    $active ? $color : theme.colors.textPrimary};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`

const TierDesc = styled.span`
  font-size: 9.5px;
  color: ${({ theme }) => theme.colors.textTertiary};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`

const Textarea = styled.textarea`
  width: 100%;
  padding: 9px 12px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.md};
  background: ${({ theme }) => theme.colors.bgSurface};
  color: ${({ theme }) => theme.colors.textPrimary};
  font-size: ${({ theme }) => theme.typography.sizes.sm};
  font-family: inherit;
  resize: vertical;
  outline: none;
  line-height: 1.5;
  box-sizing: border-box;
  transition: border-color 0.15s;

  &:focus {
    border-color: ${({ theme }) => theme.colors.accent};
    box-shadow: 0 0 0 3px ${({ theme }) => theme.colors.accent}22;
  }

  &::placeholder {
    color: ${({ theme }) => theme.colors.textTertiary};
  }
`

const SectionHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`

const CalendarIconWrap = styled.span`
  display: flex;
  align-items: center;
  color: ${({ theme }) => theme.colors.accent};
`

const CalendarUrlRow = styled.div`
  display: flex;
  align-items: flex-end;
  gap: 8px;
`

const RemoveCalendarBtn = styled(Button)`
  flex-shrink: 0;
  margin-bottom: 2px;
  color: ${({ theme }) => theme.colors.textTertiary};
  &:hover { color: #EF4444; }
`

const InfoBox = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 7px;
  padding: 8px 10px;
  background: ${({ theme }) => theme.colors.accentLight};
  border: 1px solid ${({ theme }) => theme.colors.accent}33;
  border-radius: ${({ theme }) => theme.radii.md};
  font-size: ${({ theme }) => theme.typography.sizes.xs};
  color: ${({ theme }) => theme.colors.textSecondary};
  line-height: 1.5;

  svg {
    flex-shrink: 0;
    margin-top: 1px;
    color: ${({ theme }) => theme.colors.accent};
  }
`
