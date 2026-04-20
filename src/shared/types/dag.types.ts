// ─── Node Types ───────────────────────────────────────────────────────────────

export enum NodeType {
  Question = 'Question',
  Info = 'Info',           // maps to backend 'InfoPage'
  Offer = 'Offer',
  LeadCapture = 'LeadCapture',
  Redirect = 'Redirect',
}

export enum ValueKind {
  Text = 'Text',
  Number = 'Numeric',
}

export enum AnswerType {
  SingleChoice = 'SingleChoice',
  MultipleChoice = 'MultipleChoice',
  Slider = 'Slider',
  Text = 'Text',
}

export type LeadCaptureFieldType =
  | 'FullName'
  | 'Email'
  | 'Phone'
  | 'CompanyName'
  | 'JobTitle'
  | 'CompanySize'
  | 'Website'

export type QualificationTier = 'Hot' | 'Warm' | 'Cold' | 'Disqualified'

export type CalendarProvider = 'None' | 'Calendly' | 'CalCom' | 'HubSpot' | 'Custom'

// Kept for FlowDetail.attributeKeys compatibility; key is now a plain string
export interface AttributeKeyOption {
  value: string
  label: string
  key: string
}

export interface AnswerOption {
  id: string
  label: string
  value: string
  /** Score contribution when this option is selected (+/- int). */
  scoreDelta: number
}

// ─── Node Data Discriminated Union ────────────────────────────────────────────

export interface QuestionNodeData {
  type: NodeType.Question
  /** Question title shown to the lead. */
  title: string
  description?: string
  /** Free-form attribute key stored in answer context (e.g. "job_title"). */
  attributeKey: string
  answerType: AnswerType
  valueKind: ValueKind
  options: AnswerOption[]
  /** Slider lower bound (only when answerType = Slider). */
  min?: number
  /** Slider upper bound (only when answerType = Slider). */
  max?: number
  mediaUrl?: string
}

export interface InfoNodeData {
  type: NodeType.Info
  title: string
  body: string
  mediaUrl?: string
}

export interface OfferNodeData {
  type: NodeType.Offer
  /** Internal builder name — never shown to the lead. */
  name: string
  slug?: string
  /** Lead-facing headline. Supports {{token}} substitution. */
  headline: string
  /** Lead-facing body copy. */
  body: string
  imageUrl?: string
  ctaText: string
  ctaUrl?: string
  /** When set, renders a calendar booking embed instead of plain CTA. */
  calendarUrl?: string
  calendarProvider?: CalendarProvider
  tier?: QualificationTier
  /** ID of the NodeOffer link record (populated when loaded from API). */
  nodeOfferId?: string
  /** ID of the linked Offer entity (populated when loaded from API). */
  offerId?: string
}

export interface LeadCaptureField {
  fieldType: LeadCaptureFieldType
  isRequired: boolean
  displayOrder: number
  placeholder?: string
}

export interface LeadCaptureNodeData {
  type: NodeType.LeadCapture
  /** Title shown above the form. */
  title: string
  /** If false the lead sees a Skip button. */
  isRequired: boolean
  fields: LeadCaptureField[]
}

export interface RedirectLink {
  /** Server-side ID — present for links loaded from API, absent for newly added links. */
  id?: string
  label: string
  url: string
  displayOrder: number
}

export interface RedirectNodeData {
  type: NodeType.Redirect
  /** Title shown on the redirect screen (replaces old "headline"). */
  title: string
  /** Body copy shown below the title (replaces old "body"). */
  description: string
  tier: QualificationTier
  redirectUrl?: string
  /** Seconds before auto-redirect fires (null = no auto-redirect). */
  autoRedirectAfterSeconds?: number
  links: RedirectLink[]
}

export type DagNodeData = (
  | QuestionNodeData
  | InfoNodeData
  | OfferNodeData
  | LeadCaptureNodeData
  | RedirectNodeData
) & { isLocal?: boolean }

// ─── DAG Node (React Flow node) ───────────────────────────────────────────────

export interface DagNode {
  id: string
  type: NodeType
  position: { x: number; y: number }
  data: DagNodeData
  isLocal?: boolean
}

// ─── Edge Conditions ─────────────────────────────────────────────────────────

export type EdgeOperator =
  | 'eq'
  | 'neq'
  | 'gt'
  | 'gte'
  | 'lt'
  | 'lte'
  | 'between'
  | 'in'
  | 'not_in'
  | 'contains'

export interface EdgeConditionRule {
  attributeKey: string
  operator?: EdgeOperator
  value: string
  valueTo?: string
}

export interface EdgeConditions {
  always: boolean
  rules: EdgeConditionRule[]
  priority: number
  operator?: 'AND' | 'OR'
}

// ─── DAG Edge (React Flow edge + conditions) ──────────────────────────────────

export interface DagEdge {
  id: string
  source: string
  target: string
  type?: string
  data?: { label?: string; conditions?: EdgeConditions }
}

// ─── Survey / Funnel ──────────────────────────────────────────────────────────

export enum SurveyStatus {
  Draft = 'draft',
  Published = 'published',
  Archived = 'archived',
}

export interface Survey {
  id: string
  title: string
  description?: string
  status: SurveyStatus
  completionCount: number
  createdAt: string
  updatedAt: string
  nodes: DagNode[]
  edges: DagEdge[]
}
