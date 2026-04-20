import React from 'react'
import styled from 'styled-components'
import { motion } from 'framer-motion'
import { ArrowRight, Sparkles } from 'lucide-react'
import { C, FONT } from '../constants'
import { InteractiveDemo } from './InteractiveDemo'

const Section = styled.section`
  position: relative;
  min-height: 100vh;
  background: ${C.bg};
  overflow: hidden;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 140px 24px 80px;
  font-family: ${FONT};

  &::before {
    content: '';
    position: absolute;
    inset: 0;
    background-image: radial-gradient(rgba(255,255,255,0.028) 1px, transparent 1px);
    background-size: 32px 32px;
    pointer-events: none;
  }

  @media (max-width: 768px) {
    padding: 110px 16px 60px;
    min-height: auto;
  }
`

const Orb1 = styled.div`
  position: absolute;
  width: 560px; height: 560px;
  top: -180px; left: -140px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(99,102,241,0.45), transparent);
  filter: blur(90px);
  opacity: 0.55;
  pointer-events: none;
  animation: lp-float1 12s ease-in-out infinite;
  @media (max-width: 768px) { width: 300px; height: 300px; top: -80px; left: -80px; }
`

const Orb2 = styled.div`
  position: absolute;
  width: 440px; height: 440px;
  top: 60px; left: 65%;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(139,92,246,0.35), transparent);
  filter: blur(90px);
  opacity: 0.55;
  pointer-events: none;
  animation: lp-float2 15s ease-in-out infinite;
  @media (max-width: 768px) { width: 260px; height: 260px; left: 50%; top: 0; }
`

const Orb3 = styled.div`
  position: absolute;
  width: 300px; height: 300px;
  top: 55%; left: 30%;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(59,130,246,0.3), transparent);
  filter: blur(90px);
  opacity: 0.55;
  pointer-events: none;
  animation: lp-float3 10s ease-in-out infinite;
  @media (max-width: 768px) { display: none; }
`

const Content = styled.div`
  position: relative;
  z-index: 1;
  max-width: 1200px;
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
`

const Badge = styled(motion.div)`
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 6px 14px;
  border-radius: 100px;
  border: 1px solid rgba(99,102,241,0.35);
  background: rgba(99,102,241,0.1);
  font-size: 12px;
  font-weight: 600;
  color: ${C.accentText};
  letter-spacing: 0.3px;
  margin-bottom: 24px;
  text-align: center;
`

const H1 = styled(motion.h1)`
  font-size: clamp(36px, 7vw, 78px);
  font-weight: 800;
  line-height: 1.1;
  letter-spacing: -2px;
  color: ${C.textPrimary};
  margin: 0 0 20px;
  text-align: center;

  @media (max-width: 768px) {
    letter-spacing: -1px;
    br { display: none; }
  }
`

const GradientSpan = styled.span`
  background: linear-gradient(135deg, #818CF8 0%, #6366F1 40%, #8B5CF6 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
`

const Sub = styled(motion.p)`
  font-size: clamp(15px, 2vw, 18px);
  line-height: 1.65;
  color: ${C.textSecondary};
  max-width: 560px;
  text-align: center;
  margin: 0 0 32px;
  padding: 0 8px;
`

const CTARow = styled(motion.div)`
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 48px;
  flex-wrap: wrap;
  justify-content: center;

  @media (max-width: 480px) {
    flex-direction: column;
    width: 100%;
    gap: 10px;
  }
`

const PrimaryBtn = styled(motion.a)`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 14px 28px;
  border-radius: 12px;
  background: ${C.accent};
  color: #fff;
  font-family: ${FONT};
  font-size: 15px;
  font-weight: 700;
  text-decoration: none;
  cursor: pointer;
  border: 1px solid rgba(255,255,255,0.18);
  box-shadow: 0 0 32px ${C.accentGlow}, 0 4px 16px rgba(0,0,0,0.4);
  transition: background 0.2s, box-shadow 0.2s;
  &:hover { background: ${C.accentHover}; }

  @media (max-width: 480px) {
    width: 100%;
    justify-content: center;
    padding: 14px 20px;
  }
`

const GhostBtn = styled(motion.button)`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 13px 24px;
  border-radius: 12px;
  background: transparent;
  color: ${C.textSecondary};
  font-family: ${FONT};
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  border: 1px solid ${C.border};
  transition: border-color 0.2s, color 0.2s;
  &:hover { border-color: ${C.borderHover}; color: ${C.textPrimary}; }

  @media (max-width: 480px) {
    width: 100%;
    justify-content: center;
  }
`

const StatsRow = styled(motion.div)`
  display: flex;
  align-items: center;
  margin-bottom: 48px;
  flex-wrap: wrap;
  justify-content: center;
  gap: 0;

  @media (max-width: 480px) {
    gap: 16px;
    margin-bottom: 36px;
  }
`

const StatItem = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  padding: 0 28px;
  border-right: 1px solid ${C.border};
  &:last-child { border-right: none; }
  &:first-child { padding-left: 0; }

  @media (max-width: 480px) {
    padding: 0 20px;
    border-right: 1px solid ${C.border};
    &:first-child { padding-left: 20px; }
    &:last-child { border-right: none; }
  }
`

const StatNum = styled.div`
  font-size: 24px;
  font-weight: 800;
  color: ${C.textPrimary};
  letter-spacing: -0.5px;
`

const StatLabel = styled.div`
  font-size: 11px;
  color: ${C.textMuted};
  text-align: center;
  line-height: 1.4;
`

const DemoWrap = styled(motion.div)`
  width: 100%;
  max-width: 880px;
`

const DemoLabel = styled.div`
  text-align: center;
  font-size: 12px;
  color: ${C.textMuted};
  margin-bottom: 14px;
  letter-spacing: 0.3px;
  padding: 0 8px;
`

export function HeroSection() {
  return (
    <Section>
      <Orb1 /><Orb2 /><Orb3 />

      <Content>
        <Badge initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <Sparkles size={13} />
          AI-powered lead qualification
        </Badge>

        <H1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.1 }}>
          Stop losing revenue<br />to <GradientSpan>unqualified</GradientSpan><br />demo calls.
        </H1>

        <Sub initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.2 }}>
          Replace your Calendly link with an intelligent flow.
          Only the right leads reach your sales team — automatically.
        </Sub>

        <CTARow initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.3 }}>
          <PrimaryBtn href="/signup" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            Build your first flow <ArrowRight size={16} />
          </PrimaryBtn>
          <GhostBtn
            onClick={() => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })}
            whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
          >
            See how it works ↓
          </GhostBtn>
        </CTARow>

        <StatsRow initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6, delay: 0.45 }}>
          <StatItem><StatNum>47%</StatNum><StatLabel>of demos are<br />unqualified</StatLabel></StatItem>
          <StatItem><StatNum>3.5 hrs</StatNum><StatLabel>wasted per AE<br />every week</StatLabel></StatItem>
          <StatItem><StatNum>3×</StatNum><StatLabel>more qualified<br />pipeline</StatLabel></StatItem>
        </StatsRow>

        <DemoWrap initial={{ opacity: 0, y: 32 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.55 }}>
          <DemoLabel>✦ Try a live qualification flow — this is your product in action</DemoLabel>
          <InteractiveDemo />
        </DemoWrap>
      </Content>
    </Section>
  )
}
