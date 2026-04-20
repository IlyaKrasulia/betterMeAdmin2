import { useState } from 'react'
import styled from 'styled-components'
import { ChevronRight } from 'lucide-react'
import type { SessionLeadCapture, SessionLeadCaptureField } from '@shared/types/api.types'
import { Button } from '@shared/ui/Button'

// ─── Field metadata ───────────────────────────────────────────────────────────

interface FieldMeta {
  label: string
  inputType: string
  autoComplete: string
  attributeKey: string
}

const FIELD_META: Record<string, FieldMeta> = {
  FullName:    { label: 'Full name',     inputType: 'text',  autoComplete: 'name',         attributeKey: 'lead_name' },
  Email:       { label: 'Email',         inputType: 'email', autoComplete: 'email',         attributeKey: 'lead_email' },
  Phone:       { label: 'Phone',         inputType: 'tel',   autoComplete: 'tel',           attributeKey: 'lead_phone' },
  CompanyName: { label: 'Company',       inputType: 'text',  autoComplete: 'organization',  attributeKey: 'lead_company' },
  JobTitle:    { label: 'Job title',     inputType: 'text',  autoComplete: 'organization-title', attributeKey: 'lead_title' },
  CompanySize: { label: 'Company size',  inputType: 'text',  autoComplete: 'off',           attributeKey: 'lead_company_size' },
  Website:     { label: 'Website',       inputType: 'url',   autoComplete: 'url',           attributeKey: 'lead_website' },
}

// ─── Component ────────────────────────────────────────────────────────────────

interface LeadCaptureStepProps {
  title: string
  leadCapture: SessionLeadCapture
  onSubmit: (values: Record<string, string>) => void
  onSkip?: () => void
}

export function LeadCaptureStep({ title, leadCapture, onSubmit, onSkip }: LeadCaptureStepProps) {
  const sortedFields = [...leadCapture.fields].sort((a, b) => a.displayOrder - b.displayOrder)

  const [values, setValues] = useState<Record<string, string>>(
    () => Object.fromEntries(sortedFields.map((f) => [f.fieldType, '']))
  )
  const [errors, setErrors] = useState<Record<string, string>>({})

  const setValue = (fieldType: string, value: string) => {
    setValues((prev) => ({ ...prev, [fieldType]: value }))
    if (errors[fieldType]) {
      setErrors((prev) => ({ ...prev, [fieldType]: '' }))
    }
  }

  const validate = (): boolean => {
    const next: Record<string, string> = {}
    for (const field of sortedFields) {
      if (field.isRequired && !values[field.fieldType]?.trim()) {
        const meta = FIELD_META[field.fieldType]
        next[field.fieldType] = `${meta?.label ?? field.fieldType} is required`
      }
      if (field.fieldType === 'Email' && values[field.fieldType]) {
        const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values[field.fieldType])
        if (!emailOk) next[field.fieldType] = 'Enter a valid email address'
      }
    }
    setErrors(next)
    return Object.keys(next).length === 0
  }

  const handleSubmit = () => {
    if (!validate()) return
    // Build { attributeKey: value } map for the backend
    const payload: Record<string, string> = {}
    for (const field of sortedFields) {
      const meta = FIELD_META[field.fieldType]
      if (meta && values[field.fieldType]?.trim()) {
        payload[meta.attributeKey] = values[field.fieldType].trim()
      }
    }
    onSubmit(payload)
  }

  return (
    <Wrapper>
      <TitleBlock>
        <Title>{title}</Title>
      </TitleBlock>

      <FieldList>
        {sortedFields.map((field) => (
          <FieldItem key={field.fieldType} field={field} value={values[field.fieldType]} error={errors[field.fieldType]} onChange={setValue} />
        ))}
      </FieldList>

      <Actions>
        <Button fullWidth size="lg" icon={<ChevronRight size={16} />} onClick={handleSubmit}>
          Continue
        </Button>

        {!leadCapture.isRequired && onSkip && (
          <SkipBtn type="button" onClick={onSkip}>
            Skip for now
          </SkipBtn>
        )}
      </Actions>
    </Wrapper>
  )
}

// ─── Field sub-component ──────────────────────────────────────────────────────

function FieldItem({
  field,
  value,
  error,
  onChange,
}: {
  field: SessionLeadCaptureField
  value: string
  error?: string
  onChange: (fieldType: string, value: string) => void
}) {
  const meta = FIELD_META[field.fieldType]
  if (!meta) return null

  return (
    <Field>
      <FieldLabel>
        {meta.label}
        {field.isRequired && <Required>*</Required>}
      </FieldLabel>
      <FieldInput
        type={meta.inputType}
        autoComplete={meta.autoComplete}
        value={value}
        onChange={(e) => onChange(field.fieldType, e.target.value)}
        placeholder={field.placeholder ?? ''}
        $hasError={!!error}
      />
      {error && <FieldError>{error}</FieldError>}
    </Field>
  )
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 24px;
`

const TitleBlock = styled.div`
  text-align: center;
`

const Title = styled.h2`
  font-size: ${({ theme }) => theme.typography.sizes.xl};
  font-weight: ${({ theme }) => theme.typography.weights.bold};
  color: ${({ theme }) => theme.colors.textPrimary};
  line-height: ${({ theme }) => theme.typography.lineHeights.tight};

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    font-size: ${({ theme }) => theme.typography.sizes.lg};
  }
`

const FieldList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`

const Field = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
`

const FieldLabel = styled.label`
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: ${({ theme }) => theme.typography.sizes.sm};
  font-weight: ${({ theme }) => theme.typography.weights.medium};
  color: ${({ theme }) => theme.colors.textPrimary};
`

const Required = styled.span`
  color: #EF4444;
  font-size: ${({ theme }) => theme.typography.sizes.sm};
`

const FieldInput = styled.input<{ $hasError: boolean }>`
  width: 100%;
  padding: 11px 14px;
  font-size: ${({ theme }) => theme.typography.sizes.md};
  color: ${({ theme }) => theme.colors.textPrimary};
  background: ${({ theme }) => theme.colors.bgSurface};
  border: 1.5px solid ${({ theme, $hasError }) => $hasError ? '#EF4444' : theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.md};
  outline: none;
  font-family: ${({ theme }) => theme.typography.fontFamily};
  transition: border-color 0.15s;

  &::placeholder {
    color: ${({ theme }) => theme.colors.textTertiary};
  }

  &:focus {
    border-color: ${({ theme, $hasError }) => $hasError ? '#EF4444' : theme.colors.accent};
  }
`

const FieldError = styled.p`
  font-size: ${({ theme }) => theme.typography.sizes.xs};
  color: #EF4444;
`

const Actions = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`

const SkipBtn = styled.button`
  background: none;
  border: none;
  font-size: ${({ theme }) => theme.typography.sizes.sm};
  color: ${({ theme }) => theme.colors.textTertiary};
  cursor: pointer;
  text-align: center;
  padding: 4px;

  &:hover {
    color: ${({ theme }) => theme.colors.textSecondary};
    text-decoration: underline;
  }
`
