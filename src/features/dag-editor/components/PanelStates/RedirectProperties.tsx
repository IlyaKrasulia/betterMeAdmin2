import type { Node } from 'reactflow'
import styled from 'styled-components'
import { Plus, Trash2 } from 'lucide-react'

import { Input } from '@shared/ui/Input'
import { Button } from '@shared/ui/Button'
import { useDagStore } from '../../store/dag.store'
import type {
  DagNodeData,
  RedirectNodeData,
  QualificationTier,
  RedirectLink,
} from '@shared/types/dag.types'

// ─── Tier definitions ─────────────────────────────────────────────────────────

type TierDef = {
  label: string
  desc: string
  color: string
}

const TIERS: { tier: QualificationTier; def: TierDef }[] = [
  { tier: 'Hot',          def: { label: 'Hot',          desc: 'Ready to close',       color: '#DC2626' } },
  { tier: 'Warm',         def: { label: 'Warm',         desc: 'Good fit, nurture',    color: '#2563EB' } },
  { tier: 'Cold',         def: { label: 'Cold',         desc: 'Qualified, low intent',color: '#0284C7' } },
  { tier: 'Disqualified', def: { label: 'Disqualified', desc: 'Not a fit',            color: '#64748B' } },
]

// ─── Component ────────────────────────────────────────────────────────────────

export function RedirectProperties({ node }: { node: Node<DagNodeData> }) {
  const updateNodeData = useDagStore((s) => s.updateNodeData)
  const data = node.data as RedirectNodeData

  const update = (patch: Partial<RedirectNodeData>) =>
    updateNodeData(node.id, patch as Partial<DagNodeData>)

  const addLink = () => {
    if (data.links.length >= 3) return
    const newLink: RedirectLink = {
      label: '',
      url: '',
      displayOrder: data.links.length,
    }
    update({ links: [...data.links, newLink] })
  }

  const removeLink = (index: number) =>
    update({ links: data.links.filter((_, i) => i !== index) })

  const updateLink = (index: number, patch: Partial<RedirectLink>) =>
    update({
      links: data.links.map((l, i) => (i === index ? { ...l, ...patch } : l)),
    })

  return (
    <>
      {/* ── Qualification tier ── */}
      <Section>
        <SectionLabel>Qualification tier</SectionLabel>
        <TierGrid>
          {TIERS.map(({ tier, def }) => {
            const active = data.tier === tier
            return (
              <TierButton
                key={tier}
                $active={active}
                $color={def.color}
                onClick={() => update({ tier })}
              >
                <TierDot $color={def.color} $active={active} />
                <TierText>
                  <TierName $color={def.color} $active={active}>{def.label}</TierName>
                  <TierDesc>{def.desc}</TierDesc>
                </TierText>
              </TierButton>
            )
          })}
        </TierGrid>
        <HintText>Stored with the lead record for analytics and CRM routing.</HintText>
      </Section>

      {/* ── Screen content ── */}
      <Section>
        <SectionLabel>Screen content</SectionLabel>
        <Input
          label="Title"
          value={data.title}
          onChange={(e) => update({ title: e.target.value })}
          placeholder="Thanks for your time"
        />
        <Textarea
          placeholder="Description shown below the title..."
          value={data.description}
          rows={3}
          onChange={(e) => update({ description: e.target.value })}
        />
      </Section>

      {/* ── Auto-redirect ── */}
      <Section>
        <SectionLabel>Auto-redirect</SectionLabel>
        <Input
          label="Redirect URL"
          value={data.redirectUrl ?? ''}
          onChange={(e) => update({ redirectUrl: e.target.value || undefined })}
          placeholder="https://..."
        />
        <AutoRow>
          <Input
            label="Delay (seconds)"
            type="number"
            value={data.autoRedirectAfterSeconds ?? ''}
            onChange={(e) => {
              const val = parseInt(e.target.value)
              update({ autoRedirectAfterSeconds: isNaN(val) ? undefined : Math.max(3, val) })
            }}
            placeholder="e.g. 5"
          />
          {data.autoRedirectAfterSeconds !== undefined && (
            <ClearBtn
              variant="ghost"
              size="sm"
              onClick={() => update({ autoRedirectAfterSeconds: undefined })}
              title="Remove delay"
            >
              <Trash2 size={13} />
            </ClearBtn>
          )}
        </AutoRow>
        {data.autoRedirectAfterSeconds !== undefined && (
          <HintText>Redirects automatically after {data.autoRedirectAfterSeconds}s. Minimum 3s.</HintText>
        )}
      </Section>

      {/* ── Resource links ── */}
      <Section>
        <LinksSectionHead>
          <SectionLabel style={{ margin: 0 }}>Resource links</SectionLabel>
          <LinksCount>{data.links.length} / 3</LinksCount>
        </LinksSectionHead>
        <HintText>Optional links shown below the redirect message.</HintText>

        {data.links.map((link, i) => (
          <LinkCard key={i}>
            <LinkCardHead>
              <LinkCardLabel>Link {i + 1}</LinkCardLabel>
              <RemoveLink onClick={() => removeLink(i)} title="Remove">
                <Trash2 size={12} />
              </RemoveLink>
            </LinkCardHead>
            <LinkCardFields>
              <Input
                label="Label"
                value={link.label}
                onChange={(e) => updateLink(i, { label: e.target.value })}
                placeholder="e.g. Free resources"
              />
              <Input
                label="URL"
                value={link.url}
                onChange={(e) => updateLink(i, { url: e.target.value })}
                placeholder="https://..."
              />
            </LinkCardFields>
          </LinkCard>
        ))}

        {data.links.length < 3 && (
          <Button variant="secondary" size="sm" icon={<Plus size={14} />} onClick={addLink}>
            Add link
          </Button>
        )}
      </Section>
    </>
  )
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const Section = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
`

const SectionLabel = styled.p`
  font-size: ${({ theme }) => theme.typography.sizes.xs};
  font-weight: ${({ theme }) => theme.typography.weights.semibold};
  color: ${({ theme }) => theme.colors.textTertiary};
  text-transform: uppercase;
  letter-spacing: 0.6px;
`

const HintText = styled.p`
  font-size: ${({ theme }) => theme.typography.sizes.xs};
  color: ${({ theme }) => theme.colors.textTertiary};
  line-height: 1.5;
`

// ─── Tier ─────────────────────────────────────────────────────────────────────

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
    $active ? $color : (theme as any).colors?.textTertiary ?? '#94A3B8'};
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

// ─── Textarea ─────────────────────────────────────────────────────────────────

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

  &:focus { border-color: ${({ theme }) => theme.colors.accent}; }
  &::placeholder { color: ${({ theme }) => theme.colors.textTertiary}; }
`

// ─── Auto-redirect ────────────────────────────────────────────────────────────

const AutoRow = styled.div`
  display: flex;
  align-items: flex-end;
  gap: 8px;
`

const ClearBtn = styled(Button)`
  flex-shrink: 0;
  margin-bottom: 2px;
  color: ${({ theme }) => theme.colors.textTertiary};
  &:hover { color: #EF4444; }
`

// ─── Resource links ───────────────────────────────────────────────────────────

const LinksSectionHead = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
`

const LinksCount = styled.span`
  font-size: ${({ theme }) => theme.typography.sizes.xs};
  color: ${({ theme }) => theme.colors.textTertiary};
`

const LinkCard = styled.div`
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.md};
  overflow: hidden;
  background: ${({ theme }) => theme.colors.bgElevated};
`

const LinkCardHead = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 7px 10px;
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
`

const LinkCardLabel = styled.span`
  font-size: ${({ theme }) => theme.typography.sizes.xs};
  font-weight: ${({ theme }) => theme.typography.weights.semibold};
  color: ${({ theme }) => theme.colors.textTertiary};
  text-transform: uppercase;
  letter-spacing: 0.5px;
`

const RemoveLink = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2px;
  background: none;
  border: none;
  border-radius: 3px;
  color: ${({ theme }) => theme.colors.textTertiary};
  cursor: pointer;

  &:hover {
    color: #EF4444;
    background: #FEF2F2;
  }
`

const LinkCardFields = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 10px;
`
