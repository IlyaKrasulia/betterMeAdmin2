import React, { useState, useEffect, useRef } from 'react'
import styled from 'styled-components'
import { motion, AnimatePresence, useInView } from 'framer-motion'
import { Calendar, CheckCircle, XCircle, Zap, RotateCcw, ChevronRight } from 'lucide-react'
import { C, FONT } from '../constants'

// ─── Fake bookings for "Before" panel ────────────────────────────────────────
const FAKE_BOOKINGS = [
  { id: 1, name: 'James P.',  time: '9:00 AM',  tag: 'No-show',     color: C.error },
  { id: 2, name: 'Emily K.',  time: '10:30 AM', tag: 'Unqualified', color: C.warning },
  { id: 3, name: 'Robert M.', time: '11:00 AM', tag: 'No-show',     color: C.error },
  { id: 4, name: 'Anna S.',   time: '2:00 PM',  tag: 'Cancelled',   color: C.textMuted },
  { id: 5, name: 'David L.',  time: '3:30 PM',  tag: 'Unqualified', color: C.warning },
  { id: 6, name: 'Mia C.',    time: '4:30 PM',  tag: 'No-show',     color: C.error },
]

// ─── Questions ────────────────────────────────────────────────────────────────
const QUESTIONS = [
  {
    text: "What's your company size?",
    options: [
      { label: 'Solo / Freelancer', score: 0 },
      { label: '2 – 10 people',     score: 1 },
      { label: '11 – 50 people',    score: 2 },
      { label: '50+ people',        score: 3 },
    ],
  },
  {
    text: 'Monthly software budget?',
    options: [
      { label: 'Under $500',    score: 0 },
      { label: '$500 – $2,000', score: 1 },
      { label: '$2,000+',       score: 2 },
    ],
  },
  {
    text: 'Are you the decision-maker?',
    options: [
      { label: 'Yes, I decide',         score: 2 },
      { label: 'I influence decisions',  score: 1 },
      { label: 'No, someone else',       score: 0 },
    ],
  },
]

type FlowStep = 'idle' | 'q0' | 'q1' | 'q2' | 'result'

// ─── Styled components — NO keyframes imports, use lp-* names ─────────────────
const Wrapper = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0;
  border-radius: 20px;
  overflow: hidden;
  border: 1px solid ${C.border};
  background: ${C.surface};
  box-shadow: 0 32px 80px rgba(0,0,0,0.6), 0 0 0 1px ${C.border};
  font-family: ${FONT};

  @media (max-width: 640px) {
    grid-template-columns: 1fr;
  }
`

const Panel = styled.div<{ variant?: 'after' }>`
  padding: 20px;
  background: ${({ variant }) => variant === 'after' ? C.elevated : C.surface};
  display: flex;
  flex-direction: column;
  gap: 14px;
  min-height: 320px;
  border-right: ${({ variant }) => variant ? 'none' : `1px solid ${C.border}`};

  @media (max-width: 640px) {
    border-right: none;
    border-bottom: ${({ variant }) => variant ? 'none' : `1px solid ${C.border}`};
    min-height: 260px;
    padding: 16px;
  }
`

const PanelHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`

const PanelTag = styled.div<{ variant: 'before' | 'after' }>`
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 1.2px;
  padding: 3px 8px;
  border-radius: 4px;
  background: ${({ variant }) => variant === 'before' ? 'rgba(239,68,68,0.15)' : 'rgba(34,197,94,0.15)'};
  color: ${({ variant }) => variant === 'before' ? C.error : C.success};
  border: 1px solid ${({ variant }) => variant === 'before' ? 'rgba(239,68,68,0.3)' : 'rgba(34,197,94,0.3)'};
`

const PanelTitle = styled.span`
  font-size: 13px;
  font-weight: 600;
  color: ${C.textSecondary};
  display: flex;
  align-items: center;
  gap: 6px;
`

const BookingList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  height: 220px;
  overflow-y: auto;
  overflow-x: hidden;
  scrollbar-width: thin;
  scrollbar-color: ${C.border} transparent;
  &::-webkit-scrollbar { width: 4px; }
  &::-webkit-scrollbar-track { background: transparent; }
  &::-webkit-scrollbar-thumb { background: ${C.border}; border-radius: 2px; }

  @media (max-width: 640px) { height: 200px; }
`

/* Use lp-slideIn animation name — defined in LandingKeyframes global style */
const BookingItemWrap = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 12px;
  border-radius: 8px;
  background: rgba(255,255,255,0.03);
  border: 1px solid ${C.border};
  animation: lp-slideIn 0.3s ease forwards;
`

const BookingMeta = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
`

const BookingName = styled.span`
  font-size: 13px;
  font-weight: 600;
  color: ${C.textPrimary};
`

const BookingTime = styled.span`
  font-size: 11px;
  color: ${C.textMuted};
`

const BookingTag = styled.span<{ color: string }>`
  font-size: 10px;
  font-weight: 600;
  padding: 2px 7px;
  border-radius: 4px;
  color: ${({ color }) => color};
  background: ${({ color }) => `${color}18`};
  border: 1px solid ${({ color }) => `${color}40`};
`

/* lp-pulse from global */
const WastedBadge = styled.div`
  font-size: 11px;
  color: ${C.textMuted};
  text-align: center;
  padding-top: 4px;
  animation: lp-pulse 2s ease infinite;
`

const IdleBox = styled(motion.button)`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex: 1;
  gap: 12px;
  border: 1.5px dashed ${C.border};
  border-radius: 12px;
  background: transparent;
  cursor: pointer;
  padding: 24px;
  transition: border-color 0.2s, background 0.2s;
  &:hover {
    border-color: ${C.accentLight};
    background: rgba(99,102,241,0.05);
  }
`

const IdleLabel = styled.span`
  font-size: 14px;
  font-weight: 600;
  color: ${C.accentLight};
  display: flex;
  align-items: center;
  gap: 6px;
`

const IdleSub = styled.span`
  font-size: 12px;
  color: ${C.textMuted};
  text-align: center;
  line-height: 1.5;
`

const StepDots = styled.div`
  display: flex;
  gap: 6px;
  align-items: center;
  margin-bottom: 4px;
`

const StepDot = styled.div<{ active: boolean }>`
  width: ${({ active }) => active ? '20px' : '6px'};
  height: 6px;
  border-radius: 3px;
  background: ${({ active }) => active ? C.accent : C.textMuted};
  transition: all 0.3s ease;
`

const QuestionText = styled.p`
  font-size: 15px;
  font-weight: 600;
  color: ${C.textPrimary};
  margin: 0;
  line-height: 1.4;
`

const OptionsList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`

const OptionBtn = styled(motion.button)`
  width: 100%;
  text-align: left;
  padding: 10px 14px;
  border-radius: 8px;
  border: 1px solid ${C.border};
  background: transparent;
  color: ${C.textPrimary};
  font-family: ${FONT};
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: space-between;
  transition: border-color 0.2s, background 0.2s;
  &:hover {
    border-color: ${C.accentLight};
    background: rgba(99,102,241,0.08);
    color: ${C.accentText};
  }
`

const ResultBox = styled(motion.div)<{ qualified: boolean }>`
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 10px;
  padding: 20px;
  border-radius: 12px;
  background: ${({ qualified }) => qualified ? 'rgba(34,197,94,0.08)' : 'rgba(245,158,11,0.08)'};
  border: 1px solid ${({ qualified }) => qualified ? 'rgba(34,197,94,0.25)' : 'rgba(245,158,11,0.25)'};
  flex: 1;
  justify-content: center;
`

const ResultTitle = styled.div<{ qualified?: boolean }>`
  font-size: 15px;
  font-weight: 700;
  color: ${({ qualified }) => qualified ? C.success : C.warning};
`

const ResultSub = styled.div`
  font-size: 12px;
  color: ${C.textSecondary};
  line-height: 1.5;
`

const ResultCTA = styled(motion.button)<{ qualified?: boolean }>`
  padding: 8px 18px;
  border-radius: 8px;
  border: none;
  background: ${({ qualified }) => qualified ? C.success : C.warning};
  color: #000;
  font-family: ${FONT};
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
`

const ResetBtn = styled.button`
  font-size: 11px;
  color: ${C.textMuted};
  background: transparent;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 4px;
  font-family: ${FONT};
  transition: color 0.2s;
  &:hover { color: ${C.textSecondary}; }
`

// ─── Component ────────────────────────────────────────────────────────────────
export function InteractiveDemo() {
  const [visibleCount, setVisibleCount] = useState(0)
  const [step, setStep] = useState<FlowStep>('idle')
  const [score, setScore] = useState(0)

  const wrapRef = useRef<HTMLDivElement>(null)
  const inView = useInView(wrapRef, { once: true, margin: '-80px' })

  // Start animation exactly once when scrolled into view
  useEffect(() => {
    if (!inView) return
    if (visibleCount > 0) return // already started

    let count = 0
    const interval = setInterval(() => {
      count += 1
      setVisibleCount(count)
      if (count >= FAKE_BOOKINGS.length) clearInterval(interval)
    }, 900)
    return () => clearInterval(interval)
  }, [inView])

  const handleAnswer = (optScore: number) => {
    const next = score + optScore
    setScore(next)
    setStep(s => s === 'q0' ? 'q1' : s === 'q1' ? 'q2' : 'result')
  }

  const reset = () => { setStep('idle'); setScore(0) }

  const qIndex = step === 'q0' ? 0 : step === 'q1' ? 1 : step === 'q2' ? 2 : -1
  const qualified = score >= 4

  return (
    <Wrapper ref={wrapRef}>
      {/* ── BEFORE ── */}
      <Panel>
        <PanelHeader>
          <PanelTag variant="before">BEFORE</PanelTag>
          <PanelTitle><Calendar size={12} /> Open Calendly</PanelTitle>
        </PanelHeader>

        <BookingList>
          <AnimatePresence>
            {FAKE_BOOKINGS.slice(0, visibleCount).map(b => (
              <motion.div
                key={b.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.35 }}
              >
                <BookingItemWrap>
                  <BookingMeta>
                    <BookingName>{b.name}</BookingName>
                    <BookingTime>{b.time}</BookingTime>
                  </BookingMeta>
                  <BookingTag color={b.color}>{b.tag}</BookingTag>
                </BookingItemWrap>
              </motion.div>
            ))}
          </AnimatePresence>
        </BookingList>

        {visibleCount > 0 && (
          <WastedBadge>~{visibleCount * 45} min wasted this week</WastedBadge>
        )}
      </Panel>

      {/* ── AFTER ── */}
      <Panel variant="after">
        <PanelHeader>
          <PanelTag variant="after">AFTER</PanelTag>
          <PanelTitle><Zap size={12} /> Qualify first</PanelTitle>
        </PanelHeader>

        <AnimatePresence mode="wait">
          {step === 'idle' && (
            <IdleBox
              key="idle"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setStep('q0')}
            >
              <Zap size={22} color={C.accentLight} />
              <IdleLabel>Try it live <ChevronRight size={14} /></IdleLabel>
              <IdleSub>Click to experience a real<br />qualification flow</IdleSub>
            </IdleBox>
          )}

          {qIndex >= 0 && (
            <motion.div
              key={step}
              style={{ display: 'flex', flexDirection: 'column', gap: 14, flex: 1 }}
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -16 }}
              transition={{ duration: 0.25 }}
            >
              <StepDots>
                {[0, 1, 2].map(i => <StepDot key={i} active={i <= qIndex} />)}
                <span style={{ fontSize: 11, color: C.textMuted, marginLeft: 4 }}>
                  {qIndex + 1} / 3
                </span>
              </StepDots>
              <QuestionText>{QUESTIONS[qIndex].text}</QuestionText>
              <OptionsList>
                {QUESTIONS[qIndex].options.map((opt, i) => (
                  <OptionBtn
                    key={i}
                    onClick={() => handleAnswer(opt.score)}
                    whileHover={{ x: 2 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {opt.label}
                    <ChevronRight size={13} style={{ opacity: 0.4 }} />
                  </OptionBtn>
                ))}
              </OptionsList>
            </motion.div>
          )}

          {step === 'result' && (
            <motion.div
              key="result"
              style={{ display: 'flex', flexDirection: 'column', gap: 12, flex: 1 }}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <ResultBox qualified={qualified}>
                {qualified
                  ? <CheckCircle size={28} color={C.success} />
                  : <XCircle size={28} color={C.warning} />}
                <ResultTitle qualified={qualified}>
                  {qualified ? "You're a great fit!" : 'Not quite yet.'}
                </ResultTitle>
                <ResultSub>
                  {qualified
                    ? "Here's your direct booking link. We look forward to speaking!"
                    : "We'll send you resources to help you get started."}
                </ResultSub>
                <ResultCTA
                  qualified={qualified}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                >
                  {qualified ? 'Book Your Demo →' : 'Get Resources →'}
                </ResultCTA>
              </ResultBox>
              <ResetBtn onClick={reset}>
                <RotateCcw size={11} /> try again
              </ResetBtn>
            </motion.div>
          )}
        </AnimatePresence>
      </Panel>
    </Wrapper>
  )
}
