import { describe, it, expect, vi, beforeEach } from 'vitest'
import { nodesApi } from '@api/nodes.api'
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

describe('nodesApi', () => {
  it('createNode calls POST /api/admin/flows/{flowId}/nodes', async () => {
    mockPost.mockResolvedValueOnce({ data: nodeDetail })
    const result = await nodesApi.createNode('f1', {
      type: 'Question',
      title: 'What is your goal?',
      attributeKey: 'goal',
    })
    expect(mockPost).toHaveBeenCalledWith('/api/admin/flows/f1/nodes', {
      type: 'Question',
      title: 'What is your goal?',
      attributeKey: 'goal',
    })
    expect(result).toEqual(nodeDetail)
  })

  it('updateNode calls PUT /api/admin/flows/{flowId}/nodes/{nodeId}', async () => {
    mockPut.mockResolvedValueOnce({ data: { ...nodeDetail, title: 'Updated' } })
    const result = await nodesApi.updateNode('f1', 'n1', { title: 'Updated' })
    expect(mockPut).toHaveBeenCalledWith('/api/admin/flows/f1/nodes/n1', { title: 'Updated' })
    expect(result.title).toBe('Updated')
  })

  it('updateNodePosition calls PUT /api/admin/flows/{flowId}/nodes/{nodeId}/position', async () => {
    const posDto = { id: 'n1', positionX: 350, positionY: 120 }
    mockPut.mockResolvedValueOnce({ data: posDto })
    const result = await nodesApi.updateNodePosition('f1', 'n1', {
      positionX: 350,
      positionY: 120,
    })
    expect(mockPut).toHaveBeenCalledWith('/api/admin/flows/f1/nodes/n1/position', {
      positionX: 350,
      positionY: 120,
    })
    expect(result).toEqual(posDto)
  })

  it('deleteNode calls DELETE /api/admin/flows/{flowId}/nodes/{nodeId}', async () => {
    mockDelete.mockResolvedValueOnce({ data: { message: 'Node deleted.' } })
    const result = await nodesApi.deleteNode('f1', 'n1')
    expect(mockDelete).toHaveBeenCalledWith('/api/admin/flows/f1/nodes/n1')
    expect(result.message).toBe('Node deleted.')
  })
})
