import { create } from "zustand";
import { addEdge, applyNodeChanges, applyEdgeChanges } from "reactflow";
import type { Node, Edge, Connection, NodeChange, EdgeChange } from "reactflow";
import type { DagNodeData, EdgeConditions } from "@shared/types/dag.types";

interface DagState {
  surveyId: string | null;
  nodes: Node<DagNodeData>[];
  edges: Edge[];
  selectedNodeId: string | null;
  selectedEdgeId: string | null;
  entryNodeId: string | null;
  isDirty: boolean;

  touched: {
    nodes: Set<string>;
    edges: Set<string>;
    deletedNodes: Set<string>;
    deletedEdges: Set<string>;
  };

  // Actions
  loadSurvey: (
    surveyId: string,
    nodes: Node<DagNodeData>[],
    edges: Edge[],
    entryNodeId?: string | null,
  ) => void;
  onNodesChange: (changes: NodeChange[]) => void;
  onEdgesChange: (changes: EdgeChange[]) => void;
  onConnect: (connection: Connection) => void;
  addNode: (node: Node<DagNodeData>) => void;
  updateNodeData: (id: string, data: Partial<DagNodeData>) => void;
  deleteNode: (id: string) => void;
  setSelectedNode: (id: string | null) => void;
  setSelectedEdge: (id: string | null) => void;
  updateEdgeCondition: (id: string, conditions: EdgeConditions) => void;
  setEntryNodeId: (id: string | null) => void;
  setAllIsLocal: (isLocal: boolean) => void;
  markSaved: () => void;
}

const OP_LABELS: Record<string, string> = {
  eq: "=",
  neq: "≠",
  gt: ">",
  gte: "≥",
  lt: "<",
  lte: "≤",
  between: "between",
  in: "in",
  not_in: "not in",
  contains: "contains",
};

function buildEdgeLabel(conditions: EdgeConditions): string {
  if (conditions.always || conditions.rules.length === 0) {
    return conditions.priority > 0
      ? `(always) · p${conditions.priority}`
      : "(always)";
  }
  const rulesLabel = conditions.rules
    .map((r) => {
      const operator = r.operator ?? "eq";
      const op = OP_LABELS[operator] ?? operator;
      if (operator === "between")
        return `${r.attributeKey} ${op} ${r.value}–${r.valueTo ?? "?"}`;
      return `${r.attributeKey} ${op} ${r.value}`;
    })
    .join(" AND ");
  return conditions.priority > 0
    ? `${rulesLabel} · p${conditions.priority}`
    : rulesLabel;
}

const initialTouched = () => ({
  nodes: new Set<string>(),
  edges: new Set<string>(),
  deletedNodes: new Set<string>(),
  deletedEdges: new Set<string>(),
});

export const useDagStore = create<DagState>((set, get) => ({
  surveyId: null,
  nodes: [],
  edges: [],
  selectedNodeId: null,
  selectedEdgeId: null,
  entryNodeId: null,
  isDirty: false,
  touched: initialTouched(),

  loadSurvey: (surveyId, nodes, edges, entryNodeId = null) =>
    set({
      surveyId,
      nodes,
      edges,
      entryNodeId,
      selectedNodeId: null,
      selectedEdgeId: null,
      isDirty: false,
      touched: initialTouched(),
    }),

  onNodesChange: (changes) => {
    set((s) => {
      const nextNodes = applyNodeChanges(
        changes,
        s.nodes,
      ) as Node<DagNodeData>[];
      const nextTouched = { ...s.touched };
      let hasSignificantChange = false;

      changes.forEach((c) => {
        if (c.type === "position" && c.dragging) {
          nextTouched.nodes.add(c.id);
          hasSignificantChange = true;
        }

        if (c.type === "remove") {
          nextTouched.nodes.delete(c.id);
          nextTouched.deletedNodes.add(c.id);
          hasSignificantChange = true;
        }
      });

      return {
        nodes: nextNodes,
        isDirty: s.isDirty || hasSignificantChange,
        touched: nextTouched,
      };
    });
  },

  onEdgesChange: (changes) => {
    set((s) => {
      const nextEdges = applyEdgeChanges(changes, s.edges);
      const nextTouched = { ...s.touched };
      let hasSignificantChange = false;

      changes.forEach((c) => {
        if (c.type === "remove") {
          nextTouched.edges.delete(c.id);
          nextTouched.deletedEdges.add(c.id);
          hasSignificantChange = true;
        }
      });

      return {
        edges: nextEdges,
        isDirty: s.isDirty || hasSignificantChange,
        touched: nextTouched,
      };
    });
  },

  onConnect: (connection) => {
    const edgeId = crypto.randomUUID();
    set((s) => ({
      edges: addEdge(
        { ...connection, id: edgeId, type: "conditionEdge", data: {} },
        s.edges,
      ),
      isDirty: true,
      touched: {
        ...s.touched,
        edges: new Set(s.touched.edges).add(edgeId),
      },
    }));
  },

  addNode: (node) =>
    set((s) => ({
      nodes: [...s.nodes, node],
      isDirty: true,
      touched: {
        ...s.touched,
        nodes: new Set(s.touched.nodes).add(node.id),
      },
    })),

  updateNodeData: (id, data) =>
    set((s) => ({
      nodes: s.nodes.map((n) =>
        n.id === id ? { ...n, data: { ...n.data, ...data } as DagNodeData } : n,
      ),
      isDirty: true,
      touched: {
        ...s.touched,
        nodes: new Set(s.touched.nodes).add(id),
      },
    })),

  deleteNode: (id) =>
    set((s) => {
      const nextTouched = { ...s.touched };
      nextTouched.nodes.delete(id);
      nextTouched.deletedNodes.add(id);

      return {
        nodes: s.nodes.filter((n) => n.id !== id),
        edges: s.edges.filter((e) => {
          const isRelated = e.source === id || e.target === id;
          if (isRelated) nextTouched.deletedEdges.add(e.id);
          return !isRelated;
        }),
        selectedNodeId: s.selectedNodeId === id ? null : s.selectedNodeId,
        isDirty: true,
        touched: nextTouched,
      };
    }),

  updateEdgeCondition: (id, conditions) =>
    set((s) => ({
      edges: s.edges.map((e) => {
        if (e.id !== id) return e;
        const label = buildEdgeLabel(conditions);
        return { ...e, data: { ...e.data, conditions, label } };
      }),
      isDirty: true,
      touched: {
        ...s.touched,
        edges: new Set(s.touched.edges).add(id),
      },
    })),

  setSelectedNode: (id) => set({ selectedNodeId: id, selectedEdgeId: null }),
  setSelectedEdge: (id) => set({ selectedEdgeId: id, selectedNodeId: null }),
  setEntryNodeId: (id) => set({ entryNodeId: id, isDirty: true }),

  markSaved: () =>
    set({
      isDirty: false,
      touched: initialTouched(),
    }),

  setAllIsLocal: (isLocal) =>
    set((s) => ({
      nodes: s.nodes.map((n) => ({ ...n, isLocal })),
      edges: s.edges.map((e) => ({ ...e, isLocal })),
    })),
}));

// Selectors (без изменений)
export const selectSelectedNode = (s: DagState) =>
  s.selectedNodeId
    ? (s.nodes.find((n) => n.id === s.selectedNodeId) ?? null)
    : null;

export const selectSelectedEdge = (s: DagState) =>
  s.selectedEdgeId
    ? (s.edges.find((e) => e.id === s.selectedEdgeId) ?? null)
    : null;
