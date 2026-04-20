import React from 'react'
import styled from 'styled-components'
import { motion } from 'framer-motion'
import { Check, X } from 'lucide-react'
import { C, FONT } from '../constants'

const Section = styled.section`
  background: ${C.surface};
  padding: 100px 24px;
  font-family: ${FONT};
  @media (max-width: 768px) { padding: 72px 16px; }
`

const Inner = styled.div`
  max-width: 860px;
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
  font-size: clamp(28px, 4vw, 42px);
  font-weight: 800;
  letter-spacing: -1.5px;
  color: ${C.textPrimary};
  margin: 0 0 16px;
`

const Sub = styled.p`
  text-align: center;
  font-size: 15px;
  color: ${C.textSecondary};
  max-width: 440px;
  margin: 0 auto 52px;
  line-height: 1.65;
  @media (max-width: 768px) { font-size: 14px; margin-bottom: 36px; }
`

const TableScroll = styled.div`
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  border-radius: 16px;
  border: 1px solid ${C.border};
`

const Table = styled.div`
  min-width: 540px;
  border-radius: 0;
  overflow: hidden;
`

const TableHeader = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  background: ${C.elevated};
  border-bottom: 1px solid ${C.border};
`

const HeaderCell = styled.div<{ highlighted?: boolean }>`
  padding: 16px 20px;
  text-align: center;
  font-size: 13px;
  font-weight: 700;
  color: ${({ highlighted }) => (highlighted ? C.accentText : C.textSecondary)};
  border-left: ${({ highlighted }) => (highlighted ? `1px solid rgba(99,102,241,0.25)` : 'none')};
  border-right: ${({ highlighted }) => (highlighted ? `1px solid rgba(99,102,241,0.25)` : 'none')};
  background: ${({ highlighted }) => (highlighted ? 'rgba(99,102,241,0.08)' : 'transparent')};
  position: relative;

  &::after {
    content: ${({ highlighted }) => (highlighted ? '"★ Recommended"' : 'none')};
    position: absolute;
    top: -10px;
    left: 50%;
    transform: translateX(-50%);
    font-size: 9px;
    font-weight: 700;
    color: ${C.accentText};
    background: rgba(99,102,241,0.2);
    border: 1px solid rgba(99,102,241,0.35);
    border-radius: 4px;
    padding: 2px 7px;
    letter-spacing: 0.5px;
    white-space: nowrap;
  }
`

const TableRow = styled(motion.div)`
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  border-bottom: 1px solid ${C.border};
  &:last-child { border-bottom: none; }
  &:hover { background: rgba(255,255,255,0.015); }
`

const FeatureCell = styled.div`
  padding: 13px 16px;
  font-size: 13px;
  font-weight: 500;
  color: ${C.textSecondary};
  display: flex;
  align-items: center;
`

const ValueCell = styled.div<{ highlighted?: boolean }>`
  padding: 13px 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-left: ${({ highlighted }) => (highlighted ? `1px solid rgba(99,102,241,0.15)` : 'none')};
  border-right: ${({ highlighted }) => (highlighted ? `1px solid rgba(99,102,241,0.15)` : 'none')};
  background: ${({ highlighted }) => (highlighted ? 'rgba(99,102,241,0.04)' : 'transparent')};
  font-size: 12px;
  font-weight: 600;
  color: ${C.textSecondary};
`

const CheckIcon = styled.div`
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: rgba(34,197,94,0.15);
  border: 1px solid rgba(34,197,94,0.3);
  display: flex;
  align-items: center;
  justify-content: center;
`

const XIcon = styled.div`
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: rgba(239,68,68,0.1);
  border: 1px solid rgba(239,68,68,0.2);
  display: flex;
  align-items: center;
  justify-content: center;
`

const ROWS = [
  { feature: 'Filters unqualified leads',        them: false, us: true  },
  { feature: 'Conditional branching logic',       them: false, us: true  },
  { feature: 'Visual DAG flow builder',           them: false, us: true  },
  { feature: 'AI-generated qualification flows',  them: false, us: true  },
  { feature: 'Lead scoring & routing',            them: false, us: true  },
  { feature: 'Custom disqualification messages',  them: false, us: true  },
  { feature: 'Drop-off analytics',                them: false, us: true  },
  { feature: 'Calendar scheduling',               them: true,  us: true  },
  { feature: 'Team seat management',              them: false, us: true  },
]

export function ComparisonSection() {
  return (
    <Section>
      <Inner>
        <TopLabel>Comparison</TopLabel>
        <Title>Why not just use Calendly?</Title>
        <Sub>
          Calendly books meetings. We make sure only the right
          meetings get booked.
        </Sub>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <TableScroll>
            <Table>
              <TableHeader>
                <HeaderCell>Feature</HeaderCell>
                <HeaderCell>Calendly alone</HeaderCell>
                <HeaderCell highlighted>Qualify</HeaderCell>
              </TableHeader>

              {ROWS.map((row, i) => (
                <TableRow
                  key={i}
                  initial={{ opacity: 0, x: -8 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.35, delay: i * 0.05 }}
                >
                  <FeatureCell>{row.feature}</FeatureCell>
                  <ValueCell>
                    {row.them
                      ? <CheckIcon><Check size={12} color="#22C55E" /></CheckIcon>
                      : <XIcon><X size={12} color={C.error} /></XIcon>}
                  </ValueCell>
                  <ValueCell highlighted>
                    {row.us
                      ? <CheckIcon><Check size={12} color="#22C55E" /></CheckIcon>
                      : <XIcon><X size={12} color={C.error} /></XIcon>}
                  </ValueCell>
                </TableRow>
              ))}
            </Table>
          </TableScroll>
        </motion.div>
      </Inner>
    </Section>
  )
}
