import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createElement } from 'react'
import { useCreateEdge, useUpdateEdge, useDeleteEdge } from './useEdges'
import { edgesApi } from '@api/edges.api'

vi.mock('@api/edges.api', () => ({
  edgesApi: {
    createEdge: vi.fn(),
    updateEdge: vi.fn(),
    deleteEdge: vi.fn(),
  },
}))

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  return ({ children }: { children: React.ReactNode }) =>
    createElement(QueryClientProvider, { client: queryClient }, children)
}

const edgeDetail = {
  id: 'e1',
  flowId: 'f1',
  sourceNodeId: 'n1',
  targetNodeId: 'n2',
  priority: 0,
  conditions: null,
  createdAt: '2026-01-01T00:00:00Z',
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('useCreateEdge', () => {
  it('calls createEdge with flowId and data', async () => {
    vi.mocked(edgesApi.createEdge).mockResolvedValueOnce(edgeDetail)
    const { result } = renderHook(() => useCreateEdge(), { wrapper: createWrapper() })
    result.current.mutate({ flowId: 'f1', data: { sourceNodeId: 'n1', targetNodeId: 'n2' } })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(edgesApi.createEdge).toHaveBeenCalledWith('f1', { sourceNodeId: 'n1', targetNodeId: 'n2' })
  })
})

describe('useUpdateEdge', () => {
  it('calls updateEdge with flowId, edgeId, and data', async () => {
    vi.mocked(edgesApi.updateEdge).mockResolvedValueOnce(edgeDetail)
    const { result } = renderHook(() => useUpdateEdge(), { wrapper: createWrapper() })
    result.current.mutate({ flowId: 'f1', edgeId: 'e1', data: { priority: 10 } })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(edgesApi.updateEdge).toHaveBeenCalledWith('f1', 'e1', { priority: 10 })
  })
})

describe('useDeleteEdge', () => {
  it('calls deleteEdge with flowId and edgeId', async () => {
    vi.mocked(edgesApi.deleteEdge).mockResolvedValueOnce({ message: 'Edge deleted.' })
    const { result } = renderHook(() => useDeleteEdge(), { wrapper: createWrapper() })
    result.current.mutate({ flowId: 'f1', edgeId: 'e1' })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(edgesApi.deleteEdge).toHaveBeenCalledWith('f1', 'e1')
  })
})
