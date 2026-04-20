import { useMemo, useState } from 'react'
import styled, { useTheme } from 'styled-components'
import { motion, AnimatePresence } from 'framer-motion'
import type { FlowPathDto } from '@shared/types/api.types'

// ─── Types ──────────────────────────────────────────────────────────────────

interface SankeyNode {
  id: string
  stepIndex: number
  title: string
  type: string
  totalCount: number
  y: number
  height: number
}

interface SankeyLink {
  sourceId: string
  targetId: string
  sourceStep: number
  targetStep: number
  count: number
  sourceY: number
  targetY: number
  thickness: number
}

interface NodeStat {
  answerCount: number
  droppedOffCount: number
  offerImpressions?: number
  offerConversions?: number
  offerConversionRate?: number
  avgAnswerDuration?: string | null
}

interface Props {
  paths: FlowPathDto[]
  nodeStatsMap?: Record<string, NodeStat>
}

// ─── Layout constants ───────────────────────────────────────────────────────

const NODE_WIDTH = 180
const STEP_GAP = 80
const NODE_V_GAP = 8
const MIN_NODE_H = 32
const MAX_NODE_H = 64
const MIN_LINK_THICKNESS = 2
const PADDING_X = 24
const PADDING_Y = 24

// ─── Helpers ────────────────────────────────────────────────────────────────

function formatDuration(raw: string | null | undefined): string | null {
  if (!raw) return null
  const parts = raw.split(':')
  if (parts.length < 3) return null
  const h = parseInt(parts[0], 10)
  const m = parseInt(parts[1], 10)
  const s = parseFloat(parts[2])
  const total = h * 3600 + m * 60 + s
  if (total === 0) return null
  if (h > 0) return `${h}h ${m}m ${Math.round(s)}s`
  if (m > 0) return `${m}m ${Math.round(s)}s`
  return `${s < 10 ? s.toFixed(1) : Math.round(s)}s`
}

function nodeTypeColor(type: string, theme: any): string {
  switch (type) {
    case 'Question':    return theme.colors.accent
    case 'InfoPage':    return theme.colors.success
    case 'Offer':       return theme.colors.warning
    case 'LeadCapture': return '#3B82F6'
    case 'Redirect':    return '#EF4444'
    default:            return theme.colors.textSecondary
  }
}

function buildSankeyData(paths: FlowPathDto[]) {
  // 1. Aggregate node counts per (stepIndex, nodeId)
  const stepNodeCounts = new Map<string, { nodeId: string; stepIndex: number; title: string; type: string; count: number }>()
  // 2. Aggregate link counts per (sourceStepNodeId -> targetStepNodeId)
  const linkCounts = new Map<string, { sourceId: string; targetId: string; sourceStep: number; targetStep: number; count: number }>()

  let maxSteps = 0

  for (const p of paths) {
    const nodes = p.nodes
    maxSteps = Math.max(maxSteps, nodes.length)

    for (let i = 0; i < nodes.length; i++) {
      const n = nodes[i]
      const key = `${i}:${n.id}`
      const existing = stepNodeCounts.get(key)
      if (existing) {
        existing.count += p.count
      } else {
        stepNodeCounts.set(key, {
          nodeId: n.id,
          stepIndex: i,
          title: n.title,
          type: n.type,
          count: p.count,
        })
      }

      if (i < nodes.length - 1) {
        const next = nodes[i + 1]
        const linkKey = `${i}:${n.id}->${i + 1}:${next.id}`
        const existingLink = linkCounts.get(linkKey)
        if (existingLink) {
          existingLink.count += p.count
        } else {
          linkCounts.set(linkKey, {
            sourceId: n.id,
            targetId: next.id,
            sourceStep: i,
            targetStep: i + 1,
            count: p.count,
          })
        }
      }
    }
  }

  // 3. Group nodes by step
  const stepGroups = new Map<number, typeof stepNodeCounts extends Map<string, infer V> ? V[] : never>()
  for (const node of stepNodeCounts.values()) {
    const list = stepGroups.get(node.stepIndex) || []
    list.push(node)
    stepGroups.set(node.stepIndex, list)
  }

  // Sort each step group by count (descending)
  for (const [, list] of stepGroups) {
    list.sort((a, b) => b.count - a.count)
  }

  // 4. Find max count for scaling
  const globalMaxCount = Math.max(...Array.from(stepNodeCounts.values()).map((n) => n.count), 1)

  // 5. Compute Y positions for nodes in each step
  const sankeyNodes: SankeyNode[] = []
  const nodePositions = new Map<string, { y: number; height: number }>()

  for (let step = 0; step < maxSteps; step++) {
    const group = stepGroups.get(step) || []
    let currentY = PADDING_Y

    for (const node of group) {
      const fraction = node.count / globalMaxCount
      const height = MIN_NODE_H + fraction * (MAX_NODE_H - MIN_NODE_H)
      const key = `${step}:${node.nodeId}`

      const sNode: SankeyNode = {
        id: key,
        stepIndex: step,
        title: node.title,
        type: node.type,
        totalCount: node.count,
        y: currentY,
        height,
      }
      sankeyNodes.push(sNode)
      nodePositions.set(key, { y: currentY, height })

      currentY += height + NODE_V_GAP
    }
  }

  // 6. Build links with positions
  const maxLinkCount = Math.max(...Array.from(linkCounts.values()).map((l) => l.count), 1)
  const sankeyLinks: SankeyLink[] = []

  for (const link of linkCounts.values()) {
    const sourceKey = `${link.sourceStep}:${link.sourceId}`
    const targetKey = `${link.targetStep}:${link.targetId}`
    const sourcePos = nodePositions.get(sourceKey)
    const targetPos = nodePositions.get(targetKey)

    if (!sourcePos || !targetPos) continue

    const fraction = link.count / maxLinkCount
    const thickness = Math.max(MIN_LINK_THICKNESS, fraction * 20)

    sankeyLinks.push({
      ...link,
      sourceY: sourcePos.y + sourcePos.height / 2,
      targetY: targetPos.y + targetPos.height / 2,
      thickness,
    })
  }

  // Compute total size
  let totalHeight = 0
  for (const [, group] of stepGroups) {
    let colH = PADDING_Y
    for (const node of group) {
      const fraction = node.count / globalMaxCount
      colH += MIN_NODE_H + fraction * (MAX_NODE_H - MIN_NODE_H) + NODE_V_GAP
    }
    totalHeight = Math.max(totalHeight, colH + PADDING_Y)
  }

  const totalWidth = PADDING_X * 2 + maxSteps * NODE_WIDTH + (maxSteps - 1) * STEP_GAP

  return { nodes: sankeyNodes, links: sankeyLinks, totalWidth, totalHeight, maxSteps, maxLinkCount }
}

function linkPath(
  sourceStep: number,
  sourceY: number,
  targetStep: number,
  targetY: number,
): string {
  const x1 = PADDING_X + sourceStep * (NODE_WIDTH + STEP_GAP) + NODE_WIDTH
  const x2 = PADDING_X + targetStep * (NODE_WIDTH + STEP_GAP)
  const midX = (x1 + x2) / 2
  return `M ${x1} ${sourceY} C ${midX} ${sourceY}, ${midX} ${targetY}, ${x2} ${targetY}`
}

// ─── Component ──────────────────────────────────────────────────────────────

export function FlowPathSankey({ paths, nodeStatsMap }: Props) {
  const theme = useTheme()
  const [hoveredLink, setHoveredLink] = useState<string | null>(null)
  const [hoveredNode, setHoveredNode] = useState<string | null>(null)

  const { nodes, links, totalWidth, totalHeight, maxLinkCount } = useMemo(
    () => buildSankeyData(paths),
    [paths]
  )

  const totalUsers = useMemo(
    () => paths.reduce((sum, p) => sum + p.count, 0),
    [paths]
  )

  if (paths.length === 0) return null

  return (
    <Wrapper>
      <Header>
        <Title>User Flow Paths</Title>
        <Subtitle>{paths.length} unique paths &middot; {totalUsers} total users</Subtitle>
      </Header>

      <Legend>
        <LegendItem><LegendDot $color={theme.colors.accent} /> Question</LegendItem>
        <LegendItem><LegendDot $color={theme.colors.success} /> Info Page</LegendItem>
        <LegendItem><LegendDot $color={theme.colors.warning} /> Offer</LegendItem>
        <LegendItem><LegendDot $color="#3B82F6" /> Lead Capture</LegendItem>
        <LegendItem><LegendDot $color="#EF4444" /> Redirect</LegendItem>
        <LegendHint>Brighter bands = more users</LegendHint>
      </Legend>

      <ScrollContainer>
        <svg
          width={totalWidth}
          height={Math.max(totalHeight, 200)}
          viewBox={`0 0 ${totalWidth} ${Math.max(totalHeight, 200)}`}
        >
          {/* Step labels */}
          {Array.from({ length: nodes.reduce((max, n) => Math.max(max, n.stepIndex + 1), 0) }).map((_, i) => (
            <text
              key={`step-${i}`}
              x={PADDING_X + i * (NODE_WIDTH + STEP_GAP) + NODE_WIDTH / 2}
              y={14}
              textAnchor="middle"
              fill={theme.colors.textTertiary}
              fontSize="11"
              fontWeight="600"
              fontFamily={theme.typography.fontFamily}
            >
              Step {i + 1}
            </text>
          ))}

          {/* Links */}
          {links.map((link) => {
            const key = `${link.sourceStep}:${link.sourceId}->${link.targetStep}:${link.targetId}`
            const fraction = link.count / maxLinkCount
            const baseOpacity = 0.12 + fraction * 0.55
            const isHovered = hoveredLink === key
            const isNodeHovered = hoveredNode && (
              hoveredNode === `${link.sourceStep}:${link.sourceId}` ||
              hoveredNode === `${link.targetStep}:${link.targetId}`
            )
            const dimmed = (hoveredNode || hoveredLink) && !isHovered && !isNodeHovered

            return (
              <motion.path
                key={key}
                d={linkPath(link.sourceStep, link.sourceY, link.targetStep, link.targetY)}
                fill="none"
                stroke={theme.colors.accent}
                strokeWidth={link.thickness}
                strokeLinecap="round"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{
                  pathLength: 1,
                  opacity: dimmed ? 0.06 : isHovered || isNodeHovered ? Math.min(baseOpacity + 0.25, 1) : baseOpacity,
                }}
                transition={{ duration: 0.8, delay: 0.1 }}
                onMouseEnter={() => setHoveredLink(key)}
                onMouseLeave={() => setHoveredLink(null)}
                style={{ cursor: 'pointer' }}
              />
            )
          })}

          {/* Nodes */}
          {nodes.map((node, i) => {
            const x = PADDING_X + node.stepIndex * (NODE_WIDTH + STEP_GAP)
            const color = nodeTypeColor(node.type, theme)
            const isHovered = hoveredNode === node.id
            const connectedByLink = hoveredLink && links.some(
              (l) =>
                (`${l.sourceStep}:${l.sourceId}->${l.targetStep}:${l.targetId}` === hoveredLink) &&
                (`${l.sourceStep}:${l.sourceId}` === node.id || `${l.targetStep}:${l.targetId}` === node.id)
            )
            const dimmed = (hoveredNode || hoveredLink) && !isHovered && !connectedByLink

            return (
              <motion.g
                key={node.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: dimmed ? 0.3 : 1, x: 0 }}
                transition={{ duration: 0.4, delay: i * 0.02 }}
                onMouseEnter={() => setHoveredNode(node.id)}
                onMouseLeave={() => setHoveredNode(null)}
                style={{ cursor: 'pointer' }}
              >
                {/* Node background */}
                <rect
                  x={x}
                  y={node.y}
                  width={NODE_WIDTH}
                  height={node.height}
                  rx={6}
                  fill={theme.colors.bgSurface}
                  stroke={isHovered ? color : theme.colors.border}
                  strokeWidth={isHovered ? 2 : 1}
                />
                {/* Left accent bar */}
                <rect
                  x={x}
                  y={node.y}
                  width={4}
                  height={node.height}
                  rx={2}
                  fill={color}
                />
                {/* Title (truncated) */}
                <text
                  x={x + 14}
                  y={node.y + node.height / 2 - (node.height > 40 ? 4 : 0)}
                  fill={theme.colors.textPrimary}
                  fontSize="12"
                  fontWeight="500"
                  fontFamily={theme.typography.fontFamily}
                  dominantBaseline="central"
                >
                  {node.title.length > 22 ? node.title.slice(0, 20) + '...' : node.title}
                </text>
                {/* Count badge */}
                {node.height > 40 && (
                  <text
                    x={x + 14}
                    y={node.y + node.height / 2 + 12}
                    fill={theme.colors.textTertiary}
                    fontSize="10"
                    fontWeight="600"
                    fontFamily={theme.typography.fontFamily}
                  >
                    {node.totalCount} user{node.totalCount !== 1 ? 's' : ''}
                  </text>
                )}
                {node.height <= 40 && (
                  <text
                    x={x + NODE_WIDTH - 8}
                    y={node.y + node.height / 2}
                    fill={theme.colors.textTertiary}
                    fontSize="10"
                    fontWeight="600"
                    fontFamily={theme.typography.fontFamily}
                    textAnchor="end"
                    dominantBaseline="central"
                  >
                    {node.totalCount}
                  </text>
                )}
              </motion.g>
            )
          })}
        </svg>
      </ScrollContainer>

      {/* Hovered link tooltip */}
      <AnimatePresence>
        {hoveredLink && !hoveredNode && (() => {
          const link = links.find(
            (l) => `${l.sourceStep}:${l.sourceId}->${l.targetStep}:${l.targetId}` === hoveredLink
          )
          if (!link) return null
          const sourceNode = nodes.find((n) => n.id === `${link.sourceStep}:${link.sourceId}`)
          const targetNode = nodes.find((n) => n.id === `${link.targetStep}:${link.targetId}`)
          return (
            <Tooltip
              key="link-tooltip"
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 4 }}
            >
              <TooltipRow>
                <TooltipLabel>From:</TooltipLabel> {sourceNode?.title || 'Unknown'}
              </TooltipRow>
              <TooltipRow>
                <TooltipLabel>To:</TooltipLabel> {targetNode?.title || 'Unknown'}
              </TooltipRow>
              <TooltipRow>
                <TooltipLabel>Users:</TooltipLabel> <strong>{link.count}</strong>
                {totalUsers > 0 && (
                  <TooltipPct>({((link.count / totalUsers) * 100).toFixed(1)}%)</TooltipPct>
                )}
              </TooltipRow>
            </Tooltip>
          )
        })()}

        {/* Hovered node stats panel */}
        {hoveredNode && (() => {
          const node = nodes.find((n) => n.id === hoveredNode)
          if (!node) return null
          const nodeId = node.id.split(':')[1] // strip "stepIndex:" prefix
          const ns = nodeStatsMap?.[nodeId]
          const color = nodeTypeColor(node.type, theme)
          const total = ns ? ns.answerCount + ns.droppedOffCount : 0
          const dropPct = total > 0 ? (ns!.droppedOffCount / total) * 100 : 0
          return (
            <NodePanel
              key="node-panel"
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }}
            >
              <NodePanelHeader>
                <NodePanelDot $color={color} />
                <NodePanelTitle>{node.title}</NodePanelTitle>
              </NodePanelHeader>
              <NodePanelBadge $color={color}>{node.type}</NodePanelBadge>
              <NodePanelDivider />
              <NodePanelStat>
                <NodePanelStatLabel>Reach</NodePanelStatLabel>
                {/* Use answerCount+droppedOffCount when available — it's the true total;
                    node.totalCount only counts users who continued past this node */}
                <NodePanelStatVal>{ns ? total : node.totalCount}</NodePanelStatVal>
              </NodePanelStat>
              {ns && (
                <>
                  {(node.type === 'Question' || node.type === 'InfoPage' || node.type === 'LeadCapture') && (
                    <>
                      <NodePanelStat>
                        <NodePanelStatLabel>{node.type === 'LeadCapture' ? 'Submitted' : 'Responses'}</NodePanelStatLabel>
                        <NodePanelStatVal>{ns.answerCount}</NodePanelStatVal>
                      </NodePanelStat>
                      <NodePanelStat>
                        <NodePanelStatLabel>Drop-offs</NodePanelStatLabel>
                        <NodePanelStatVal $danger={dropPct > 40}>{ns.droppedOffCount}</NodePanelStatVal>
                      </NodePanelStat>
                      {total > 0 && (
                        <NodePanelBarWrap>
                          <NodePanelBarTrack>
                            <NodePanelBarFill style={{ width: `${dropPct}%`, background: dropPct > 40 ? theme.colors.error : theme.colors.warning }} />
                          </NodePanelBarTrack>
                          <NodePanelBarLabel $danger={dropPct > 40}>{dropPct.toFixed(1)}%</NodePanelBarLabel>
                        </NodePanelBarWrap>
                      )}
                      {formatDuration(ns.avgAnswerDuration) && (
                        <>
                          <NodePanelDivider />
                          <NodePanelStat>
                            <NodePanelStatLabel>Avg time</NodePanelStatLabel>
                            <NodePanelStatVal>{formatDuration(ns.avgAnswerDuration)}</NodePanelStatVal>
                          </NodePanelStat>
                        </>
                      )}
                    </>
                  )}
                  {node.type === 'Offer' && ns.offerImpressions !== undefined && (
                    <>
                      <NodePanelStat>
                        <NodePanelStatLabel>Impressions</NodePanelStatLabel>
                        <NodePanelStatVal>{ns.offerImpressions}</NodePanelStatVal>
                      </NodePanelStat>
                      <NodePanelStat>
                        <NodePanelStatLabel>Conversions</NodePanelStatLabel>
                        <NodePanelStatVal>{ns.offerConversions ?? 0}</NodePanelStatVal>
                      </NodePanelStat>
                      <NodePanelStat>
                        <NodePanelStatLabel>Conv. Rate</NodePanelStatLabel>
                        <NodePanelStatVal>{(ns.offerConversionRate ?? 0).toFixed(1)}%</NodePanelStatVal>
                      </NodePanelStat>
                    </>
                  )}
                  {node.type === 'Redirect' && (
                    <NodePanelMuted>Terminal node</NodePanelMuted>
                  )}
                </>
              )}
              {!ns && (
                <NodePanelMuted>No stats recorded</NodePanelMuted>
              )}
            </NodePanel>
          )
        })()}
      </AnimatePresence>
    </Wrapper>
  )
}

// ─── Styles ─────────────────────────────────────────────────────────────────

const Wrapper = styled.div`
  position: relative;
  background: ${({ theme }) => theme.colors.bgSurface};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.md};
  overflow: hidden;
`

const Header = styled.div`
  padding: 16px 20px 0;
`

const Title = styled.h3`
  font-size: ${({ theme }) => theme.typography.sizes.md};
  font-weight: ${({ theme }) => theme.typography.weights.semibold};
  color: ${({ theme }) => theme.colors.textPrimary};
  margin: 0;
`

const Subtitle = styled.p`
  font-size: ${({ theme }) => theme.typography.sizes.xs};
  color: ${({ theme }) => theme.colors.textTertiary};
  margin: 2px 0 0;
`

const Legend = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 10px 20px;
  font-size: ${({ theme }) => theme.typography.sizes.xs};
  color: ${({ theme }) => theme.colors.textSecondary};
`

const LegendItem = styled.span`
  display: flex;
  align-items: center;
  gap: 5px;
`

const LegendDot = styled.span<{ $color: string }>`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: ${({ $color }) => $color};
`

const LegendHint = styled.span`
  margin-left: auto;
  font-style: italic;
  color: ${({ theme }) => theme.colors.textTertiary};
`

const ScrollContainer = styled.div`
  overflow-x: auto;
  padding: 0 8px 16px;

  &::-webkit-scrollbar {
    height: 6px;
  }
  &::-webkit-scrollbar-track {
    background: ${({ theme }) => theme.colors.bgElevated};
    border-radius: 3px;
  }
  &::-webkit-scrollbar-thumb {
    background: ${({ theme }) => theme.colors.border};
    border-radius: 3px;
  }
`

const Tooltip = styled(motion.div)`
  position: absolute;
  bottom: 12px;
  left: 20px;
  background: ${({ theme }) => theme.colors.bgElevated};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.sm};
  padding: 10px 14px;
  font-size: ${({ theme }) => theme.typography.sizes.xs};
  color: ${({ theme }) => theme.colors.textPrimary};
  box-shadow: ${({ theme }) => theme.shadows.md};
  pointer-events: none;
  z-index: 10;
  display: flex;
  flex-direction: column;
  gap: 3px;
`

const TooltipRow = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
`

const TooltipLabel = styled.span`
  color: ${({ theme }) => theme.colors.textTertiary};
  font-weight: ${({ theme }) => theme.typography.weights.medium};
  min-width: 36px;
`

const TooltipPct = styled.span`
  color: ${({ theme }) => theme.colors.textTertiary};
  margin-left: 4px;
`

// ── Node Stats Panel ─────────────────────────────────────────────────────────

const NodePanel = styled(motion.div)`
  position: absolute;
  bottom: 12px;
  left: 20px;
  background: ${({ theme }) => theme.colors.bgElevated};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.sm};
  padding: 12px 14px;
  font-size: ${({ theme }) => theme.typography.sizes.xs};
  color: ${({ theme }) => theme.colors.textPrimary};
  box-shadow: ${({ theme }) => theme.shadows.md};
  pointer-events: none;
  z-index: 10;
  min-width: 160px;
  display: flex;
  flex-direction: column;
  gap: 4px;
`

const NodePanelHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 2px;
`

const NodePanelDot = styled.div<{ $color: string }>`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: ${({ $color }) => $color};
  flex-shrink: 0;
`

const NodePanelTitle = styled.div`
  font-size: ${({ theme }) => theme.typography.sizes.xs};
  font-weight: ${({ theme }) => theme.typography.weights.semibold};
  color: ${({ theme }) => theme.colors.textPrimary};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 130px;
`

const NodePanelBadge = styled.div<{ $color: string }>`
  display: inline-flex;
  width: fit-content;
  padding: 1px 7px;
  border-radius: 999px;
  background: ${({ $color }) => `${$color}20`};
  color: ${({ $color }) => $color};
  font-size: 10px;
  font-weight: 600;
`

const NodePanelDivider = styled.div`
  height: 1px;
  background: ${({ theme }) => theme.colors.border};
  margin: 2px 0;
`

const NodePanelStat = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
`

const NodePanelStatLabel = styled.span`
  color: ${({ theme }) => theme.colors.textTertiary};
`

const NodePanelStatVal = styled.span<{ $danger?: boolean }>`
  font-weight: ${({ theme }) => theme.typography.weights.semibold};
  color: ${({ $danger, theme }) => $danger ? theme.colors.error : theme.colors.textPrimary};
`

const NodePanelBarWrap = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 2px;
`

const NodePanelBarTrack = styled.div`
  flex: 1;
  height: 5px;
  background: ${({ theme }) => theme.colors.bgSurface};
  border-radius: 3px;
  overflow: hidden;
`

const NodePanelBarFill = styled.div`
  height: 100%;
  border-radius: 3px;
  transition: width 0.3s ease;
`

const NodePanelBarLabel = styled.span<{ $danger: boolean }>`
  font-size: 10px;
  font-weight: 600;
  color: ${({ $danger, theme }) => $danger ? theme.colors.error : theme.colors.warning};
  flex-shrink: 0;
`

const NodePanelMuted = styled.div`
  color: ${({ theme }) => theme.colors.textTertiary};
  font-style: italic;
`
