import React, { useState } from 'react'
import styled from 'styled-components'
import { motion } from 'framer-motion'
import { Check, Zap } from 'lucide-react'
import { C, FONT } from '../constants'

const Section = styled.section`
  background: ${C.bg};
  padding: 100px 24px;
  font-family: ${FONT};
  position: relative;
  overflow: hidden;
  @media (max-width: 768px) { padding: 72px 16px; }

  &::before {
    content: '';
    position: absolute;
    bottom: -200px;
    left: 50%;
    transform: translateX(-50%);
    width: 600px;
    height: 600px;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(99,102,241,0.12), transparent 70%);
    filter: blur(60px);
    pointer-events: none;
  }
`

const Inner = styled.div`
  max-width: 1060px;
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
  font-size: clamp(32px, 5vw, 48px);
  font-weight: 800;
  letter-spacing: -1.5px;
  color: ${C.textPrimary};
  margin: 0 0 16px;
`

const Sub = styled.p`
  text-align: center;
  font-size: 16px;
  color: ${C.textSecondary};
  max-width: 440px;
  margin: 0 auto 40px;
  line-height: 1.65;
  @media (max-width: 768px) { font-size: 15px; }
`

const Toggle = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  margin-bottom: 52px;
`

const ToggleLabel = styled.span<{ active: boolean }>`
  font-size: 13px;
  font-weight: 600;
  color: ${({ active }) => (active ? C.textPrimary : C.textMuted)};
  cursor: pointer;
  transition: color 0.2s;
`

const ToggleSwitch = styled.div<{ annual: boolean }>`
  width: 44px;
  height: 24px;
  border-radius: 12px;
  background: ${({ annual }) => (annual ? C.accent : C.elevated)};
  border: 1px solid ${({ annual }) => (annual ? C.accent : C.border)};
  cursor: pointer;
  position: relative;
  transition: background 0.25s, border-color 0.25s;
  box-shadow: ${({ annual }) => (annual ? `0 0 16px ${C.accentGlow}` : 'none')};

  &::after {
    content: '';
    position: absolute;
    top: 2px;
    left: ${({ annual }) => (annual ? '22px' : '2px')};
    width: 18px;
    height: 18px;
    border-radius: 50%;
    background: #fff;
    transition: left 0.25s;
    box-shadow: 0 1px 4px rgba(0,0,0,0.3);
  }
`

const SaveBadge = styled.span`
  font-size: 10px;
  font-weight: 700;
  padding: 2px 7px;
  border-radius: 4px;
  background: rgba(34,197,94,0.15);
  color: ${C.success};
  border: 1px solid rgba(34,197,94,0.3);
`

const CardsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
  align-items: start;
  @media (max-width: 900px) {
    grid-template-columns: 1fr;
    max-width: 420px;
    margin: 0 auto;
    gap: 16px;
  }
`

const PriceCard = styled(motion.div)<{ featured?: boolean }>`
  border-radius: 20px;
  border: 1px solid ${({ featured }) => (featured ? 'rgba(99,102,241,0.5)' : C.border)};
  background: ${({ featured }) => (featured ? 'rgba(99,102,241,0.07)' : C.surface)};
  padding: 28px;
  display: flex;
  flex-direction: column;
  gap: 20px;
  position: relative;
  overflow: hidden;
  box-shadow: ${({ featured }) => (featured ? `0 0 48px ${C.accentGlow}` : 'none')};
  @media (max-width: 768px) { padding: 22px; }

  ${({ featured }) =>
    featured &&
    `&::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 2px;
      background: linear-gradient(90deg, #6366F1, #8B5CF6, #6366F1);
    }`}
`

const FeaturedBadge = styled.div`
  position: absolute;
  top: 16px;
  right: 16px;
  font-size: 10px;
  font-weight: 700;
  padding: 3px 8px;
  border-radius: 4px;
  background: rgba(99,102,241,0.2);
  color: ${C.accentText};
  border: 1px solid rgba(99,102,241,0.35);
  letter-spacing: 0.5px;
`

const TierName = styled.div`
  font-size: 14px;
  font-weight: 700;
  color: ${C.textSecondary};
  letter-spacing: 0.5px;
  text-transform: uppercase;
`

const PriceRow = styled.div`
  display: flex;
  align-items: baseline;
  gap: 4px;
`

const PriceAmount = styled.div`
  font-size: 44px;
  font-weight: 900;
  color: ${C.textPrimary};
  letter-spacing: -2px;
`

const PriceCurrency = styled.div`
  font-size: 20px;
  font-weight: 700;
  color: ${C.textSecondary};
  align-self: flex-start;
  margin-top: 10px;
`

const PricePer = styled.div`
  font-size: 13px;
  color: ${C.textMuted};
  margin-left: 2px;
`

const PriceDesc = styled.div`
  font-size: 13px;
  color: ${C.textSecondary};
  line-height: 1.55;
`

const FeatureList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
`

const FeatureItem = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 10px;
  font-size: 13px;
  color: ${C.textSecondary};
  line-height: 1.4;
`

const FeatureCheck = styled.div`
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: rgba(34,197,94,0.15);
  border: 1px solid rgba(34,197,94,0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  margin-top: 1px;
`

const CTABtn = styled(motion.a)<{ featured?: boolean }>`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
  padding: 13px;
  border-radius: 10px;
  border: ${({ featured }) => (featured ? 'none' : `1px solid ${C.border}`)};
  background: ${({ featured }) => (featured ? C.accent : 'transparent')};
  color: ${({ featured }) => (featured ? '#fff' : C.textSecondary)};
  font-family: ${FONT};
  font-size: 14px;
  font-weight: 700;
  text-decoration: none;
  cursor: pointer;
  box-shadow: ${({ featured }) => (featured ? `0 0 24px ${C.accentGlow}` : 'none')};
  transition: background 0.2s, color 0.2s, box-shadow 0.2s;
  &:hover {
    background: ${({ featured }) => (featured ? C.accentHover : C.elevated)};
    color: ${({ featured }) => (featured ? '#fff' : C.textPrimary)};
    box-shadow: ${({ featured }) => (featured ? `0 0 36px ${C.accentGlow}` : 'none')};
  }
`

const TIERS = [
  {
    name: 'Starter',
    monthly: 29,
    annual: 23,
    desc: 'Perfect for early-stage teams validating their first flows.',
    features: [
      '1 active qualifier flow',
      '200 qualifications / month',
      'Basic branching logic',
      'Email routing',
      'CSV export',
    ],
    cta: 'Start for free',
  },
  {
    name: 'Growth',
    monthly: 79,
    annual: 63,
    desc: 'For growing sales teams that need power and flexibility.',
    features: [
      '10 active qualifier flows',
      '2,000 qualifications / month',
      'AI flow generation',
      'Lead scoring & routing',
      'Drop-off analytics',
      'CRM integrations',
      'Priority support',
    ],
    cta: 'Get started',
    featured: true,
  },
  {
    name: 'Scale',
    monthly: 199,
    annual: 159,
    desc: 'Unlimited power for enterprise sales and RevOps teams.',
    features: [
      'Unlimited flows',
      'Unlimited qualifications',
      'Custom routing logic',
      'Team seats & permissions',
      'API access',
      'White-label widget',
      'Dedicated onboarding',
    ],
    cta: 'Talk to sales',
  },
]

export function PricingSection() {
  const [annual, setAnnual] = useState(false)

  return (
    <Section id="pricing">
      <Inner>
        <TopLabel>Pricing</TopLabel>
        <Title>Simple, transparent pricing.</Title>
        <Sub>Start free. Scale as your pipeline grows.</Sub>

        <Toggle>
          <ToggleLabel active={!annual} onClick={() => setAnnual(false)}>Monthly</ToggleLabel>
          <ToggleSwitch annual={annual} onClick={() => setAnnual(a => !a)} />
          <ToggleLabel active={annual} onClick={() => setAnnual(true)}>
            Annual <SaveBadge>Save 20%</SaveBadge>
          </ToggleLabel>
        </Toggle>

        <CardsGrid>
          {TIERS.map((tier, i) => (
            <PriceCard
              key={i}
              featured={tier.featured}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
            >
              {tier.featured && <FeaturedBadge>MOST POPULAR</FeaturedBadge>}

              <div>
                <TierName>{tier.name}</TierName>
                <PriceRow>
                  <PriceCurrency>$</PriceCurrency>
                  <PriceAmount>{annual ? tier.annual : tier.monthly}</PriceAmount>
                  <PricePer>/mo</PricePer>
                </PriceRow>
                <PriceDesc>{tier.desc}</PriceDesc>
              </div>

              <CTABtn
                href="/login"
                featured={tier.featured}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {tier.featured && <Zap size={14} />}
                {tier.cta}
              </CTABtn>

              <FeatureList>
                {tier.features.map((f, j) => (
                  <FeatureItem key={j}>
                    <FeatureCheck>
                      <Check size={10} color="#22C55E" />
                    </FeatureCheck>
                    {f}
                  </FeatureItem>
                ))}
              </FeatureList>
            </PriceCard>
          ))}
        </CardsGrid>
      </Inner>
    </Section>
  )
}
