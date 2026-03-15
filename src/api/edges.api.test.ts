import { describe, it, expect, vi, beforeEach } from 'vitest'
import { edgesApi } from '@api/edges.api'
import { apiClient } from '@api/axios'

vi.mock('@api/axios', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}))

const mockPost = vi.mocked(apiClient.post)
const mockPut = vi.mocked(apiClient.put)
const mockDelete = vi.mocked(apiClient.delete)

beforeEach(() => {
  vi.clearAllMocks()
})

const edgeDetail = {
  id: 'e1',
  flowId: 'f1',
  sourceNodeId: 'n1',
  targetNodeId: 'n2',
  priority: 0,
  conditions: null,
  createdAt: '2026-01-01T00:00:00Z',
}

describe('edgesApi', () => {
  it('createEdge calls POST /api/admin/flows/{flowId}/edges', async () => {
    mockPost.mockResolvedValueOnce({ data: edgeDetail })
    const result = await edgesApi.createEdge('f1', {
      sourceNodeId: 'n1',
      targetNodeId: 'n2',
    })
    expect(mockPost).toHaveBeenCalledWith('/api/admin/flows/f1/edges', {
      sourceNodeId: 'n1',
      targetNodeId: 'n2',
    })
    expect(result).toEqual(edgeDetail)
  })

  it('updateEdge calls PUT /api/admin/flows/{flowId}/edges/{edgeId}', async () => {
    const updated = { ...edgeDetail, priority: 10 }
    mockPut.mockResolvedValueOnce({ data: updated })
    const result = await edgesApi.updateEdge('f1', 'e1', { priority: 10 })
    expect(mockPut).toHaveBeenCalledWith('/api/admin/flows/f1/edges/e1', { priority: 10 })
    expect(result.priority).toBe(10)
  })

  it('deleteEdge calls DELETE /api/admin/flows/{flowId}/edges/{edgeId}', async () => {
    mockDelete.mockResolvedValueOnce({ data: { message: 'Edge deleted.' } })
    const result = await edgesApi.deleteEdge('f1', 'e1')
    expect(mockDelete).toHaveBeenCalledWith('/api/admin/flows/f1/edges/e1')
    expect(result.message).toBe('Edge deleted.')
  })
})
