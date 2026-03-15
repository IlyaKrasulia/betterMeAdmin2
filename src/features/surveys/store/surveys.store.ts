import { create } from 'zustand'
import type { Survey } from '@shared/types/dag.types'
import { MOCK_SURVEYS } from '../data/mock-surveys'

interface SurveysState {
  surveys: Survey[]
  addSurvey: (survey: Survey) => void
  updateSurvey: (id: string, updates: Partial<Survey>) => void
  deleteSurvey: (id: string) => void
  getSurveyById: (id: string) => Survey | undefined
}

export const useSurveysStore = create<SurveysState>((set, get) => ({
  surveys: MOCK_SURVEYS,
  addSurvey: (survey) => set((s) => ({ surveys: [...s.surveys, survey] })),
  updateSurvey: (id, updates) =>
    set((s) => ({
      surveys: s.surveys.map((sv) =>
        sv.id === id ? { ...sv, ...updates, updatedAt: new Date().toISOString() } : sv
      ),
    })),
  deleteSurvey: (id) => set((s) => ({ surveys: s.surveys.filter((sv) => sv.id !== id) })),
  getSurveyById: (id) => get().surveys.find((sv) => sv.id === id),
}))
