// ─── Common ───────────────────────────────────────────────────────────────────

import { AnswerType } from "./dag.types"

export interface MessageResponse {
  message: string
}

// ─── Admin — Flows ────────────────────────────────────────────────────────────

export interface FlowSummary {
  id: string
  name: string
  description: string
  isPublished: boolean
  entryNodeId: string | null
  createdAt: string
  updatedAt: string
}

export interface OptionDto {
  id: string
  label: string
  value: string
  displayOrder: number
  mediaUrl: string | null
}

export interface NodeOfferDto {
  id: string
  offerId: string
  isPrimary: boolean
  offerName: string
  offerSlug: string
}

export type FlowNodeType = 'question' | 'info_page' | 'offer'

// Admin API uses PascalCase node types
export type AdminFlowNodeType = 'Question' | 'InfoPage' | 'Offer'

export type ConditionOperator =
  | 'eq'
  | 'neq'
  | 'gt'
  | 'gte'
  | 'lt'
  | 'lte'
  | 'in'
  | 'contains'
  | 'not_in'

export interface ConditionRule {
  attribute: string
  op: ConditionOperator
  value: string
}

export interface EdgeConditions {
  operator: 'AND' | 'OR'
  rules: ConditionRule[]
}

export interface FlowNodeDto {
  id: string
  type: AdminFlowNodeType
  attributeKey: string | null
  title: string
  description: string | null
  mediaUrl: string | null
  positionX: number
  positionY: number
  options: OptionDto[]
  nodeOffers: NodeOfferDto[]
}

export interface FlowEdgeDto {
  id: string
  sourceNodeId: string
  targetNodeId: string
  priority: number
  conditions: string | null  // JSON string from GET /flows/{id}
}

export interface FlowDetail extends FlowSummary {
  nodes: FlowNodeDto[]
  edges: FlowEdgeDto[]
}

// Requests
export interface CreateFlowRequest {
  name: string
  description?: string
}

export interface UpdateFlowRequest {
  name?: string
  description?: string
}

export interface SetEntryNodeRequest {
  entryNodeId: string
}

// ─── Admin — Nodes ────────────────────────────────────────────────────────────

export interface NodeDetail {
  id: string
  flowId: string
  type: AdminFlowNodeType
  attributeKey: string | null
  title: string
  description: string | null
  mediaUrl: string | null
  positionX: number
  positionY: number
  createdAt: string
  options: OptionDto[]
  nodeOffers: NodeOfferDto[]
}

export interface NodePositionDto {
  id: string
  positionX: number
  positionY: number
}

export interface InlineOfferRequest {
  slug?: string
  name?: string
  description?: string
  duration?: string
  digitalContent?: string
  physicalWellnessKitName?: string
  physicalWellnessKitItems?: string
  price?: number
  imageUrl?: string
  ctaText?: string
  ctaUrl?: string
  isPrimary?: boolean
}

// Requests
export interface CreateNodeRequest {
  type: AdminFlowNodeType
  title: string
  attributeKey?: string
  description?: string
  mediaUrl?: string
  positionX?: number
  positionY?: number
  offer?: InlineOfferRequest
}

export interface UpdateInlineOfferRequest {
  ctaText?: string
  ctaUrl?: string
  price?: number
  physicalWellnessKitName?: string
  physicalWellnessKitItems?: string
  description?: string
  duration?: string
  digitalContent?: string
  imageUrl?: string
}

export interface UpdateNodeRequest {
  title?: string
  description?: string
  attributeKey?: string
  mediaUrl?: string
  offer?: UpdateInlineOfferRequest
}

export interface UpdateNodePositionRequest {
  positionX: number
  positionY: number
}

// ─── Admin — Options ──────────────────────────────────────────────────────────

export interface OptionDetail {
  id: string
  nodeId: string
  label: string
  value: string
  displayOrder: number
  mediaUrl: string | null
}

// Requests
export interface CreateOptionRequest {
  label: string
  value: string
  displayOrder?: number
  mediaUrl?: string
}

export interface UpdateOptionRequest {
  label?: string
  value?: string
  displayOrder?: number
  mediaUrl?: string
}

export interface ReorderItem {
  optionId: string
  displayOrder: number
}

export interface ReorderOptionsRequest {
  order: ReorderItem[]
}

// ─── Admin — Edges ────────────────────────────────────────────────────────────

export interface EdgeDetail {
  id: string
  flowId: string
  sourceNodeId: string
  targetNodeId: string
  priority: number
  conditionsJson: string | null  // JSON string from POST/PUT responses
  createdAt: string
}

// Requests
export interface CreateEdgeRequest {
  sourceNodeId: string
  targetNodeId: string
  priority?: number
  conditionsJson?: string | null
}

export interface UpdateEdgeRequest {
  priority?: number
  conditionsJson?: string | null
}

// ─── Admin — Offers ───────────────────────────────────────────────────────────

export interface OfferDto {
  id: string
  slug: string
  name: string
  description: string | null
  duration: string | null
  digitalContent: string | null
  kitName: string | null
  kitContents: string | null
  price: number
  imageUrl: string | null
  ctaText: string | null
  ctaUrl: string | null
}

// Requests
export interface CreateOfferRequest {
  slug: string
  name: string
  description?: string
  duration?: string
  digitalContent?: string
  kitName?: string
  kitContents?: string
  price?: number
  imageUrl?: string
  ctaText?: string
  ctaUrl?: string
}

export interface UpdateOfferRequest {
  slug?: string
  name?: string
  description?: string
  duration?: string
  digitalContent?: string
  kitName?: string
  kitContents?: string
  price?: number
  imageUrl?: string
  ctaText?: string
  ctaUrl?: string
}

// ─── Admin — Node↔Offer Links ─────────────────────────────────────────────────

export interface NodeOfferLinkDto {
  id: string
  nodeId: string
  offerId: string
  isPrimary: boolean
  offer: {
    slug: string
    name: string
  }
}

// Requests
export interface CreateNodeOfferLinkRequest {
  offerId: string
  isPrimary?: boolean
}

export interface UpdateNodeOfferLinkRequest {
  isPrimary: boolean
}

// ─── Content Delivery ─────────────────────────────────────────────────────────

export interface ContentOptionDto {
  id: string
  label: string
  value: string
  displayOrder: number
  mediaUrl: string | null
}

export interface ContentNodeDto {
  id: string
  type: FlowNodeType
  attributeKey: string | null
  title: string
  description: string | null
  mediaUrl: string | null
  options: ContentOptionDto[]
}

export interface ContentEdgeDto {
  id: string
  sourceNodeId: string
  targetNodeId: string
  priority: number
  conditions: EdgeConditions | null
}

export interface PublishedFlowDto {
  flowId: string
  name: string
  entryNodeId: string
  nodes: ContentNodeDto[]
  edges: ContentEdgeDto[]
}

// ─── User Quiz / Sessions ─────────────────────────────────────────────────────

export type SessionStatus = 'InProgress' | 'Completed' | 'Abandoned'

/** Backend returns PascalCase node types in session responses */
export type SessionNodeType = 'Question' | 'InfoPage' | 'Offer'

/** Offer object embedded inside currentNode.offers[] from the backend */
export interface SessionNodeOffer {
  id: string
  name: string
  slug: string
  description: string | null
  duration: string | null
  digitalContent: string | null
  physicalWellnessKitName: string | null
  physicalWellnessKitItems: string | null
  price: number | null
  imageUrl: string | null
  ctaText: string | null
  ctaUrl: string | null
  isPrimary: boolean
}

export interface SessionCurrentNode {
  id: string
  type: SessionNodeType
  attributeKey: string | null
  title: string | null
  description: string | null
  mediaUrl: string | null
  options: ContentOptionDto[]
  offers: SessionNodeOffer[]
  answerType: AnswerType
}

/** Unified session response shape returned by start, answer, back, and get endpoints */
export interface SessionResponse {
  sessionId: string
  flowId: string
  status: SessionStatus
  startedAt: string
  completedAt: string | null
  currentNode: SessionCurrentNode
}

// Keep aliases for backward compatibility with hooks
export type StartSessionResponse = SessionResponse
export type SubmitAnswerResponse = SessionResponse
export type BackResponse = SessionResponse

export interface SessionAnswer {
  attributeKey: string
  value: string
  answeredAt: string
}

export interface GetSessionResponse extends SessionResponse {
  answers: SessionAnswer[]
}

// Requests
export interface StartSessionRequest {
  flowId?: string
  utmSource?: string
  utmCampaign?: string
}

export interface SubmitAnswerRequest {
  nodeId: string
  value?: string | null
}

export interface ConvertRequest {
  offerId: string
}

// ─── Admin — Analytics ───────────────────────────────────────────────────────

export interface SessionStatsDto {
  total: number
  completed: number
  abandoned: number
  inProgress: number
  completionRate: number
  conversionRate: number
  avgAnswersBeforeCompletion: number
}

export interface OfferStatsDto {
  offerId: string
  offerName: string
  offerSlug: string
  timesPrimary: number
  timesAddon: number
  conversions: number
  conversionRate: number
}

export interface DropOffDto {
  nodeId: string
  nodeTitle: string
  dropOffCount: number
  dropOffRate: number
}

// Query params
export interface AnalyticsQueryParams {
  flowId: string
  from?: string
  to?: string
}
