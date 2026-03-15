import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createElement } from 'react'
import { useSessionStats, useOfferStats, useDropOffs } from './useAnalytics'
import { analyticsApi } from '@api/analytics.api'

vi.mock('@api/analytics.api', () => ({
  analyticsApi: {
    getSessionStats: vi.fn(),
    getOfferStats: vi.fn(),
    getDropOffs: vi.fn(),
  },
}))

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  return ({ children }: { children: React.ReactNode }) =>
    createElement(QueryClientProvider, { client: queryClient }, children)
}

const params = { flowId: 'f1', from: '2026-01-01', to: '2026-03-01' }

beforeEach(() => {
  vi.clearAllMocks()
})

describe('useSessionStats', () => {
  it('fetches session statistics for a flow', async () => {
    const stats = {
      total: 1250,
      completed: 940,
      abandoned: 210,
      inProgress: 100,
      completionRate: 0.752,
      conversionRate: 0.34,
      avgAnswersBeforeCompletion: 5.2,
    }
    vi.mocked(analyticsApi.getSessionStats).mockResolvedValueOnce(stats)
    const { result } = renderHook(() => useSessionStats(params), { wrapper: createWrapper() })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.total).toBe(1250)
    expect(analyticsApi.getSessionStats).toHaveBeenCalledWith(params)
  })

  it('is disabled when flowId is empty', () => {
    const { result } = renderHook(() => useSessionStats({ flowId: '' }), {
      wrapper: createWrapper(),
    })
    expect(result.current.fetchStatus).toBe('idle')
  })
})

describe('useOfferStats', () => {
  it('fetches offer statistics for a flow', async () => {
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
    vi.mocked(analyticsApi.getOfferStats).mockResolvedValueOnce(offerStats)
    const { result } = renderHook(() => useOfferStats(params), { wrapper: createWrapper() })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toHaveLength(1)
    expect(analyticsApi.getOfferStats).toHaveBeenCalledWith(params)
  })

  it('is disabled when flowId is empty', () => {
    const { result } = renderHook(() => useOfferStats({ flowId: '' }), {
      wrapper: createWrapper(),
    })
    expect(result.current.fetchStatus).toBe('idle')
  })
})

describe('useDropOffs', () => {
  it('fetches drop-off data for a flow', async () => {
    const dropOffs = [
      {
        nodeId: 'n1',
        nodeTitle: "What's your stress level?",
        dropOffCount: 45,
        dropOffRate: 0.12,
      },
    ]
    vi.mocked(analyticsApi.getDropOffs).mockResolvedValueOnce(dropOffs)
    const { result } = renderHook(() => useDropOffs(params), { wrapper: createWrapper() })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.[0].dropOffCount).toBe(45)
    expect(analyticsApi.getDropOffs).toHaveBeenCalledWith(params)
  })

  it('is disabled when flowId is empty', () => {
    const { result } = renderHook(() => useDropOffs({ flowId: '' }), {
      wrapper: createWrapper(),
    })
    expect(result.current.fetchStatus).toBe('idle')
  })
})
