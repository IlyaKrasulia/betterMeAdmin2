import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createElement } from 'react'
import {
  useFlows,
  useFlow,
  useCreateFlow,
  useUpdateFlow,
  useSetEntryNode,
  usePublishFlow,
  useUnpublishFlow,
  useDeleteFlow,
} from './useFlows'
import { flowsApi } from '@api/flows.api'

vi.mock('@api/flows.api', () => ({
  flowsApi: {
    listFlows: vi.fn(),
    getFlow: vi.fn(),
    createFlow: vi.fn(),
    updateFlow: vi.fn(),
    setEntryNode: vi.fn(),
    publishFlow: vi.fn(),
    unpublishFlow: vi.fn(),
    deleteFlow: vi.fn(),
  },
}))

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  return ({ children }: { children: React.ReactNode }) =>
    createElement(QueryClientProvider, { client: queryClient }, children)
}

const flowSummary = {
  id: 'f1',
  name: 'Flow 1',
  description: '',
  isPublished: false,
  entryNodeId: null,
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('useFlows', () => {
  it('fetches the list of flows', async () => {
    vi.mocked(flowsApi.listFlows).mockResolvedValueOnce([flowSummary])
    const { result } = renderHook(() => useFlows(), { wrapper: createWrapper() })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual([flowSummary])
  })
})

describe('useFlow', () => {
  it('fetches a single flow by id', async () => {
    const detail = { ...flowSummary, nodes: [], edges: [] }
    vi.mocked(flowsApi.getFlow).mockResolvedValueOnce(detail)
    const { result } = renderHook(() => useFlow('f1'), { wrapper: createWrapper() })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual(detail)
    expect(flowsApi.getFlow).toHaveBeenCalledWith('f1')
  })

  it('is disabled when flowId is empty', () => {
    const { result } = renderHook(() => useFlow(''), { wrapper: createWrapper() })
    expect(result.current.fetchStatus).toBe('idle')
  })
})

describe('useCreateFlow', () => {
  it('calls createFlow and returns the new flow', async () => {
    vi.mocked(flowsApi.createFlow).mockResolvedValueOnce(flowSummary)
    const { result } = renderHook(() => useCreateFlow(), { wrapper: createWrapper() })
    result.current.mutate({ name: 'Flow 1' })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(flowsApi.createFlow).toHaveBeenCalledWith({ name: 'Flow 1' })
  })
})

describe('useUpdateFlow', () => {
  it('calls updateFlow with flowId and data', async () => {
    vi.mocked(flowsApi.updateFlow).mockResolvedValueOnce(flowSummary)
    const { result } = renderHook(() => useUpdateFlow(), { wrapper: createWrapper() })
    result.current.mutate({ flowId: 'f1', data: { name: 'Renamed' } })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(flowsApi.updateFlow).toHaveBeenCalledWith('f1', { name: 'Renamed' })
  })
})

describe('useSetEntryNode', () => {
  it('calls setEntryNode with flowId and data', async () => {
    vi.mocked(flowsApi.setEntryNode).mockResolvedValueOnce(flowSummary)
    const { result } = renderHook(() => useSetEntryNode(), { wrapper: createWrapper() })
    result.current.mutate({ flowId: 'f1', data: { entryNodeId: 'n1' } })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(flowsApi.setEntryNode).toHaveBeenCalledWith('f1', { entryNodeId: 'n1' })
  })
})

describe('usePublishFlow', () => {
  it('calls publishFlow with flowId', async () => {
    vi.mocked(flowsApi.publishFlow).mockResolvedValueOnce({ ...flowSummary, isPublished: true })
    const { result } = renderHook(() => usePublishFlow(), { wrapper: createWrapper() })
    result.current.mutate('f1')
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(flowsApi.publishFlow).toHaveBeenCalledWith('f1')
  })
})

describe('useUnpublishFlow', () => {
  it('calls unpublishFlow with flowId', async () => {
    vi.mocked(flowsApi.unpublishFlow).mockResolvedValueOnce(flowSummary)
    const { result } = renderHook(() => useUnpublishFlow(), { wrapper: createWrapper() })
    result.current.mutate('f1')
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(flowsApi.unpublishFlow).toHaveBeenCalledWith('f1')
  })
})

describe('useDeleteFlow', () => {
  it('calls deleteFlow with flowId', async () => {
    vi.mocked(flowsApi.deleteFlow).mockResolvedValueOnce({ message: 'Flow deleted.' })
    const { result } = renderHook(() => useDeleteFlow(), { wrapper: createWrapper() })
    result.current.mutate('f1')
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(flowsApi.deleteFlow).toHaveBeenCalledWith('f1')
  })
})
