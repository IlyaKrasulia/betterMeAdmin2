import { describe, it, expect, vi, beforeEach } from 'vitest'
import { optionsApi } from '@api/options.api'
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

const optionDetail = {
  id: 'opt1',
  nodeId: 'n1',
  label: 'Weight Loss',
  value: 'weight_loss',
  displayOrder: 0,
  mediaUrl: null,
}

describe('optionsApi', () => {
  it('createOption calls POST /api/admin/nodes/{nodeId}/options', async () => {
    mockPost.mockResolvedValueOnce({ data: optionDetail })
    const result = await optionsApi.createOption('n1', {
      label: 'Weight Loss',
      value: 'weight_loss',
    })
    expect(mockPost).toHaveBeenCalledWith('/api/admin/nodes/n1/options', {
      label: 'Weight Loss',
      value: 'weight_loss',
    })
    expect(result).toEqual(optionDetail)
  })

  it('updateOption calls PUT /api/admin/nodes/{nodeId}/options/{optionId}', async () => {
    mockPut.mockResolvedValueOnce({ data: { ...optionDetail, label: 'Lose Weight' } })
    const result = await optionsApi.updateOption('n1', 'opt1', { label: 'Lose Weight' })
    expect(mockPut).toHaveBeenCalledWith('/api/admin/nodes/n1/options/opt1', {
      label: 'Lose Weight',
    })
    expect(result.label).toBe('Lose Weight')
  })

  it('deleteOption calls DELETE /api/admin/nodes/{nodeId}/options/{optionId}', async () => {
    mockDelete.mockResolvedValueOnce({ data: { message: 'Option deleted.' } })
    const result = await optionsApi.deleteOption('n1', 'opt1')
    expect(mockDelete).toHaveBeenCalledWith('/api/admin/nodes/n1/options/opt1')
    expect(result.message).toBe('Option deleted.')
  })

  it('reorderOptions calls PUT /api/admin/nodes/{nodeId}/options/reorder', async () => {
    mockPut.mockResolvedValueOnce({ data: { message: 'Options reordered.' } })
    const order = [
      { optionId: 'opt1', displayOrder: 0 },
      { optionId: 'opt2', displayOrder: 1 },
    ]
    const result = await optionsApi.reorderOptions('n1', { order })
    expect(mockPut).toHaveBeenCalledWith('/api/admin/nodes/n1/options/reorder', { order })
    expect(result.message).toBe('Options reordered.')
  })
})
