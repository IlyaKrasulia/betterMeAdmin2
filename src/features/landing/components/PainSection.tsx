import React, { useRef, useState, useEffect } from 'react'
import styled from 'styled-components'
import { motion, useInView } from 'framer-motion'
import { TrendingDown, Clock, DollarSign } from 'lucide-react'
import { C, FONT } from '../constants'

function useCountUp(end: number, duration = 1800, start = false) {
  const [val, setVal] = useState(0)
  useEffect(() => {
    if (!start) return
    let startTs: number
    const raf = (ts: number) => {
      if (!startTs) startTs = ts
      const p = Math.min((ts - startTs) / duration, 1)
      const eased = 1 - Math.pow(1 - p, 3)
      setVal(Math.round(eased * end))
      if (p < 1) requestAnimationFrame(raf)
    }
    requestAnimationFrame(raf)
  }, [start, end, duration])
  return val
}

const Section = styled.section`
  background: ${C.bg};
  padding: 100px 24px;
  font-family: ${FONT};
  position: relative;
  overflow: hidden;
  &::before {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(180deg, transparent 0%, rgba(99,102,241,0.03) 50%, transparent 100%);
    pointer-events: none;
  }
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
  max-width: 520px;
  margin: 0 auto 64px;
  line-height: 1.65;
`

const CardsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
  margin-bottom: 60px;
`

const Card = styled(motion.div)<{ glowColor: string }>`
  padding: 32px;
  border-radius: 16px;
  background: ${C.surface};
  border: 1px solid ${C.border};
  position: relative;
  overflow: hidden;
  transition: border-color 0.3s, transform 0.3s;

  &::before {
    content: '';
    position: absolute;
    top: 0; left: 0; right: 0;
    height: 1px;
    background: ${({ glowColor }) => `linear-gradient(90deg, transparent, ${glowColor}, transparent)`};
  }

  &:hover {
    border-color: ${({ glowColor }) => `${glowColor}60`};
    transform: translateY(-2px);
  }
`

const CardIcon = styled.div<{ color: string }>`
  width: 44px;
  height: 44px;
  border-radius: 10px;
  background: ${({ color }) => `${color}18`};
  border: 1px solid ${({ color }) => `${color}30`};
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 20px;
`

/* lp-shimmer defined in LandingKeyframes */
const StatNumber = styled.div`
  font-size: 52px;
  font-weight: 900;
  line-height: 1;
  letter-spacing: -2px;
  margin-bottom: 8px;
  background: linear-gradient(120deg, ${C.textPrimary} 0%, ${C.textSecondary} 100%);
  background-size: 200% auto;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  animation: lp-shimmer 3s linear infinite;
`

const StatLabel = styled.div`
  font-size: 15px;
  font-weight: 600;
  color: ${C.textPrimary};
  margin-bottom: 8px;
`

const StatDesc = styled.div`
  font-size: 13px;
  color: ${C.textMuted};
  line-height: 1.55;
`

const BottomCallout = styled(motion.div)`
  padding: 32px 40px;
  border-radius: 16px;
  background: linear-gradient(135deg, rgba(99,102,241,0.08), rgba(139,92,246,0.06));
  border: 1px solid rgba(99,102,241,0.2);
  text-align: center;
`

const CalloutText = styled.p`
  font-size: 18px;
  font-weight: 600;
  color: ${C.textPrimary};
  margin: 0;
  line-height: 1.55;
  & em {
    font-style: normal;
    color: ${C.accentText};
  }
`

const STATS = [
  {
    icon: TrendingDown, iconColor: C.error, glowColor: C.error,
    end: 47, suffix: '%',
    label: 'Demos are unqualified',
    desc: "Nearly half of all demo bookings come from leads outside your ICP — wasting everyone's time.",
  },
  {
    icon: Clock, iconColor: C.warning, glowColor: C.warning,
    end: 35, suffix: ' hrs',
    label: 'Lost per AE per month',
    desc: "Your best salespeople spend a third of their time explaining basics to leads who'll never convert.",
  },
  {
    icon: DollarSign, iconColor: '#22C55E', glowColor: '#22C55E',
    end: 12, prefix: '$', suffix: 'k',
    label: 'Revenue leaked monthly',
    desc: 'Unqualified demos represent real opportunity cost — a number that compounds as you scale.',
  },
]

function StatCard({ stat, triggered }: { stat: typeof STATS[0]; triggered: boolean }) {
  const count = useCountUp(stat.end, 1600, triggered)
  const Icon = stat.icon

  return (
    <Card
      glowColor={stat.glowColor}
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.55 }}
    >
      <CardIcon color={stat.iconColor}>
        <Icon size={20} color={stat.iconColor} />
      </CardIcon>
      <StatNumber>
        {stat.prefix ?? ''}{triggered ? count : 0}{stat.suffix}
      </StatNumber>
      <StatLabel>{stat.label}</StatLabel>
      <StatDesc>{stat.desc}</StatDesc>
    </Card>
  )
}

export function PainSection() {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })

  return (
    <Section>
      <Inner ref={ref}>
        <TopLabel>The problem</TopLabel>
        <Title>Your calendar is bleeding money.</Title>
        <Sub>
          Every unqualified demo call burns AE time, kills pipeline velocity,
          and lets real buyers slip through the cracks.
        </Sub>

        <CardsGrid>
          {STATS.map((s, i) => <StatCard key={i} stat={s} triggered={inView} />)}
        </CardsGrid>

        <BottomCallout
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <CalloutText>
            Your sales team is your most valuable asset.
            Stop making them do <em>marketing's job</em>.
          </CalloutText>
        </BottomCallout>
      </Inner>
    </Section>
  )
}
