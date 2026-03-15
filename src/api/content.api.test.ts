import { describe, it, expect, vi, beforeEach } from 'vitest'
import { contentApi } from '@api/content.api'
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

beforeEach(() => {
  vi.clearAllMocks()
})

const publishedFlow = {
  flowId: 'f1',
  name: 'BetterMe Wellness',
  entryNodeId: 'n1',
  nodes: [],
  edges: [],
}

describe('contentApi', () => {
  it('getPublishedFlow calls GET /api/content/flow', async () => {
    mockGet.mockResolvedValueOnce({ data: publishedFlow })
    const result = await contentApi.getPublishedFlow()
    expect(mockGet).toHaveBeenCalledWith('/api/content/flow')
    expect(result).toEqual(publishedFlow)
  })

  it('getFlowById calls GET /api/content/flow/{flowId}', async () => {
    mockGet.mockResolvedValueOnce({ data: publishedFlow })
    const result = await contentApi.getFlowById('f1')
    expect(mockGet).toHaveBeenCalledWith('/api/content/flow/f1')
    expect(result).toEqual(publishedFlow)
  })
})
