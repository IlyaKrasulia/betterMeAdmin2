import { describe, it, expect, vi, beforeEach } from 'vitest'
import { flowsApi } from '@api/flows.api'
import { apiClient } from '@api/axios'

vi.mock('@api/axios', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}))

const mockGet = vi.mocked(apiClient.get)
const mockPost = vi.mocked(apiClient.post)
const mockPut = vi.mocked(apiClient.put)
const mockDelete = vi.mocked(apiClient.delete)

beforeEach(() => {
  vi.clearAllMocks()
})

const flowSummary = {
  id: 'f1',
  name: 'Flow 1',
  description: '',
  isPublished: false,
  entryNodeId: null,
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
}

describe('flowsApi', () => {
  it('listFlows calls GET /api/admin/flows', async () => {
    mockGet.mockResolvedValueOnce({ data: [flowSummary] })
    const result = await flowsApi.listFlows()
    expect(mockGet).toHaveBeenCalledWith('/api/admin/flows')
    expect(result).toEqual([flowSummary])
  })

  it('getFlow calls GET /api/admin/flows/{flowId}', async () => {
    const detail = { ...flowSummary, nodes: [], edges: [] }
    mockGet.mockResolvedValueOnce({ data: detail })
    const result = await flowsApi.getFlow('f1')
    expect(mockGet).toHaveBeenCalledWith('/api/admin/flows/f1')
    expect(result).toEqual(detail)
  })

  it('createFlow calls POST /api/admin/flows', async () => {
    mockPost.mockResolvedValueOnce({ data: flowSummary })
    const result = await flowsApi.createFlow({ name: 'Flow 1' })
    expect(mockPost).toHaveBeenCalledWith('/api/admin/flows', { name: 'Flow 1' })
    expect(result).toEqual(flowSummary)
  })

  it('updateFlow calls PUT /api/admin/flows/{flowId}', async () => {
    mockPut.mockResolvedValueOnce({ data: flowSummary })
    const result = await flowsApi.updateFlow('f1', { name: 'Renamed' })
    expect(mockPut).toHaveBeenCalledWith('/api/admin/flows/f1', { name: 'Renamed' })
    expect(result).toEqual(flowSummary)
  })

  it('setEntryNode calls PUT /api/admin/flows/{flowId}/entry-node', async () => {
    mockPut.mockResolvedValueOnce({ data: flowSummary })
    const result = await flowsApi.setEntryNode('f1', { entryNodeId: 'n1' })
    expect(mockPut).toHaveBeenCalledWith('/api/admin/flows/f1/entry-node', {
      entryNodeId: 'n1',
    })
    expect(result).toEqual(flowSummary)
  })

  it('publishFlow calls POST /api/admin/flows/{flowId}/publish', async () => {
    mockPost.mockResolvedValueOnce({ data: { ...flowSummary, isPublished: true } })
    const result = await flowsApi.publishFlow('f1')
    expect(mockPost).toHaveBeenCalledWith('/api/admin/flows/f1/publish')
    expect(result.isPublished).toBe(true)
  })

  it('unpublishFlow calls POST /api/admin/flows/{flowId}/unpublish', async () => {
    mockPost.mockResolvedValueOnce({ data: flowSummary })
    const result = await flowsApi.unpublishFlow('f1')
    expect(mockPost).toHaveBeenCalledWith('/api/admin/flows/f1/unpublish')
    expect(result).toEqual(flowSummary)
  })

  it('deleteFlow calls DELETE /api/admin/flows/{flowId}', async () => {
    mockDelete.mockResolvedValueOnce({ data: { message: 'Flow deleted.' } })
    const result = await flowsApi.deleteFlow('f1')
    expect(mockDelete).toHaveBeenCalledWith('/api/admin/flows/f1')
    expect(result.message).toBe('Flow deleted.')
  })
})
