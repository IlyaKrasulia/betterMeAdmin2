/**
 * Conversion utilities between the backend API DTOs (FlowNodeDto / FlowEdgeDto)
 * and the React-Flow / DAG-store types used in the editor canvas.
 */

import { MarkerType } from "reactflow";
import type { Node, Edge } from "reactflow";
import type {
  FlowNodeDto,
  FlowEdgeDto,
  CreateNodeRequest,
  UpdateNodeRequest,
  AdminFlowNodeType,
} from "@shared/types/api.types";
import { NodeType, AttributeKey, AnswerType } from "@shared/types/dag.types";
import type {
  DagNodeData,
  QuestionNodeData,
  InfoNodeData,
  OfferNodeData,
  EdgeConditions,
  EdgeOperator,
} from "@shared/types/dag.types";

const VALID_ANSWER_TYPES = new Set<string>(Object.values(AnswerType));

// ─── API → DAG ────────────────────────────────────────────────────────────────

/**
 * Map the API `type` string to the internal `NodeType` enum.
 * The API uses `'info_page'`; the canvas uses `'info'`.
 */
function apiTypeToNodeType(apiType: string): NodeType {
  if (apiType === "InfoPage") return NodeType.Info;
  if (apiType === "Offer") return NodeType.Offer;
  return NodeType.Question;
}

/**
 * Convert a single `FlowNodeDto` from the admin API into a ReactFlow
 * `Node<DagNodeData>` that can be loaded into the DAG store / canvas.
 */
export function flowNodeToNode(dto: FlowNodeDto): Node<DagNodeData> {
  const nodeType = apiTypeToNodeType(dto.type);

  let data: DagNodeData;
  switch (dto.type) {
    case "Question": {
      // answerType, min and max are serialised into `description` as JSON
      // because the backend node model has no dedicated columns for them.
      let answerType: AnswerType = AnswerType.SingleChoice;
      let min: number | undefined;
      let max: number | undefined;
      if (dto.description) {
        try {
          const meta = JSON.parse(dto.description) as {
            answerType?: string;
            min?: number;
            max?: number;
          };
          if (
            typeof meta.answerType === "string" &&
            VALID_ANSWER_TYPES.has(meta.answerType)
          ) {
            answerType = meta.answerType as AnswerType;
          }
          if (typeof meta.min === "number") min = meta.min;
          if (typeof meta.max === "number") max = meta.max;
        } catch {
          // description is plain text (old data) — leave defaults
        }
      }
      const d: QuestionNodeData = {
        type: NodeType.Question,
        questionText: dto.title,
        attribute: (dto.attributeKey as AttributeKey) ?? AttributeKey.Goal,
        answerType,
        options: (dto.options ?? []).map((o) => ({
          id: o.id,
          label: o.label,
          value: o.value,
        })),
      };
      if (min !== undefined) d.min = min;
      if (max !== undefined) d.max = max;
      data = d;
      break;
    }
    case "InfoPage": {
      const d: InfoNodeData = {
        type: NodeType.Info,
        title: dto.title,
        body: dto.description ?? "",
        imageUrl: dto.mediaUrl ?? undefined,
      };
      data = d;
      break;
    }
    case "Offer":
    default: {
      // Try to read offer fields from the linked offer first (nodeOffers),
      // then fall back to legacy mediaUrl JSON encoding.
      let ctaText = "Get Started";
      let price: number | undefined;
      let kitName: string | undefined;
      let kitContents: string | undefined;

      // Legacy: ctaText, price, kitName, kitContents encoded in mediaUrl JSON
      if (dto.mediaUrl) {
        try {
          const meta = JSON.parse(dto.mediaUrl) as {
            ctaText?: string;
            price?: number;
            kitName?: string;
            kitContents?: string;
          };
          if (typeof meta.ctaText === "string") ctaText = meta.ctaText;
          if (typeof meta.price === "number") price = meta.price;
          if (typeof meta.kitName === "string") kitName = meta.kitName;
          if (typeof meta.kitContents === "string") kitContents = meta.kitContents;
        } catch {
          // mediaUrl is a plain URL (old data) — leave defaults
        }
      }

      const d: OfferNodeData = {
        type: NodeType.Offer,
        headline: dto.title,
        description: dto.description ?? "",
        ctaText,
        price,
        kitName,
        kitContents,
      };
      data = d;
      break;
    }
  }
  return {
    id: dto.id,
    type: nodeType,
    position: { x: dto.positionX, y: dto.positionY },
    data,
  };
}

/**
 * Convert a single `FlowEdgeDto` from the admin API into a ReactFlow `Edge`.
 *
 * Backend conditionsJson formats supported:
 *   1. Null / empty string  → unconditional (always)
 *   2. JSON array [{ AttributeKey, Value }, ...]  → canonical backend format
 *   3. JSON object { operator, rules: [{ attribute, op, value }] }  → legacy frontend format
 */
export function flowEdgeToEdge(dto: FlowEdgeDto): Edge {
  const priority = dto.priority ?? 0;
  let conditions: EdgeConditions = { always: true, rules: [], priority };

  if (dto.conditions) {
    try {
      const parsed = JSON.parse(dto.conditions) as unknown;

      if (Array.isArray(parsed) && parsed.length > 0) {
        // Canonical backend format: [{ AttributeKey, Operator?, Value, ValueTo? }]
        type BackendRule = {
          AttributeKey?: string;
          Operator?: string;
          Value?: string;
          ValueTo?: string;
        };
        const rules = (parsed as BackendRule[])
          .filter((r) => r.AttributeKey)
          .map((r) => ({
            attributeKey: r.AttributeKey!,
            operator: (r.Operator ?? "eq") as EdgeOperator,
            value: r.Value ?? "",
            ...(r.ValueTo !== undefined ? { valueTo: r.ValueTo } : {}),
          }));
        if (rules.length > 0) {
          conditions = { always: false, rules, priority };
        }
      } else if (
        parsed &&
        typeof parsed === "object" &&
        !Array.isArray(parsed)
      ) {
        // Legacy format: { operator: "AND", rules: [{ attribute, op, value }] }
        const legacy = parsed as {
          rules?: Array<{ attribute?: string; op?: string; value?: string }>;
        };
        const rules = (legacy.rules ?? [])
          .filter((r) => r.attribute)
          .map((r) => ({
            attributeKey: r.attribute!,
            operator: (r.op ?? "eq") as EdgeOperator,
            value: r.value ?? "",
          }));
        if (rules.length > 0) {
          conditions = { always: false, rules, priority };
        }
      }
    } catch {
      // malformed JSON — treat as unconditional
    }
  }

  const OP_SYM: Record<string, string> = {
    eq: "=", neq: "≠", gt: ">", gte: "≥", lt: "<", lte: "≤",
    between: "between", in: "in", not_in: "not in", contains: "contains",
  };
  let label: string;
  if (conditions.always || conditions.rules.length === 0) {
    label = priority > 0 ? `(always) · p${priority}` : "(always)";
  } else {
    const rulesLabel = conditions.rules
      .map((r) => {
        const sym = OP_SYM[r.operator] ?? r.operator;
        if (r.operator === "between") return `${r.attributeKey} ${sym} ${r.value}–${r.valueTo ?? "?"}`;
        if (r.operator === "in" || r.operator === "not_in") return `${r.attributeKey} ${sym} [${r.value}]`;
        return `${r.attributeKey} ${sym} ${r.value}`;
      })
      .join(" AND ");
    label = priority > 0 ? `${rulesLabel} · p${priority}` : rulesLabel;
  }

  return {
    id: dto.id,
    source: dto.sourceNodeId,
    target: dto.targetNodeId,
    type: "conditionEdge",
    markerEnd: { type: MarkerType.ArrowClosed, width: 18, height: 18 },
    data: { label, conditions },
  };
}

// ─── DAG → API ────────────────────────────────────────────────────────────────

/**
 * Map the internal `NodeType` enum back to the API `FlowNodeType` string.
 */
function nodeTypeToApiType(type: NodeType): AdminFlowNodeType {
  if (type === NodeType.Info) return "InfoPage";
  if (type === NodeType.Offer) return "Offer";
  return "Question";
}

/**
 * Build a `CreateNodeRequest` payload from a ReactFlow `Node<DagNodeData>`.
 *
 * Note: answer options for question nodes are managed via the separate options
 * API (`POST /api/admin/nodes/{nodeId}/options`) and are not part of this
 * request.  Add/remove/reorder options using `useCreateOption` / `useDeleteOption`.
 */
export function nodeToCreateRequest(
  node: Node<DagNodeData>,
): CreateNodeRequest {
  const { data, position } = node;
  const base = {
    type: nodeTypeToApiType(data.type),
    positionX: Math.round(position.x),
    positionY: Math.round(position.y),
  } as const;

  switch (data.type) {
    case NodeType.Question: {
      // answerType, min and max are serialised into `description` as JSON
      // because the backend node model has no dedicated columns for them.
      const meta: { answerType: string; min?: number; max?: number } = {
        answerType: data.answerType,
      };
      if (data.min !== undefined) meta.min = data.min;
      if (data.max !== undefined) meta.max = data.max;
      return {
        ...base,
        title: data.questionText,
        attributeKey: data.attribute,
        description: JSON.stringify(meta),
      };
    }
    case NodeType.Info:
      return {
        ...base,
        title: data.title,
        description: data.body || undefined,
        mediaUrl: data.imageUrl || undefined,
      };
    case NodeType.Offer: {
      return {
        ...base,
        title: data.headline,
        description: data.description || undefined,
        offer: {
          name: data.headline,
          ctaText: data.ctaText || undefined,
          price: data.price,
          physicalWellnessKitName: data.kitName || undefined,
          physicalWellnessKitItems: data.kitContents || undefined,
        },
      };
    }
  }
}

/**
 * Build an `UpdateNodeRequest` payload from a ReactFlow `Node<DagNodeData>`.
 *
 * Note: answer options are a separate resource and are not updated here.
 * Use `useCreateOption` / `useUpdateOption` / `useDeleteOption` for that.
 */
export function nodeToUpdateRequest(
  node: Node<DagNodeData>,
): UpdateNodeRequest {
  const { data } = node;

  switch (data.type) {
    case NodeType.Question: {
      const meta: { answerType: string; min?: number; max?: number } = {
        answerType: data.answerType,
      };
      if (data.min !== undefined) meta.min = data.min;
      if (data.max !== undefined) meta.max = data.max;
      return {
        title: data.questionText,
        attributeKey: data.attribute,
        description: JSON.stringify(meta),
      };
    }
    case NodeType.Info:
      return {
        title: data.title,
        description: data.body || undefined,
        mediaUrl: data.imageUrl || undefined,
      };
    case NodeType.Offer: {
      return {
        title: data.headline,
        description: data.description || undefined,
        offer: {
          ctaText: data.ctaText || undefined,
          price: data.price,
          physicalWellnessKitName: data.kitName || undefined,
          physicalWellnessKitItems: data.kitContents || undefined,
        },
      };
    }
  }
}
