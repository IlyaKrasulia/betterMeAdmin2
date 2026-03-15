import type { DagNode, Survey } from '@shared/types/dag.types'

// ─── Types ────────────────────────────────────────────────────────────────────

/** Answers collected so far: nodeId → selected value(s) */
export type AnswerMap = Map<string, string | string[]>

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Tokenise an edge label and test whether a specific answer value is present.
 * Labels look like: "goal = weight_loss", "context = home | outdoor", "always"
 *
 * Split characters: whitespace, `=`, `|`, `(`, `)`, `→` (U+2192), `,`, `-`
 * This matches the formatting conventions used in the DAG edge labels so that
 * individual answer values such as "weight_loss" or "home" can be found as
 * exact tokens even within compound labels like "context = home | outdoor".
 */
function labelContainsValue(label: string, value: string): boolean {
  const tokens = label.split(/[\s=|()\u2192,\-]+/).filter(Boolean)
  return tokens.includes(value)
}

// ─── Public API ───────────────────────────────────────────────────────────────

/** Return the entry node (the one with no incoming edges). */
export function findStartNode(survey: Survey): DagNode | undefined {
  const targetIds = new Set(survey.edges.map((e) => e.target))
  return survey.nodes.find((n) => !targetIds.has(n.id))
}

/**
 * Given the current node and all collected answers, return the ID of the next
 * node to display.  Returns null when the current node is a terminal leaf.
 *
 * Matching priority:
 *  1. Non-fallback edge whose label contains one of the recent answer values
 *  2. Fallback edge ("fallback" keyword in label) that also matches an answer
 *  3. Any fallback edge (catch-all)
 *  4. Edge with label "always" or empty label
 *  5. First outgoing edge
 */
export function getNextNodeId(
  survey: Survey,
  currentNodeId: string,
  answers: AnswerMap
): string | null {
  const outgoing = survey.edges.filter((e) => e.source === currentNodeId)
  if (outgoing.length === 0) return null
  if (outgoing.length === 1) return outgoing[0].target

  // Collect all answer values across attributes as flat strings
  const answerValues: string[] = []
  for (const val of answers.values()) {
    if (Array.isArray(val)) answerValues.push(...val)
    else answerValues.push(val)
  }

  const nonFallback = outgoing.filter((e) => !e.data?.label?.includes('fallback'))
  const fallbacks = outgoing.filter((e) => e.data?.label?.includes('fallback'))

  // 1. Non-fallback exact match
  for (const edge of nonFallback) {
    const label = edge.data?.label ?? ''
    if (!label || label === 'always') continue
    for (const val of answerValues) {
      if (labelContainsValue(label, val)) return edge.target
    }
  }

  // 2. Fallback edges with matching answer value
  for (const edge of fallbacks) {
    const label = edge.data?.label ?? ''
    for (const val of answerValues) {
      if (labelContainsValue(label, val)) return edge.target
    }
  }

  // 3. Any fallback edge (catch-all)
  if (fallbacks.length > 0) return fallbacks[0].target

  // 4. "always" / empty-label edge
  const alwaysEdge = outgoing.find((e) => {
    const label = e.data?.label ?? ''
    return label === 'always' || !label
  })
  if (alwaysEdge) return alwaysEdge.target

  // 5. First outgoing edge
  return outgoing[0].target
}

/**
 * Estimate survey progress as a 0-100 percentage.
 * Uses history depth vs. estimated path length.
 */
export function estimateProgress(survey: Survey, historyCount: number): number {
  const nodeCount = survey.nodes.length
  if (nodeCount === 0) return 0
  const estimatedPathLength = Math.max(Math.ceil(nodeCount * 0.5), 2)
  return Math.min(Math.round((historyCount / estimatedPathLength) * 100), 95)
}
