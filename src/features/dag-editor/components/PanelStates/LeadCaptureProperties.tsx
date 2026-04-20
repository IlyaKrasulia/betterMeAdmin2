import type { Node } from 'reactflow'
import styled from 'styled-components'
import { Lock, AlertCircle, X } from 'lucide-react'

import { Input } from '@shared/ui/Input'
import { useDagStore } from '../../store/dag.store'
import type { DagNodeData, LeadCaptureNodeData, LeadCaptureField, LeadCaptureFieldType } from '@shared/types/dag.types'
import { EntryNodeSection } from './EntryNodeSection'

interface FieldMeta {
  fieldType: LeadCaptureFieldType
  label: string
  permanent: boolean
  defaultPlaceholder: string
}

const AVAILABLE_FIELDS: FieldMeta[] = [
  { fieldType: 'Email',        label: 'Email',        permanent: true,  defaultPlaceholder: 'jane@company.com' },
  { fieldType: 'FullName',     label: 'Full name',    permanent: false, defaultPlaceholder: 'Jane Smith' },
  { fieldType: 'Phone',        label: 'Phone',        permanent: false, defaultPlaceholder: '+1 (555) 000-0000' },
  { fieldType: 'CompanyName',  label: 'Company',      permanent: false, defaultPlaceholder: 'Acme Corp' },
  { fieldType: 'JobTitle',     label: 'Job title',    permanent: false, defaultPlaceholder: 'Head of Sales' },
  { fieldType: 'CompanySize',  label: 'Company size', permanent: false, defaultPlaceholder: '50–200 employees' },
  { fieldType: 'Website',      label: 'Website',      permanent: false, defaultPlaceholder: 'https://company.com' },
]

export function LeadCaptureProperties({ node }: { node: Node<DagNodeData> }) {
  const updateNodeData = useDagStore((s) => s.updateNodeData)
  const data = node.data as LeadCaptureNodeData

  const enabledSet = new Set(data.fields.map((f) => f.fieldType))

  const enableField = (meta: FieldMeta) => {
    if (enabledSet.has(meta.fieldType)) return
    const newField: LeadCaptureField = {
      fieldType: meta.fieldType,
      isRequired: false,
      displayOrder: data.fields.length,
      placeholder: meta.defaultPlaceholder,
    }
    updateNodeData(node.id, { fields: [...data.fields, newField] } as Partial<DagNodeData>)
  }

  const removeField = (fieldType: LeadCaptureFieldType) => {
    updateNodeData(node.id, {
      fields: data.fields
        .filter((f) => f.fieldType !== fieldType)
        .map((f, i) => ({ ...f, displayOrder: i })),
    } as Partial<DagNodeData>)
  }

  const updateField = (fieldType: LeadCaptureFieldType, patch: Partial<LeadCaptureField>) => {
    updateNodeData(node.id, {
      fields: data.fields.map((f) =>
        f.fieldType === fieldType ? { ...f, ...patch } : f,
      ),
    } as Partial<DagNodeData>)
  }

  const hasEmail = enabledSet.has('Email')
  const disabledFields = AVAILABLE_FIELDS.filter((m) => !enabledSet.has(m.fieldType))

  return (
    <>
      {/* ── Form title ── */}
      <Section>
        <SectionLabel>Title</SectionLabel>
        <Input
          label="Shown above the form"
          value={data.title}
          onChange={(e) =>
            updateNodeData(node.id, { title: e.target.value } as Partial<DagNodeData>)
          }
          placeholder="Almost there!"
        />
      </Section>

      {/* ── Submission gate ── */}
      <Section>
        <SectionLabel>Gate</SectionLabel>
        <GateRow onClick={() =>
          updateNodeData(node.id, { isRequired: !data.isRequired } as Partial<DagNodeData>)
        }>
          <GateText>
            <GateTitle>Require form to proceed</GateTitle>
            <GateDesc>
              {data.isRequired
                ? 'Leads must submit before continuing'
                : 'Leads can skip the form'}
            </GateDesc>
          </GateText>
          <Pill $on={data.isRequired} />
        </GateRow>
      </Section>

      {/* ── Active fields ── */}
      <Section>
        <SectionLabel>Form fields</SectionLabel>

        {!hasEmail && (
          <EmailWarning>
            <AlertCircle size={12} />
            Email is required — add it below
          </EmailWarning>
        )}

        <FieldList>
          {data.fields
            .slice()
            .sort((a, b) => a.displayOrder - b.displayOrder)
            .map((field) => {
              const meta = AVAILABLE_FIELDS.find((m) => m.fieldType === field.fieldType)
              if (!meta) return null

              return (
                <ActiveFieldRow key={field.fieldType}>
                  <FieldHeader>
                    <FieldName>
                      {meta.permanent && <LockIcon size={11} />}
                      {meta.label}
                    </FieldName>
                    <FieldActions>
                      {!meta.permanent && (
                        <RequiredCheck
                          type="checkbox"
                          checked={field.isRequired}
                          title="Required"
                          onChange={() => updateField(field.fieldType, { isRequired: !field.isRequired })}
                          onClick={(e) => e.stopPropagation()}
                        />
                      )}
                      {!meta.permanent && (
                        <RemoveBtn
                          onClick={() => removeField(field.fieldType)}
                          title={`Remove ${meta.label}`}
                        >
                          <X size={12} />
                        </RemoveBtn>
                      )}
                    </FieldActions>
                  </FieldHeader>
                  <PlaceholderInput
                    value={field.placeholder ?? ''}
                    onChange={(e) =>
                      updateField(field.fieldType, { placeholder: e.target.value || undefined })
                    }
                    placeholder={meta.defaultPlaceholder}
                  />
                </ActiveFieldRow>
              )
            })}
        </FieldList>

        {/* ── Add field picker ── */}
        {disabledFields.length > 0 && (
          <AddSection>
            <AddLabel>Add field</AddLabel>
            <AddGrid>
              {disabledFields.map((meta) => (
                <AddChip key={meta.fieldType} onClick={() => enableField(meta)}>
                  + {meta.label}
                </AddChip>
              ))}
            </AddGrid>
          </AddSection>
        )}
      </Section>

      {/* ── Entry node ── */}
      <EntryNodeSection nodeId={node.id} />
    </>
  )
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const Section = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`

const SectionLabel = styled.p`
  font-size: ${({ theme }) => theme.typography.sizes.xs};
  font-weight: ${({ theme }) => theme.typography.weights.semibold};
  color: ${({ theme }) => theme.colors.textTertiary};
  text-transform: uppercase;
  letter-spacing: 0.6px;
`

const GateRow = styled.button`
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  padding: 10px 12px;
  background: ${({ theme }) => theme.colors.bgElevated};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.md};
  cursor: pointer;
  text-align: left;

  &:hover {
    border-color: ${({ theme }) => theme.colors.textTertiary};
  }
`

const GateText = styled.div`
  flex: 1;
`

const GateTitle = styled.p`
  font-size: ${({ theme }) => theme.typography.sizes.sm};
  font-weight: ${({ theme }) => theme.typography.weights.medium};
  color: ${({ theme }) => theme.colors.textPrimary};
`

const GateDesc = styled.p`
  font-size: ${({ theme }) => theme.typography.sizes.xs};
  color: ${({ theme }) => theme.colors.textTertiary};
  margin-top: 1px;
`

const Pill = styled.span<{ $on: boolean }>`
  flex-shrink: 0;
  width: 32px;
  height: 18px;
  border-radius: 9px;
  background: ${({ $on }) => ($on ? '#3B82F6' : '#CBD5E1')};
  position: relative;
  transition: background 0.15s;

  &::after {
    content: '';
    position: absolute;
    top: 2px;
    left: ${({ $on }) => ($on ? '16px' : '2px')};
    width: 14px;
    height: 14px;
    border-radius: 50%;
    background: white;
    transition: left 0.15s;
    box-shadow: 0 1px 2px rgba(0,0,0,0.2);
  }
`

const EmailWarning = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 7px 10px;
  background: #FEF2F2;
  border: 1px solid #FCA5A5;
  border-radius: ${({ theme }) => theme.radii.md};
  font-size: ${({ theme }) => theme.typography.sizes.xs};
  color: #DC2626;

  svg { flex-shrink: 0; }
`

const FieldList = styled.div`
  display: flex;
  flex-direction: column;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.md};
  overflow: hidden;
`

const ActiveFieldRow = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 8px 10px;
  background: ${({ theme }) => theme.colors.bgElevated};

  & + & {
    border-top: 1px solid ${({ theme }) => theme.colors.border};
  }
`

const FieldHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
`

const FieldName = styled.span`
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: ${({ theme }) => theme.typography.sizes.sm};
  font-weight: ${({ theme }) => theme.typography.weights.medium};
  color: ${({ theme }) => theme.colors.textPrimary};
`

const LockIcon = styled(Lock)`
  color: ${({ theme }) => theme.colors.textTertiary};
  flex-shrink: 0;
`

const FieldActions = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
`

const RequiredCheck = styled.input`
  width: 13px;
  height: 13px;
  accent-color: #3B82F6;
  cursor: pointer;
`

const RemoveBtn = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2px;
  color: ${({ theme }) => theme.colors.textTertiary};
  background: none;
  border: none;
  border-radius: 3px;
  cursor: pointer;

  &:hover {
    color: #EF4444;
    background: #FEF2F2;
  }
`

const PlaceholderInput = styled.input`
  width: 100%;
  padding: 5px 8px;
  font-size: ${({ theme }) => theme.typography.sizes.xs};
  color: ${({ theme }) => theme.colors.textSecondary};
  background: ${({ theme }) => theme.colors.bg};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.sm};
  outline: none;

  &::placeholder { color: ${({ theme }) => theme.colors.textTertiary}; }
  &:focus { border-color: #3B82F6; }
`

const AddSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding-top: 4px;
`

const AddLabel = styled.p`
  font-size: ${({ theme }) => theme.typography.sizes.xs};
  color: ${({ theme }) => theme.colors.textTertiary};
`

const AddGrid = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
`

const AddChip = styled.button`
  padding: 4px 10px;
  font-size: ${({ theme }) => theme.typography.sizes.xs};
  font-weight: ${({ theme }) => theme.typography.weights.medium};
  color: ${({ theme }) => theme.colors.textSecondary};
  background: ${({ theme }) => theme.colors.bgElevated};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 20px;
  cursor: pointer;

  &:hover {
    color: #3B82F6;
    border-color: #3B82F650;
    background: #3B82F608;
  }
`
