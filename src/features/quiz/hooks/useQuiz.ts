import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { quizApi } from '@api/quiz.api'
import type { StartSessionRequest, SubmitAnswerRequest, ConvertRequest } from '@shared/types/api.types'

export function useStartSession() {
  return useMutation({
    mutationFn: (data: StartSessionRequest) => quizApi.startSession(data),
  })
}

export function useSubmitAnswer() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ sessionId, data }: { sessionId: string; data: SubmitAnswerRequest }) =>
      quizApi.submitAnswer(sessionId, data),
    onSuccess: (_, { sessionId }) => {
      queryClient.invalidateQueries({ queryKey: ['quiz', 'session', sessionId] })
    },
  })
}

export function useSession(sessionId: string) {
  return useQuery({
    queryKey: ['quiz', 'session', sessionId],
    queryFn: () => quizApi.getSession(sessionId),
    enabled: !!sessionId,
  })
}

export function useGoBack() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (sessionId: string) => quizApi.goBack(sessionId),
    onSuccess: (_, sessionId) => {
      queryClient.invalidateQueries({ queryKey: ['quiz', 'session', sessionId] })
    },
  })
}

export function useRecordConversion() {
  return useMutation({
    mutationFn: ({ sessionId, data }: { sessionId: string; data: ConvertRequest }) =>
      quizApi.recordConversion(sessionId, data),
  })
}
