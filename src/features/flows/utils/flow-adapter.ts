/**
 * Conversion utilities between backend API DTOs (FlowNodeDto / FlowEdgeDto)
 * and React-Flow / DAG-store types used in the editor canvas.
 */

import { MarkerType } from 'reactflow'
import type { Node, Edge } from 'reactflow'
import type {
  FlowNodeDto,
  FlowEdgeDto,
  CreateNodeRequest,
  UpdateNodeRequest,
  AdminFlowNodeType,
} from '@shared/types/api.types'
import {
  NodeType,
  AnswerType,
  ValueKind,
  type QualificationTier,
  type CalendarProvider,
} from '@shared/types/dag.types'
import type {
  DagNodeData,
  QuestionNodeData,
  InfoNodeData,
  OfferNodeData,
  LeadCaptureNodeData,
  RedirectNodeData,
  EdgeConditions,
  EdgeOperator,
  LeadCaptureField,
  RedirectLink,
} from '@shared/types/dag.types'

// ─── API → DAG ────────────────────────────────────────────────────────────────

function apiTypeToNodeType(apiType: string): NodeType {
  switch (apiType) {
    case 'InfoPage':     return NodeType.Info
    case 'Offer':        return NodeType.Offer
    case 'LeadCapture':  return NodeType.LeadCapture
    case 'Redirect':     return NodeType.Redirect
    default:             return NodeType.Question
  }
}

export function flowNodeToNode(dto: FlowNodeDto): Node<DagNodeData> {
  const nodeType = apiTypeToNodeType(dto.type)
  let data: DagNodeData

  switch (dto.type) {
    case 'Question': {
      const d: QuestionNodeData = {
        type: NodeType.Question,
        title: dto.title,
        description: dto.description ?? undefined,
        attributeKey: dto.attributeKey ?? '',
        answerType: dto.answerType ?? AnswerType.SingleChoice,
        valueKind: dto.valueKind ?? ValueKind.Text,
        options: (dto.options ?? []).map((o) => ({
          id: o.id,
          label: o.label,
          value: o.value,
          scoreDelta: o.scoreDelta ?? 0,
        })),
        min: dto.answerType === AnswerType.Slider ? dto.sliderMin : undefined,
        max: dto.answerType === AnswerType.Slider ? dto.sliderMax : undefined,
        mediaUrl: dto.mediaUrl ?? undefined,
      }
      data = d
      break
    }

    case 'InfoPage': {
      const d: InfoNodeData = {
        type: NodeType.Info,
        title: dto.title,
        body: dto.description ?? '',
        mediaUrl: dto.mediaUrl ?? undefined,
      }
      data = d
      break
    }

    case 'Offer': {
      const primaryOffer =
        (dto.nodeOffers ?? []).find((o) => o.isPrimary) ??
        dto.nodeOffers?.[0] ??
        null
      const o = primaryOffer?.offer
      const d: OfferNodeData = {
        type: NodeType.Offer,
        offerId: o?.id ?? undefined,
        nodeOfferId: primaryOffer?.id ?? undefined,
        name: o?.name ?? dto.title,
        slug: o?.slug ?? undefined,
        headline: o?.headline ?? dto.title,
        body: o?.body ?? dto.description ?? '',
        imageUrl: o?.imageUrl ?? undefined,
        ctaText: o?.ctaText ?? 'Book a call',
        ctaUrl: o?.ctaUrl ?? undefined,
        calendarUrl: o?.calendarUrl ?? undefined,
        calendarProvider: (o?.calendarProvider ?? undefined) as CalendarProvider | undefined,
        tier: (o?.tier ?? undefined) as QualificationTier | undefined,
      }
      data = d
      break
    }

    case 'LeadCapture': {
      const lc = dto.leadCapture
      const d: LeadCaptureNodeData = {
        type: NodeType.LeadCapture,
        title: dto.title,
        isRequired: lc?.isRequired ?? true,
        fields: (lc?.fields ?? []).map((f) => ({
          fieldType: f.fieldType as LeadCaptureField['fieldType'],
          isRequired: f.isRequired,
          displayOrder: f.displayOrder,
          placeholder: f.placeholder ?? undefined,
        })),
      }
      data = d
      break
    }

    case 'Redirect': {
      const rd = dto.redirect
      const d: RedirectNodeData = {
        type: NodeType.Redirect,
        title: rd?.headline ?? dto.title,
        description: rd?.body ?? dto.description ?? '',
        tier: (rd?.tier ?? 'Cold') as QualificationTier,
        redirectUrl: rd?.redirectUrl ?? undefined,
        autoRedirectAfterSeconds: rd?.autoRedirectAfterSeconds ?? undefined,
        links: (rd?.links ?? []).map((l) => ({
          id: l.id,
          label: l.label,
          url: l.url,
          displayOrder: l.displayOrder,
        })),
      }
      data = d
      break
    }

    default: {
      const d: InfoNodeData = { type: NodeType.Info, title: dto.title, body: '' }
      data = d
    }
  }

  return {
    id: dto.id,
    type: nodeType,
    position: { x: dto.positionX, y: dto.positionY },
    data,
  }
}

export function flowEdgeToEdge(dto: FlowEdgeDto): Edge {
  const priority = dto.priority ?? 0

  let conditions: EdgeConditions = { always: true, rules: [], priority }
  let operator: 'AND' | 'OR' = 'AND'

  if (dto.conditions) {
    try {
      const parsed = JSON.parse(dto.conditions) as {
        rules?: Array<{
          AttributeKey?: string
          Operator?: string
          Value?: string
          ValueTo?: string
        }>
        operator?: 'AND' | 'OR'
      }

      operator = parsed.operator ?? 'AND'

      if (parsed.rules && Array.isArray(parsed.rules)) {
        const rules = parsed.rules
          .filter((r) => r.AttributeKey)
          .map((r) => ({
            attributeKey: r.AttributeKey!,
            operator: (r.Operator ?? 'eq') as EdgeOperator,
            value: r.Value ?? '',
            ...(r.ValueTo !== undefined ? { valueTo: r.ValueTo } : {}),
          }))

        if (rules.length > 0) {
          conditions = { always: false, rules, priority }
        }
      }
    } catch {
      // malformed JSON — treat as unconditional
    }
  }

  const OP_SYM: Record<string, string> = {
    eq: '=', neq: '≠', gt: '>', gte: '≥', lt: '<', lte: '≤',
    between: 'between', in: 'in', not_in: 'not in', contains: 'contains',
  }

  let label: string
  if (conditions.always || conditions.rules.length === 0) {
    label = priority > 0 ? `(always) · p${priority}` : '(always)'
  } else {
    const sep = operator === 'OR' ? ' OR ' : ' AND '
    const rulesLabel = conditions.rules
      .map((r) => {
        const op = OP_SYM[r.operator ?? 'eq'] ?? r.operator
        if (r.operator === 'between') return `${r.attributeKey} ${op} ${r.value}–${r.valueTo ?? '?'}`
        if (r.operator === 'in' || r.operator === 'not_in') return `${r.attributeKey} ${op} [${r.value}]`
        return `${r.attributeKey} ${op} ${r.value}`
      })
      .join(sep)
    label = priority > 0 ? `${rulesLabel} · p${priority}` : rulesLabel
  }

  return {
    id: dto.id,
    source: dto.sourceNodeId,
    target: dto.targetNodeId,
    type: 'conditionEdge',
    markerEnd: { type: MarkerType.ArrowClosed, width: 18, height: 18 },
    data: { label, conditions, operator },
  }
}

// ─── DAG → API ────────────────────────────────────────────────────────────────

function nodeTypeToApiType(type: NodeType): AdminFlowNodeType {
  switch (type) {
    case NodeType.Info:         return 'InfoPage'
    case NodeType.Offer:        return 'Offer'
    case NodeType.LeadCapture:  return 'LeadCapture'
    case NodeType.Redirect:     return 'Redirect'
    default:                    return 'Question'
  }
}

export function nodeToCreateRequest(node: Node<DagNodeData>): CreateNodeRequest {
  const { data, position } = node
  const base = {
    type: nodeTypeToApiType(data.type),
    positionX: Math.round(position.x),
    positionY: Math.round(position.y),
  } as const

  switch (data.type) {
    case NodeType.Question: {
      const isSlider = data.answerType === AnswerType.Slider
      return {
        ...base,
        title: data.title,
        attributeKey: data.attributeKey,
        description: data.description || undefined,
        mediaUrl: data.mediaUrl || undefined,
        answerType: data.answerType,
        valueKind: data.valueKind ?? ValueKind.Text,
        ...(isSlider ? { SliderMin: data.min ?? 0, SliderMax: data.max ?? 10 } : {}),
      }
    }

    case NodeType.Info:
      return {
        ...base,
        title: data.title,
        description: data.body || undefined,
        mediaUrl: data.mediaUrl || undefined,
      }

    case NodeType.Offer:
      return {
        ...base,
        title: data.name || data.headline,
        offer: {
          slug: data.slug || undefined,
          name: data.name || data.headline,
          headline: data.headline || undefined,
          body: data.body || undefined,
          imageUrl: data.imageUrl || undefined,
          calendarUrl: data.calendarUrl ?? undefined,
          calendarProvider: data.calendarProvider ?? undefined,
          tier: data.tier || undefined,
          ctaText: data.ctaText || undefined,
          ctaUrl: data.ctaUrl || undefined,
          isPrimary: true,
        },
      }

    case NodeType.LeadCapture:
      return {
        ...base,
        title: data.title,
        isRequired: data.isRequired,
        fields: data.fields.map((f, i) => ({
          fieldType: f.fieldType,
          isRequired: f.isRequired,
          displayOrder: f.displayOrder ?? i,
          placeholder: f.placeholder || undefined,
        })),
      }

    case NodeType.Redirect:
      return {
        ...base,
        title: data.title,
        description: data.description || undefined,
        tier: data.tier,
        redirectUrl: data.redirectUrl || undefined,
        autoRedirectAfterSeconds: data.autoRedirectAfterSeconds ?? -1,
        links: data.links.map((l) => ({ label: l.label, url: l.url })),
      }
  }
}

export function nodeToUpdateRequest(node: Node<DagNodeData>): UpdateNodeRequest {
  const { data } = node

  switch (data.type) {
    case NodeType.Question: {
      const isSlider = data.answerType === AnswerType.Slider
      return {
        title: data.title,
        description: data.description || undefined,
        mediaUrl: data.mediaUrl || undefined,
        answerType: data.answerType,
        valueKind: data.valueKind ?? ValueKind.Text,
        ...(isSlider ? { SliderMin: data.min ?? 0, SliderMax: data.max ?? 10 } : {}),
      }
    }

    case NodeType.Info:
      return {
        title: data.title,
        description: data.body || undefined,
        mediaUrl: data.mediaUrl || undefined,
      }

    case NodeType.Offer:
      return {
        title: data.name || data.headline,
        offer: {
          headline: data.headline || undefined,
          body: data.body || undefined,
          imageUrl: data.imageUrl || undefined,
          calendarUrl: data.calendarUrl ?? undefined,
          calendarProvider: data.calendarProvider ?? undefined,
          tier: data.tier || undefined,
          ctaText: data.ctaText || undefined,
          ctaUrl: data.ctaUrl || undefined,
        },
      }

    case NodeType.LeadCapture:
      return {
        title: data.title,
        isRequired: data.isRequired,
      }

    case NodeType.Redirect:
      return {
        title: data.title,
        description: data.description || undefined,
        tier: data.tier,
        redirectUrl: data.redirectUrl || undefined,
        autoRedirectAfterSeconds: data.autoRedirectAfterSeconds ?? -1,
        // links are managed separately via /redirect-links endpoints
      }
  }
}
