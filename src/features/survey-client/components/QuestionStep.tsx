import { useState } from 'react'
import styled from 'styled-components'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronRight } from 'lucide-react'
import type { QuestionNodeData, AnswerOption } from '@shared/types/dag.types'
import { AnswerType } from '@shared/types/dag.types'
import { Button } from '@shared/ui/Button'

// ─── Component ────────────────────────────────────────────────────────────────

interface QuestionStepProps {
  data: QuestionNodeData & { mediaUrl?: string | null }
  onAnswer: (value: string | string[]) => void
}

export function QuestionStep({ data, onAnswer }: QuestionStepProps) {
  const [selected, setSelected] = useState<string[]>([])

  const { questionText, answerType, options, mediaUrl } = data

  // ─── Handlers ───────────────────────────────────────────────────────────────

  function handleOptionClick(option: AnswerOption) {
    if (answerType === AnswerType.SingleChoice || answerType === AnswerType.Slider) {
      // Immediately advance on single selection
      onAnswer(option.value)
    } else {
      // Multiple choice: toggle selection
      setSelected((prev) =>
        prev.includes(option.value)
          ? prev.filter((v) => v !== option.value)
          : [...prev, option.value]
      )
    }
  }

  function handleMultiContinue() {
    if (selected.length > 0) onAnswer(selected)
  }

  // ─── Choice variants (SingleChoice, MultipleChoice, Slider-as-options) ───────
  const isMulti = answerType === AnswerType.MultipleChoice

  console.log(data, ' answer type');
  

  return (
    <Wrapper>
      {mediaUrl && <QuestionMedia src={mediaUrl} alt={questionText} />}
      <QuestionText>{questionText}</QuestionText>

      {isMulti && (
        <HintText>Select all that apply</HintText>
      )}

      <OptionsGrid>
        <AnimatePresence>
          {options && answerType !== AnswerType.Slider ? options.map((opt, i) => {
            const isSelected = selected.includes(opt.value)
            return (
              <OptionCard
                key={opt.id}
                $selected={isMulti ? isSelected : false}
                onClick={() => handleOptionClick(opt)}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05, duration: 0.2 }}
                whileTap={{ scale: 0.98 }}
                type="button"
              >
                {opt.icon && <OptionIcon>{opt.icon}</OptionIcon>}
                <OptionLabel $selected={isMulti ? isSelected : false}>
                  {opt.label}
                </OptionLabel>
              </OptionCard>
            )
          }) : <>STIDER</>}
        </AnimatePresence>
      </OptionsGrid>

      {isMulti && (
        <Button
          fullWidth
          size="lg"
          disabled={selected.length === 0}
          icon={<ChevronRight size={18} />}
          onClick={handleMultiContinue}
        >
          Continue
        </Button>
      )}
    </Wrapper>
  )
}


// ─── Styles ───────────────────────────────────────────────────────────────────

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 28px;
`

const QuestionText = styled.h2`
  font-size: ${({ theme }) => theme.typography.sizes.xl};
  font-weight: ${({ theme }) => theme.typography.weights.semibold};
  color: ${({ theme }) => theme.colors.textPrimary};
  line-height: ${({ theme }) => theme.typography.lineHeights.tight};
  text-align: center;
`

const OptionsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 12px;

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    grid-template-columns: 1fr;
  }
`

const OptionCard = styled(motion.button)<{ $selected: boolean }>`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 18px;
  border-radius: ${({ theme }) => theme.radii.md};
  border: 2px solid
    ${({ theme, $selected }) =>
      $selected ? theme.colors.accent : theme.colors.border};
  background: ${({ theme, $selected }) =>
    $selected ? theme.colors.accentLight : theme.colors.bgSurface};
  cursor: pointer;
  text-align: left;
  transition: border-color ${({ theme }) => theme.transitions.fast},
    background ${({ theme }) => theme.transitions.fast},
    box-shadow ${({ theme }) => theme.transitions.fast};

  &:hover {
    border-color: ${({ theme }) => theme.colors.accent};
    box-shadow: ${({ theme }) => theme.shadows.sm};
  }

  &:focus-visible {
    outline: none;
    box-shadow: 0 0 0 3px ${({ theme }) => theme.colors.accentLight};
  }
`

const OptionIcon = styled.span`
  font-size: 22px;
  line-height: 1;
  flex-shrink: 0;
`

const OptionLabel = styled.span<{ $selected: boolean }>`
  font-size: ${({ theme }) => theme.typography.sizes.md};
  font-weight: ${({ theme, $selected }) =>
    $selected
      ? theme.typography.weights.semibold
      : theme.typography.weights.regular};
  color: ${({ theme, $selected }) =>
    $selected ? theme.colors.accentText : theme.colors.textPrimary};
`

const TextInput = styled.textarea`
  width: 100%;
  min-height: 120px;
  padding: 14px 16px;
  border: 2px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.md};
  background: ${({ theme }) => theme.colors.bgSurface};
  color: ${({ theme }) => theme.colors.textPrimary};
  font-family: ${({ theme }) => theme.typography.fontFamily};
  font-size: ${({ theme }) => theme.typography.sizes.md};
  resize: vertical;
  transition: border-color ${({ theme }) => theme.transitions.fast};
  outline: none;

  &:focus {
    border-color: ${({ theme }) => theme.colors.borderFocus};
  }

  &::placeholder {
    color: ${({ theme }) => theme.colors.textTertiary};
  }
`

const HintText = styled.p`
  font-size: ${({ theme }) => theme.typography.sizes.sm};
  color: ${({ theme }) => theme.colors.textTertiary};
  text-align: center;
`

const QuestionMedia = styled.img`
  max-width: 100%;
  max-height: 240px;
  border-radius: ${({ theme }) => theme.radii.md};
  object-fit: contain;
  align-self: center;
`
