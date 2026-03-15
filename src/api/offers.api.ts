import { apiClient } from './axios'
import type {
  OfferDto,
  CreateOfferRequest,
  UpdateOfferRequest,
  MessageResponse,
} from '@shared/types/api.types'

export const offersApi = {
  // GET /api/admin/offers
  listOffers: async (): Promise<OfferDto[]> => {
    const response = await apiClient.get<OfferDto[]>('/api/admin/offers')
    return response.data
  },

  // GET /api/admin/offers/{offerId}
  getOffer: async (offerId: string): Promise<OfferDto> => {
    const response = await apiClient.get<OfferDto>(`/api/admin/offers/${offerId}`)
    return response.data
  },

  // POST /api/admin/offers
  createOffer: async (data: CreateOfferRequest): Promise<OfferDto> => {
    const response = await apiClient.post<OfferDto>('/api/admin/offers', data)
    return response.data
  },

  // PUT /api/admin/offers/{offerId}
  updateOffer: async (offerId: string, data: UpdateOfferRequest): Promise<OfferDto> => {
    const response = await apiClient.put<OfferDto>(`/api/admin/offers/${offerId}`, data)
    return response.data
  },

  // DELETE /api/admin/offers/{offerId}
  deleteOffer: async (offerId: string): Promise<MessageResponse> => {
    const response = await apiClient.delete<MessageResponse>(`/api/admin/offers/${offerId}`)
    return response.data
  },
}
