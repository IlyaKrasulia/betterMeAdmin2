import { describe, it, expect, vi, beforeEach } from 'vitest'
import { nodeOffersApi } from '@api/node-offers.api'
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

const linkDto = {
  id: 'link1',
  nodeId: 'n1',
  offerId: 'o1',
  isPrimary: true,
  offer: { slug: 'weight_loss_starter', name: 'Weight Loss Starter' },
}

describe('nodeOffersApi', () => {
  it('listNodeOffers calls GET /api/admin/nodes/{nodeId}/offers', async () => {
    mockGet.mockResolvedValueOnce({ data: [linkDto] })
    const result = await nodeOffersApi.listNodeOffers('n1')
    expect(mockGet).toHaveBeenCalledWith('/api/admin/nodes/n1/offers')
    expect(result).toEqual([linkDto])
  })

  it('linkOffer calls POST /api/admin/nodes/{nodeId}/offers', async () => {
    mockPost.mockResolvedValueOnce({ data: linkDto })
    const result = await nodeOffersApi.linkOffer('n1', { offerId: 'o1', isPrimary: true })
    expect(mockPost).toHaveBeenCalledWith('/api/admin/nodes/n1/offers', {
      offerId: 'o1',
      isPrimary: true,
    })
    expect(result).toEqual(linkDto)
  })

  it('updateNodeOffer calls PUT /api/admin/nodes/{nodeId}/offers/{nodeOfferId}', async () => {
    const updated = { ...linkDto, isPrimary: false }
    mockPut.mockResolvedValueOnce({ data: updated })
    const result = await nodeOffersApi.updateNodeOffer('n1', 'link1', { isPrimary: false })
    expect(mockPut).toHaveBeenCalledWith('/api/admin/nodes/n1/offers/link1', {
      isPrimary: false,
    })
    expect(result.isPrimary).toBe(false)
  })

  it('unlinkOffer calls DELETE /api/admin/nodes/{nodeId}/offers/{nodeOfferId}', async () => {
    mockDelete.mockResolvedValueOnce({ data: { message: 'Node-offer link removed.' } })
    const result = await nodeOffersApi.unlinkOffer('n1', 'link1')
    expect(mockDelete).toHaveBeenCalledWith('/api/admin/nodes/n1/offers/link1')
    expect(result.message).toBe('Node-offer link removed.')
  })
})
