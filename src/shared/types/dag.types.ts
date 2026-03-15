// ─── DAG Node Types ───────────────────────────────────────────────────────────

export enum NodeType {
  Question = 'Question',
  Info = 'Info',
  Offer = 'Offer',
}

export enum AttributeKey {
  Age = 'age',
  Gender = 'gender',
  Goal = 'goal',
  Location = 'location',
  FitnessLevel = 'fitness_level',
  AvailableTime = 'available_time',
  Injuries = 'injuries',
  Motivation = 'motivation',
  StressLevel = 'stress_level',
  SleepLevel = 'sleep_level',
  EnergyLevel = 'energy_level',
}

export enum AnswerType {
  SingleChoice = 'single_choice',
  MultipleChoice = 'multiple_choice',
  Slider = 'slider',
}

export interface AnswerOption {
  id: string
  label: string
  icon?: string
  value: string
}

// ─── Node Data Discriminated Union ───────────────────────────────────────────

export interface QuestionNodeData {
  type: NodeType.Question
  questionText: string
  attribute: AttributeKey
  answerType: AnswerType
  options: AnswerOption[]
  /** Slider lower bound (only used when answerType is Slider) */
  min?: number
  /** Slider upper bound (only used when answerType is Slider) */
  max?: number
}

export interface InfoNodeData {
  type: NodeType.Info
  title: string
  body: string
  imageUrl?: string
}

export interface OfferNodeData {
  type: NodeType.Offer
  headline: string
  description: string
  ctaText: string
  price?: number
  kitName?: string
  kitContents?: string
}

export type DagNodeData = QuestionNodeData | InfoNodeData | OfferNodeData

// ─── DAG Node (React Flow node) ───────────────────────────────────────────────

export interface DagNode {
  id: string
  type: NodeType
  position: { x: number; y: number }
  data: DagNodeData
}

// ─── Edge Conditions ─────────────────────────────────────────────────────────

/**
 * Logical operators for edge condition rules.
 *  - Equality:  eq, neq
 *  - Numeric:   gt, gte, lt, lte, between
 *  - Set:       in, not_in  (comma-separated values)
 *  - Text:      contains
 */
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

/**
 * A single AND-combined condition rule stored on an edge.
 * Backend JSON format: { AttributeKey, Operator, Value, ValueTo? }
 *   - 'between':  value = range start, valueTo = range end
 *   - 'in'/'not_in': value = comma-separated list
 *   - all others: value = single string
 */
export interface EdgeConditionRule {
  attributeKey: string     // matches a question node's AttributeKey
  operator: EdgeOperator   // comparison operator
  value: string            // primary value (or range start for 'between')
  valueTo?: string         // range end — only used with 'between'
}

/**
 * All routing config for one edge, stored in edge.data.conditions.
 * Serialised to conditionsJson on save:
 *   - always=true  → null          (unconditional fallback)
 *   - always=false → JSON array of EdgeConditionRule objects
 */
export interface EdgeConditions {
  always: boolean           // true = unconditional; conditionsJson will be null
  rules: EdgeConditionRule[] // AND logic; ignored when always=true
  priority: number          // higher = evaluated first; 0 = lowest (default for fallback)
}

// ─── DAG Edge (React Flow edge + conditions) ─────────────────────────────────

export interface DagEdge {
  id: string
  source: string
  target: string
  type?: string
  data?: { label?: string; conditions?: EdgeConditions }
}

// ─── Survey / Funnel ─────────────────────────────────────────────────────────

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
