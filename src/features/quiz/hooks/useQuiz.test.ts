import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createElement } from 'react'
import {
  useStartSession,
  useSubmitAnswer,
  useSession,
  useGoBack,
  useRecordConversion,
} from './useQuiz'
import { quizApi } from '@api/quiz.api'

vi.mock('@api/quiz.api', () => ({
  quizApi: {
    startSession: vi.fn(),
    submitAnswer: vi.fn(),
    getSession: vi.fn(),
    goBack: vi.fn(),
    recordConversion: vi.fn(),
  },
}))

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  return ({ children }: { children: React.ReactNode }) =>
    createElement(QueryClientProvider, { client: queryClient }, children)
}

const currentNode = {
  id: 'n1',
  type: 'Question' as const,
  attributeKey: 'goal',
  title: 'What is your goal?',
  description: null,
  mediaUrl: null,
  options: [],
  offers: [],
}

const sessionResponse = {
  sessionId: 's1',
  flowId: 'f1',
  status: 'InProgress' as const,
  startedAt: '2026-03-15T00:00:00Z',
  completedAt: null,
  currentNode,
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('useStartSession', () => {
  it('calls startSession and returns the session', async () => {
    vi.mocked(quizApi.startSession).mockResolvedValueOnce(sessionResponse)
    const { result } = renderHook(() => useStartSession(), { wrapper: createWrapper() })
    result.current.mutate({ flowId: 'f1' })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(quizApi.startSession).toHaveBeenCalledWith({ flowId: 'f1' })
    expect(result.current.data?.sessionId).toBe('s1')
  })
})

describe('useSubmitAnswer', () => {
  it('calls submitAnswer with sessionId and data', async () => {
    const response = { ...sessionResponse, status: 'InProgress' as const }
    vi.mocked(quizApi.submitAnswer).mockResolvedValueOnce(response)
    const { result } = renderHook(() => useSubmitAnswer(), { wrapper: createWrapper() })
    result.current.mutate({ sessionId: 's1', data: { nodeId: 'n1', value: 'weight_loss' } })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(quizApi.submitAnswer).toHaveBeenCalledWith('s1', { nodeId: 'n1', value: 'weight_loss' })
  })
})

describe('useSession', () => {
  it('fetches session state by sessionId', async () => {
    const sessionState = {
      sessionId: 's1',
      flowId: 'f1',
      status: 'InProgress' as const,
      startedAt: '2026-03-15T00:00:00Z',
      completedAt: null,
      currentNode,
      answers: [],
    }
    vi.mocked(quizApi.getSession).mockResolvedValueOnce(sessionState)
    const { result } = renderHook(() => useSession('s1'), { wrapper: createWrapper() })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.sessionId).toBe('s1')
    expect(quizApi.getSession).toHaveBeenCalledWith('s1')
  })

  it('is disabled when sessionId is empty', () => {
    const { result } = renderHook(() => useSession(''), { wrapper: createWrapper() })
    expect(result.current.fetchStatus).toBe('idle')
  })
})

describe('useGoBack', () => {
  it('calls goBack with sessionId', async () => {
    vi.mocked(quizApi.goBack).mockResolvedValueOnce(sessionResponse)
    const { result } = renderHook(() => useGoBack(), { wrapper: createWrapper() })
    result.current.mutate('s1')
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(quizApi.goBack).toHaveBeenCalledWith('s1')
  })
})

describe('useRecordConversion', () => {
  it('calls recordConversion with sessionId and offerId', async () => {
    vi.mocked(quizApi.recordConversion).mockResolvedValueOnce({ message: 'Conversion recorded.' })
    const { result } = renderHook(() => useRecordConversion(), { wrapper: createWrapper() })
    result.current.mutate({ sessionId: 's1', data: { offerId: 'o1' } })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(quizApi.recordConversion).toHaveBeenCalledWith('s1', { offerId: 'o1' })
  })
})
