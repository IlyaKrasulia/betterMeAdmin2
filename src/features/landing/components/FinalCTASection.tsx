import React from 'react'
import styled from 'styled-components'
import { motion } from 'framer-motion'
import { ArrowRight, Zap } from 'lucide-react'
import { C, FONT } from '../constants'
import { RoutlyLogo } from '@shared/ui/RoutlyLogo'

const Section = styled.section`
  background: ${C.surface};
  padding: 100px 24px 80px;
  font-family: ${FONT};
  @media (max-width: 768px) { padding: 72px 16px 56px; }
`

const Inner = styled.div`
  max-width: 800px;
  margin: 0 auto;
`

const Card = styled(motion.div)`
  position: relative;
  border-radius: 24px;
  overflow: hidden;
  padding: 72px 56px;
  text-align: center;
  background: linear-gradient(135deg, rgba(99,102,241,0.12) 0%, rgba(139,92,246,0.08) 50%, rgba(59,130,246,0.06) 100%);
  border: 1px solid rgba(99,102,241,0.3);
  @media (max-width: 768px) { padding: 48px 24px; border-radius: 20px; }
  @media (max-width: 480px) { padding: 40px 20px; }

  &::before {
    content: '';
    position: absolute;
    top: -50%;
    left: 50%;
    transform: translateX(-50%);
    width: 500px;
    height: 500px;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(99,102,241,0.15), transparent 65%);
    filter: blur(40px);
    pointer-events: none;
  }
`

/* lp-orbit used as plain animation name */
const Orbit = styled.div`
  position: absolute;
  top: -60px;
  right: -60px;
  width: 220px;
  height: 220px;
  border-radius: 50%;
  border: 1px dashed rgba(99,102,241,0.2);
  animation: lp-orbit 20s linear infinite;
`

const OrbitDot = styled.div`
  position: absolute;
  top: 10px;
  left: 50%;
  transform: translateX(-50%);
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: ${C.accent};
  box-shadow: 0 0 10px ${C.accentGlow};
`

const TopLabel = styled.div`
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 2px;
  color: ${C.accentText};
  text-transform: uppercase;
  margin-bottom: 20px;
`

const H2 = styled.h2`
  font-size: clamp(36px, 5vw, 58px);
  font-weight: 900;
  letter-spacing: -2px;
  color: ${C.textPrimary};
  margin: 0 0 20px;
  line-height: 1.1;
`

const Em = styled.em`
  font-style: normal;
  background: linear-gradient(135deg, #818CF8, #6366F1, #8B5CF6);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
`

const Sub = styled.p`
  font-size: 17px;
  color: ${C.textSecondary};
  max-width: 460px;
  margin: 0 auto 36px;
  line-height: 1.65;
  @media (max-width: 768px) { font-size: 15px; }
`

const CTABtn = styled(motion.a)`
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 16px 36px;
  border-radius: 14px;
  background: ${C.accent};
  color: #fff;
  font-family: ${FONT};
  font-size: 16px;
  font-weight: 700;
  text-decoration: none;
  cursor: pointer;
  border: 1px solid rgba(255,255,255,0.2);
  box-shadow: 0 0 40px ${C.accentGlow}, 0 8px 24px rgba(0,0,0,0.4);
  transition: background 0.2s, box-shadow 0.2s;
  &:hover {
    background: ${C.accentHover};
    box-shadow: 0 0 60px ${C.accentGlow}, 0 8px 28px rgba(0,0,0,0.5);
  }
  @media (max-width: 480px) {
    width: 100%;
    justify-content: center;
    padding: 15px 20px;
    font-size: 15px;
  }
`

const Micro = styled.p`
  margin: 16px 0 0;
  font-size: 12px;
  color: ${C.textMuted};
`

const Footer = styled.div`
  margin-top: 80px;
  padding-top: 32px;
  border-top: 1px solid ${C.border};
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 16px;
  @media (max-width: 640px) {
    flex-direction: column;
    align-items: flex-start;
    margin-top: 56px;
    gap: 20px;
  }
`


const FooterLinks = styled.div`
  display: flex;
  gap: 24px;
`

const FooterLink = styled.a`
  font-size: 13px;
  color: ${C.textMuted};
  text-decoration: none;
  cursor: pointer;
  transition: color 0.2s;
  &:hover { color: ${C.textSecondary}; }
`

const FooterRight = styled.div`
  font-size: 12px;
  color: ${C.textMuted};
`


export function FinalCTASection() {
  return (
    <Section>
      <Inner>
        <Card
          initial={{ opacity: 0, y: 28 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <Orbit><OrbitDot /></Orbit>

          <TopLabel>Ready to qualify smarter?</TopLabel>
          <H2>Your calendar<br />deserves <Em>better leads.</Em></H2>
          <Sub>
            Stop letting unqualified prospects eat your AEs' time.
            Build your first qualifier in 5 minutes — free.
          </Sub>
          <CTABtn href="/signup" whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
            <Zap size={17} />
            Build your flow — it's free
            <ArrowRight size={17} />
          </CTABtn>
          <Micro>No credit card · Live in 5 minutes · Cancel anytime</Micro>
        </Card>

        <Footer>
          <RoutlyLogo size="sm" textColor={C.textPrimary} glow />
          <FooterLinks>
            <FooterLink>Privacy</FooterLink>
            <FooterLink>Terms</FooterLink>
            <FooterLink>Contact</FooterLink>
          </FooterLinks>
          <FooterRight>© 2026 Routly. All rights reserved.</FooterRight>
        </Footer>
      </Inner>
    </Section>
  )
}
