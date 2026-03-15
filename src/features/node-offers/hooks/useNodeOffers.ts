import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { nodeOffersApi } from '@api/node-offers.api'
import type { CreateNodeOfferLinkRequest, UpdateNodeOfferLinkRequest } from '@shared/types/api.types'

export function useNodeOffers(nodeId: string) {
  return useQuery({
    queryKey: ['node-offers', nodeId],
    queryFn: () => nodeOffersApi.listNodeOffers(nodeId),
    enabled: !!nodeId,
  })
}

export function useLinkOffer() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ nodeId, data }: { nodeId: string; data: CreateNodeOfferLinkRequest }) =>
      nodeOffersApi.linkOffer(nodeId, data),
    onSuccess: (_, { nodeId }) => {
      queryClient.invalidateQueries({ queryKey: ['node-offers', nodeId] })
    },
  })
}

export function useUpdateNodeOffer() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      nodeId,
      nodeOfferId,
      data,
    }: {
      nodeId: string
      nodeOfferId: string
      data: UpdateNodeOfferLinkRequest
    }) => nodeOffersApi.updateNodeOffer(nodeId, nodeOfferId, data),
    onSuccess: (_, { nodeId }) => {
      queryClient.invalidateQueries({ queryKey: ['node-offers', nodeId] })
    },
  })
}

export function useUnlinkOffer() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ nodeId, nodeOfferId }: { nodeId: string; nodeOfferId: string }) =>
      nodeOffersApi.unlinkOffer(nodeId, nodeOfferId),
    onSuccess: (_, { nodeId }) => {
      queryClient.invalidateQueries({ queryKey: ['node-offers', nodeId] })
    },
  })
}
