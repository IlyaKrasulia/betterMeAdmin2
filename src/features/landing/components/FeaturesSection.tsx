import React, { useState, useEffect } from 'react'
import styled from 'styled-components'
import { motion, AnimatePresence } from 'framer-motion'
import { GitMerge, Sparkles, BarChart2, ArrowRight } from 'lucide-react'
import { C, FONT } from '../constants'

// ─── Styled — all animations use lp-* names from LandingKeyframes global ──────
const Section = styled.section`
  background: ${C.bg};
  padding: 100px 24px;
  font-family: ${FONT};
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
  max-width: 480px;
  margin: 0 auto 72px;
  line-height: 1.65;
  @media (max-width: 768px) { font-size: 15px; margin-bottom: 40px; }
`

const FeaturesGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
  @media (max-width: 900px) { grid-template-columns: 1fr; gap: 16px; }
`

const FeatureCard = styled(motion.div)`
  border-radius: 20px;
  border: 1px solid ${C.border};
  background: ${C.surface};
  overflow: hidden;
  display: flex;
  flex-direction: column;
  transition: border-color 0.3s;
  &:hover { border-color: ${C.borderHover}; }
`

const CardVisual = styled.div`
  height: 220px;
  background: ${C.elevated};
  border-bottom: 1px solid ${C.border};
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  position: relative;
  @media (max-width: 768px) { height: 180px; }
`

const CardBody = styled.div`
  padding: 24px;
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
`

const CardIconWrap = styled.div<{ color: string }>`
  width: 36px;
  height: 36px;
  border-radius: 8px;
  background: ${({ color }) => `${color}18`};
  border: 1px solid ${({ color }) => `${color}30`};
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 6px;
`

const CardTitle = styled.h3`
  font-size: 17px;
  font-weight: 700;
  color: ${C.textPrimary};
  margin: 0;
`

const CardDesc = styled.p`
  font-size: 13px;
  color: ${C.textSecondary};
  line-height: 1.6;
  margin: 0;
`

// ─── DAG SVG edges — use plain animation names ────────────────────────────────
const Edge1 = styled.line`
  stroke-dasharray: 60;
  stroke-dashoffset: 60;
  animation: lp-drawLine 1s ease forwards, lp-edgeGlow 2.5s ease 0s infinite;
`
const Edge2 = styled.line`
  stroke-dasharray: 60;
  stroke-dashoffset: 60;
  animation: lp-drawLine 1.2s ease forwards, lp-edgeGlow 2.5s ease 0.3s infinite;
`
const Edge3 = styled.line`
  stroke-dasharray: 60;
  stroke-dashoffset: 60;
  animation: lp-drawLine 1.4s ease forwards, lp-edgeGlow 2.5s ease 0.6s infinite;
`
const Edge4 = styled.line`
  stroke-dasharray: 60;
  stroke-dashoffset: 60;
  animation: lp-drawLine 1.4s ease forwards, lp-edgeGlow 2.5s ease 0.9s infinite;
`

function DagVisual() {
  return (
    <svg width="240" height="200" viewBox="0 0 240 200" style={{ overflow: 'visible' }}>
      <Edge1 x1="120" y1="38" x2="68"  y2="90"  stroke={C.accentLight} strokeWidth="1.5" />
      <Edge2 x1="120" y1="38" x2="172" y2="90"  stroke={C.accentLight} strokeWidth="1.5" />
      <Edge3 x1="68"  y1="110" x2="68" y2="156" stroke="#22C55E"       strokeWidth="1.5" />
      <Edge4 x1="172" y1="110" x2="172" y2="156" stroke={C.error}      strokeWidth="1.5" />

      <foreignObject x="70" y="10" width="100" height="30">
        <div style={{ background: 'rgba(99,102,241,0.2)', border: `1px solid ${C.accent}60`, borderRadius: 6, padding: '5px 10px', fontSize: 10, fontWeight: 700, color: C.accentText, textAlign: 'center', fontFamily: FONT }}>
          Company size?
        </div>
      </foreignObject>
      <foreignObject x="28" y="88" width="80" height="24">
        <div style={{ background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.3)', borderRadius: 6, padding: '4px 8px', fontSize: 10, fontWeight: 600, color: '#4ADE80', textAlign: 'center', fontFamily: FONT }}>
          50+ → Score +2
        </div>
      </foreignObject>
      <foreignObject x="132" y="88" width="80" height="24">
        <div style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 6, padding: '4px 8px', fontSize: 10, fontWeight: 600, color: '#F87171', textAlign: 'center', fontFamily: FONT }}>
          {'< 5 → Score 0'}
        </div>
      </foreignObject>
      <foreignObject x="24" y="154" width="88" height="26">
        <div style={{ background: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.4)', borderRadius: 6, padding: '5px 8px', fontSize: 10, fontWeight: 700, color: '#4ADE80', textAlign: 'center', fontFamily: FONT }}>
          ✓ Qualified
        </div>
      </foreignObject>
      <foreignObject x="128" y="154" width="84" height="26">
        <div style={{ background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: 6, padding: '5px 8px', fontSize: 10, fontWeight: 700, color: '#FCD34D', textAlign: 'center', fontFamily: FONT }}>
          → Nurture
        </div>
      </foreignObject>
    </svg>
  )
}

// ─── AI typing visual ──────────────────────────────────────────────────────────
/* lp-blink used as plain string */
const Cursor = styled.span`
  color: ${C.accent};
  animation: lp-blink 0.8s ease infinite;
`

const PROMPT = 'SaaS companies with 50+ employees using Salesforce'
const NODES = ['Company size?', 'Uses Salesforce?', 'Budget > $2k?', '→ Qualified']

function AIVisual() {
  const [typed, setTyped] = useState(0)
  const [showNodes, setShowNodes] = useState(false)
  const [nodeCount, setNodeCount] = useState(0)

  useEffect(() => {
    const t = setInterval(() => {
      setTyped(p => { if (p >= PROMPT.length) { clearInterval(t); return p } return p + 1 })
    }, 42)
    return () => clearInterval(t)
  }, [])

  useEffect(() => {
    if (typed < PROMPT.length) return
    const timeout = setTimeout(() => {
      setShowNodes(true)
      let i = 0
      const iv = setInterval(() => { i++; setNodeCount(i); if (i >= NODES.length) clearInterval(iv) }, 320)
    }, 500)
    return () => clearTimeout(timeout)
  }, [typed])

  const colors = [C.accent, C.purple, C.blue, '#22C55E']

  return (
    <div style={{ width: '90%', display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, padding: '10px 12px', fontFamily: 'monospace', fontSize: 11, color: C.accentText, minHeight: 36, display: 'flex', alignItems: 'center', gap: 4 }}>
        <Sparkles size={11} color={C.accentLight} style={{ flexShrink: 0 }} />
        <span>{PROMPT.slice(0, typed)}</span>
        <Cursor>|</Cursor>
      </div>

      <AnimatePresence>
        {showNodes && NODES.slice(0, nodeCount).map((n, i) => (
          <motion.div
            key={n}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            style={{ padding: '7px 12px', borderRadius: 7, background: `${colors[i]}18`, border: `1px solid ${colors[i]}35`, fontSize: 11, fontWeight: 600, color: colors[i], display: 'flex', alignItems: 'center', gap: 6, fontFamily: FONT }}
          >
            {i < NODES.length - 1 ? <ArrowRight size={10} /> : <span>✓</span>}
            {n}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}

// ─── Analytics funnel visual ──────────────────────────────────────────────────
const FUNNEL = [
  { label: 'Visitors',  val: 100, color: C.blue },
  { label: 'Started',   val: 68,  color: C.accent },
  { label: 'Completed', val: 44,  color: C.purple },
  { label: 'Qualified', val: 27,  color: '#22C55E' },
]

function AnalyticsVisual() {
  return (
    <div style={{ width: '88%', display: 'flex', flexDirection: 'column', gap: 10 }}>
      {FUNNEL.map((item, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 72, fontSize: 10, color: C.textMuted, textAlign: 'right', flexShrink: 0, fontFamily: FONT }}>
            {item.label}
          </div>
          <motion.div style={{ height: 22, borderRadius: 5, background: `${item.color}30`, border: `1px solid ${item.color}40`, overflow: 'hidden', flex: 1, position: 'relative' }}>
            <motion.div
              initial={{ width: 0 }}
              whileInView={{ width: `${item.val}%` }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, delay: i * 0.15, ease: 'easeOut' }}
              style={{ height: '100%', background: `linear-gradient(90deg, ${item.color}60, ${item.color})`, borderRadius: 5 }}
            />
            <span style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', fontSize: 10, fontWeight: 700, color: item.color, fontFamily: FONT }}>
              {item.val}%
            </span>
          </motion.div>
        </div>
      ))}
    </div>
  )
}

// ─── Feature data ─────────────────────────────────────────────────────────────
const FEATURES = [
  {
    icon: GitMerge, iconColor: C.accent,
    title: 'Visual DAG Builder',
    desc: 'Build flows as complex as your sales process. Conditional logic, scoring, multi-path branching — all drag & drop.',
    visual: <DagVisual />,
  },
  {
    icon: Sparkles, iconColor: C.purple,
    title: 'AI Flow Generation',
    desc: 'Describe your ideal customer in plain English. Our AI generates the full qualification flow in seconds.',
    visual: <AIVisual />,
  },
  {
    icon: BarChart2, iconColor: C.blue,
    title: 'Analytics & Routing',
    desc: 'See exactly where leads drop off, track qualification rates, and route winners to the right rep or calendar.',
    visual: <AnalyticsVisual />,
  },
]

export function FeaturesSection() {
  return (
    <Section id="features">
      <Inner>
        <TopLabel>Features</TopLabel>
        <Title>Built for modern sales teams.</Title>
        <Sub>
          Everything you need to qualify smarter —
          from a 2-question screener to a complex enterprise intake.
        </Sub>

        <FeaturesGrid>
          {FEATURES.map((f, i) => {
            const Icon = f.icon
            return (
              <FeatureCard
                key={i}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
              >
                <CardVisual>{f.visual}</CardVisual>
                <CardBody>
                  <CardIconWrap color={f.iconColor}>
                    <Icon size={18} color={f.iconColor} />
                  </CardIconWrap>
                  <CardTitle>{f.title}</CardTitle>
                  <CardDesc>{f.desc}</CardDesc>
                </CardBody>
              </FeatureCard>
            )
          })}
        </FeaturesGrid>
      </Inner>
    </Section>
  )
}
