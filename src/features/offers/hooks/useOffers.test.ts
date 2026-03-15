import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createElement } from 'react'
import { useOffers, useOffer, useCreateOffer, useUpdateOffer, useDeleteOffer } from './useOffers'
import { offersApi } from '@api/offers.api'

vi.mock('@api/offers.api', () => ({
  offersApi: {
    listOffers: vi.fn(),
    getOffer: vi.fn(),
    createOffer: vi.fn(),
    updateOffer: vi.fn(),
    deleteOffer: vi.fn(),
  },
}))

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  return ({ children }: { children: React.ReactNode }) =>
    createElement(QueryClientProvider, { client: queryClient }, children)
}

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

beforeEach(() => {
  vi.clearAllMocks()
})

describe('useOffers', () => {
  it('fetches the list of offers', async () => {
    vi.mocked(offersApi.listOffers).mockResolvedValueOnce([offerDto])
    const { result } = renderHook(() => useOffers(), { wrapper: createWrapper() })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual([offerDto])
  })
})

describe('useOffer', () => {
  it('fetches a single offer by id', async () => {
    vi.mocked(offersApi.getOffer).mockResolvedValueOnce(offerDto)
    const { result } = renderHook(() => useOffer('o1'), { wrapper: createWrapper() })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual(offerDto)
    expect(offersApi.getOffer).toHaveBeenCalledWith('o1')
  })

  it('is disabled when offerId is empty', () => {
    const { result } = renderHook(() => useOffer(''), { wrapper: createWrapper() })
    expect(result.current.fetchStatus).toBe('idle')
  })
})

describe('useCreateOffer', () => {
  it('calls createOffer with data', async () => {
    vi.mocked(offersApi.createOffer).mockResolvedValueOnce(offerDto)
    const { result } = renderHook(() => useCreateOffer(), { wrapper: createWrapper() })
    result.current.mutate({ slug: 'weight_loss_starter', name: 'Weight Loss Starter' })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(offersApi.createOffer).toHaveBeenCalledWith({ slug: 'weight_loss_starter', name: 'Weight Loss Starter' })
  })
})

describe('useUpdateOffer', () => {
  it('calls updateOffer with offerId and data', async () => {
    vi.mocked(offersApi.updateOffer).mockResolvedValueOnce(offerDto)
    const { result } = renderHook(() => useUpdateOffer(), { wrapper: createWrapper() })
    result.current.mutate({ offerId: 'o1', data: { name: 'Updated Name' } })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(offersApi.updateOffer).toHaveBeenCalledWith('o1', { name: 'Updated Name' })
  })
})

describe('useDeleteOffer', () => {
  it('calls deleteOffer with offerId', async () => {
    vi.mocked(offersApi.deleteOffer).mockResolvedValueOnce({ message: 'Offer deleted.' })
    const { result } = renderHook(() => useDeleteOffer(), { wrapper: createWrapper() })
    result.current.mutate('o1')
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(offersApi.deleteOffer).toHaveBeenCalledWith('o1')
  })
})
