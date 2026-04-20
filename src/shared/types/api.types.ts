// ─── Common ───────────────────────────────────────────────────────────────────

import { AnswerType, AttributeKeyOption, ValueKind } from './dag.types'

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
  scoreDelta: number
}

export interface NodeOfferDto {
  id: string
  isPrimary: boolean
  offer: {
    id: string
    slug: string
    name: string
    headline: string | null
    body: string | null
    imageUrl: string | null
    ctaText: string | null
    ctaUrl: string | null
    calendarUrl: string | null
    tier: string | null
    calendarProvider: string | null
  }
}

// All node types the admin API uses
export type AdminFlowNodeType =
  | 'Question'
  | 'InfoPage'
  | 'Offer'
  | 'LeadCapture'
  | 'Redirect'

export type FlowNodeType = 'question' | 'info_page' | 'offer' | 'lead_capture' | 'redirect'

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

export interface FlowNodeStatsDto {
  answerCount: number
  droppedOffCount: number
  offerImpressions: number
  offerConversions: number
  offerConversionRate: number
  avgAnswerDuration: string | null
}

// ─── LeadCapture field DTO ────────────────────────────────────────────────────

export interface LeadCaptureFieldDto {
  fieldType: string
  isRequired: boolean
  displayOrder: number
  placeholder: string | null
}

export interface LeadCaptureDto {
  isRequired: boolean
  fields: LeadCaptureFieldDto[]
}

// ─── Redirect DTO ─────────────────────────────────────────────────────────────

export interface RedirectLinkDto {
  id: string
  label: string
  url: string
  displayOrder: number
}

export interface RedirectDto {
  headline: string
  body: string
  tier: string
  redirectUrl: string | null
  autoRedirectAfterSeconds: number | null
  links: RedirectLinkDto[]
}

// ─── Unified node DTO (admin) ─────────────────────────────────────────────────

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
  answerType: AnswerType
  sliderMin?: number
  sliderMax?: number
  valueKind?: ValueKind
  stats?: FlowNodeStatsDto
  /** Populated for LeadCapture nodes */
  leadCapture?: LeadCaptureDto | null
  /** Populated for Redirect nodes */
  redirect?: RedirectDto | null
}

export interface FlowEdgeDto {
  id: string
  sourceNodeId: string
  targetNodeId: string
  priority: number
  conditions: string | null
}

export interface FlowStatsDto {
  nodeCount: number
  edgeCount: number
  questionCount: number
  offerNodeCount: number
  infoPageCount: number
  totalSessions: number
  completedSessions: number
  abandonedSessions: number
  inProgressSessions: number
  completionRate: number
  abandonRate: number
  lastSessionAt: string | null
  totalOfferImpressions: number
  totalOfferConversions: number
  offerConversionRate: number
  avgSessionDuration: string | null
  medianSessionDuration: string | null
  minSessionDuration: string | null
  maxSessionDuration: string | null
  avgAnswerDuration: string | null
  medianAnswerDuration: string | null
  minAnswerDuration: string | null
  maxAnswerDuration: string | null
}

export interface FlowPathNodeDto {
  id: string
  type: string
  attributeKey: string
  valueKind: string | null
  title: string
  answerType: string | null
}

export interface FlowPathDto {
  path: string
  nodes: FlowPathNodeDto[]
  count: number
  completed: number
  abandoned: number
  inProgress: number
}

export interface FlowDetail extends FlowSummary {
  nodes: FlowNodeDto[]
  edges: FlowEdgeDto[]
  attributeKeys: AttributeKeyOption[]
  stats?: FlowStatsDto
  pathDistribution?: FlowPathDto[]
}

// ─── Flow Requests ────────────────────────────────────────────────────────────

export interface CreateFlowRequest {
  name: string
  description?: string
}

export interface GenerateFlowRequest {
  userPrompt: string
}

export interface GenerateFlowStartResponse {
  jobId: string
}

export interface GenerateFlowStatusResponse {
  jobId: string
  status: 'Pending' | 'Running' | 'Done' | 'Failed'
  flowId: string | null
  error: string | null
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

// ─── Inline Offer (for Offer node create/update) ─────────────────────────────

export interface InlineOfferRequest {
  slug?: string
  name?: string
  headline?: string
  body?: string
  imageUrl?: string
  calendarUrl?: string
  calendarProvider?: string
  tier?: string
  ctaText?: string
  ctaUrl?: string
  isPrimary?: boolean
}

export interface UpdateInlineOfferRequest {
  headline?: string
  body?: string
  imageUrl?: string
  calendarUrl?: string
  calendarProvider?: string
  tier?: string
  ctaText?: string
  ctaUrl?: string
}

// ─── Redirect Link API types ──────────────────────────────────────────────────

export interface RedirectLinkDetail {
  id: string
  nodeRedirectId: string
  label: string
  url: string
  displayOrder: number
}

export interface CreateRedirectLinkRequest {
  label: string
  url: string
  displayOrder: number
}

export interface UpdateRedirectLinkRequest {
  label?: string
  url?: string
  displayOrder?: number
}

export interface ReorderRedirectLinksRequest {
  items: Array<{ linkId: string; displayOrder: number }>
}

// ─── LeadCapture field request ────────────────────────────────────────────────

export interface LeadCaptureFieldRequest {
  fieldType: string
  isRequired: boolean
  displayOrder: number
  placeholder?: string
}

// ─── Redirect link request ────────────────────────────────────────────────────

export interface NodeRedirectLinkRequest {
  label: string
  url: string
}

// ─── Node Requests ────────────────────────────────────────────────────────────

export interface CreateNodeRequest {
  type: AdminFlowNodeType
  title: string
  positionX?: number
  positionY?: number
  // Shared optional
  description?: string
  mediaUrl?: string
  // Question
  attributeKey?: string
  answerType?: AnswerType
  valueKind?: ValueKind
  SliderMin?: number
  SliderMax?: number
  // Offer (inline)
  offer?: InlineOfferRequest
  // LeadCapture
  isRequired?: boolean
  fields?: LeadCaptureFieldRequest[]
  // Redirect — title & description use the shared fields above
  tier?: string
  redirectUrl?: string
  autoRedirectAfterSeconds?: number
  links?: NodeRedirectLinkRequest[]
}

export interface UpdateNodeRequest {
  title?: string
  description?: string
  mediaUrl?: string
  // Question
  answerType?: AnswerType
  SliderMin?: number
  SliderMax?: number
  clearAnswerType?: boolean
  valueKind?: ValueKind
  // Offer
  offer?: UpdateInlineOfferRequest
  // Redirect — title & description use the shared fields above
  tier?: string
  redirectUrl?: string
  autoRedirectAfterSeconds?: number | null
  // LeadCapture
  isRequired?: boolean
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
  scoreDelta: number
}

export interface CreateOptionRequest {
  label: string
  value: string
  displayOrder?: number
  mediaUrl?: string
  scoreDelta?: number
}

export interface UpdateOptionRequest {
  label?: string
  value?: string
  displayOrder?: number
  mediaUrl?: string
  scoreDelta?: number
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
  conditions: string | null
  createdAt: string
}

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
  headline: string | null
  body: string | null
  imageUrl: string | null
  ctaText: string | null
  ctaUrl: string | null
  calendarUrl: string | null
}

export interface CreateOfferRequest {
  slug: string
  name: string
  headline?: string
  body?: string
  imageUrl?: string
  calendarUrl?: string
  ctaText?: string
  ctaUrl?: string
}

export interface UpdateOfferRequest {
  slug?: string
  name?: string
  headline?: string
  body?: string
  imageUrl?: string
  calendarUrl?: string
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
  scoreDelta?: number
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

export type SessionNodeType =
  | 'Question'
  | 'InfoPage'
  | 'Offer'
  | 'LeadCapture'
  | 'Redirect'

export interface SessionNodeOffer {
  id: string
  name: string
  slug: string
  headline: string | null
  body: string | null
  imageUrl: string | null
  ctaText: string | null
  ctaUrl: string | null
  calendarUrl: string | null
  isPrimary: boolean
  tier?: string
}

export interface SessionLeadCaptureField {
  fieldType: string
  isRequired: boolean
  displayOrder: number
  placeholder: string | null
}

export interface SessionLeadCapture {
  isRequired: boolean
  fields: SessionLeadCaptureField[]
}

export interface SessionRedirectLink {
  label: string
  url: string
  displayOrder: number
}

export interface SessionRedirect {
  headline: string
  body: string
  tier: string
  redirectUrl: string | null
  autoRedirectAfterSeconds: number | null
  links: SessionRedirectLink[]
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
  answerType?: AnswerType
  sliderMin?: number
  sliderMax?: number
  valueKind?: ValueKind
  leadCapture?: SessionLeadCapture | null
  redirect?: SessionRedirect | null
}

export interface SessionResponse {
  sessionId: string
  flowId: string
  status: SessionStatus
  startedAt: string
  completedAt: string | null
  currentNode: SessionCurrentNode
}

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

export interface StartSessionRequest {
  flowId?: string
  utmSource?: string
  utmCampaign?: string
}

export interface SubmitAnswerRequest {
  nodeId: string
  value?: string | null
  leadFields?: Record<string, string>
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

export interface GlobalSessionStatsResponse {
  totalSessions: number
  inProgress: number
  completed: number
  abandoned: number
  completionRate: number
  abandonRate: number
}

export interface GlobalOfferStatsItem {
  offerId: string
  offerName: string
  offerSlug: string
  flowId: string
  flowName: string
  timesPresented: number
  timesConverted: number
  conversionRate: number
}

export interface GlobalOfferStatsResponse {
  items: GlobalOfferStatsItem[]
}

export interface GlobalDropOffItem {
  nodeId: string
  nodeTitle: string
  flowId: string
  flowTitle: string
  sessionCount: number
  dropOffRate: number
}

export interface GlobalDropOffResponse {
  items: GlobalDropOffItem[]
}

export interface AnalyticsQueryParams {
  flowId: string
  from?: string
  to?: string
}

// ─── Leads ────────────────────────────────────────────────────────────────────

export interface LeadDto {
  id: string
  flowId: string
  sessionId: string
  tier: string | null
  status: string | null
  score: number | null
  fullName: string | null
  email: string | null
  phone: string | null
  companyName: string | null
  jobTitle: string | null
  companySize: string | null
  website: string | null
  notes: string | null
  assignedToId: string | null
  timeToComplete: string | null
  timeToCompleteSeconds: number | null
  createdAt: string
  updatedAt: string
}

export interface ListLeadsParams {
  tier?: string
  status?: string
  search?: string
  from?: string
  to?: string
  sortBy?: string
  sortDescending?: boolean
  page?: number
  pageSize?: number
}

export interface ListLeadsResponse {
  items: LeadDto[]
  total: number
  page: number
  pageSize: number
}

export interface PatchLeadRequest {
  status?: string | null
  tier?: string | null
  notes?: string | null
  assignedToId?: string | null
}
