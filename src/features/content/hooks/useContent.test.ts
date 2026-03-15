import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createElement } from 'react'
import { usePublishedFlow, useContentFlow } from './useContent'
import { contentApi } from '@api/content.api'

vi.mock('@api/content.api', () => ({
  contentApi: {
    getPublishedFlow: vi.fn(),
    getFlowById: vi.fn(),
  },
}))

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  return ({ children }: { children: React.ReactNode }) =>
    createElement(QueryClientProvider, { client: queryClient }, children)
}

const publishedFlow = {
  flowId: 'f1',
  name: 'Flow 1',
  entryNodeId: 'n1',
  nodes: [],
  edges: [],
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('usePublishedFlow', () => {
  it('fetches the published flow', async () => {
    vi.mocked(contentApi.getPublishedFlow).mockResolvedValueOnce(publishedFlow)
    const { result } = renderHook(() => usePublishedFlow(), { wrapper: createWrapper() })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual(publishedFlow)
  })
})

describe('useContentFlow', () => {
  it('fetches a specific flow by id', async () => {
    vi.mocked(contentApi.getFlowById).mockResolvedValueOnce(publishedFlow)
    const { result } = renderHook(() => useContentFlow('f1'), { wrapper: createWrapper() })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual(publishedFlow)
    expect(contentApi.getFlowById).toHaveBeenCalledWith('f1')
  })

  it('is disabled when flowId is empty', () => {
    const { result } = renderHook(() => useContentFlow(''), { wrapper: createWrapper() })
    expect(result.current.fetchStatus).toBe('idle')
  })
})
