import { create } from "zustand";
import { addEdge, applyNodeChanges, applyEdgeChanges } from "reactflow";
import type { Node, Edge, Connection, NodeChange, EdgeChange } from "reactflow";
import type { DagNodeData, EdgeConditions, EdgeConditionRule, QuestionNodeData } from "@shared/types/dag.types";
import { NodeType } from "@shared/types/dag.types";

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
  /**
   * After a single answer option is deleted, scrub any edge conditions that
   * referenced that specific option value.
   */
  cleanEdgesForDeletedOption: (attributeKey: string, optionValue: string) => void;
  /**
   * After a question's answer-type changes (e.g. to Slider / Text), or whenever
   * the full set of valid option values changes, sweep edges that reference this
   * attribute key and remove rules whose values are no longer valid.
   *
   * Pass the CURRENT valid option values (empty array = no options exist).
   */
  cleanEdgesForAttribute: (attributeKey: string, validValues: string[]) => void;
  setEntryNodeId: (id: string | null) => void;
  setAllIsLocal: (isLocal: boolean) => void;
  markSaved: () => void;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

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

/**
 * Core sweep utility.
 *
 * Walks every edge and removes / shrinks condition rules whose values no longer
 * match the provided set of valid option values for `attributeKey`.
 *
 * Numeric range operators (gt / gte / lt / lte / between) are never removed —
 * they reference numeric ranges, not option values.
 *
 * When `validValues` is EMPTY (question has no options or switched to slider):
 *   - `in` / `not_in` rules are always dropped
 *   - `eq` / `neq` / `contains` rules are also dropped (they were option-based)
 *
 * When `validValues` is NON-EMPTY (some options still exist):
 *   - `in` / `not_in`: remove entries absent from the valid set; drop if empty
 *   - `eq` / `neq` / `contains`: drop if value is absent from the valid set
 *
 * Returns the (possibly unchanged) edge array and the set of edge IDs that changed.
 */
function sweepEdgeConditions(
  edges: Edge[],
  attributeKey: string,
  validValues: Set<string>,
): { edges: Edge[]; changed: Set<string> } {
  const changed = new Set<string>();

  const nextEdges = edges.map((edge) => {
    const conditions = edge.data?.conditions as EdgeConditions | undefined;
    if (!conditions || conditions.always || conditions.rules.length === 0) return edge;

    const nextRules = conditions.rules
      .map((rule): EdgeConditionRule | null => {
        if (rule.attributeKey !== attributeKey) return rule;

        // Numeric range operators never reference option values — leave them alone
        const op = rule.operator ?? "eq";
        if (op === "gt" || op === "gte" || op === "lt" || op === "lte" || op === "between") {
          return rule;
        }

        if (op === "in" || op === "not_in") {
          if (validValues.size === 0) return null; // no options at all → drop rule
          const remaining = rule.value
            .split(",")
            .map((v) => v.trim())
            .filter((v) => v !== "" && validValues.has(v));
          if (remaining.length === 0) return null;
          const newValue = remaining.join(",");
          // Return a NEW object only when the list actually shrank so the
          // reference-equality check below can detect a modification.
          return newValue === rule.value ? rule : { ...rule, value: newValue };
        }

        // eq / neq / contains:
        //   • if no valid options exist → the rule was option-based, drop it
        //   • if valid options exist and this value isn't one of them → drop it
        if (validValues.size === 0) return null;
        if (!validValues.has(rule.value)) return null;
        return rule;
      })
      .filter((r): r is EdgeConditionRule => r !== null);

    // Nothing changed when the count is the same AND every surviving rule is the
    // exact same object reference (a modified rule always returns a new object).
    if (
      nextRules.length === conditions.rules.length &&
      nextRules.every((r, i) => r === conditions.rules[i])
    ) return edge;

    const nextConditions: EdgeConditions =
      nextRules.length === 0
        ? { always: true, rules: [], priority: conditions.priority, operator: conditions.operator }
        : { ...conditions, rules: nextRules };

    changed.add(edge.id);

    return {
      ...edge,
      data: {
        ...edge.data,
        conditions: nextConditions,
        label: buildEdgeLabel(nextConditions),
      },
    };
  });

  return { edges: nextEdges, changed };
}

/**
 * Removes EVERY edge condition rule that references `attributeKey`, regardless
 * of operator type (including numeric ranges).
 *
 * Used when a Question node is deleted and no other Question node in the graph
 * shares the same attributeKey — at that point every condition testing that
 * attribute is permanently meaningless.
 */
function sweepAllRulesForAttribute(
  edges: Edge[],
  attributeKey: string,
): { edges: Edge[]; changed: Set<string> } {
  const changed = new Set<string>();

  const nextEdges = edges.map((edge) => {
    const conditions = edge.data?.conditions as EdgeConditions | undefined;
    if (!conditions || conditions.always || conditions.rules.length === 0) return edge;

    const nextRules = conditions.rules.filter(
      (rule) => rule.attributeKey !== attributeKey,
    );

    if (nextRules.length === conditions.rules.length) return edge; // nothing matched

    const nextConditions: EdgeConditions =
      nextRules.length === 0
        ? { always: true, rules: [], priority: conditions.priority, operator: conditions.operator }
        : { ...conditions, rules: nextRules };

    changed.add(edge.id);

    return {
      ...edge,
      data: {
        ...edge.data,
        conditions: nextConditions,
        label: buildEdgeLabel(nextConditions),
      },
    };
  });

  return { edges: nextEdges, changed };
}

/** Returns the attributeKeys of deleted Question nodes that are no longer
 *  referenced by any surviving Question node in `remainingNodes`. */
function orphanedAttributeKeys(
  deletedIds: Set<string>,
  allNodes: Node<DagNodeData>[],
): Set<string> {
  const orphaned = new Set<string>();

  for (const id of deletedIds) {
    const node = allNodes.find((n) => n.id === id);
    if (!node || node.data.type !== NodeType.Question) continue;
    const key = (node.data as QuestionNodeData).attributeKey;
    if (!key) continue;

    const stillExists = allNodes.some(
      (n) =>
        !deletedIds.has(n.id) &&
        n.data.type === NodeType.Question &&
        (n.data as QuestionNodeData).attributeKey === key,
    );
    if (!stillExists) orphaned.add(key);
  }

  return orphaned;
}

const initialTouched = () => ({
  nodes: new Set<string>(),
  edges: new Set<string>(),
  deletedNodes: new Set<string>(),
  deletedEdges: new Set<string>(),
});

// ─── Store ────────────────────────────────────────────────────────────────────

export const useDagStore = create<DagState>((set, get) => ({
  surveyId: null,
  nodes: [],
  edges: [],
  selectedNodeId: null,
  selectedEdgeId: null,
  entryNodeId: null,
  isDirty: false,
  touched: initialTouched(),

  loadSurvey: (surveyId, nodes, edges, entryNodeId = null) => {
    /**
     * On load, sweep stale edge conditions against the actual option sets of
     * every Question node. This repairs data-integrity issues from the backend
     * (e.g. options deleted server-side while edges still referenced their values).
     *
     * Cleaned edges are added to touched.edges so they will be persisted on the
     * next save — the flow is marked dirty only when cleanup was actually needed.
     */
    let cleanEdges = edges;
    const touchedEdgeIds = new Set<string>();

    for (const node of nodes) {
      if (node.data.type !== NodeType.Question) continue;
      const qData = node.data as QuestionNodeData;
      if (!qData.attributeKey) continue;

      const validValues = new Set<string>(
        (qData.options ?? []).map((o) => o.value),
      );
      const { edges: swept, changed } = sweepEdgeConditions(
        cleanEdges,
        qData.attributeKey,
        validValues,
      );
      cleanEdges = swept;
      changed.forEach((id) => touchedEdgeIds.add(id));
    }

    const hadStaleEdges = touchedEdgeIds.size > 0;
    const touched = initialTouched();
    touchedEdgeIds.forEach((id) => touched.edges.add(id));

    set({
      surveyId,
      nodes,
      edges: cleanEdges,
      entryNodeId,
      selectedNodeId: null,
      selectedEdgeId: null,
      // Mark dirty when we repaired stale conditions so the fix is persisted.
      isDirty: hadStaleEdges,
      touched,
    });
  },

  onNodesChange: (changes) => {
    set((s) => {
      const nextNodes = applyNodeChanges(
        changes,
        s.nodes,
      ) as Node<DagNodeData>[];
      const nextTouched = { ...s.touched };
      let hasSignificantChange = false;
      const removedIds = new Set<string>();

      changes.forEach((c) => {
        if (c.type === "position" && c.dragging) {
          nextTouched.nodes.add(c.id);
          hasSignificantChange = true;
        }

        if (c.type === "remove") {
          nextTouched.nodes.delete(c.id);
          nextTouched.deletedNodes.add(c.id);
          hasSignificantChange = true;
          removedIds.add(c.id);
        }
      });

      // For every deleted Question node whose attributeKey is no longer used by
      // any surviving Question node, sweep all edge conditions that reference it.
      let nextEdges = s.edges;
      if (removedIds.size > 0) {
        const keysToSweep = orphanedAttributeKeys(removedIds, s.nodes);
        for (const key of keysToSweep) {
          const { edges: swept, changed } = sweepAllRulesForAttribute(nextEdges, key);
          nextEdges = swept;
          changed.forEach((id) => nextTouched.edges.add(id));
          if (changed.size > 0) hasSignificantChange = true;
        }
      }

      return {
        nodes: nextNodes,
        edges: nextEdges,
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
    const defaultConditions: EdgeConditions = {
      always: true,
      rules: [],
      priority: 0,
      operator: "AND",
    };
    set((s) => ({
      edges: addEdge(
        {
          ...connection,
          id: edgeId,
          type: "conditionEdge",
          data: {
            conditions: defaultConditions,
            label: buildEdgeLabel(defaultConditions),
          },
        },
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

      // Remove edges connected to this node
      let nextEdges = s.edges.filter((e) => {
        const isRelated = e.source === id || e.target === id;
        if (isRelated) nextTouched.deletedEdges.add(e.id);
        return !isRelated;
      });

      // If the deleted node is a Question whose attributeKey is no longer used
      // by any other Question node, sweep all conditions referencing that key.
      const keysToSweep = orphanedAttributeKeys(new Set([id]), s.nodes);
      for (const key of keysToSweep) {
        const { edges: swept, changed } = sweepAllRulesForAttribute(nextEdges, key);
        nextEdges = swept;
        changed.forEach((eid) => nextTouched.edges.add(eid));
      }

      return {
        nodes: s.nodes.filter((n) => n.id !== id),
        edges: nextEdges,
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

  cleanEdgesForDeletedOption: (attributeKey, optionValue) =>
    set((s) => {
      const nextTouchedEdges = new Set(s.touched.edges);
      let becameDirty = false;

      const nextEdges = s.edges.map((edge) => {
        const conditions = edge.data?.conditions as EdgeConditions | undefined;
        if (!conditions || conditions.always || conditions.rules.length === 0) return edge;

        const nextRules = conditions.rules
          .map((rule): EdgeConditionRule | null => {
            if (rule.attributeKey !== attributeKey) return rule;

            if (rule.operator === "in" || rule.operator === "not_in") {
              const remaining = rule.value
                .split(",")
                .map((v) => v.trim())
                .filter((v) => v !== optionValue);
              if (remaining.length === 0) return null;
              const newValue = remaining.join(",");
              // New object only when the list actually changed — lets the
              // reference-equality check below detect modifications correctly.
              return newValue === rule.value ? rule : { ...rule, value: newValue };
            }

            return rule.value === optionValue ? null : rule;
          })
          .filter((r): r is EdgeConditionRule => r !== null);

        // Detect both rule removal (count drops) AND rule modification
        // (same count but at least one rule is a new object reference).
        if (
          nextRules.length === conditions.rules.length &&
          nextRules.every((r, i) => r === conditions.rules[i])
        ) return edge;

        const nextConditions: EdgeConditions =
          nextRules.length === 0
            ? { always: true, rules: [], priority: conditions.priority, operator: conditions.operator }
            : { ...conditions, rules: nextRules };

        nextTouchedEdges.add(edge.id);
        becameDirty = true;

        return {
          ...edge,
          data: {
            ...edge.data,
            conditions: nextConditions,
            label: buildEdgeLabel(nextConditions),
          },
        };
      });

      return {
        edges: nextEdges,
        isDirty: s.isDirty || becameDirty,
        touched: { ...s.touched, edges: nextTouchedEdges },
      };
    }),

  cleanEdgesForAttribute: (attributeKey, validValues) =>
    set((s) => {
      const { edges: nextEdges, changed } = sweepEdgeConditions(
        s.edges,
        attributeKey,
        new Set(validValues),
      );

      if (changed.size === 0) return s;

      const nextTouchedEdges = new Set(s.touched.edges);
      changed.forEach((id) => nextTouchedEdges.add(id));

      return {
        edges: nextEdges,
        isDirty: true,
        touched: { ...s.touched, edges: nextTouchedEdges },
      };
    }),

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
      // Update both the React Flow node wrapper AND node.data.isLocal so that
      // QuestionProperties (which reads node.data.isLocal) correctly reflects
      // the saved state and freezes the attributeKey / valueKind fields.
      nodes: s.nodes.map((n) => ({
        ...n,
        isLocal,
        data: { ...n.data, isLocal } as DagNodeData,
      })),
      edges: s.edges.map((e) => ({ ...e, isLocal })),
    })),
}));

// ─── Selectors ────────────────────────────────────────────────────────────────

export const selectSelectedNode = (s: DagState) =>
  s.selectedNodeId
    ? (s.nodes.find((n) => n.id === s.selectedNodeId) ?? null)
    : null;

export const selectSelectedEdge = (s: DagState) =>
  s.selectedEdgeId
    ? (s.edges.find((e) => e.id === s.selectedEdgeId) ?? null)
    : null;
