import { useState, useCallback, useEffect, useRef } from 'react'
import styled from 'styled-components'
import { motion, AnimatePresence } from 'framer-motion'
import {
  SurveyPageGlobal,
  PageShell,
  TopBar,
  BrandCenter,
  BackBtn,
  ProgressTrack,
  ProgressFill,
  ContentArea,
  SurveyCard,
} from '@features/survey-client/SurveyLayout'
import { useParams, useNavigate } from '@tanstack/react-router'
import { ArrowLeft, CheckCircle2 } from 'lucide-react'
import { RoutlyLogo } from '@shared/ui/RoutlyLogo'
import { NodeType, AnswerType, ValueKind } from '@shared/types/dag.types'
import type { QuestionNodeData, InfoNodeData, OfferNodeData } from '@shared/types/dag.types'
import type { SessionCurrentNode, SessionNodeOffer } from '@shared/types/api.types'
import {
  useStartSession,
  useSubmitAnswer,
  useGoBack,
  useRecordConversion,
} from '@features/quiz/hooks/useQuiz'
import { QuestionStep } from '@features/survey-client/components/QuestionStep'
import { InfoStep } from '@features/survey-client/components/InfoStep'
import { OfferStep } from '@features/survey-client/components/OfferStep'
import { RedirectStep } from '@features/survey-client/components/RedirectStep'
import { LeadCaptureStep } from '@features/survey-client/components/LeadCaptureStep'
import { Button } from '@shared/ui/Button'
import { Spinner } from '@shared/ui/Spinner'

// ─── Card animation variants ──────────────────────────────────────────────────

const cardVariants = {
  enter: { opacity: 0, x: 40 },
  center: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -40 },
}

// ─── Adapter: SessionCurrentNode → step component data ───────────────────────

function sessionNodeToQuestion(node: SessionCurrentNode): QuestionNodeData & { mediaUrl?: string | null } {
  // answerType may come as a top-level field OR embedded in description JSON
  let answerType: AnswerType = node.answerType ?? AnswerType.SingleChoice
  let min: number | undefined = node.sliderMin
  let max: number | undefined = node.sliderMax

  if (!node.answerType && node.description) {
    try {
      const parsed = JSON.parse(node.description)
      if (parsed.answerType) answerType = parsed.answerType as AnswerType
      if (parsed.min != null) min = parsed.min
      if (parsed.max != null) max = parsed.max
    } catch {
      // description is plain text, not JSON — ignore
    }
  }

  return {
    type: NodeType.Question,
    title: node.title ?? '',
    attributeKey: node.attributeKey ?? 'goal',
    answerType,
    valueKind: ValueKind.Text,
    options: (node.options ?? []).map((o) => ({
      id: o.id,
      label: o.label,
      value: o.value,
      scoreDelta: 0,
    })),
    mediaUrl: node.mediaUrl ?? undefined,
    min,
    max,
  }
}

function sessionNodeToInfo(node: SessionCurrentNode): InfoNodeData {
  return {
    type: NodeType.Info,
    title: node.title ?? '',
    body: node.description ?? '',
    mediaUrl: node.mediaUrl ?? undefined,
  }
}

function sessionNodeToOffer(
  node: SessionCurrentNode,
  offers: SessionNodeOffer[]
): OfferNodeData & { offers: SessionNodeOffer[] } {
  const primary = offers.find((o) => o.isPrimary) ?? offers[0]

  // ctaText may be stored as JSON inside node.mediaUrl
  let ctaText = primary?.ctaText ?? 'Get Started'
  if (node.mediaUrl) {
    try {
      const parsed = JSON.parse(node.mediaUrl)
      if (parsed.ctaText) ctaText = parsed.ctaText
    } catch {
      // not JSON — ignore
    }
  }

  return {
    type: NodeType.Offer,
    name: primary?.name ?? 'Special Offer',
    headline: node.title ?? (primary?.name ?? 'Special Offer'),
    body: primary?.body ?? node.description ?? '',
    ctaText,
    ctaUrl: primary?.ctaUrl ?? undefined,
    calendarUrl: primary?.calendarUrl ?? undefined,
    imageUrl: primary?.imageUrl ?? undefined,
    offers,
  }
}

// ─── Component ────────────────────────────────────────────────────────────────

type PageState = 'loading' | 'survey' | 'completed' | 'error'

/** Estimate progress as 0-95 %, capped until the session completes. */
function calculateProgress(stepCount: number): number {
  return Math.min(Math.round((stepCount / Math.max(stepCount + 2, 5)) * 100), 95)
}

export function SurveyPage() {
  const navigate = useNavigate()
  const params = useParams({ strict: false }) as { surveyId?: string }
  const surveyId = params.surveyId ?? ''

  // ─── API hooks ────────────────────────────────────────────────────────────
  const { mutateAsync: startSession } = useStartSession()
  const { mutateAsync: submitAnswer } = useSubmitAnswer()
  const { mutateAsync: goBackApi } = useGoBack()
  const { mutateAsync: recordConversion } = useRecordConversion()

  // ─── State ────────────────────────────────────────────────────────────────
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [currentNode, setCurrentNode] = useState<SessionCurrentNode | null>(null)
  const [progressPct, setProgressPct] = useState(0)
  const [pageState, setPageState] = useState<PageState>('loading')
  const [direction, setDirection] = useState<1 | -1>(1)
  const [stepCount, setStepCount] = useState(0)
  const [canGoBack, setCanGoBack] = useState(false)
  const [flowName, setFlowName] = useState<string>('')

  // ─── Start session once surveyId is available ─────────────────────────────
  const hasStartedRef = useRef(false)
  useEffect(() => {
    if (!surveyId) {
      setPageState('error')
      return
    }
    // Guard against React strict-mode double invocation
    if (hasStartedRef.current) return
    hasStartedRef.current = true
    

    startSession({ flowId: surveyId })
      .then((resp) => {
        setSessionId(resp.sessionId)
        setCurrentNode(resp.currentNode)
        setFlowName(resp.flowId)
        setProgressPct(0)
        setStepCount(0)
        setPageState(resp.status === 'Completed' ? 'completed' : 'survey')
        setCanGoBack(false)
      })
      .catch(() => setPageState('error'))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [surveyId])

  // ─── Answer handler ────────────────────────────────────────────────────────

  const handleAnswer = useCallback(
    async (value: string | string[]) => {
      if (!sessionId || !currentNode) return
      try {
        const resp = await submitAnswer({
          sessionId,
          data: {
            nodeId: currentNode.id,
            value: Array.isArray(value) ? value.join(',') : value,
          },
        })
        const newStepCount = stepCount + 1
        setDirection(1)
        setCurrentNode(resp.currentNode)
        setStepCount(newStepCount)
        setCanGoBack(true)

        if (resp.status === 'Completed') {
          setProgressPct(100)
          setPageState('completed')
        } else {
          // Estimate progress: cap at 95% until completed
          setProgressPct(calculateProgress(newStepCount))
        }
      } catch {
        // Non-fatal: keep the current node displayed
      }
    },
    [sessionId, currentNode, submitAnswer, stepCount]
  )

  // ─── Info continue ─────────────────────────────────────────────────────────

  const handleInfoContinue = useCallback(async () => {
    if (!sessionId || !currentNode) return
    try {
      const resp = await submitAnswer({
        sessionId,
        data: { nodeId: currentNode.id, value: '' },
      })
      const newStepCount = stepCount + 1
      setDirection(1)
      setCurrentNode(resp.currentNode)
      setStepCount(newStepCount)
      setCanGoBack(true)

      if (resp.status === 'Completed') {
        setProgressPct(100)
        setPageState('completed')
      } else {
        setProgressPct(calculateProgress(newStepCount))
      }
    } catch {
      // Non-fatal
    }
  }, [sessionId, currentNode, submitAnswer, stepCount])

  // ─── Go back ───────────────────────────────────────────────────────────────

  const handleGoBack = useCallback(async () => {
    if (!sessionId || !canGoBack) return
    try {
      const resp = await goBackApi(sessionId)
      const newStepCount = Math.max(stepCount - 1, 0)
      setDirection(-1)
      setCurrentNode(resp.currentNode)
      setStepCount(newStepCount)
      setCanGoBack(newStepCount > 0)
      setProgressPct(
        newStepCount === 0
          ? 0
          : calculateProgress(newStepCount)
      )
      if (pageState === 'completed') {
        setPageState('survey')
      }
    } catch {
      // Non-fatal
    }
  }, [sessionId, canGoBack, goBackApi, stepCount, pageState])

  // ─── Offer accept ──────────────────────────────────────────────────────────

  const handleOfferAccept = useCallback(
    async (offerId?: string, ctaUrl?: string) => {
      if (sessionId && offerId) {
        try {
          await recordConversion({ sessionId, data: { offerId } })
        } catch {
          // Non-fatal: complete even if conversion recording fails
        }
      }
      if (ctaUrl) {
        window.open(ctaUrl, '_blank', 'noopener,noreferrer')
      }
      setPageState('completed')
    },
    [sessionId, recordConversion]
  )

  // ─── Lead capture submit ───────────────────────────────────────────────────

  const handleLeadCapture = useCallback(
    async (values: Record<string, string>) => {
      if (!sessionId || !currentNode) return
      try {
        const resp = await submitAnswer({
          sessionId,
          data: { nodeId: currentNode.id, value: '', leadFields: values },
        })
        const newStepCount = stepCount + 1
        setDirection(1)
        setCurrentNode(resp.currentNode)
        setStepCount(newStepCount)
        setCanGoBack(true)
        if (resp.status === 'Completed') {
          setProgressPct(100)
          setPageState('completed')
        } else {
          setProgressPct(calculateProgress(newStepCount))
        }
      } catch {
        // Non-fatal
      }
    },
    [sessionId, currentNode, submitAnswer, stepCount]
  )

  // ─── Loading / error / empty states ───────────────────────────────────────

  if (pageState === 'loading') {
    return (
      <PageShell>
        <SurveyPageGlobal />
        <CenterBlock>
          <Spinner size={32} />
        </CenterBlock>
      </PageShell>
    )
  }

  if (pageState === 'error') {
    return (
      <PageShell>
        <SurveyPageGlobal />
        <CenterBlock>
          <BigEmoji>🔍</BigEmoji>
          <StateTitle>Survey not found</StateTitle>
          <StateBody>
            This survey does not exist or is not available. Please check the
            link and try again.
          </StateBody>
          <Button variant="secondary" onClick={() => navigate({ to: '/dashboard' })}>
            Back to dashboard
          </Button>
        </CenterBlock>
      </PageShell>
    )
  }

  if (!currentNode) {
    return (
      <PageShell>
        <SurveyPageGlobal />
        <CenterBlock>
          <Spinner size={32} />
        </CenterBlock>
      </PageShell>
    )
  }

  // ─── Determine if we should show the offer / completion screen ─────────
  const isOffer = currentNode.type === 'Offer' && pageState === 'completed'
  const isRedirect = currentNode.type === 'Redirect'
  const showCompletionOnly = pageState === 'completed' && currentNode.type !== 'Offer' && currentNode.type !== 'Redirect'

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <PageShell>
      <SurveyPageGlobal />

      {/* ─── Top bar ─────────────────────────────────────────────────── */}
      <TopBar>
        <BackBtn
          aria-label="Go back"
          disabled={!canGoBack || pageState === 'completed'}
          onClick={handleGoBack}
        >
          <ArrowLeft size={18} />
        </BackBtn>
        <BrandCenter>
          <RoutlyLogo size="sm" glow />
        </BrandCenter>
        {/* spacer balances the back button so brand stays centered */}
        <div style={{ width: 32, flexShrink: 0 }} />
      </TopBar>

      {/* ─── Progress bar ────────────────────────────────────────────── */}
      <ProgressTrack>
        <ProgressFill
          animate={{ width: `${pageState === 'completed' ? 100 : progressPct}%` }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          style={{ width: 0 }}
        />
      </ProgressTrack>

      {/* ─── Content ─────────────────────────────────────────────────── */}
      <ContentArea>
        <AnimatePresence mode="wait" initial={false}>
          {showCompletionOnly ? (
            <SurveyCard
              key="completion"
              variants={cardVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.3, ease: 'easeInOut' }}
              custom={direction}
            >
              <CompletionWrapper
                initial={{ opacity: 0, scale: 0.92 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.35 }}
              >
                <CompletionIcon
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.1, type: 'spring', stiffness: 260, damping: 18 }}
                >
                  <CheckCircle2 size={64} />
                </CompletionIcon>
                <CompletionTitle>All done! 🎉</CompletionTitle>
                <CompletionBody>
                  Thank you for completing the survey. Your personalised
                  recommendations have been saved — good luck on your wellness journey!
                </CompletionBody>
              </CompletionWrapper>
            </SurveyCard>
          ) : (
            <SurveyCard
              key={currentNode.id}
              custom={direction}
              variants={cardVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.25, ease: 'easeInOut' }}
            >
              {currentNode.type === 'Question' && (
                <QuestionStep
                  data={sessionNodeToQuestion(currentNode)}
                  onAnswer={handleAnswer}
                />
              )}

              {currentNode.type === 'InfoPage' && (
                <InfoStep
                  data={sessionNodeToInfo(currentNode)}
                  onContinue={handleInfoContinue}
                />
              )}

              {currentNode.type === 'Offer' && (
                <OfferStep
                  data={sessionNodeToOffer(currentNode, currentNode.offers ?? [])}
                  onAccept={() => {
                    const primary = (currentNode.offers ?? []).find((o) => o.isPrimary) ?? (currentNode.offers ?? [])[0]
                    // Prefer calendar URL when a booking integration is configured
                    const url = primary?.calendarUrl ?? primary?.ctaUrl ?? undefined
                    handleOfferAccept(primary?.id, url)
                  }}
                />
              )}

              {isRedirect && currentNode.redirect && (
                <RedirectStep
                  title={currentNode.title ?? ''}
                  description={currentNode.description ?? undefined}
                  redirect={currentNode.redirect}
                />
              )}

              {currentNode.type === 'LeadCapture' && currentNode.leadCapture && (
                <LeadCaptureStep
                  title={currentNode.title ?? ''}
                  leadCapture={currentNode.leadCapture}
                  onSubmit={handleLeadCapture}
                  onSkip={!currentNode.leadCapture.isRequired ? handleInfoContinue : undefined}
                />
              )}
            </SurveyCard>
          )}
        </AnimatePresence>
      </ContentArea>
    </PageShell>
  )
}



// ─── Error / Not-found states ─────────────────────────────────────────────────

const CenterBlock = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  padding: 48px 24px;
  text-align: center;

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    padding: 32px 16px;
    gap: 12px;
  }
`

const BigEmoji = styled.div`
  font-size: 56px;
`

const StateTitle = styled.h1`
  font-size: ${({ theme }) => theme.typography.sizes.xl};
  font-weight: ${({ theme }) => theme.typography.weights.bold};
  color: ${({ theme }) => theme.colors.textPrimary};
`

const StateBody = styled.p`
  font-size: ${({ theme }) => theme.typography.sizes.md};
  color: ${({ theme }) => theme.colors.textSecondary};
  max-width: 360px;
`

// ─── Completion screen ────────────────────────────────────────────────────────

const CompletionWrapper = styled(motion.div)`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
  text-align: center;
  padding: 16px 0;
`

const CompletionIcon = styled(motion.div)`
  color: ${({ theme }) => theme.colors.success};

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    svg {
      width: 48px;
      height: 48px;
    }
  }
`

const CompletionTitle = styled.h2`
  font-size: ${({ theme }) => theme.typography.sizes.xxl};
  font-weight: ${({ theme }) => theme.typography.weights.bold};
  color: ${({ theme }) => theme.colors.textPrimary};

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    font-size: ${({ theme }) => theme.typography.sizes.xl};
  }
`

const CompletionBody = styled.p`
  font-size: ${({ theme }) => theme.typography.sizes.md};
  color: ${({ theme }) => theme.colors.textSecondary};
  max-width: 400px;
  line-height: ${({ theme }) => theme.typography.lineHeights.relaxed};
`