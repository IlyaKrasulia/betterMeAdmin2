import { useMemo } from 'react'
import { Plus, Trash2, Info, Lock } from 'lucide-react'
import type { Node } from 'reactflow'
import styled from 'styled-components'

import { Input } from '@shared/ui/Input'
import { Select } from '@shared/ui/Select'
import { Button } from '@shared/ui/Button'
import { useDagStore } from '../../store/dag.store'
import type { DagNodeData, AnswerOption, QuestionNodeData, EdgeConditions } from '@shared/types/dag.types'
import { AnswerType, ValueKind } from '@shared/types/dag.types'

/** All answer types per value kind (full list, before runtime filtering). */
const ANSWER_TYPES_FOR_KIND: Record<ValueKind, Array<{ value: AnswerType; label: string }>> = {
  [ValueKind.Text]: [
    { value: AnswerType.SingleChoice,   label: 'Single Choice' },
    { value: AnswerType.MultipleChoice, label: 'Multiple Choice' },
    { value: AnswerType.Text,           label: 'Text (free input)' },
  ],
  [ValueKind.Number]: [
    { value: AnswerType.Slider, label: 'Slider (numeric range)' },
  ],
}

const VALUE_KINDS = [
  { value: ValueKind.Text,   label: 'Text' },
  { value: ValueKind.Number, label: 'Numeric' },
]

function slugify(str: string): string {
  return str.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '')
}

export function QuestionProperties({ node }: { node: Node<DagNodeData> }) {
  const updateNodeData = useDagStore((s) => s.updateNodeData)
  const cleanEdgesForDeletedOption = useDagStore((s) => s.cleanEdgesForDeletedOption)
  const cleanEdgesForAttribute = useDagStore((s) => s.cleanEdgesForAttribute)
  const edges = useDagStore((s) => s.edges)
  const data = node.data as QuestionNodeData

  /**
   * True when this question's attributeKey is already referenced in at least
   * one edge condition rule — even before the flow is saved.
   * Changing the key or value-type at that point would silently break those
   * conditions, so both fields must be locked.
   */
  const isKeyUsedInEdge = useMemo(() => {
    if (!data.attributeKey) return false
    return edges.some((edge) => {
      const cond = edge.data?.conditions as EdgeConditions | undefined
      if (!cond || cond.always || cond.rules.length === 0) return false
      return cond.rules.some((r) => r.attributeKey === data.attributeKey)
    })
  }, [edges, data.attributeKey])

  // node.data (DagNodeData) carries the isLocal flag; the narrowed QuestionNodeData does not.
  const isLocal = node.data.isLocal ?? false

  /**
   * attributeKey and valueKind are frozen when:
   *   • the node has been saved to the API (!isLocal), OR
   *   • the attributeKey is already used in an edge condition
   */
  const isAttrFrozen = !isLocal || isKeyUsedInEdge

  const isSlider = data.answerType === AnswerType.Slider
  const isText = data.answerType === AnswerType.Text
  const hasOptions = !isSlider && !isText
  const hasExistingOptions = (data.options ?? []).length > 0

  /**
   * Runtime-filtered list: hides "Text (free input)" when the question already
   * has options — the user must remove all options before switching to free text.
   */
  const availableAnswerTypes = ANSWER_TYPES_FOR_KIND[data.valueKind ?? ValueKind.Text].filter(
    (t) => !(t.value === AnswerType.Text && hasExistingOptions),
  )

  const addOption = () => {
    const uid = crypto.randomUUID().slice(0, 8)
    const newOption: AnswerOption = {
      id: crypto.randomUUID(),
      label: 'New option',
      value: `option_${uid}`,
      scoreDelta: 0,
    }
    updateNodeData(node.id, {
      options: [...(data.options ?? []), newOption],
    } as Partial<DagNodeData>)
  }

  const removeOption = (id: string) => {
    const opt = data.options.find((o) => o.id === id)
    updateNodeData(node.id, {
      options: data.options.filter((o) => o.id !== id),
    } as Partial<DagNodeData>)
    // Scrub any edge conditions that referenced this option's value
    if (opt && data.attributeKey) {
      cleanEdgesForDeletedOption(data.attributeKey, opt.value)
    }
  }

  const updateOption = (id: string, field: keyof AnswerOption, value: string | number) => {
    updateNodeData(node.id, {
      options: data.options.map((o) => (o.id === id ? { ...o, [field]: value } : o)),
    } as Partial<DagNodeData>)
  }

  const handleAnswerTypeChange = (newType: AnswerType) => {
    updateNodeData(node.id, {
      answerType: newType,
      options: newType === AnswerType.Slider ? [] : data.options,
    } as Partial<DagNodeData>)
    // Switching to Slider clears all options → scrub any option-based edge rules.
    // Switching to Text keeps options in memory but they're no longer the answer
    // mechanic, so in/not_in rules (which require discrete option picks) are stale.
    if ((newType === AnswerType.Slider || newType === AnswerType.Text) && data.attributeKey) {
      // For Slider: no valid options → sweep everything (pass empty)
      // For Text: same — free-text answers make option-referencing rules invalid
      cleanEdgesForAttribute(data.attributeKey, [])
    }
  }

  /**
   * Changing the value kind constrains which answer types are available.
   * Automatically resets answerType to the first available option for the new kind.
   */
  const handleValueKindChange = (newKind: ValueKind) => {
    const availableTypes = ANSWER_TYPES_FOR_KIND[newKind]
    const currentValid = availableTypes.some((t) => t.value === data.answerType)
    const patch: Partial<DagNodeData> = { valueKind: newKind } as Partial<DagNodeData>
    if (!currentValid) {
      const firstType = availableTypes[0].value
      ;(patch as any).answerType = firstType
      if (firstType === AnswerType.Slider) (patch as any).options = []
    }
    updateNodeData(node.id, patch)
    // Switching to Numeric forces Slider (no options) → sweep option-based edge rules
    if (newKind === ValueKind.Number && data.attributeKey) {
      cleanEdgesForAttribute(data.attributeKey, [])
    }
  }

  return (
    <>
      {/* ── Content ── */}
      <FieldGroup>
        <GroupLabel>Content</GroupLabel>
        <Input
          label="Question title"
          value={data.title}
          onChange={(e) => updateNodeData(node.id, { title: e.target.value } as Partial<DagNodeData>)}
          placeholder="e.g. What is your company size?"
        />
        <Input
          label="Description (optional)"
          value={data.description ?? ''}
          onChange={(e) =>
            updateNodeData(node.id, {
              description: e.target.value || undefined,
            } as Partial<DagNodeData>)
          }
          placeholder="Supporting text shown below the question"
        />
      </FieldGroup>

      {/* ── Attribute ── */}
      <FieldGroup>
        <GroupLabel>Attribute key</GroupLabel>
        <Input
          label="Attribute key"
          value={data.attributeKey}
          onChange={(e) =>
            updateNodeData(node.id, {
              attributeKey: slugify(e.target.value),
            } as Partial<DagNodeData>)
          }
          placeholder="e.g. company_size"
          disabled={isAttrFrozen}
        />
        <HintText>
          This key is stored in the lead's answer context and available in edge conditions.
          {!isLocal && (
            <FreezeReason><Lock size={10} /> Locked — already saved to the API.</FreezeReason>
          )}
          {isLocal && isKeyUsedInEdge && (
            <FreezeReason><Lock size={10} /> Locked — used in an edge condition. Remove that condition first to unlock.</FreezeReason>
          )}
        </HintText>
        <Select
          label="Value type"
          value={data.valueKind ?? ValueKind.Text}
          options={VALUE_KINDS}
          onChange={(e) => handleValueKindChange(e.target.value as ValueKind)}
          disabled={isAttrFrozen}
        />
      </FieldGroup>

      {/* ── Answer type ── */}
      <FieldGroup>
        <GroupLabel>Answer type</GroupLabel>
        <Select
          label="How leads answer this question"
          value={data.answerType}
          options={availableAnswerTypes}
          onChange={(e) => handleAnswerTypeChange(e.target.value as AnswerType)}
        />
        {hasExistingOptions && (
          <HintText>
            "Text (free input)" is unavailable while options exist — remove all options first.
          </HintText>
        )}

        {isSlider && (
          <OptionRow>
            <Input
              label="Min"
              type="number"
              value={data.min ?? 0}
              onChange={(e) =>
                updateNodeData(node.id, { min: Number(e.target.value) } as Partial<DagNodeData>)
              }
            />
            <Input
              label="Max"
              type="number"
              value={data.max ?? 10}
              onChange={(e) =>
                updateNodeData(node.id, { max: Number(e.target.value) } as Partial<DagNodeData>)
              }
            />
          </OptionRow>
        )}

        {isText && (
          <InfoBox>
            <Info size={13} />
            <span>
              Lead's typed answer will be saved to <code>{data.attributeKey || '…'}</code>. Use it in edge conditions with the <code>contains</code> or <code>eq</code> operator.
            </span>
          </InfoBox>
        )}
      </FieldGroup>

      {/* ── Options (SingleChoice / MultipleChoice) ── */}
      {hasOptions && (
        <FieldGroup>
          <GroupLabel>
            Answer options
            <ScoreHint>Score delta accumulates as <code>__score__</code></ScoreHint>
          </GroupLabel>

          {(data.options ?? []).length === 0 && (
            <EmptyOptions>No options yet — add at least one.</EmptyOptions>
          )}

          {(data.options ?? []).map((opt) => (
            <OptionCard key={opt.id}>
              <OptionMain>
                <Input
                  value={opt.label}
                  onChange={(e) => updateOption(opt.id, 'label', e.target.value)}
                  placeholder="Option label"
                  error={opt.label.trim() === '' ? 'Label cannot be empty' : undefined}
                />
                <DeleteBtn
                  variant="ghost"
                  size="sm"
                  onClick={() => removeOption(opt.id)}
                  title="Remove option"
                >
                  <Trash2 size={14} />
                </DeleteBtn>
              </OptionMain>
              <ScoreRow>
                <ScoreLabel>Score delta</ScoreLabel>
                <ScoreControls>
                  <ScoreStepBtn
                    onClick={() => updateOption(opt.id, 'scoreDelta', opt.scoreDelta - 10)}
                    title="–10"
                  >−</ScoreStepBtn>
                  <ScoreInput
                    type="number"
                    value={opt.scoreDelta}
                    onChange={(e) => updateOption(opt.id, 'scoreDelta', parseInt(e.target.value) || 0)}
                  />
                  <ScoreStepBtn
                    onClick={() => updateOption(opt.id, 'scoreDelta', opt.scoreDelta + 10)}
                    title="+10"
                  >+</ScoreStepBtn>
                </ScoreControls>
                <ScoreBadge $value={opt.scoreDelta}>
                  {opt.scoreDelta > 0 ? `+${opt.scoreDelta}` : opt.scoreDelta === 0 ? '±0' : opt.scoreDelta}
                </ScoreBadge>
              </ScoreRow>
            </OptionCard>
          ))}

          <Button
            variant="secondary"
            size="sm"
            icon={<Plus size={14} />}
            onClick={addOption}
          >
            Add option
          </Button>
        </FieldGroup>
      )}
    </>
  )
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const FreezeReason = styled.span`
  display: flex;
  align-items: center;
  gap: 4px;
  margin-top: 4px;
  font-size: 10px;
  color: ${({ theme }) => theme.colors.textTertiary};
  opacity: 0.85;
`

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
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
`

const ScoreHint = styled.span`
  font-size: 9.5px;
  font-weight: 400;
  text-transform: none;
  letter-spacing: 0;
  color: ${({ theme }) => theme.colors.textTertiary};
  opacity: 0.8;

  code {
    background: ${({ theme }) => theme.colors.bgElevated};
    padding: 0 4px;
    border-radius: 3px;
    font-family: monospace;
    font-size: 9px;
  }
`

const HintText = styled.p`
  font-size: ${({ theme }) => theme.typography.sizes.xs};
  color: ${({ theme }) => theme.colors.textTertiary};
  line-height: 1.5;
`

const InfoBox = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 10px 12px;
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

  code {
    font-family: monospace;
    background: ${({ theme }) => theme.colors.bgElevated};
    padding: 0 3px;
    border-radius: 3px;
    font-size: 10px;
  }
`

const EmptyOptions = styled.p`
  font-size: ${({ theme }) => theme.typography.sizes.xs};
  color: ${({ theme }) => theme.colors.textTertiary};
  font-style: italic;
`

const OptionCard = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 10px;
  background: ${({ theme }) => theme.colors.bgElevated};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.md};
`

const OptionMain = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`

const DeleteBtn = styled(Button)`
  flex-shrink: 0;
  padding: 4px;
  width: 26px;
  height: 26px;
  min-width: unset;
  color: ${({ theme }) => theme.colors.textTertiary};
  &:hover { color: #EF4444; }
`

const ScoreRow = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
`

const ScoreLabel = styled.span`
  font-size: 10px;
  color: ${({ theme }) => theme.colors.textTertiary};
  flex: 1;
`

const ScoreControls = styled.div`
  display: flex;
  align-items: center;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 6px;
  overflow: hidden;
`

const ScoreStepBtn = styled.button`
  width: 24px;
  height: 26px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${({ theme }) => theme.colors.bgSurface};
  border: none;
  cursor: pointer;
  font-size: 14px;
  color: ${({ theme }) => theme.colors.textSecondary};
  transition: background 0.1s;
  &:hover { background: ${({ theme }) => theme.colors.border}; }
`

const ScoreInput = styled.input`
  width: 44px;
  height: 26px;
  border: none;
  border-left: 1px solid ${({ theme }) => theme.colors.border};
  border-right: 1px solid ${({ theme }) => theme.colors.border};
  background: ${({ theme }) => theme.colors.bgSurface};
  color: ${({ theme }) => theme.colors.textPrimary};
  font-size: 12px;
  text-align: center;
  outline: none;
  -moz-appearance: textfield;
  &::-webkit-outer-spin-button,
  &::-webkit-inner-spin-button { -webkit-appearance: none; }
`

const ScoreBadge = styled.span<{ $value: number }>`
  font-size: 11px;
  font-weight: 700;
  color: ${({ $value }) =>
    $value > 0 ? '#10B981' : $value < 0 ? '#EF4444' : '#94A3B8'};
  min-width: 28px;
  text-align: right;
`

const OptionRow = styled.div`
  display: flex;
  gap: 8px;
  align-items: flex-start;
`
