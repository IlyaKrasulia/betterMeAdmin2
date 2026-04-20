import React from 'react'
import styled from 'styled-components'
import { motion } from 'framer-motion'
import { GitBranch, Link2, CheckCircle2 } from 'lucide-react'
import { C, FONT } from '../constants'

const Section = styled.section`
  background: ${C.surface};
  padding: 100px 24px;
  font-family: ${FONT};
  position: relative;
  &::before {
    content: '';
    position: absolute;
    inset: 0;
    background-image: radial-gradient(rgba(255,255,255,0.02) 1px, transparent 1px);
    background-size: 28px 28px;
    pointer-events: none;
  }
  @media (max-width: 768px) { padding: 72px 16px; }
`

const Inner = styled.div`
  max-width: 1100px;
  margin: 0 auto;
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
`

const Sub = styled.p`
  text-align: center;
  font-size: 16px;
  color: ${C.textSecondary};
  max-width: 480px;
  margin: 0 auto 56px;
  line-height: 1.65;
  @media (max-width: 768px) { font-size: 15px; margin-bottom: 40px; }
`

const StepsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0;
  position: relative;

  /* Horizontal connector line — desktop only */
  &::before {
    content: '';
    position: absolute;
    top: 44px;
    left: calc(16.6% + 22px);
    right: calc(16.6% + 22px);
    height: 1px;
    background: linear-gradient(90deg, ${C.accent}, ${C.purple}, ${C.accent});
    opacity: 0.35;
  }

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 32px;
    &::before { display: none; }
  }
`

const Step = styled(motion.div)`
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 0 32px;
  position: relative;

  @media (max-width: 768px) {
    padding: 0 8px;
    flex-direction: row;
    text-align: left;
    align-items: flex-start;
    gap: 20px;
  }
`

const StepNumber = styled.div<{ index: number }>`
  width: 56px;
  height: 56px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  font-weight: 800;
  color: #fff;
  margin-bottom: 28px;
  position: relative;
  z-index: 1;
  flex-shrink: 0;
  background: ${({ index }) =>
    index === 0 ? `linear-gradient(135deg, ${C.accent}, ${C.purple})`
    : index === 1 ? `linear-gradient(135deg, ${C.purple}, #EC4899)`
    : `linear-gradient(135deg, #EC4899, #F59E0B)`};
  box-shadow: ${({ index }) =>
    index === 0 ? `0 0 28px ${C.accentGlow}`
    : index === 1 ? '0 0 28px rgba(139,92,246,0.4)'
    : '0 0 28px rgba(236,72,153,0.35)'};

  @media (max-width: 768px) {
    width: 48px;
    height: 48px;
    font-size: 16px;
    margin-bottom: 0;
  }
`

const StepIconWrap = styled.div`
  position: absolute;
  bottom: -4px;
  right: -4px;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: ${C.surface};
  border: 2px solid ${C.border};
  display: flex;
  align-items: center;
  justify-content: center;
`

const StepContent = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  @media (max-width: 768px) { align-items: flex-start; flex: 1; }
`

const StepTitle = styled.h3`
  font-size: 18px;
  font-weight: 700;
  color: ${C.textPrimary};
  margin: 0 0 10px;
`

const StepDesc = styled.p`
  font-size: 14px;
  color: ${C.textSecondary};
  line-height: 1.65;
  margin: 0 0 20px;
`

const StepMock = styled.div`
  width: 100%;
  border-radius: 12px;
  border: 1px solid ${C.border};
  background: ${C.elevated};
  padding: 14px;
  margin-top: 4px;
`

const MockNode = styled.div<{ color?: string }>`
  padding: 6px 12px;
  border-radius: 6px;
  background: ${({ color }) => color ?? C.surface};
  border: 1px solid ${C.border};
  font-size: 11px;
  font-weight: 600;
  color: ${C.textSecondary};
  margin-bottom: 6px;
  display: flex;
  align-items: center;
  gap: 6px;
`

const MockLine = styled.div`
  width: 1px;
  height: 10px;
  background: ${C.border};
  margin: 0 auto 6px;
`

const MockTag = styled.div<{ color: string }>`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 3px 8px;
  border-radius: 4px;
  font-size: 10px;
  font-weight: 700;
  background: ${({ color }) => `${color}18`};
  color: ${({ color }) => color};
  border: 1px solid ${({ color }) => `${color}35`};
`

const MockRow = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 11px;
  color: ${C.textMuted};
  padding: 5px 0;
  border-bottom: 1px solid ${C.border};
  &:last-child { border-bottom: none; }
`

const MockDot = styled.div<{ color: string }>`
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: ${({ color }) => color};
  flex-shrink: 0;
`

const STEPS = [
  {
    num: '01',
    icon: GitBranch,
    title: 'Build your qualifier',
    desc: 'Type a prompt like "SaaS companies, 50+ employees, $2k+ budget" and AI generates the full flow instantly. Or use the visual drag-and-drop builder for complex branching logic — no code ever.',
    mock: (
      <StepMock>
        <MockNode color="rgba(99,102,241,0.12)">🎯 Company size?</MockNode>
        <MockLine />
        <div style={{ display: 'flex', gap: 8 }}>
          <MockNode color="rgba(34,197,94,0.1)" style={{ flex: 1, fontSize: 10 }}>50+</MockNode>
          <MockNode color="rgba(239,68,68,0.1)" style={{ flex: 1, fontSize: 10 }}>{'< 10'}</MockNode>
        </div>
      </StepMock>
    ),
  },
  {
    num: '02',
    icon: Link2,
    title: 'Replace your Calendly link',
    desc: 'Drop in one embed snippet or share a hosted link. Plug it wherever your "Book a Demo" button lives — website, email, ads.',
    mock: (
      <StepMock>
        <div style={{ background: C.surface, borderRadius: 6, padding: '8px 10px', border: `1px solid ${C.border}`, fontFamily: 'monospace', fontSize: 10, color: C.accentText, wordBreak: 'break-all' }}>
          {'<QualifyWidget id="sq_abc123" />'}
        </div>
        <div style={{ marginTop: 8, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <MockTag color={C.success}>✓ Calendly</MockTag>
          <MockTag color={C.success}>✓ HubSpot</MockTag>
          <MockTag color={C.success}>✓ Webflow</MockTag>
        </div>
      </StepMock>
    ),
  },
  {
    num: '03',
    icon: CheckCircle2,
    title: 'Only qualified leads book',
    desc: 'Qualified prospects land straight in your calendar. Everyone else gets a tailored message, email nurture, or alternate routing.',
    mock: (
      <StepMock>
        <MockRow><MockDot color={C.success} />Alex T. — <MockTag color={C.success}>Qualified</MockTag></MockRow>
        <MockRow><MockDot color={C.warning} />Sam K. — <MockTag color={C.warning}>Nurture</MockTag></MockRow>
        <MockRow><MockDot color={C.success} />Priya M. — <MockTag color={C.success}>Qualified</MockTag></MockRow>
      </StepMock>
    ),
  },
]

export function HowItWorksSection() {
  return (
    <Section id="how-it-works">
      <Inner>
        <TopLabel>How it works</TopLabel>
        <Title>Live in 5 minutes.</Title>
        <Sub>Three steps to stop wasting demos and start closing faster.</Sub>

        <StepsGrid>
          {STEPS.map((step, i) => {
            const Icon = step.icon
            return (
              <Step
                key={i}
                initial={{ opacity: 0, y: 28 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.12 }}
              >
                <StepNumber index={i}>
                  {step.num}
                  <StepIconWrap><Icon size={11} color={C.accentLight} /></StepIconWrap>
                </StepNumber>
                <StepContent>
                  <StepTitle>{step.title}</StepTitle>
                  <StepDesc>{step.desc}</StepDesc>
                  {step.mock}
                </StepContent>
              </Step>
            )
          })}
        </StepsGrid>
      </Inner>
    </Section>
  )
}
