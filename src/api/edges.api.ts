import { apiClient } from './axios'
import type {
  EdgeDetail,
  CreateEdgeRequest,
  UpdateEdgeRequest,
  MessageResponse,
} from '@shared/types/api.types'

export const edgesApi = {
  // POST /api/admin/flows/{flowId}/edges
  createEdge: async (flowId: string, data: CreateEdgeRequest): Promise<EdgeDetail> => {
    const response = await apiClient.post<EdgeDetail>(`/api/admin/flows/${flowId}/edges`, data)
    return response.data
  },

  // PUT /api/admin/flows/{flowId}/edges/{edgeId}
  updateEdge: async (
    flowId: string,
    edgeId: string,
    data: UpdateEdgeRequest
  ): Promise<EdgeDetail> => {
    const response = await apiClient.put<EdgeDetail>(
      `/api/admin/flows/${flowId}/edges/${edgeId}`,
      data
    )
    return response.data
  },

  // DELETE /api/admin/flows/{flowId}/edges/{edgeId}
  deleteEdge: async (flowId: string, edgeId: string): Promise<MessageResponse> => {
    const response = await apiClient.delete<MessageResponse>(
      `/api/admin/flows/${flowId}/edges/${edgeId}`
    )
    return response.data
  },
}
