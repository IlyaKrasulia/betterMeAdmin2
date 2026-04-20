import React, { useState, useRef } from 'react'
import styled from 'styled-components'
import { motion, AnimatePresence, useInView } from 'framer-motion'
import { ArrowRight, TrendingDown, Clock, DollarSign, AlertTriangle, Zap, RotateCcw } from 'lucide-react'
import { C, FONT } from '../constants'

// ─── Data ─────────────────────────────────────────────────────────────────────
const WEEKLY_OPTIONS = [
  { label: '5–15',  value: 10,  desc: 'Early-stage hustle' },
  { label: '15–30', value: 22,  desc: 'Growing pipeline' },
  { label: '30–60', value: 45,  desc: 'Active sales motion' },
  { label: '60+',   value: 80,  desc: 'High-volume inbound' },
]

const UNQUAL_OPTIONS = [
  { label: '~20%', value: 0.20, desc: 'We screen well already' },
  { label: '~40%', value: 0.40, desc: 'About half are off-target' },
  { label: '~60%', value: 0.60, desc: 'Most feel like a waste' },
  { label: '~80%', value: 0.80, desc: "It's basically chaos" },
]

const SOURCE_OPTIONS = [
  { label: 'Calendly link',    icon: '📅', desc: 'Anyone can book directly' },
  { label: 'Contact form',     icon: '📝', desc: '"We\'ll get back to you"' },
  { label: 'Direct email',     icon: '📧', desc: 'Cold inbound messages' },
  { label: 'Mix of all these', icon: '🔀', desc: 'Multiple entry points' },
]

const RATE_OPTIONS = [
  { label: 'SDR / BDR',         value: 45,  desc: '$45 / hr' },
  { label: 'Account Executive', value: 75,  desc: '$75 / hr' },
  { label: 'Senior AE / CS',    value: 100, desc: '$100 / hr' },
  { label: 'Founder / VP',      value: 150, desc: '$150 / hr' },
]

const DURATION_OPTIONS = [
  { label: '15 min', value: 0.25, desc: 'Quick screening call' },
  { label: '30 min', value: 0.50, desc: 'Standard intro call' },
  { label: '45 min', value: 0.75, desc: 'Full discovery' },
  { label: '60 min+', value: 1.0, desc: 'Deep-dive demo' },
]

type Step = 1 | 2 | 3 | 4 | 5 | 'result'

interface Answers {
  weekly?: number
  unqual?: number
  source?: string
  rate?: number
  duration?: number
}

// ─── Styled ───────────────────────────────────────────────────────────────────
const Section = styled.section`
  background: ${C.surface};
  padding: 100px 24px;
  font-family: ${FONT};
  position: relative;
  overflow: hidden;
  @media (max-width: 768px) { padding: 72px 16px; }
  &::before {
    content: '';
    position: absolute;
    inset: 0;
    background-image: radial-gradient(rgba(255,255,255,0.02) 1px, transparent 1px);
    background-size: 28px 28px;
    pointer-events: none;
  }
`

const Inner = styled.div`
  max-width: 1100px;
  margin: 0 auto;
  position: relative;
  z-index: 1;
`

const TopLabel = styled.div`
  text-align: center;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 2px;
  color: ${C.accentText};
  text-transform: uppercase;
  margin-bottom: 16px;
`

const Title = styled.h2`
  text-align: center;
  font-size: clamp(28px, 5vw, 48px);
  font-weight: 800;
  letter-spacing: -1.5px;
  color: ${C.textPrimary};
  margin: 0 0 16px;
  @media (max-width: 768px) { br { display: none; } }
`

const Sub = styled.p`
  text-align: center;
  font-size: 16px;
  color: ${C.textSecondary};
  max-width: 520px;
  margin: 0 auto 52px;
  line-height: 1.65;
  @media (max-width: 768px) { font-size: 15px; margin-bottom: 36px; }
`

// ─── Calculator card ──────────────────────────────────────────────────────────
const CalcCard = styled(motion.div)`
  max-width: 720px;
  margin: 0 auto;
  background: ${C.elevated};
  border: 1px solid ${C.border};
  border-radius: 24px;
  overflow: hidden;
`

const CalcHeader = styled.div`
  padding: 24px 32px 0;
  @media (max-width: 480px) { padding: 18px 18px 0; }
`

const ProgressRow = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 20px;
`

const ProgressTrack = styled.div`
  flex: 1;
  height: 4px;
  border-radius: 2px;
  background: ${C.border};
  overflow: hidden;
`

const ProgressFill = styled(motion.div)`
  height: 100%;
  border-radius: 2px;
  background: linear-gradient(90deg, ${C.accent}, ${C.purple});
`

const StepLabel = styled.span`
  font-size: 12px;
  font-weight: 600;
  color: ${C.textMuted};
  white-space: nowrap;
`

const CalcBody = styled.div`
  padding: 0 32px 32px;
  min-height: 280px;
  display: flex;
  flex-direction: column;
  @media (max-width: 480px) { padding: 0 18px 24px; min-height: 240px; }
`

const QuestionTitle = styled.h3`
  font-size: 20px;
  font-weight: 700;
  color: ${C.textPrimary};
  margin: 0 0 6px;
  line-height: 1.3;
  @media (max-width: 480px) { font-size: 17px; }
`

const QuestionSub = styled.p`
  font-size: 13px;
  color: ${C.textMuted};
  margin: 0 0 24px;
  line-height: 1.5;
  @media (max-width: 480px) { font-size: 12px; margin-bottom: 16px; }
`

const OptionsGrid = styled.div<{ cols?: number }>`
  display: grid;
  grid-template-columns: ${({ cols = 4 }) => `repeat(${cols}, 1fr)`};
  gap: 10px;
  @media (max-width: 560px) {
    grid-template-columns: repeat(2, 1fr) !important;
    gap: 8px;
  }
`

const OptionCard = styled(motion.button)<{ selected?: boolean }>`
  padding: 14px 10px;
  border-radius: 12px;
  border: 1.5px solid ${({ selected }) => selected ? C.accent : C.border};
  background: ${({ selected }) => selected ? 'rgba(99,102,241,0.12)' : 'transparent'};
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  transition: border-color 0.2s, background 0.2s;
  box-shadow: ${({ selected }) => selected ? `0 0 16px ${C.accentGlow}` : 'none'};
  &:hover {
    border-color: ${C.accentLight};
    background: rgba(99,102,241,0.06);
  }
  @media (max-width: 480px) { padding: 12px 8px; border-radius: 10px; }
`

const OptionIcon = styled.div`
  font-size: 22px;
  line-height: 1;
  margin-bottom: 2px;
`

const OptionLabel = styled.div<{ selected?: boolean }>`
  font-size: 13px;
  font-weight: 700;
  color: ${({ selected }) => selected ? C.accentText : C.textPrimary};
  font-family: ${FONT};
`

const OptionDesc = styled.div`
  font-size: 10px;
  color: ${C.textMuted};
  text-align: center;
  font-family: ${FONT};
  line-height: 1.3;
`

// ─── Result styles ────────────────────────────────────────────────────────────
const ResultWrap = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
`

const ResultHero = styled.div`
  background: linear-gradient(135deg, rgba(239,68,68,0.1), rgba(245,158,11,0.08));
  border: 1px solid rgba(239,68,68,0.2);
  border-radius: 16px;
  padding: 24px;
  text-align: center;
`

const ResultEyebrow = styled.div`
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 1.5px;
  text-transform: uppercase;
  color: ${C.error};
  margin-bottom: 8px;
`

const ResultBigNumber = styled(motion.div)`
  font-size: clamp(42px, 6vw, 64px);
  font-weight: 900;
  letter-spacing: -2px;
  color: ${C.error};
  line-height: 1;
  margin-bottom: 6px;
`

const ResultBigLabel = styled.div`
  font-size: 14px;
  color: ${C.textSecondary};
`

const ResultStats = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
  @media (max-width: 480px) { grid-template-columns: 1fr; gap: 8px; }
`

const ResultStat = styled(motion.div)`
  background: ${C.surface};
  border: 1px solid ${C.border};
  border-radius: 10px;
  padding: 14px;
  text-align: center;
`

const ResultStatNum = styled.div<{ color?: string }>`
  font-size: 22px;
  font-weight: 800;
  color: ${({ color }) => color ?? C.textPrimary};
  letter-spacing: -0.5px;
  margin-bottom: 3px;
`

const ResultStatLabel = styled.div`
  font-size: 11px;
  color: ${C.textMuted};
  line-height: 1.3;
`

const PrepCallout = styled(motion.div)`
  background: linear-gradient(135deg, rgba(99,102,241,0.1), rgba(139,92,246,0.07));
  border: 1px solid rgba(99,102,241,0.25);
  border-radius: 14px;
  padding: 20px 24px;
  display: flex;
  gap: 16px;
  align-items: flex-start;
  @media (max-width: 480px) { padding: 16px; gap: 12px; }
`

const PrepIcon = styled.div`
  width: 36px;
  height: 36px;
  border-radius: 8px;
  background: rgba(99,102,241,0.2);
  border: 1px solid rgba(99,102,241,0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
`

const PrepText = styled.div`
  flex: 1;
`

const PrepTitle = styled.div`
  font-size: 14px;
  font-weight: 700;
  color: ${C.textPrimary};
  margin-bottom: 4px;
`

const PrepDesc = styled.div`
  font-size: 12px;
  color: ${C.textSecondary};
  line-height: 1.55;
`

const ResultCTARow = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  @media (max-width: 560px) {
    flex-direction: column;
    gap: 8px;
    & > * { width: 100%; justify-content: center; }
  }
`

const ResultCTABtn = styled(motion.a)`
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 14px 24px;
  border-radius: 12px;
  background: ${C.accent};
  color: #fff;
  font-family: ${FONT};
  font-size: 14px;
  font-weight: 700;
  text-decoration: none;
  cursor: pointer;
  border: 1px solid rgba(255,255,255,0.15);
  box-shadow: 0 0 28px ${C.accentGlow};
  transition: background 0.2s;
  &:hover { background: ${C.accentHover}; }
`

const ResetBtn = styled.button`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 13px 18px;
  border-radius: 12px;
  border: 1px solid ${C.border};
  background: transparent;
  color: ${C.textMuted};
  font-family: ${FONT};
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: color 0.2s, border-color 0.2s;
  white-space: nowrap;
  &:hover { color: ${C.textSecondary}; border-color: ${C.borderHover}; }
`

// ─── Animated counter ─────────────────────────────────────────────────────────
function AnimatedNumber({ value, prefix = '', suffix = '', duration = 1200 }: {
  value: number; prefix?: string; suffix?: string; duration?: number
}) {
  const [displayed, setDisplayed] = React.useState(0)
  React.useEffect(() => {
    let start: number
    const raf = (ts: number) => {
      if (!start) start = ts
      const p = Math.min((ts - start) / duration, 1)
      const eased = 1 - Math.pow(1 - p, 3)
      setDisplayed(Math.round(eased * value))
      if (p < 1) requestAnimationFrame(raf)
    }
    requestAnimationFrame(raf)
  }, [value, duration])
  return <>{prefix}{displayed.toLocaleString()}{suffix}</>
}

// ─── Step component ───────────────────────────────────────────────────────────
function CalcStep({
  stepNum, total, question, hint, options, cols, onSelect, selectedValue,
}: {
  stepNum: number
  total: number
  question: string
  hint?: string
  options: { label: string; value?: number | string; desc?: string; icon?: string }[]
  cols?: number
  onSelect: (value: number | string) => void
  selectedValue?: number | string
}) {
  return (
    <CalcCard
      key={stepNum}
      initial={{ opacity: 0, x: 32 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -32 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
    >
      <CalcHeader>
        <ProgressRow>
          <ProgressTrack>
            <ProgressFill
              initial={{ width: `${((stepNum - 1) / total) * 100}%` }}
              animate={{ width: `${(stepNum / total) * 100}%` }}
              transition={{ duration: 0.5 }}
            />
          </ProgressTrack>
          <StepLabel>{stepNum} / {total}</StepLabel>
        </ProgressRow>
      </CalcHeader>
      <CalcBody>
        <QuestionTitle>{question}</QuestionTitle>
        {hint && <QuestionSub>{hint}</QuestionSub>}
        <OptionsGrid cols={cols ?? options.length}>
          {options.map((opt, i) => (
            <OptionCard
              key={i}
              selected={selectedValue === (opt.value ?? opt.label)}
              onClick={() => onSelect(opt.value ?? opt.label)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
            >
              {opt.icon && <OptionIcon>{opt.icon}</OptionIcon>}
              <OptionLabel selected={selectedValue === (opt.value ?? opt.label)}>
                {opt.label}
              </OptionLabel>
              {opt.desc && <OptionDesc>{opt.desc}</OptionDesc>}
            </OptionCard>
          ))}
        </OptionsGrid>
      </CalcBody>
    </CalcCard>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────
export function RevenueCalculatorSection() {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-100px' })

  const [step, setStep] = useState<Step>(1)
  const [answers, setAnswers] = useState<Answers>({})

  const select = (key: keyof Answers, value: number | string) => {
    const updated = { ...answers, [key]: value }
    setAnswers(updated)
    setTimeout(() => {
      setStep(s => {
        if (s === 1) return 2
        if (s === 2) return 3
        if (s === 3) return 4
        if (s === 4) return 5
        if (s === 5) return 'result'
        return s
      })
    }, 260) // small delay so the selection highlight is visible before transition
  }

  const reset = () => { setAnswers({}); setStep(1) }

  // Calculations
  const weekly = answers.weekly ?? 0
  const unqual = answers.unqual ?? 0
  const rate = answers.rate ?? 0
  const duration = answers.duration ?? 0

  const unqualPerWeek = Math.round(weekly * unqual)
  const hoursPerWeek = Math.round(unqualPerWeek * duration * 10) / 10
  const monthlyWaste = Math.round(hoursPerWeek * 4.33 * rate)
  const annualWaste = monthlyWaste * 12

  return (
    <Section ref={ref}>
      <Inner>
        <TopLabel>Revenue leak calculator</TopLabel>
        <Title>What is your lead problem<br />actually costing you?</Title>
        <Sub>
          Answer 5 quick questions about your sales process.
          We'll show you exactly how much you're bleeding — and what changes when leads arrive pre-qualified and prepared.
        </Sub>

        <AnimatePresence mode="wait">
          {step === 1 && (
            <CalcStep
              key="s1"
              stepNum={1} total={5}
              question="How many demo or sales requests do you receive per week?"
              hint="Include Calendly bookings, contact form submissions, cold inbound emails — everything your team has to respond to."
              options={WEEKLY_OPTIONS}
              onSelect={v => select('weekly', v)}
              selectedValue={answers.weekly}
            />
          )}

          {step === 2 && (
            <CalcStep
              key="s2"
              stepNum={2} total={5}
              question="What percentage of those turn out to be unqualified or irrelevant?"
              hint="Think: wrong company size, no budget, student research, competitors, or just completely off-base."
              options={UNQUAL_OPTIONS}
              onSelect={v => select('unqual', v)}
              selectedValue={answers.unqual}
            />
          )}

          {step === 3 && (
            <CalcStep
              key="s3"
              stepNum={3} total={5}
              question="How do most leads reach your team today?"
              hint="This tells us how blind your team is going into each interaction."
              options={SOURCE_OPTIONS}
              cols={2}
              onSelect={v => select('source', v)}
              selectedValue={answers.source}
            />
          )}

          {step === 4 && (
            <CalcStep
              key="s4"
              stepNum={4} total={5}
              question="Who on your team handles these inbound leads?"
              hint="We'll calculate their time cost based on typical market rates."
              options={RATE_OPTIONS}
              cols={2}
              onSelect={v => select('rate', v)}
              selectedValue={answers.rate}
            />
          )}

          {step === 5 && (
            <CalcStep
              key="s5"
              stepNum={5} total={5}
              question="How long is a typical call or intake response?"
              hint="Include the call itself plus any follow-up notes, CRM updates, or email responses afterwards."
              options={DURATION_OPTIONS}
              onSelect={v => select('duration', v)}
              selectedValue={answers.duration}
            />
          )}

          {step === 'result' && (
            <CalcCard
              key="result"
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
            >
              <CalcHeader>
                <ProgressRow>
                  <ProgressTrack>
                    <ProgressFill initial={{ width: '100%' }} animate={{ width: '100%' }} />
                  </ProgressTrack>
                  <StepLabel style={{ color: C.success }}>✓ Done</StepLabel>
                </ProgressRow>
              </CalcHeader>
              <CalcBody>
                <ResultWrap>
                  {/* Big number */}
                  <ResultHero>
                    <ResultEyebrow>
                      <TrendingDown size={11} style={{ display: 'inline', marginRight: 4 }} />
                      Monthly revenue leak
                    </ResultEyebrow>
                    <ResultBigNumber
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 }}
                    >
                      <AnimatedNumber value={monthlyWaste} prefix="$" />
                    </ResultBigNumber>
                    <ResultBigLabel>wasted every month on unqualified leads</ResultBigLabel>
                  </ResultHero>

                  {/* Stats row */}
                  <ResultStats>
                    <ResultStat
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                    >
                      <ResultStatNum color={C.warning}>
                        <AnimatedNumber value={unqualPerWeek} duration={900} />
                      </ResultStatNum>
                      <ResultStatLabel>unqualified calls<br />per week</ResultStatLabel>
                    </ResultStat>
                    <ResultStat
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 }}
                    >
                      <ResultStatNum color={C.error}>
                        <AnimatedNumber value={hoursPerWeek * 10} duration={1000} />
                        <span style={{ fontSize: 14, fontWeight: 500 }}> hrs/mo</span>
                      </ResultStatNum>
                      <ResultStatLabel>of your team's time<br />gone forever</ResultStatLabel>
                    </ResultStat>
                    <ResultStat
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4 }}
                    >
                      <ResultStatNum color="#F87171">
                        <AnimatedNumber value={annualWaste} prefix="$" duration={1400} />
                      </ResultStatNum>
                      <ResultStatLabel>annual cost of<br />staying as-is</ResultStatLabel>
                    </ResultStat>
                  </ResultStats>

                  {/* Preparation callout */}
                  <PrepCallout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                  >
                    <PrepIcon>
                      <AlertTriangle size={18} color={C.accentLight} />
                    </PrepIcon>
                    <PrepText>
                      <PrepTitle>Your team is going in blind — every single time.</PrepTitle>
                      <PrepDesc>
                        Whether it's a random Calendly booking or a vague "contact us" form, your AEs have zero context before the call.
                        With Qualify, every lead arrives pre-profiled: company size, budget range, use case, urgency level.
                        Your team walks in <strong style={{ color: C.accentText }}>prepared for a big client</strong>, not guessing who just booked.
                      </PrepDesc>
                    </PrepText>
                  </PrepCallout>

                  {/* CTA */}
                  <ResultCTARow>
                    <ResultCTABtn
                      href="/login"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Zap size={15} />
                      Stop leaking ${monthlyWaste.toLocaleString()} / month
                      <ArrowRight size={15} />
                    </ResultCTABtn>
                    <ResetBtn onClick={reset}>
                      <RotateCcw size={13} /> Recalculate
                    </ResetBtn>
                  </ResultCTARow>
                </ResultWrap>
              </CalcBody>
            </CalcCard>
          )}
        </AnimatePresence>
      </Inner>
    </Section>
  )
}
