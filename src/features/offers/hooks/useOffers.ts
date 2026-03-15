import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { offersApi } from '@api/offers.api'
import type { CreateOfferRequest, UpdateOfferRequest } from '@shared/types/api.types'

export function useOffers() {
  return useQuery({
    queryKey: ['offers'],
    queryFn: () => offersApi.listOffers(),
  })
}

export function useOffer(offerId: string) {
  return useQuery({
    queryKey: ['offers', offerId],
    queryFn: () => offersApi.getOffer(offerId),
    enabled: !!offerId,
  })
}

export function useCreateOffer() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateOfferRequest) => offersApi.createOffer(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['offers'] })
    },
  })
}

export function useUpdateOffer() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ offerId, data }: { offerId: string; data: UpdateOfferRequest }) =>
      offersApi.updateOffer(offerId, data),
    onSuccess: (_, { offerId }) => {
      queryClient.invalidateQueries({ queryKey: ['offers'] })
      queryClient.invalidateQueries({ queryKey: ['offers', offerId] })
    },
  })
}

export function useDeleteOffer() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (offerId: string) => offersApi.deleteOffer(offerId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['offers'] })
    },
  })
}
