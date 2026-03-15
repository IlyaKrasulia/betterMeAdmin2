import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createElement } from 'react'
import { useNodeOffers, useLinkOffer, useUpdateNodeOffer, useUnlinkOffer } from './useNodeOffers'
import { nodeOffersApi } from '@api/node-offers.api'

vi.mock('@api/node-offers.api', () => ({
  nodeOffersApi: {
    listNodeOffers: vi.fn(),
    linkOffer: vi.fn(),
    updateNodeOffer: vi.fn(),
    unlinkOffer: vi.fn(),
  },
}))

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  return ({ children }: { children: React.ReactNode }) =>
    createElement(QueryClientProvider, { client: queryClient }, children)
}

const linkDto = {
  id: 'nl1',
  nodeId: 'n1',
  offerId: 'o1',
  isPrimary: true,
  offer: { slug: 'weight_loss_starter', name: 'Weight Loss Starter' },
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('useNodeOffers', () => {
  it('fetches offers linked to a node', async () => {
    vi.mocked(nodeOffersApi.listNodeOffers).mockResolvedValueOnce([linkDto])
    const { result } = renderHook(() => useNodeOffers('n1'), { wrapper: createWrapper() })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual([linkDto])
    expect(nodeOffersApi.listNodeOffers).toHaveBeenCalledWith('n1')
  })

  it('is disabled when nodeId is empty', () => {
    const { result } = renderHook(() => useNodeOffers(''), { wrapper: createWrapper() })
    expect(result.current.fetchStatus).toBe('idle')
  })
})

describe('useLinkOffer', () => {
  it('calls linkOffer with nodeId and data', async () => {
    vi.mocked(nodeOffersApi.linkOffer).mockResolvedValueOnce(linkDto)
    const { result } = renderHook(() => useLinkOffer(), { wrapper: createWrapper() })
    result.current.mutate({ nodeId: 'n1', data: { offerId: 'o1', isPrimary: true } })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(nodeOffersApi.linkOffer).toHaveBeenCalledWith('n1', { offerId: 'o1', isPrimary: true })
  })
})

describe('useUpdateNodeOffer', () => {
  it('calls updateNodeOffer with nodeId, nodeOfferId, and data', async () => {
    vi.mocked(nodeOffersApi.updateNodeOffer).mockResolvedValueOnce(linkDto)
    const { result } = renderHook(() => useUpdateNodeOffer(), { wrapper: createWrapper() })
    result.current.mutate({ nodeId: 'n1', nodeOfferId: 'nl1', data: { isPrimary: false } })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(nodeOffersApi.updateNodeOffer).toHaveBeenCalledWith('n1', 'nl1', { isPrimary: false })
  })
})

describe('useUnlinkOffer', () => {
  it('calls unlinkOffer with nodeId and nodeOfferId', async () => {
    vi.mocked(nodeOffersApi.unlinkOffer).mockResolvedValueOnce({ message: 'Node-offer link removed.' })
    const { result } = renderHook(() => useUnlinkOffer(), { wrapper: createWrapper() })
    result.current.mutate({ nodeId: 'n1', nodeOfferId: 'nl1' })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(nodeOffersApi.unlinkOffer).toHaveBeenCalledWith('n1', 'nl1')
  })
})
