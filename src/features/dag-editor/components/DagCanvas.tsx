import { useCallback, useEffect, useRef } from 'react'
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  BackgroundVariant,
  useReactFlow,
  Panel,
  MarkerType,
} from 'reactflow'
import type { Node, Connection } from 'reactflow'
import 'reactflow/dist/style.css'
import styled, { useTheme } from 'styled-components'
import { useDagStore } from '../store/dag.store'
import { NodePalette } from './NodePalette'
import { PropertiesPanel } from './PropertiesPanel'
import { QuestionNode } from './nodes/QuestionNode'
import { InfoNode } from './nodes/InfoNode'
import { OfferNode } from './nodes/OfferNode'
import { LeadCaptureNode } from './nodes/LeadCaptureNode'
import { RedirectNode } from './nodes/RedirectNode'
import { ConditionEdge } from './ConditionEdge'
import { NodeType, AnswerType, ValueKind } from '@shared/types/dag.types'
import type {
  DagNodeData,
  QuestionNodeData,
  InfoNodeData,
  OfferNodeData,
  LeadCaptureNodeData,
  RedirectNodeData,
} from '@shared/types/dag.types'
import { useParams } from '@tanstack/react-router'
import { useFlow } from '@/features/flows/hooks/useFlows'

// ─── Type registries — MUST be defined outside the component ──────────────────
const nodeTypes = {
  [NodeType.Question]:    QuestionNode,
  [NodeType.Info]:        InfoNode,
  [NodeType.Offer]:       OfferNode,
  [NodeType.LeadCapture]: LeadCaptureNode,
  [NodeType.Redirect]:    RedirectNode,
} as const

const edgeTypes = {
  conditionEdge: ConditionEdge,
} as const

const defaultEdgeOptions = {
  type: 'conditionEdge',
  markerEnd: { type: MarkerType.ArrowClosed, width: 18, height: 18 },
  data: {},
}

// ─── Node data factories ──────────────────────────────────────────────────────
function createNodeData(type: NodeType): DagNodeData {
  switch (type) {
    case NodeType.Question:
      return {
        type: NodeType.Question,
        title: 'New question',
        attributeKey: 'attribute_key',
        answerType: AnswerType.SingleChoice,
        valueKind: ValueKind.Text,
        options: [],
      } satisfies QuestionNodeData

    case NodeType.Info:
      return {
        type: NodeType.Info,
        title: 'New info screen',
        body: 'Add context or instructions here.',
      } satisfies InfoNodeData

    case NodeType.Offer:
      return {
        type: NodeType.Offer,
        name: 'New Offer',
        headline: 'Ready to talk to our team?',
        body: 'Based on your answers, you\'re a great fit. Book a call to learn more.',
        ctaText: 'Book a call',
      } satisfies OfferNodeData

    case NodeType.LeadCapture:
      return {
        type: NodeType.LeadCapture,
        title: 'Almost there!',
        isRequired: true,
        fields: [
          { fieldType: 'FullName', isRequired: true, displayOrder: 0 },
          { fieldType: 'Email', isRequired: true, displayOrder: 1 },
          { fieldType: 'CompanyName', isRequired: false, displayOrder: 2 },
        ],
      } satisfies LeadCaptureNodeData

    case NodeType.Redirect:
      return {
        type: NodeType.Redirect,
        title: 'Thanks for your time',
        description: "This solution isn't the right fit right now, but we'll keep you in mind.",
        tier: 'Cold',
        links: [],
      } satisfies RedirectNodeData
  }
}

// ─── Component ────────────────────────────────────────────────────────────────
export function DagCanvas() {
  const theme = useTheme()
  const reactFlowWrapper = useRef<HTMLDivElement>(null)
  const { screenToFlowPosition, fitView } = useReactFlow()
  const hasFittedRef = useRef(false)
  const { surveyId } = useParams({ from: '/editor/$surveyId' })
  useFlow(surveyId) // keep cache warm

  const nodes = useDagStore((s) => s.nodes)
  const edges = useDagStore((s) => s.edges)
  const onNodesChange = useDagStore((s) => s.onNodesChange)
  const onEdgesChange = useDagStore((s) => s.onEdgesChange)
  const onConnect = useDagStore((s) => s.onConnect)
  const addNode = useDagStore((s) => s.addNode)
  const setSelectedNode = useDagStore((s) => s.setSelectedNode)
  const setSelectedEdge = useDagStore((s) => s.setSelectedEdge)

  // ─── Auto-fit view when nodes first load ──────────────────────────────────
  useEffect(() => {
    if (nodes.length > 0 && !hasFittedRef.current) {
      hasFittedRef.current = true
      const timer = setTimeout(() => {
        fitView({ padding: 0.15, duration: 300 })
      }, 150)
      return () => clearTimeout(timer)
    }
    if (nodes.length === 0) hasFittedRef.current = false
  }, [nodes.length, fitView])

  // ─── Drag from palette ────────────────────────────────────────────────────
  const onDragStart = useCallback((e: React.DragEvent, type: NodeType) => {
    e.dataTransfer.setData('application/reactflow-type', type)
    e.dataTransfer.effectAllowed = 'move'
  }, [])

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }, [])

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      const type = e.dataTransfer.getData('application/reactflow-type') as NodeType
      if (!type || !Object.values(NodeType).includes(type)) return

      const position = screenToFlowPosition({ x: e.clientX, y: e.clientY })

      const newNode: Node<DagNodeData> = {
        id: crypto.randomUUID(),
        type,
        position,
        data: { ...createNodeData(type), isLocal: true },
      }

      addNode(newNode)
      setSelectedNode(newNode.id)
    },
    [screenToFlowPosition, addNode, setSelectedNode],
  )

  const handleConnect = useCallback(
    (connection: Connection) => onConnect(connection),
    [onConnect],
  )

  const miniMapNodeColor = useCallback(
    (n: Node) => {
      switch (n.type) {
        case NodeType.Question:    return theme.colors.nodeQuestion
        case NodeType.Info:        return theme.colors.nodeInfo
        case NodeType.Offer:       return theme.colors.nodeOffer
        case NodeType.LeadCapture: return '#3B82F6'
        case NodeType.Redirect:    return '#EF4444'
        default:                   return theme.colors.border
      }
    },
    [theme],
  )

  return (
    <EditorLayout>
      <NodePalette onDragStart={onDragStart} />

      <CanvasWrapper ref={reactFlowWrapper}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          defaultEdgeOptions={defaultEdgeOptions}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={handleConnect}
          onDrop={onDrop}
          onDragOver={onDragOver}
          onNodeClick={(_, node) => setSelectedNode(node.id)}
          onEdgeClick={(_, edge) => setSelectedEdge(edge.id)}
          onPaneClick={() => {
            setSelectedNode(null)
            setSelectedEdge(null)
          }}
          fitView
          fitViewOptions={{ padding: 0.15 }}
          snapToGrid
          snapGrid={[16, 16]}
          deleteKeyCode={['Backspace', 'Delete']}
          proOptions={{ hideAttribution: true }}
        >
          <Background
            variant={BackgroundVariant.Dots}
            gap={22}
            size={1.2}
            color={theme.colors.border}
          />

          <Controls
            showInteractive={false}
            style={{
              background: theme.colors.bgSurface,
              border: `1px solid ${theme.colors.border}`,
              borderRadius: 10,
              boxShadow: theme.shadows.sm,
              overflow: 'hidden',
            }}
          />

          <MiniMap
            nodeColor={miniMapNodeColor}
            maskColor={
              theme.mode === 'dark'
                ? 'rgba(0,0,0,0.55)'
                : 'rgba(255,255,255,0.65)'
            }
            style={{
              background: theme.colors.bgSurface,
              border: `1px solid ${theme.colors.border}`,
              borderRadius: 10,
              boxShadow: theme.shadows.sm,
            }}
          />

          {nodes.length === 0 && (
            <Panel position="top-center" style={{ marginTop: '15%' }}>
              <EmptyHint>
                <EmptyIcon>🎯</EmptyIcon>
                <p style={{ fontWeight: 600, marginBottom: 6 }}>Canvas is empty</p>
                <p>Drag a node type from the left panel onto this canvas to start</p>
                <p style={{ marginTop: 4, fontSize: 11, opacity: 0.65 }}>
                  Then drag from a node's <strong>right ●</strong> to another's{' '}
                  <strong>left ●</strong> to create a connection
                </p>
              </EmptyHint>
            </Panel>
          )}
        </ReactFlow>
      </CanvasWrapper>

      <PropertiesPanel />
    </EditorLayout>
  )
}

// ─── Layout ───────────────────────────────────────────────────────────────────
const EditorLayout = styled.div`
  display: flex;
  flex: 1 1 0%;
  min-height: 0;
  min-width: 0;
  overflow: hidden;
  height: 100%;
`

const CanvasWrapper = styled.div`
  flex: 1 1 0%;
  min-height: 0;
  min-width: 0;
  position: relative;
  height: 100%;

  .react-flow {
    width: 100% !important;
    height: 100% !important;
  }
`

const EmptyHint = styled.div`
  pointer-events: none;
  text-align: center;
  color: ${({ theme }) => theme.colors.textTertiary};
  font-size: ${({ theme }) => theme.typography.sizes.sm};
  padding: 0 16px;
`

const EmptyIcon = styled.div`
  font-size: 38px;
  margin-bottom: 12px;
`
