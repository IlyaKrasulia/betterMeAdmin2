import { describe, it, expect, vi, beforeEach } from 'vitest'
import { offersApi } from '@api/offers.api'
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

const offerDto = {
  id: 'o1',
  slug: 'weight_loss_starter',
  name: 'Weight Loss Starter',
  description: null,
  duration: '4 weeks',
  digitalContent: null,
  kitName: null,
  kitContents: null,
  price: 49.99,
  imageUrl: null,
  ctaText: 'Start My Plan',
  ctaUrl: 'https://example.com',
}

describe('offersApi', () => {
  it('listOffers calls GET /api/admin/offers', async () => {
    mockGet.mockResolvedValueOnce({ data: [offerDto] })
    const result = await offersApi.listOffers()
    expect(mockGet).toHaveBeenCalledWith('/api/admin/offers')
    expect(result).toEqual([offerDto])
  })

  it('getOffer calls GET /api/admin/offers/{offerId}', async () => {
    mockGet.mockResolvedValueOnce({ data: offerDto })
    const result = await offersApi.getOffer('o1')
    expect(mockGet).toHaveBeenCalledWith('/api/admin/offers/o1')
    expect(result).toEqual(offerDto)
  })

  it('createOffer calls POST /api/admin/offers', async () => {
    mockPost.mockResolvedValueOnce({ data: offerDto })
    const result = await offersApi.createOffer({
      slug: 'weight_loss_starter',
      name: 'Weight Loss Starter',
    })
    expect(mockPost).toHaveBeenCalledWith('/api/admin/offers', {
      slug: 'weight_loss_starter',
      name: 'Weight Loss Starter',
    })
    expect(result).toEqual(offerDto)
  })

  it('updateOffer calls PUT /api/admin/offers/{offerId}', async () => {
    const updated = { ...offerDto, name: 'Updated Offer' }
    mockPut.mockResolvedValueOnce({ data: updated })
    const result = await offersApi.updateOffer('o1', { name: 'Updated Offer' })
    expect(mockPut).toHaveBeenCalledWith('/api/admin/offers/o1', { name: 'Updated Offer' })
    expect(result.name).toBe('Updated Offer')
  })

  it('deleteOffer calls DELETE /api/admin/offers/{offerId}', async () => {
    mockDelete.mockResolvedValueOnce({ data: { message: 'Offer deleted.' } })
    const result = await offersApi.deleteOffer('o1')
    expect(mockDelete).toHaveBeenCalledWith('/api/admin/offers/o1')
    expect(result.message).toBe('Offer deleted.')
  })
})
