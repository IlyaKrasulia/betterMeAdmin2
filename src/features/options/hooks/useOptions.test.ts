import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createElement } from 'react'
import { useCreateOption, useUpdateOption, useDeleteOption, useReorderOptions } from './useOptions'
import { optionsApi } from '@api/options.api'

vi.mock('@api/options.api', () => ({
  optionsApi: {
    createOption: vi.fn(),
    updateOption: vi.fn(),
    deleteOption: vi.fn(),
    reorderOptions: vi.fn(),
  },
}))

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  return ({ children }: { children: React.ReactNode }) =>
    createElement(QueryClientProvider, { client: queryClient }, children)
}

const optionDetail = {
  id: 'o1',
  nodeId: 'n1',
  label: 'Weight Loss',
  value: 'weight_loss',
  displayOrder: 0,
  mediaUrl: null,
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('useCreateOption', () => {
  it('calls createOption with nodeId and data', async () => {
    vi.mocked(optionsApi.createOption).mockResolvedValueOnce(optionDetail)
    const { result } = renderHook(() => useCreateOption(), { wrapper: createWrapper() })
    result.current.mutate({ nodeId: 'n1', data: { label: 'Weight Loss', value: 'weight_loss' } })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(optionsApi.createOption).toHaveBeenCalledWith('n1', { label: 'Weight Loss', value: 'weight_loss' })
  })
})

describe('useUpdateOption', () => {
  it('calls updateOption with nodeId, optionId, and data', async () => {
    vi.mocked(optionsApi.updateOption).mockResolvedValueOnce(optionDetail)
    const { result } = renderHook(() => useUpdateOption(), { wrapper: createWrapper() })
    result.current.mutate({ nodeId: 'n1', optionId: 'o1', data: { label: 'Updated Label' } })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(optionsApi.updateOption).toHaveBeenCalledWith('n1', 'o1', { label: 'Updated Label' })
  })
})

describe('useDeleteOption', () => {
  it('calls deleteOption with nodeId and optionId', async () => {
    vi.mocked(optionsApi.deleteOption).mockResolvedValueOnce({ message: 'Option deleted.' })
    const { result } = renderHook(() => useDeleteOption(), { wrapper: createWrapper() })
    result.current.mutate({ nodeId: 'n1', optionId: 'o1' })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(optionsApi.deleteOption).toHaveBeenCalledWith('n1', 'o1')
  })
})

describe('useReorderOptions', () => {
  it('calls reorderOptions with nodeId and order data', async () => {
    vi.mocked(optionsApi.reorderOptions).mockResolvedValueOnce({ message: 'Options reordered.' })
    const { result } = renderHook(() => useReorderOptions(), { wrapper: createWrapper() })
    const order = { order: [{ optionId: 'o1', displayOrder: 0 }, { optionId: 'o2', displayOrder: 1 }] }
    result.current.mutate({ nodeId: 'n1', data: order })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(optionsApi.reorderOptions).toHaveBeenCalledWith('n1', order)
  })
})
