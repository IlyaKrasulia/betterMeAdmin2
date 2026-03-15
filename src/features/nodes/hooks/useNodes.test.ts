import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createElement } from 'react'
import { useCreateNode, useUpdateNode, useUpdateNodePosition, useDeleteNode } from './useNodes'
import { nodesApi } from '@api/nodes.api'

vi.mock('@api/nodes.api', () => ({
  nodesApi: {
    createNode: vi.fn(),
    updateNode: vi.fn(),
    updateNodePosition: vi.fn(),
    deleteNode: vi.fn(),
  },
}))

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  return ({ children }: { children: React.ReactNode }) =>
    createElement(QueryClientProvider, { client: queryClient }, children)
}

const nodeDetail = {
  id: 'n1',
  flowId: 'f1',
  type: 'Question' as const,
  attributeKey: 'goal',
  title: 'What is your goal?',
  description: null,
  mediaUrl: null,
  positionX: 100,
  positionY: 200,
  createdAt: '2026-01-01T00:00:00Z',
  options: [],
  nodeOffers: [],
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('useCreateNode', () => {
  it('calls createNode with flowId and data', async () => {
    vi.mocked(nodesApi.createNode).mockResolvedValueOnce(nodeDetail)
    const { result } = renderHook(() => useCreateNode(), { wrapper: createWrapper() })
    result.current.mutate({ flowId: 'f1', data: { type: 'Question', title: 'What is your goal?' } })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(nodesApi.createNode).toHaveBeenCalledWith('f1', { type: 'Question', title: 'What is your goal?' })
  })
})

describe('useUpdateNode', () => {
  it('calls updateNode with flowId, nodeId, and data', async () => {
    vi.mocked(nodesApi.updateNode).mockResolvedValueOnce(nodeDetail)
    const { result } = renderHook(() => useUpdateNode(), { wrapper: createWrapper() })
    result.current.mutate({ flowId: 'f1', nodeId: 'n1', data: { title: 'Updated' } })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(nodesApi.updateNode).toHaveBeenCalledWith('f1', 'n1', { title: 'Updated' })
  })
})

describe('useUpdateNodePosition', () => {
  it('calls updateNodePosition with flowId, nodeId, and position data', async () => {
    vi.mocked(nodesApi.updateNodePosition).mockResolvedValueOnce({ id: 'n1', positionX: 350, positionY: 120 })
    const { result } = renderHook(() => useUpdateNodePosition(), { wrapper: createWrapper() })
    result.current.mutate({ flowId: 'f1', nodeId: 'n1', data: { positionX: 350, positionY: 120 } })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(nodesApi.updateNodePosition).toHaveBeenCalledWith('f1', 'n1', { positionX: 350, positionY: 120 })
  })
})

describe('useDeleteNode', () => {
  it('calls deleteNode with flowId and nodeId', async () => {
    vi.mocked(nodesApi.deleteNode).mockResolvedValueOnce({ message: 'Node deleted.' })
    const { result } = renderHook(() => useDeleteNode(), { wrapper: createWrapper() })
    result.current.mutate({ flowId: 'f1', nodeId: 'n1' })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(nodesApi.deleteNode).toHaveBeenCalledWith('f1', 'n1')
  })
})
