import { useMemo, useState } from 'react'
import styled from 'styled-components'
import { Plus, Trash2, GitBranch, Infinity } from 'lucide-react'
import type { Edge } from 'reactflow'

import { Input } from '@shared/ui/Input'
import { Select } from '@shared/ui/Select'
import { Button } from '@shared/ui/Button'
import { useDagStore } from '../../store/dag.store'
import type {
  EdgeConditions,
  EdgeConditionRule,
  EdgeOperator,
  QuestionNodeData,
} from '@shared/types/dag.types'
import { NodeType, AnswerType, ValueKind } from '@shared/types/dag.types'

// ─── Types ────────────────────────────────────────────────────────────────────

type AttrKind = 'numeric' | 'enum' | 'text'

interface AttrMeta {
  kind: AttrKind
  options?: { id: string; label: string; value: string }[]
}

// ─── Operators ────────────────────────────────────────────────────────────────

const OPERATORS: Record<AttrKind, { value: EdgeOperator; label: string }[]> = {
  numeric: [
    { value: 'eq',      label: '= equals' },
    { value: 'neq',     label: '≠ not equals' },
    { value: 'gt',      label: '> greater than' },
    { value: 'gte',     label: '≥ greater or equal' },
    { value: 'lt',      label: '< less than' },
    { value: 'lte',     label: '≤ less or equal' },
    { value: 'between', label: '↔ between' },
  ],
  enum: [
    { value: 'eq',     label: '= equals' },
    { value: 'neq',    label: '≠ not equals' },
    { value: 'in',     label: '∈ is one of' },
    { value: 'not_in', label: '∉ is not one of' },
  ],
  text: [
    { value: 'eq',       label: '= equals' },
    { value: 'neq',      label: '≠ not equals' },
    { value: 'contains', label: '⊃ contains' },
  ],
}

const DEFAULT_OP: Record<AttrKind, EdgeOperator> = {
  numeric: 'eq',
  enum: 'eq',
  text: 'eq',
}

const DEFAULT_CONDITIONS: EdgeConditions = { always: true, rules: [], priority: 0 }

const LOGICAL_OPS = ['AND', 'OR'] as const

// ─── Component ────────────────────────────────────────────────────────────────

export function EdgeProperties({ edge }: { edge: Edge }) {
  const updateEdgeCondition = useDagStore((s) => s.updateEdgeCondition)
  const nodes = useDagStore((s) => s.nodes)

  const [activeOperator, setActiveOperator] = useState<'AND' | 'OR'>(
    (edge.data?.operator as 'AND' | 'OR') ?? 'AND',
  )

  const conditions: EdgeConditions = edge.data?.conditions ?? DEFAULT_CONDITIONS

  // Build attribute list from canvas Question nodes + special __score__ attribute
  const { attrList, attrMeta } = useMemo(() => {
    const meta: Record<string, AttrMeta> = {
      __score__: { kind: 'numeric' },
    }
    const list: { key: string; label: string }[] = [
      { key: '__score__', label: '⭐ Lead Score (__score__)' },
    ]

    for (const n of nodes) {
      if (n.type !== NodeType.Question) continue
      const qData = n.data as QuestionNodeData
      if (!qData.attributeKey) continue

      const isNumeric =
        qData.answerType === AnswerType.Slider || qData.valueKind === ValueKind.Number
      const hasOptions = !isNumeric && (qData.options?.length ?? 0) > 0

      meta[qData.attributeKey] = {
        kind: isNumeric ? 'numeric' : hasOptions ? 'enum' : 'text',
        options: hasOptions ? qData.options : undefined,
      }

      if (!list.some((l) => l.key === qData.attributeKey)) {
        list.push({
          key: qData.attributeKey,
          label: qData.attributeKey.replace(/_/g, ' '),
        })
      }
    }

    return { attrList: list, attrMeta: meta }
  }, [nodes])

  const getKind = (key: string): AttrKind => attrMeta[key]?.kind ?? 'text'

  const update = (patch: Partial<EdgeConditions>, op?: 'AND' | 'OR') => {
    updateEdgeCondition(edge.id, {
      ...conditions,
      ...patch,
      operator: op ?? activeOperator,
    })
  }

  const addRule = () => {
    const firstAttr = attrList[0]?.key ?? '__score__'
    const kind = getKind(firstAttr)
    const opts = attrMeta[firstAttr]?.options
    update({
      rules: [
        ...conditions.rules,
        {
          attributeKey: firstAttr,
          operator: DEFAULT_OP[kind],
          value: opts?.[0]?.value ?? '',
        },
      ],
    })
  }

  const removeRule = (idx: number) =>
    update({ rules: conditions.rules.filter((_, i) => i !== idx) })

  const patchRule = (idx: number, patch: Partial<EdgeConditionRule>) =>
    update({
      rules: conditions.rules.map((r, i) => (i === idx ? { ...r, ...patch } : r)),
    })

  const changeAttribute = (idx: number, newKey: string) => {
    const kind = getKind(newKey)
    const opts = attrMeta[newKey]?.options
    patchRule(idx, {
      attributeKey: newKey,
      operator: DEFAULT_OP[kind],
      value: opts?.[0]?.value ?? '',
      valueTo: undefined,
    })
  }

  const changeOperator = (idx: number, newOp: EdgeOperator) => {
    const rule = conditions.rules[idx]
    const wasMulti = rule.operator === 'in' || rule.operator === 'not_in'
    const isMulti = newOp === 'in' || newOp === 'not_in'
    patchRule(idx, {
      operator: newOp,
      valueTo: newOp === 'between' ? (rule.valueTo ?? '') : undefined,
      value: wasMulti !== isMulti ? '' : rule.value,
    })
  }

  const toggleSetValue = (idx: number, optValue: string) => {
    const rule = conditions.rules[idx]
    const current = rule.value ? rule.value.split(',') : []
    const next = current.includes(optValue)
      ? current.filter((v) => v !== optValue)
      : [...current, optValue]
    patchRule(idx, { value: next.join(',') })
  }

  const noQuestionsYet = attrList.length <= 1 // only __score__

  return (
    <>
      {/* ── Routing ── */}
      <FieldGroup>
        <GroupLabel>Routing</GroupLabel>

        <Input
          label="Priority (higher = evaluated first)"
          type="number"
          value={conditions.priority}
          onChange={(e) =>
            update({ priority: Math.max(0, parseInt(e.target.value) || 0) })
          }
        />

        <AlwaysToggle
          $active={conditions.always}
          onClick={() => update({ always: !conditions.always })}
        >
          <ToggleIcon>
            {conditions.always ? <Infinity size={14} /> : <GitBranch size={14} />}
          </ToggleIcon>
          <ToggleLabel>
            {conditions.always
              ? 'Unconditional — always match'
              : 'Conditional — evaluate rules'}
          </ToggleLabel>
          <TogglePill $active={conditions.always} />
        </AlwaysToggle>

        {conditions.always && (
          <HintText>
            Fallback edge — fires when no conditional edge matches. Set priority
            lower than conditional siblings.
          </HintText>
        )}
      </FieldGroup>

      {/* ── Condition rules ── */}
      {!conditions.always && (
        <FieldGroup>
          <GroupLabel>Conditions</GroupLabel>

          {noQuestionsYet && (
            <HintText>
              Add Question nodes to your flow to define conditions. The{' '}
              <code>__score__</code> attribute is always available (accumulated lead score).
            </HintText>
          )}

          {conditions.rules.length === 0 && !noQuestionsYet && (
            <HintText>
              No rules yet — add at least one condition, or switch to unconditional.
            </HintText>
          )}

          {conditions.rules.length > 1 && (
            <Select
              label="Combine rules with"
              value={activeOperator}
              options={LOGICAL_OPS.map((op) => ({ value: op, label: op }))}
              onChange={(e) => {
                const op = e.target.value as 'AND' | 'OR'
                setActiveOperator(op)
                update({}, op)
              }}
            />
          )}

          {conditions.rules.map((rule, idx) => {
            const kind = getKind(rule.attributeKey)
            const meta = attrMeta[rule.attributeKey]
            const selectedValues = rule.value
              ? rule.value.split(',').filter(Boolean)
              : []

            return (
              <RuleCard key={idx}>
                <RuleRow>
                  <Select
                    label="Attribute"
                    value={rule.attributeKey}
                    options={attrList.map((a) => ({ value: a.key, label: a.label }))}
                    onChange={(e) => changeAttribute(idx, e.target.value)}
                  />
                  <DeleteRuleBtn
                    variant="ghost"
                    size="sm"
                    onClick={() => removeRule(idx)}
                    title="Remove condition"
                  >
                    <Trash2 size={13} />
                  </DeleteRuleBtn>
                </RuleRow>

                <Select
                  label="Operator"
                  value={rule.operator}
                  options={OPERATORS[kind]}
                  onChange={(e) => changeOperator(idx, e.target.value as EdgeOperator)}
                />

                {/* between → two numeric inputs */}
                {rule.operator === 'between' && (
                  <BetweenRow>
                    <Input
                      label="From"
                      type="number"
                      value={rule.value}
                      onChange={(e) => patchRule(idx, { value: e.target.value })}
                      placeholder="min"
                    />
                    <BetweenSep>–</BetweenSep>
                    <Input
                      label="To"
                      type="number"
                      value={rule.valueTo ?? ''}
                      onChange={(e) => patchRule(idx, { valueTo: e.target.value })}
                      placeholder="max"
                    />
                  </BetweenRow>
                )}

                {/* in / not_in + enum → checkboxes */}
                {(rule.operator === 'in' || rule.operator === 'not_in') &&
                  meta?.options?.length && (
                    <CheckboxGroup>
                      <CheckboxGroupLabel>Select values</CheckboxGroupLabel>
                      {meta.options.map((opt) => (
                        <CheckboxRow key={opt.id}>
                          <NativeCheckbox
                            type="checkbox"
                            id={`rule-${idx}-${opt.id}`}
                            checked={selectedValues.includes(opt.value)}
                            onChange={() => toggleSetValue(idx, opt.value)}
                          />
                          <CheckboxLabel htmlFor={`rule-${idx}-${opt.id}`}>
                            {opt.label}
                          </CheckboxLabel>
                        </CheckboxRow>
                      ))}
                    </CheckboxGroup>
                  )}

                {/* in / not_in without enum options → free text */}
                {(rule.operator === 'in' || rule.operator === 'not_in') &&
                  !meta?.options?.length && (
                    <Input
                      label="Values (comma-separated)"
                      value={rule.value}
                      onChange={(e) => patchRule(idx, { value: e.target.value })}
                      placeholder="val1,val2,val3"
                    />
                  )}

                {/* enum single-value → dropdown */}
                {rule.operator !== 'between' &&
                  rule.operator !== 'in' &&
                  rule.operator !== 'not_in' &&
                  kind === 'enum' &&
                  meta?.options?.length && (
                    <Select
                      label="Value"
                      value={rule.value}
                      options={meta.options.map((o) => ({ value: o.value, label: o.label }))}
                      onChange={(e) => patchRule(idx, { value: e.target.value })}
                    />
                  )}

                {/* numeric single-value → number input */}
                {rule.operator !== 'between' &&
                  rule.operator !== 'in' &&
                  rule.operator !== 'not_in' &&
                  kind === 'numeric' && (
                    <Input
                      label="Value"
                      type="number"
                      value={rule.value}
                      onChange={(e) => patchRule(idx, { value: e.target.value })}
                      placeholder="0"
                    />
                  )}

                {/* text → text input */}
                {rule.operator !== 'between' &&
                  rule.operator !== 'in' &&
                  rule.operator !== 'not_in' &&
                  kind === 'text' && (
                    <Input
                      label="Value"
                      value={rule.value}
                      onChange={(e) => patchRule(idx, { value: e.target.value })}
                      placeholder="exact match value"
                    />
                  )}

                {idx < conditions.rules.length - 1 && (
                  <AndDivider>{activeOperator}</AndDivider>
                )}
              </RuleCard>
            )
          })}

          <Button
            variant="secondary"
            size="sm"
            icon={<Plus size={14} />}
            onClick={addRule}
          >
            Add condition
          </Button>
        </FieldGroup>
      )}
    </>
  )
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const FieldGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`

const GroupLabel = styled.p`
  font-size: ${({ theme }) => theme.typography.sizes.xs};
  font-weight: ${({ theme }) => theme.typography.weights.semibold};
  color: ${({ theme }) => theme.colors.textTertiary};
  text-transform: uppercase;
  letter-spacing: 0.7px;
`

const AlwaysToggle = styled.button<{ $active: boolean }>`
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 10px 12px;
  background: ${({ theme, $active }) =>
    $active ? theme.colors.accentLight : theme.colors.bgElevated};
  border: 1px solid
    ${({ theme, $active }) => $active ? theme.colors.accent : theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.md};
  cursor: pointer;
  transition: all 0.15s ease;
  text-align: left;
  &:hover { border-color: ${({ theme }) => theme.colors.accent}; }
`

const ToggleIcon = styled.span`
  display: flex;
  align-items: center;
  color: ${({ theme }) => theme.colors.accent};
  flex-shrink: 0;
`

const ToggleLabel = styled.span`
  flex: 1;
  font-size: ${({ theme }) => theme.typography.sizes.sm};
  font-weight: ${({ theme }) => theme.typography.weights.medium};
  color: ${({ theme }) => theme.colors.textPrimary};
`

const TogglePill = styled.span<{ $active: boolean }>`
  width: 28px;
  height: 16px;
  border-radius: 8px;
  background: ${({ theme, $active }) => $active ? theme.colors.accent : theme.colors.border};
  position: relative;
  flex-shrink: 0;
  transition: background 0.15s ease;

  &::after {
    content: '';
    position: absolute;
    top: 2px;
    left: ${({ $active }) => ($active ? '14px' : '2px')};
    width: 12px;
    height: 12px;
    border-radius: 50%;
    background: white;
    transition: left 0.15s ease;
  }
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

const RuleCard = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 10px;
  background: ${({ theme }) => theme.colors.bgElevated};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.md};
`

const RuleRow = styled.div`
  display: flex;
  align-items: flex-end;
  gap: 6px;
`

const DeleteRuleBtn = styled(Button)`
  flex-shrink: 0;
  margin-bottom: 2px;
  color: ${({ theme }) => theme.colors.textTertiary};
  &:hover { color: #EF4444; }
`

const AndDivider = styled.div`
  font-size: ${({ theme }) => theme.typography.sizes.xs};
  font-weight: ${({ theme }) => theme.typography.weights.semibold};
  color: ${({ theme }) => theme.colors.textTertiary};
  text-align: center;
  letter-spacing: 0.5px;
`

const BetweenRow = styled.div`
  display: flex;
  align-items: flex-end;
  gap: 6px;
`

const BetweenSep = styled.span`
  flex-shrink: 0;
  padding-bottom: 10px;
  font-size: ${({ theme }) => theme.typography.sizes.sm};
  color: ${({ theme }) => theme.colors.textTertiary};
`

const CheckboxGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
`

const CheckboxGroupLabel = styled.p`
  font-size: ${({ theme }) => theme.typography.sizes.xs};
  color: ${({ theme }) => theme.colors.textTertiary};
  font-weight: ${({ theme }) => theme.typography.weights.medium};
  margin-bottom: 2px;
`

const CheckboxRow = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`

const NativeCheckbox = styled.input`
  width: 14px;
  height: 14px;
  flex-shrink: 0;
  accent-color: ${({ theme }) => theme.colors.accent};
  cursor: pointer;
`

const CheckboxLabel = styled.label`
  font-size: ${({ theme }) => theme.typography.sizes.sm};
  color: ${({ theme }) => theme.colors.textPrimary};
  cursor: pointer;
  user-select: none;
`
