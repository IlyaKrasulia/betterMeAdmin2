import { useState, useEffect, useCallback, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import styled, { keyframes, useTheme } from 'styled-components'
import { motion, AnimatePresence } from 'framer-motion'
import { Modal } from '@shared/ui/Modal'
import { Input } from '@shared/ui/Input'
import { Button } from '@shared/ui/Button'
import { useCreateFlow, useStartGenerateFlow } from '@features/flows/hooks/useFlows'
import { flowsApi } from '@api/flows.api'
import { useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { useNavigate } from '@tanstack/react-router'
import { Sparkles, PenLine } from 'lucide-react'

const schema = z.object({
  title: z.string().min(1, 'Title is required').max(80, 'Max 80 characters'),
  description: z.string().max(200, 'Max 200 characters').optional(),
})

const aiSchema = z.object({
  prompt: z.string().min(10, 'Please describe your survey in at least 10 characters').max(2000, 'Max 2000 characters'),
})

type FormValues = z.infer<typeof schema>
type AiFormValues = z.infer<typeof aiSchema>

interface CreateSurveyModalProps {
  open: boolean
  onClose: () => void
}

// --- Generation phases with ordered labels ---
const GENERATION_PHASES: { label: string; minTime: number }[] = [
  { label: 'Analyzing your description...', minTime: 0 },
  { label: 'Understanding survey goals...', minTime: 5000 },
  { label: 'Designing flow structure...', minTime: 10000 },
  { label: 'Mapping out question paths...', minTime: 16000 },
  { label: 'Generating survey nodes...', minTime: 22000 },
  { label: 'Crafting question copy...', minTime: 28000 },
  { label: 'Building branching logic...', minTime: 35000 },
  { label: 'Wiring everything up...', minTime: 42000 },
  { label: 'Deciding which offers to add...', minTime: 50000 },
  { label: 'Optimizing user experience...', minTime: 58000 },
  { label: 'Adding finishing touches...', minTime: 66000 },
  { label: 'Polishing the flow layout...', minTime: 74000 },
  { label: 'Running quality checks...', minTime: 82000 },
  { label: 'Validating connections...', minTime: 90000 },
  { label: 'Almost there, wrapping up...', minTime: 100000 },
  { label: 'Finalizing your survey...', minTime: 110000 },
]

const QUOTES = [
  '"Good surveys ask questions people actually want to answer."',
  '"The best funnels feel like conversations, not interrogations."',
  '"Personalization starts with the right question."',
  '"Every great user journey starts with a single node."',
  '"Simplicity is the ultimate sophistication." — Leonardo da Vinci',
  '"Data beats opinions." — Jim Barksdale',
  '"Know your user, know your flow."',
  '"A well-designed survey is invisible to the respondent."',
]

export function CreateSurveyModal({ open, onClose }: CreateSurveyModalProps) {
  const [mode, setMode] = useState<'pick' | 'manual' | 'ai'>('pick')
  const [isGenerating, setIsGenerating] = useState(false)
  const [generationStart, setGenerationStart] = useState(0)
  const [phaseIndex, setPhaseIndex] = useState(0)
  const [quoteIndex, setQuoteIndex] = useState(0)

  const { mutate: createFlow, isPending } = useCreateFlow()
  const { mutate: startGenerate } = useStartGenerateFlow()
  const navigate = useNavigate()
  const theme = useTheme()
  const queryClient = useQueryClient()
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const manualForm = useForm<FormValues>({
    resolver: zodResolver(schema),
  })

  const aiForm = useForm<AiFormValues>({
    resolver: zodResolver(aiSchema),
  })

  const stopPolling = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current)
      pollRef.current = null
    }
  }, [])

  const handleClose = useCallback(() => {
    if (isGenerating) return
    stopPolling()
    manualForm.reset()
    aiForm.reset()
    setMode('pick')
    setIsGenerating(false)
    setPhaseIndex(0)
    onClose()
  }, [isGenerating, manualForm, aiForm, onClose, stopPolling])

  // Phase ticker — advance based on elapsed time
  useEffect(() => {
    if (!isGenerating) return
    const interval = setInterval(() => {
      const elapsed = Date.now() - generationStart
      let newIndex = 0
      for (let i = GENERATION_PHASES.length - 1; i >= 0; i--) {
        if (elapsed >= GENERATION_PHASES[i].minTime) {
          newIndex = i
          break
        }
      }
      setPhaseIndex(newIndex)
    }, 800)
    return () => clearInterval(interval)
  }, [isGenerating, generationStart])

  // Quote rotator
  useEffect(() => {
    if (!isGenerating) return
    setQuoteIndex(Math.floor(Math.random() * QUOTES.length))
    const interval = setInterval(() => {
      setQuoteIndex((prev) => (prev + 1) % QUOTES.length)
    }, 8000)
    return () => clearInterval(interval)
  }, [isGenerating])

  const onManualSubmit = (values: FormValues) => {
    createFlow(
      { name: values.title, description: values.description },
      {
        onSuccess: (flow) => {
          toast.success('Survey created!')
          handleClose()
          navigate({ to: '/editor/$surveyId', params: { surveyId: flow.id } })
        },
        onError: () => {
          toast.error('Failed to create survey. Please try again.')
        },
      }
    )
  }

  const startPolling = useCallback((jobId: string) => {
    stopPolling()
    pollRef.current = setInterval(async () => {
      try {
        const status = await flowsApi.getGenerateStatus(jobId)

        if (status.status === 'Done' && status.flowId) {
          stopPolling()
          setIsGenerating(false)
          queryClient.invalidateQueries({ queryKey: ['flows'] })
          toast.success('Survey generated successfully!')
          manualForm.reset()
          aiForm.reset()
          setMode('pick')
          setPhaseIndex(0)
          onClose()
          navigate({ to: '/editor/$surveyId', params: { surveyId: status.flowId } })
        } else if (status.status === 'Failed') {
          stopPolling()
          setIsGenerating(false)
          toast.error(status.error || 'Generation failed. Please try again.')
        }
      } catch {
        stopPolling()
        setIsGenerating(false)
        toast.error('Failed to check generation status.')
      }
    }, 3000)
  }, [stopPolling, queryClient, navigate, onClose, manualForm, aiForm])

  // Clean up polling on unmount
  useEffect(() => {
    return () => stopPolling()
  }, [stopPolling])

  const onAiSubmit = (values: AiFormValues) => {
    setIsGenerating(true)
    setGenerationStart(Date.now())
    setPhaseIndex(0)

    startGenerate(
      { userPrompt: values.prompt },
      {
        onSuccess: (res) => {
          startPolling(res.jobId)
        },
        onError: () => {
          setIsGenerating(false)
          toast.error('Failed to start generation. Please try again.')
        },
      }
    )
  }

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title={isGenerating ? undefined : mode === 'pick' ? 'Create New Survey' : mode === 'manual' ? 'Create Manually' : 'Generate with AI'}
      width={isGenerating ? 540 : mode === 'pick' ? 520 : 480}
    >
      <AnimatePresence mode="wait">
        {/* ============ GENERATING STATE ============ */}
        {isGenerating && (
          <GeneratingContainer
            key="generating"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {/* Animated orb */}
            <OrbWrapper>
              <OrbOuter>
                <OrbInner />
              </OrbOuter>
              {/* Orbiting particles */}
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <Particle key={i} $index={i} $total={6} />
              ))}
              {/* Pulse rings */}
              <PulseRing $delay={0} />
              <PulseRing $delay={1.5} />
              <PulseRing $delay={3} />
            </OrbWrapper>

            {/* Phase label */}
            <AnimatePresence mode="wait">
              <PhaseLabel
                key={phaseIndex}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.4 }}
              >
                {GENERATION_PHASES[phaseIndex].label}
              </PhaseLabel>
            </AnimatePresence>

            {/* Progress bar */}
            <ProgressTrack>
              <ProgressFill
                initial={{ width: '0%' }}
                animate={{ width: `${Math.min(((phaseIndex + 1) / GENERATION_PHASES.length) * 100, 95)}%` }}
                transition={{ duration: 1.2, ease: 'easeInOut' }}
              />
            </ProgressTrack>

            {/* Quote */}
            <AnimatePresence mode="wait">
              <Quote
                key={quoteIndex}
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.6 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.8 }}
              >
                {QUOTES[quoteIndex]}
              </Quote>
            </AnimatePresence>

            <HintText>This usually takes 1-2 minutes. Hang tight!</HintText>
          </GeneratingContainer>
        )}

        {/* ============ PICK MODE ============ */}
        {!isGenerating && mode === 'pick' && (
          <PickContainer
            key="pick"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            <PickCard
              onClick={() => setMode('manual')}
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
            >
              <PickIconWrap $color={theme.colors.accent}>
                <PenLine size={24} />
              </PickIconWrap>
              <PickCardContent>
                <PickCardTitle>Create Manually</PickCardTitle>
                <PickCardDesc>Start with a blank canvas and build your survey from scratch</PickCardDesc>
              </PickCardContent>
            </PickCard>

            <PickCard
              onClick={() => setMode('ai')}
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
            >
              <PickIconWrap $color={theme.colors.nodeOffer}>
                <Sparkles size={24} />
              </PickIconWrap>
              <PickCardContent>
                <PickCardTitle>
                  Generate with AI
                </PickCardTitle>
                <PickCardDesc>Describe your survey and let AI build the entire flow for you</PickCardDesc>
              </PickCardContent>
            </PickCard>
          </PickContainer>
        )}

        {/* ============ MANUAL MODE ============ */}
        {!isGenerating && mode === 'manual' && (
          <FormContainer
            key="manual"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            <FormBody onSubmit={manualForm.handleSubmit(onManualSubmit)} noValidate>
              <Input
                label="Survey Title"
                placeholder="e.g. Wellness Onboarding"
                error={manualForm.formState.errors.title?.message}
                autoFocus
                {...manualForm.register('title')}
              />
              <Input
                label="Description (optional)"
                placeholder="Brief description of this funnel"
                error={manualForm.formState.errors.description?.message}
                {...manualForm.register('description')}
              />
              <Footer>
                <Button variant="secondary" type="button" onClick={() => setMode('pick')}>
                  Back
                </Button>
                <Button type="submit" disabled={isPending}>
                  {isPending ? 'Creating...' : 'Create Survey'}
                </Button>
              </Footer>
            </FormBody>
          </FormContainer>
        )}

        {/* ============ AI MODE ============ */}
        {!isGenerating && mode === 'ai' && (
          <FormContainer
            key="ai"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            <FormBody onSubmit={aiForm.handleSubmit(onAiSubmit)} noValidate>
              <AiPromptGroup>
                <AiLabel>Describe your survey</AiLabel>
                <AiTextarea
                  placeholder="e.g. Create a wellness onboarding survey that asks about fitness goals, dietary preferences, sleep habits, and stress levels. Include personalized offer recommendations based on answers."
                  rows={5}
                  {...aiForm.register('prompt')}
                />
                {aiForm.formState.errors.prompt && (
                  <AiError>{aiForm.formState.errors.prompt.message}</AiError>
                )}
                <AiHint>Be as detailed as possible — the more context you give, the better the result.</AiHint>
              </AiPromptGroup>
              <Footer>
                <Button variant="secondary" type="button" onClick={() => setMode('pick')}>
                  Back
                </Button>
                <Button type="submit" icon={<Sparkles size={16} />}>
                  Generate Survey
                </Button>
              </Footer>
            </FormBody>
          </FormContainer>
        )}
      </AnimatePresence>
    </Modal>
  )
}

// ==================== STYLED COMPONENTS ====================

const FormBody = styled.form`
  display: flex;
  flex-direction: column;
  gap: 20px;
`

const Footer = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 8px;
`

const FormContainer = styled(motion.div)``

// --- Pick mode ---

const PickContainer = styled(motion.div)`
  display: flex;
  flex-direction: column;
  gap: 12px;
`

const PickCard = styled(motion.div)`
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px;
  border-radius: ${({ theme }) => theme.radii.lg};
  border: 1px solid ${({ theme }) => theme.colors.border};
  cursor: pointer;
  transition: border-color ${({ theme }) => theme.transitions.fast},
    box-shadow ${({ theme }) => theme.transitions.fast};

  &:hover {
    border-color: ${({ theme }) => theme.colors.borderFocus};
    box-shadow: 0 0 0 1px ${({ theme }) => theme.colors.borderFocus};
  }
`

const PickIconWrap = styled.div<{ $color: string }>`
  width: 48px;
  height: 48px;
  border-radius: ${({ theme }) => theme.radii.md};
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${({ $color }) => $color}18;
  color: ${({ $color }) => $color};
  flex-shrink: 0;
`

const PickCardContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`

const PickCardTitle = styled.span`
  font-size: ${({ theme }) => theme.typography.sizes.md};
  font-weight: ${({ theme }) => theme.typography.weights.semibold};
  color: ${({ theme }) => theme.colors.textPrimary};
  display: flex;
  align-items: center;
  gap: 8px;
`

const PickCardDesc = styled.span`
  font-size: ${({ theme }) => theme.typography.sizes.sm};
  color: ${({ theme }) => theme.colors.textSecondary};
  line-height: ${({ theme }) => theme.typography.lineHeights.normal};
`

// --- AI Form ---

const AiPromptGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`

const AiLabel = styled.label`
  font-size: ${({ theme }) => theme.typography.sizes.sm};
  font-weight: ${({ theme }) => theme.typography.weights.medium};
  color: ${({ theme }) => theme.colors.textPrimary};
`

const AiTextarea = styled.textarea`
  width: 100%;
  padding: 12px;
  border-radius: ${({ theme }) => theme.radii.md};
  border: 1px solid ${({ theme }) => theme.colors.border};
  background: ${({ theme }) => theme.colors.bgElevated};
  color: ${({ theme }) => theme.colors.textPrimary};
  font-family: ${({ theme }) => theme.typography.fontFamily};
  font-size: ${({ theme }) => theme.typography.sizes.sm};
  line-height: ${({ theme }) => theme.typography.lineHeights.normal};
  resize: vertical;
  outline: none;
  transition: border-color ${({ theme }) => theme.transitions.fast};
  box-sizing: border-box;

  &:focus {
    border-color: ${({ theme }) => theme.colors.borderFocus};
    box-shadow: 0 0 0 2px ${({ theme }) => theme.colors.accentLight};
  }

  &::placeholder {
    color: ${({ theme }) => theme.colors.textTertiary};
  }
`

const AiHint = styled.span`
  font-size: ${({ theme }) => theme.typography.sizes.xs};
  color: ${({ theme }) => theme.colors.textTertiary};
`

const AiError = styled.span`
  font-size: ${({ theme }) => theme.typography.sizes.xs};
  color: ${({ theme }) => theme.colors.error};
`

// --- Generating state ---

const GeneratingContainer = styled(motion.div)`
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 40px 24px 32px;
  gap: 24px;
`

const orbGlow = keyframes`
  0%, 100% { box-shadow: 0 0 30px 10px rgba(99, 102, 241, 0.3), 0 0 60px 20px rgba(99, 102, 241, 0.1); }
  50% { box-shadow: 0 0 50px 15px rgba(99, 102, 241, 0.5), 0 0 80px 30px rgba(99, 102, 241, 0.2); }
`

const orbRotate = keyframes`
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
`

const orbColorShift = keyframes`
  0% { background: linear-gradient(135deg, #6366f1, #818cf8); }
  25% { background: linear-gradient(135deg, #818cf8, #a78bfa); }
  50% { background: linear-gradient(135deg, #a78bfa, #f59e0b); }
  75% { background: linear-gradient(135deg, #f59e0b, #6366f1); }
  100% { background: linear-gradient(135deg, #6366f1, #818cf8); }
`

const pulseExpand = keyframes`
  0% { transform: scale(1); opacity: 0.6; }
  100% { transform: scale(2.5); opacity: 0; }
`

const OrbWrapper = styled.div`
  position: relative;
  width: 100px;
  height: 100px;
  display: flex;
  align-items: center;
  justify-content: center;
`

const OrbOuter = styled.div`
  width: 72px;
  height: 72px;
  border-radius: 50%;
  animation: ${orbGlow} 3s ease-in-out infinite, ${orbRotate} 12s linear infinite;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  z-index: 2;

  &::before {
    content: '';
    position: absolute;
    inset: -3px;
    border-radius: 50%;
    border: 2px solid transparent;
    border-top-color: rgba(255, 255, 255, 0.5);
    border-right-color: rgba(255, 255, 255, 0.2);
    animation: ${orbRotate} 3s linear infinite;
  }
`

const OrbInner = styled.div`
  width: 64px;
  height: 64px;
  border-radius: 50%;
  animation: ${orbColorShift} 8s ease-in-out infinite;
  background: linear-gradient(135deg, #6366f1, #818cf8);
`

const particleOrbit = (index: number, total: number) => {
  const angle = (360 / total) * index
  return keyframes`
    0% { transform: rotate(${angle}deg) translateX(44px) rotate(-${angle}deg) scale(1); opacity: 0.8; }
    50% { transform: rotate(${angle + 180}deg) translateX(48px) rotate(-${angle + 180}deg) scale(1.3); opacity: 0.4; }
    100% { transform: rotate(${angle + 360}deg) translateX(44px) rotate(-${angle + 360}deg) scale(1); opacity: 0.8; }
  `
}

const Particle = styled.div<{ $index: number; $total: number }>`
  position: absolute;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: ${({ theme }) => theme.colors.accent};
  top: 50%;
  left: 50%;
  margin: -3px 0 0 -3px;
  animation: ${({ $index, $total }) => particleOrbit($index, $total)} ${({ $index }) => 4 + $index * 0.3}s linear infinite;
  z-index: 1;
`

const PulseRing = styled.div<{ $delay: number }>`
  position: absolute;
  width: 64px;
  height: 64px;
  border-radius: 50%;
  border: 2px solid ${({ theme }) => theme.colors.accent};
  top: 50%;
  left: 50%;
  margin: -32px 0 0 -32px;
  animation: ${pulseExpand} 3s ease-out infinite;
  animation-delay: ${({ $delay }) => $delay}s;
  z-index: 0;
`

const PhaseLabel = styled(motion.p)`
  font-size: ${({ theme }) => theme.typography.sizes.lg};
  font-weight: ${({ theme }) => theme.typography.weights.semibold};
  color: ${({ theme }) => theme.colors.textPrimary};
  text-align: center;
  margin: 0;
`

const ProgressTrack = styled.div`
  width: 100%;
  max-width: 320px;
  height: 4px;
  border-radius: ${({ theme }) => theme.radii.full};
  background: ${({ theme }) => theme.colors.bgElevated};
  overflow: hidden;
`

const progressShimmer = keyframes`
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
`

const ProgressFill = styled(motion.div)`
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(
    90deg,
    ${({ theme }) => theme.colors.accent} 0%,
    ${({ theme }) => theme.colors.accentHover} 40%,
    #a78bfa 60%,
    ${({ theme }) => theme.colors.accent} 100%
  );
  background-size: 200% 100%;
  animation: ${progressShimmer} 2s linear infinite;
`

const Quote = styled(motion.p)`
  font-size: ${({ theme }) => theme.typography.sizes.sm};
  color: ${({ theme }) => theme.colors.textTertiary};
  text-align: center;
  font-style: italic;
  max-width: 360px;
  line-height: ${({ theme }) => theme.typography.lineHeights.normal};
  margin: 0;
  min-height: 40px;
`

const HintText = styled.p`
  font-size: ${({ theme }) => theme.typography.sizes.xs};
  color: ${({ theme }) => theme.colors.textTertiary};
  margin: 0;
`
