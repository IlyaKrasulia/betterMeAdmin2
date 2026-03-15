import { describe, it, expect, beforeEach } from 'vitest'
import { useSurveysStore } from '@features/surveys/store/surveys.store'
import { SurveyStatus } from '@shared/types/dag.types'
import type { Survey } from '@shared/types/dag.types'

const makeSurvey = (id: string, overrides: Partial<Survey> = {}): Survey => ({
  id,
  title: `Survey ${id}`,
  status: SurveyStatus.Draft,
  completionCount: 0,
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
  nodes: [],
  edges: [],
  ...overrides,
})

describe('useSurveysStore', () => {
  beforeEach(() => {
    // Reset to empty state before each test
    useSurveysStore.setState({ surveys: [] })
  })

  // ── addSurvey ─────────────────────────────────────────────────────────────

  it('addSurvey appends a survey to the list', () => {
    const survey = makeSurvey('s1')
    useSurveysStore.getState().addSurvey(survey)

    expect(useSurveysStore.getState().surveys).toHaveLength(1)
    expect(useSurveysStore.getState().surveys[0].id).toBe('s1')
  })

  it('addSurvey preserves existing surveys', () => {
    useSurveysStore.getState().addSurvey(makeSurvey('s1'))
    useSurveysStore.getState().addSurvey(makeSurvey('s2'))

    expect(useSurveysStore.getState().surveys).toHaveLength(2)
  })

  // ── updateSurvey ──────────────────────────────────────────────────────────

  it('updateSurvey merges partial updates and bumps updatedAt', () => {
    const originalTime = '2026-01-01T00:00:00Z'
    useSurveysStore.getState().addSurvey(makeSurvey('s1', { updatedAt: originalTime }))

    useSurveysStore.getState().updateSurvey('s1', { title: 'Renamed', status: SurveyStatus.Published })

    const updated = useSurveysStore.getState().surveys[0]
    expect(updated.title).toBe('Renamed')
    expect(updated.status).toBe(SurveyStatus.Published)
    expect(updated.updatedAt).not.toBe(originalTime)
  })

  it('updateSurvey is a no-op for unknown id', () => {
    useSurveysStore.getState().addSurvey(makeSurvey('s1'))
    const before = useSurveysStore.getState().surveys[0].title

    useSurveysStore.getState().updateSurvey('ghost', { title: 'Ghost' })

    expect(useSurveysStore.getState().surveys[0].title).toBe(before)
  })

  // ── deleteSurvey ──────────────────────────────────────────────────────────

  it('deleteSurvey removes the matching survey', () => {
    useSurveysStore.getState().addSurvey(makeSurvey('s1'))
    useSurveysStore.getState().addSurvey(makeSurvey('s2'))

    useSurveysStore.getState().deleteSurvey('s1')

    const surveys = useSurveysStore.getState().surveys
    expect(surveys).toHaveLength(1)
    expect(surveys[0].id).toBe('s2')
  })

  it('deleteSurvey is a no-op for unknown id', () => {
    useSurveysStore.getState().addSurvey(makeSurvey('s1'))

    useSurveysStore.getState().deleteSurvey('ghost')

    expect(useSurveysStore.getState().surveys).toHaveLength(1)
  })

  // ── getSurveyById ─────────────────────────────────────────────────────────

  it('getSurveyById returns the matching survey', () => {
    useSurveysStore.getState().addSurvey(makeSurvey('s1'))

    const found = useSurveysStore.getState().getSurveyById('s1')
    expect(found?.id).toBe('s1')
  })

  it('getSurveyById returns undefined for an unknown id', () => {
    useSurveysStore.getState().addSurvey(makeSurvey('s1'))

    const found = useSurveysStore.getState().getSurveyById('ghost')
    expect(found).toBeUndefined()
  })
})
