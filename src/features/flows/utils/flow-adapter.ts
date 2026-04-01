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
      const d: QuestionNodeData = {
        type: NodeType.Question,
        questionText: dto.title,
        attribute: (dto.attributeKey as AttributeKey) ?? AttributeKey.Goal,
        answerType: dto.answerType,
        options: (dto.options ?? []).map((o) => ({
          id: o.id,
          label: o.label,
          value: o.value,
        })),
        valueKind: dto.valueKind,
        max: dto.answerType === AnswerType.Slider ? dto.sliderMax : undefined,
        min: dto.answerType === AnswerType.Slider ? dto.sliderMin : undefined,
      };
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
      // Read offer details from the primary linked offer returned by the API.
      // Fall back to the first offer if none is marked primary.
      const primaryOffer =
        (dto.nodeOffers ?? []).find((o) => o.isPrimary) ??
        dto.nodeOffers?.[0] ??
        null;

      const d: OfferNodeData = {
        type: NodeType.Offer,
        headline: dto.title,
        description: primaryOffer?.offer.description ?? dto.description ?? "",
        ctaText: primaryOffer?.offer.ctaText ?? "Get Started",
        ctaUrl: primaryOffer?.offer.ctaUrl ?? undefined,
        price: primaryOffer?.offer.price ?? undefined,
        imageUrl: primaryOffer?.offer.imageUrl ?? undefined,
        kitName: primaryOffer?.offer.physicalWellnessKitName ?? undefined,
        kitContents: primaryOffer?.offer.physicalWellnessKitItems ?? undefined,
        nodeOfferId: primaryOffer?.id ?? undefined,
        offerId: primaryOffer?.offer.offerId ?? undefined,
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

  const conditionJson = dto?.conditions as string ?? null;
  let conditions: EdgeConditions = conditionJson ? JSON.parse(conditionJson) : { always: true, rules: [], priority };

  if (dto.conditions) {
    try {
      const parsed = JSON.parse(dto.conditions) as { rules?: unknown };

      if (parsed) {
        // Canonical backend format: [{ AttributeKey, Operator?, Value, ValueTo? }]
        type BackendRule = {
          AttributeKey?: string;
          Operator?: string;
          Value?: string;
          ValueTo?: string;
          rules?: unknown;
        };
        const rules = (parsed.rules as BackendRule[])
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
        const legacy = parsed as {
          rules?: Array<{ rules: { AttributeKey?: string; Operator?: string; Value?: string; ValueTo?: string } }>;
        };
        const rules = (legacy.rules ?? [])
          .filter((r) => r.rules.AttributeKey)
          .map((r) => ({
            attributeKey: r.rules.AttributeKey!,
            operator: (r.rules.Operator ?? "eq") as EdgeOperator,
            value: r.rules.Value ?? "",
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
        const operator = r.operator ?? "eq";
        const sym = OP_SYM[operator] ?? operator;
        if (operator === "between") return `${r.attributeKey} ${sym} ${r.value}–${r.valueTo ?? "?"}`;
        if (operator === "in" || operator === "not_in") return `${r.attributeKey} ${sym} [${r.value}]`;
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
      let slider = data.type === NodeType.Question && data.answerType === AnswerType.Slider
      ? { SliderMin: data.min ?? 0, SliderMax: data.max ?? 10 }
      : {};

      return {
        ...base,
        title: data.questionText,
        attributeKey: data.attribute,
        description: '',
        answerType: data.answerType,
        valueKind: data.valueKind,
        ...slider,
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
          ctaUrl: data.ctaUrl || undefined,
          price: data.price,
          imageUrl: data.imageUrl || undefined,
          physicalWellnessKitName: data.kitName || undefined,
          physicalWellnessKitItems: data.kitContents || undefined,
          description: data.description || undefined,
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

    let slider = data.type === NodeType.Question && data.answerType === AnswerType.Slider
      ? { SliderMin: data.min ?? 0, SliderMax: data.max ?? 10 }
      : {};

  switch (data.type) {
    case NodeType.Question: {
      return {
        title: data.questionText,
        attributeKey: data.attribute,
        description: '',
        answerType: data.answerType,
        valueKind: data.valueKind,
        ...slider,
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
          name: data.headline,
          ctaText: data.ctaText || undefined,
          ctaUrl: data.ctaUrl || undefined,
          price: data.price,
          imageUrl: data.imageUrl || undefined,
          physicalWellnessKitName: data.kitName || undefined,
          physicalWellnessKitItems: data.kitContents || undefined,
          description: data.description || undefined,
        },
      };
    }
  }
}
