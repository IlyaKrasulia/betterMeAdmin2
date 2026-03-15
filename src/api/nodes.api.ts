import { apiClient } from './axios'
import type {
  NodeDetail,
  NodePositionDto,
  CreateNodeRequest,
  UpdateNodeRequest,
  UpdateNodePositionRequest,
  MessageResponse,
} from '@shared/types/api.types'

export const nodesApi = {
  // POST /api/admin/flows/{flowId}/nodes
  createNode: async (flowId: string, data: CreateNodeRequest): Promise<NodeDetail> => {
    const response = await apiClient.post<NodeDetail>(`/api/admin/flows/${flowId}/nodes`, data)
    return response.data
  },

  // PUT /api/admin/flows/{flowId}/nodes/{nodeId}
  updateNode: async (
    flowId: string,
    nodeId: string,
    data: UpdateNodeRequest
  ): Promise<NodeDetail> => {
    const response = await apiClient.put<NodeDetail>(
      `/api/admin/flows/${flowId}/nodes/${nodeId}`,
      data
    )
    return response.data
  },

  // PUT /api/admin/flows/{flowId}/nodes/{nodeId}/position
  updateNodePosition: async (
    flowId: string,
    nodeId: string,
    data: UpdateNodePositionRequest
  ): Promise<NodePositionDto> => {
    const response = await apiClient.put<NodePositionDto>(
      `/api/admin/flows/${flowId}/nodes/${nodeId}/position`,
      data
    )
    return response.data
  },

  // DELETE /api/admin/flows/{flowId}/nodes/{nodeId}
  deleteNode: async (flowId: string, nodeId: string): Promise<MessageResponse> => {
    const response = await apiClient.delete<MessageResponse>(
      `/api/admin/flows/${flowId}/nodes/${nodeId}`
    )
    return response.data
  },
}
