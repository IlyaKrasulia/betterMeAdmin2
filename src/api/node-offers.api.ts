import { apiClient } from './axios'
import type {
  NodeOfferLinkDto,
  CreateNodeOfferLinkRequest,
  UpdateNodeOfferLinkRequest,
  MessageResponse,
} from '@shared/types/api.types'

export const nodeOffersApi = {
  // GET /api/admin/nodes/{nodeId}/offers
  listNodeOffers: async (nodeId: string): Promise<NodeOfferLinkDto[]> => {
    const response = await apiClient.get<NodeOfferLinkDto[]>(
      `/api/admin/nodes/${nodeId}/offers`
    )
    return response.data
  },

  // POST /api/admin/nodes/{nodeId}/offers
  linkOffer: async (
    nodeId: string,
    data: CreateNodeOfferLinkRequest
  ): Promise<NodeOfferLinkDto> => {
    const response = await apiClient.post<NodeOfferLinkDto>(
      `/api/admin/nodes/${nodeId}/offers`,
      data
    )
    return response.data
  },

  // PUT /api/admin/nodes/{nodeId}/offers/{nodeOfferId}
  updateNodeOffer: async (
    nodeId: string,
    nodeOfferId: string,
    data: UpdateNodeOfferLinkRequest
  ): Promise<NodeOfferLinkDto> => {
    const response = await apiClient.put<NodeOfferLinkDto>(
      `/api/admin/nodes/${nodeId}/offers/${nodeOfferId}`,
      data
    )
    return response.data
  },

  // DELETE /api/admin/nodes/{nodeId}/offers/{nodeOfferId}
  unlinkOffer: async (nodeId: string, nodeOfferId: string): Promise<MessageResponse> => {
    const response = await apiClient.delete<MessageResponse>(
      `/api/admin/nodes/${nodeId}/offers/${nodeOfferId}`
    )
    return response.data
  },
}
