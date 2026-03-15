import { create } from 'zustand'
import { addEdge, applyNodeChanges, applyEdgeChanges } from 'reactflow'
import type { Node, Edge, Connection, NodeChange, EdgeChange } from 'reactflow'
import type { DagNodeData, DagEdge, EdgeConditions } from '@shared/types/dag.types'

interface DagState {
  surveyId: string | null
  nodes: Node<DagNodeData>[]
  edges: Edge[]
  selectedNodeId: string | null
  selectedEdgeId: string | null
  entryNodeId: string | null
  isDirty: boolean

  // Actions
  loadSurvey: (surveyId: string, nodes: Node<DagNodeData>[], edges: Edge[], entryNodeId?: string | null) => void
  onNodesChange: (changes: NodeChange[]) => void
  onEdgesChange: (changes: EdgeChange[]) => void
  onConnect: (connection: Connection) => void
  addNode: (node: Node<DagNodeData>) => void
  updateNodeData: (id: string, data: Partial<DagNodeData>) => void
  deleteNode: (id: string) => void
  setSelectedNode: (id: string | null) => void
  setSelectedEdge: (id: string | null) => void
  updateEdgeCondition: (id: string, conditions: EdgeConditions) => void
  setEntryNodeId: (id: string | null) => void
  markSaved: () => void
}

const OP_LABELS: Record<string, string> = {
  eq: '=',
  neq: '≠',
  gt: '>',
  gte: '≥',
  lt: '<',
  lte: '≤',
  between: 'between',
  in: 'in',
  not_in: 'not in',
  contains: 'contains',
}

function buildEdgeLabel(conditions: EdgeConditions): string {
  if (conditions.always || conditions.rules.length === 0) {
    return conditions.priority > 0
      ? `(always) · p${conditions.priority}`
      : '(always)'
  }
  const rulesLabel = conditions.rules
    .map((r) => {
      const op = OP_LABELS[r.operator] ?? r.operator
      if (r.operator === 'between') {
        return `${r.attributeKey} ${op} ${r.value}–${r.valueTo ?? '?'}`
      }
      if (r.operator === 'in' || r.operator === 'not_in') {
        return `${r.attributeKey} ${op} [${r.value}]`
      }
      return `${r.attributeKey} ${op} ${r.value}`
    })
    .join(' AND ')
  return conditions.priority > 0
    ? `${rulesLabel} · p${conditions.priority}`
    : rulesLabel
}

export const useDagStore = create<DagState>((set, get) => ({
  surveyId: null,
  nodes: [],
  edges: [],
  selectedNodeId: null,
  selectedEdgeId: null,
  entryNodeId: null,
  isDirty: false,

  loadSurvey: (surveyId, nodes, edges, entryNodeId = null) =>
    set({ surveyId, nodes, edges, entryNodeId, selectedNodeId: null, selectedEdgeId: null, isDirty: false }),

  onNodesChange: (changes) =>
    set((s) => ({
      nodes: applyNodeChanges(changes, s.nodes) as Node<DagNodeData>[],
      isDirty: true,
    })),

  onEdgesChange: (changes) =>
    set((s) => ({
      edges: applyEdgeChanges(changes, s.edges),
      isDirty: true,
    })),

  onConnect: (connection) =>
    set((s) => ({
      edges: addEdge(
        { ...connection, id: crypto.randomUUID(), type: 'conditionEdge', data: {} },
        s.edges
      ),
      isDirty: true,
    })),

  addNode: (node) =>
    set((s) => ({
      nodes: [...s.nodes, node],
      isDirty: true,
    })),

  updateNodeData: (id, data) =>
    set((s) => ({
      nodes: s.nodes.map((n) =>
        n.id === id ? { ...n, data: { ...n.data, ...data } as DagNodeData } : n
      ),
      isDirty: true,
    })),

  deleteNode: (id) =>
    set((s) => ({
      nodes: s.nodes.filter((n) => n.id !== id),
      edges: s.edges.filter((e) => e.source !== id && e.target !== id),
      selectedNodeId: s.selectedNodeId === id ? null : s.selectedNodeId,
      isDirty: true,
    })),

  setSelectedNode: (id) => set({ selectedNodeId: id, selectedEdgeId: null }),
  setSelectedEdge: (id) => set({ selectedEdgeId: id, selectedNodeId: null }),
  setEntryNodeId: (id) => set({ entryNodeId: id }),

  updateEdgeCondition: (id, conditions) =>
    set((s) => ({
      edges: s.edges.map((e) => {
        if (e.id !== id) return e
        const label = buildEdgeLabel(conditions)
        return { ...e, data: { ...e.data, conditions, label } }
      }),
      isDirty: true,
    })),

  markSaved: () => set({ isDirty: false }),
}))

// Selectors
export const selectSelectedNode = (s: DagState) =>
  s.selectedNodeId ? s.nodes.find((n) => n.id === s.selectedNodeId) ?? null : null

export const selectSelectedEdge = (s: DagState) =>
  s.selectedEdgeId ? s.edges.find((e) => e.id === s.selectedEdgeId) ?? null : null
