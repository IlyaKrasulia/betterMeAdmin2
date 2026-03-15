import { describe, it, expect, vi, beforeEach } from 'vitest'
import { analyticsApi } from '@api/analytics.api'
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

const params = { flowId: 'f1', from: '2026-01-01', to: '2026-03-01' }

describe('analyticsApi', () => {
  it('getSessionStats calls GET /api/admin/analytics/sessions with params', async () => {
    const stats = {
      total: 1250,
      completed: 940,
      abandoned: 210,
      inProgress: 100,
      completionRate: 0.752,
      conversionRate: 0.34,
      avgAnswersBeforeCompletion: 5.2,
    }
    mockGet.mockResolvedValueOnce({ data: stats })
    const result = await analyticsApi.getSessionStats(params)
    expect(mockGet).toHaveBeenCalledWith('/api/admin/analytics/sessions', { params })
    expect(result.total).toBe(1250)
  })

  it('getOfferStats calls GET /api/admin/analytics/offers with params', async () => {
    const offerStats = [
      {
        offerId: 'o1',
        offerName: 'Weight Loss Starter',
        offerSlug: 'weight_loss_starter',
        timesPrimary: 320,
        timesAddon: 45,
        conversions: 112,
        conversionRate: 0.307,
      },
    ]
    mockGet.mockResolvedValueOnce({ data: offerStats })
    const result = await analyticsApi.getOfferStats(params)
    expect(mockGet).toHaveBeenCalledWith('/api/admin/analytics/offers', { params })
    expect(result).toHaveLength(1)
  })

  it('getDropOffs calls GET /api/admin/analytics/drop-offs with params', async () => {
    const dropOffs = [
      {
        nodeId: 'n1',
        nodeTitle: "What's your stress level?",
        dropOffCount: 45,
        dropOffRate: 0.12,
      },
    ]
    mockGet.mockResolvedValueOnce({ data: dropOffs })
    const result = await analyticsApi.getDropOffs(params)
    expect(mockGet).toHaveBeenCalledWith('/api/admin/analytics/drop-offs', { params })
    expect(result[0].dropOffCount).toBe(45)
  })
})
