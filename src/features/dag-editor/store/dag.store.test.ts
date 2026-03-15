import { describe, it, expect, beforeEach } from 'vitest'
import type { Node, Edge } from 'reactflow'
import { useDagStore, selectSelectedNode, selectSelectedEdge } from '@features/dag-editor/store/dag.store'
import { NodeType, AttributeKey, AnswerType } from '@shared/types/dag.types'
import type { DagNodeData } from '@shared/types/dag.types'

const makeQuestionNode = (id: string, x = 0, y = 0): Node<DagNodeData> => ({
  id,
  type: NodeType.Question,
  position: { x, y },
  data: {
    type: NodeType.Question,
    questionText: `Question ${id}`,
    attribute: AttributeKey.Goal,
    answerType: AnswerType.SingleChoice,
    options: [],
  },
})

const makeEdge = (id: string, source: string, target: string): Edge => ({
  id,
  source,
  target,
  type: 'conditionEdge',
  data: {},
})

describe('useDagStore', () => {
  beforeEach(() => {
    useDagStore.setState({
      surveyId: null,
      nodes: [],
      edges: [],
      selectedNodeId: null,
      selectedEdgeId: null,
      isDirty: false,
    })
  })

  // ── loadSurvey ────────────────────────────────────────────────────────────

  it('loadSurvey replaces nodes and edges and resets dirty flag', () => {
    const nodes = [makeQuestionNode('n1'), makeQuestionNode('n2')]
    const edges = [makeEdge('e1', 'n1', 'n2')]

    useDagStore.getState().loadSurvey('survey-1', nodes, edges)

    const state = useDagStore.getState()
    expect(state.surveyId).toBe('survey-1')
    expect(state.nodes).toHaveLength(2)
    expect(state.edges).toHaveLength(1)
    expect(state.isDirty).toBe(false)
    expect(state.selectedNodeId).toBeNull()
    expect(state.selectedEdgeId).toBeNull()
  })

  // ── addNode ───────────────────────────────────────────────────────────────

  it('addNode appends a node and marks dirty', () => {
    const node = makeQuestionNode('n1')
    useDagStore.getState().addNode(node)

    const state = useDagStore.getState()
    expect(state.nodes).toHaveLength(1)
    expect(state.nodes[0].id).toBe('n1')
    expect(state.isDirty).toBe(true)
  })

  // ── updateNodeData ────────────────────────────────────────────────────────

  it('updateNodeData merges partial data and marks dirty', () => {
    useDagStore.getState().addNode(makeQuestionNode('n1'))
    useDagStore.setState({ isDirty: false }) // reset dirty after add

    useDagStore.getState().updateNodeData('n1', { questionText: 'Updated?' })

    const node = useDagStore.getState().nodes.find((n) => n.id === 'n1')
    expect((node?.data as { questionText: string }).questionText).toBe('Updated?')
    expect(useDagStore.getState().isDirty).toBe(true)
  })

  it('updateNodeData is a no-op for unknown node id', () => {
    useDagStore.getState().addNode(makeQuestionNode('n1'))
    const before = useDagStore.getState().nodes[0].data

    useDagStore.getState().updateNodeData('unknown', { questionText: 'Ghost' })

    expect(useDagStore.getState().nodes[0].data).toEqual(before)
  })

  // ── deleteNode ────────────────────────────────────────────────────────────

  it('deleteNode removes the node and its connected edges', () => {
    const n1 = makeQuestionNode('n1')
    const n2 = makeQuestionNode('n2')
    const edge = makeEdge('e1', 'n1', 'n2')
    useDagStore.getState().addNode(n1)
    useDagStore.getState().addNode(n2)
    useDagStore.setState((s) => ({ edges: [...s.edges, edge] }))

    useDagStore.getState().deleteNode('n1')

    const state = useDagStore.getState()
    expect(state.nodes.find((n) => n.id === 'n1')).toBeUndefined()
    expect(state.edges).toHaveLength(0)
    expect(state.isDirty).toBe(true)
  })

  it('deleteNode clears selectedNodeId when the selected node is deleted', () => {
    useDagStore.getState().addNode(makeQuestionNode('n1'))
    useDagStore.getState().setSelectedNode('n1')

    useDagStore.getState().deleteNode('n1')

    expect(useDagStore.getState().selectedNodeId).toBeNull()
  })

  // ── selection ─────────────────────────────────────────────────────────────

  it('setSelectedNode clears selectedEdgeId', () => {
    useDagStore.setState({ selectedEdgeId: 'e1' })
    useDagStore.getState().setSelectedNode('n1')

    const state = useDagStore.getState()
    expect(state.selectedNodeId).toBe('n1')
    expect(state.selectedEdgeId).toBeNull()
  })

  it('setSelectedEdge clears selectedNodeId', () => {
    useDagStore.setState({ selectedNodeId: 'n1' })
    useDagStore.getState().setSelectedEdge('e1')

    const state = useDagStore.getState()
    expect(state.selectedEdgeId).toBe('e1')
    expect(state.selectedNodeId).toBeNull()
  })

  // ── updateEdgeCondition ───────────────────────────────────────────────────

  it('updateEdgeCondition sets condition and label on the edge', () => {
    useDagStore.getState().addNode(makeQuestionNode('n1'))
    useDagStore.getState().addNode(makeQuestionNode('n2'))
    useDagStore.setState((s) => ({ edges: [...s.edges, makeEdge('e1', 'n1', 'n2')] }))

    useDagStore.getState().updateEdgeCondition('e1', {
      always: false,
      rules: [{ attributeKey: AttributeKey.Goal, value: 'weight_loss' }],
      priority: 0,
    })

    const edge = useDagStore.getState().edges.find((e) => e.id === 'e1')
    expect(edge?.data?.conditions?.rules[0]?.value).toBe('weight_loss')
    expect(edge?.data?.label).toContain('weight_loss')
    expect(useDagStore.getState().isDirty).toBe(true)
  })

  // ── markSaved ─────────────────────────────────────────────────────────────

  it('markSaved clears the dirty flag', () => {
    useDagStore.getState().addNode(makeQuestionNode('n1'))
    expect(useDagStore.getState().isDirty).toBe(true)

    useDagStore.getState().markSaved()
    expect(useDagStore.getState().isDirty).toBe(false)
  })

  // ── selectors ─────────────────────────────────────────────────────────────

  it('selectSelectedNode returns the selected node', () => {
    useDagStore.getState().addNode(makeQuestionNode('n1'))
    useDagStore.getState().setSelectedNode('n1')

    const node = selectSelectedNode(useDagStore.getState())
    expect(node?.id).toBe('n1')
  })

  it('selectSelectedNode returns null when nothing is selected', () => {
    useDagStore.getState().addNode(makeQuestionNode('n1'))
    expect(selectSelectedNode(useDagStore.getState())).toBeNull()
  })

  it('selectSelectedEdge returns the selected edge', () => {
    useDagStore.getState().addNode(makeQuestionNode('n1'))
    useDagStore.getState().addNode(makeQuestionNode('n2'))
    useDagStore.setState((s) => ({ edges: [...s.edges, makeEdge('e1', 'n1', 'n2')] }))
    useDagStore.getState().setSelectedEdge('e1')

    const edge = selectSelectedEdge(useDagStore.getState())
    expect(edge?.id).toBe('e1')
  })
})
