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

  // Slider: discrete (has options) vs numeric (empty options, uses min/max)
  const isNumericSlider = answerType === AnswerType.Slider && (!options || options.length === 0)
  const sliderMin = data.min ?? 0
  const sliderMax = data.max ?? 100

  const [sliderValue, setSliderValue] = useState<number>(
    isNumericSlider
      ? Math.round((sliderMin + sliderMax) / 2)
      : Math.floor(((options?.length ?? 1) - 1) / 2)
  )

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
          }) : null}
        </AnimatePresence>
      </OptionsGrid>

      {answerType === AnswerType.Slider && (
        <SliderWrapper
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <SliderCurrentLabel>
            {isNumericSlider ? (
              sliderValue
            ) : (
              <>
                {options[sliderValue]?.icon && (
                  <SliderEmoji>{options[sliderValue].icon}</SliderEmoji>
                )}
                {options[sliderValue]?.label}
              </>
            )}
          </SliderCurrentLabel>

          {isNumericSlider ? (
            <SliderRow>
              <EdgeLabel>{sliderMin}</EdgeLabel>
              <SliderTrackWrapper>
                <SliderInput
                  type="range"
                  min={sliderMin}
                  max={sliderMax}
                  step={1}
                  value={sliderValue}
                  onChange={(e) => setSliderValue(Number(e.target.value))}
                />
              </SliderTrackWrapper>
              <EdgeLabel>{sliderMax}</EdgeLabel>
            </SliderRow>
          ) : (
            <>
              <SliderTrackWrapper>
                <SliderInput
                  type="range"
                  min={0}
                  max={(options?.length ?? 1) - 1}
                  step={1}
                  value={sliderValue}
                  onChange={(e) => setSliderValue(Number(e.target.value))}
                />
              </SliderTrackWrapper>
              <SliderLabels>
                {options?.map((opt, i) => (
                  <SliderTick
                    key={opt.id}
                    $active={i === sliderValue}
                    onClick={() => setSliderValue(i)}
                  >
                    {opt.label}
                  </SliderTick>
                ))}
              </SliderLabels>
            </>
          )}

          <Button
            fullWidth
            size="lg"
            icon={<ChevronRight size={18} />}
            onClick={() =>
              onAnswer(
                isNumericSlider
                  ? String(sliderValue)
                  : options[sliderValue].value
              )
            }
          >
            Continue
          </Button>
        </SliderWrapper>
      )}

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

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    gap: 20px;
  }
`

const QuestionText = styled.h2`
  font-size: ${({ theme }) => theme.typography.sizes.xl};
  font-weight: ${({ theme }) => theme.typography.weights.semibold};
  color: ${({ theme }) => theme.colors.textPrimary};
  line-height: ${({ theme }) => theme.typography.lineHeights.tight};
  text-align: center;

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    font-size: ${({ theme }) => theme.typography.sizes.lg};
  }
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
  min-height: 48px;
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

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    max-height: 160px;
  }
`

// ─── Slider Styles ────────────────────────────────────────────────────────────

const SliderWrapper = styled(motion.div)`
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 100%;
`

const SliderCurrentLabel = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-size: ${({ theme }) => theme.typography.sizes.lg};
  font-weight: ${({ theme }) => theme.typography.weights.semibold};
  color: ${({ theme }) => theme.colors.accent};
  min-height: 36px;
`

const SliderEmoji = styled.span`
  font-size: 28px;
  line-height: 1;
`

const SliderRow = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`

const EdgeLabel = styled.span`
  font-size: ${({ theme }) => theme.typography.sizes.sm};
  font-weight: ${({ theme }) => theme.typography.weights.semibold};
  color: ${({ theme }) => theme.colors.textTertiary};
  flex-shrink: 0;
  min-width: 24px;
  text-align: center;
`

const SliderTrackWrapper = styled.div`
  position: relative;
  width: 100%;
  flex: 1;
  min-width: 0;
`

const SliderInput = styled.input`
  -webkit-appearance: none;
  appearance: none;
  width: 100%;
  height: 6px;
  border-radius: 3px;
  background: ${({ theme }) => theme.colors.border};
  outline: none;
  cursor: pointer;

  &::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 28px;
    height: 28px;
    border-radius: 50%;
    background: ${({ theme }) => theme.colors.accent};
    border: 3px solid ${({ theme }) => theme.colors.bgSurface};
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.25);
    cursor: pointer;
    transition: transform 0.15s ease, box-shadow 0.15s ease;

    @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
      width: 36px;
      height: 36px;
    }
  }

  &::-webkit-slider-thumb:hover {
    transform: scale(1.15);
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
  }

  &::-webkit-slider-thumb:active {
    transform: scale(1.05);
  }

  &::-moz-range-thumb {
    width: 28px;
    height: 28px;
    border-radius: 50%;
    background: ${({ theme }) => theme.colors.accent};
    border: 3px solid ${({ theme }) => theme.colors.bgSurface};
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.25);
    cursor: pointer;

    @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
      width: 36px;
      height: 36px;
    }
  }

  &::-moz-range-track {
    height: 6px;
    border-radius: 3px;
    background: ${({ theme }) => theme.colors.border};
  }
`

const SliderLabels = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 4px;
`

const SliderTick = styled.button<{ $active: boolean }>`
  background: none;
  border: none;
  padding: 4px 2px;
  cursor: pointer;
  font-size: ${({ theme }) => theme.typography.sizes.sm};
  color: ${({ theme, $active }) =>
    $active ? theme.colors.accent : theme.colors.textTertiary};
  font-weight: ${({ theme, $active }) =>
    $active ? theme.typography.weights.semibold : theme.typography.weights.regular};
  transition: color 0.15s ease;
  text-align: center;
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;

  &:hover {
    color: ${({ theme }) => theme.colors.accent};
  }
`
