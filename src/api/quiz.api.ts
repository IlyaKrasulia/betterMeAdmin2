import { apiClient } from './axios'
import type {
  StartSessionRequest,
  StartSessionResponse,
  SubmitAnswerRequest,
  SubmitAnswerResponse,
  GetSessionResponse,
  BackResponse,
  ConvertRequest,
  MessageResponse,
} from '@shared/types/api.types'

export const quizApi = {
  // POST /api/quiz/sessions
  startSession: async (data: StartSessionRequest): Promise<StartSessionResponse> => {
    const response = await apiClient.post<StartSessionResponse>('/api/quiz/sessions', data)
    return response.data
  },

  // POST /api/quiz/sessions/{sessionId}/answers
  submitAnswer: async (
    sessionId: string,
    data: SubmitAnswerRequest
  ): Promise<SubmitAnswerResponse> => {
    const response = await apiClient.post<SubmitAnswerResponse>(
      `/api/quiz/sessions/${sessionId}/answers`,
      data
    )
    return response.data
  },

  // GET /api/quiz/sessions/{sessionId}
  getSession: async (sessionId: string): Promise<GetSessionResponse> => {
    const response = await apiClient.get<GetSessionResponse>(
      `/api/quiz/sessions/${sessionId}`
    )
    return response.data
  },

  // POST /api/quiz/sessions/{sessionId}/back
  goBack: async (sessionId: string): Promise<BackResponse> => {
    const response = await apiClient.post<BackResponse>(
      `/api/quiz/sessions/${sessionId}/back`
    )
    return response.data
  },

  // POST /api/quiz/sessions/{sessionId}/convert
  recordConversion: async (
    sessionId: string,
    data: ConvertRequest
  ): Promise<MessageResponse> => {
    const response = await apiClient.post<MessageResponse>(
      `/api/quiz/sessions/${sessionId}/convert`,
      data
    )
    return response.data
  },
}
