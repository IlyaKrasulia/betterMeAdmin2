import { apiClient } from './axios'
import type {
  OptionDetail,
  CreateOptionRequest,
  UpdateOptionRequest,
  ReorderOptionsRequest,
  MessageResponse,
} from '@shared/types/api.types'

export const optionsApi = {
  // POST /api/admin/nodes/{nodeId}/options
  createOption: async (nodeId: string, data: CreateOptionRequest): Promise<OptionDetail> => {
    const response = await apiClient.post<OptionDetail>(
      `/api/admin/nodes/${nodeId}/options`,
      data
    )
    return response.data
  },

  // PUT /api/admin/nodes/{nodeId}/options/{optionId}
  updateOption: async (
    nodeId: string,
    optionId: string,
    data: UpdateOptionRequest
  ): Promise<OptionDetail> => {
    const response = await apiClient.put<OptionDetail>(
      `/api/admin/nodes/${nodeId}/options/${optionId}`,
      data
    )
    return response.data
  },

  // DELETE /api/admin/nodes/{nodeId}/options/{optionId}
  deleteOption: async (nodeId: string, optionId: string): Promise<MessageResponse> => {
    const response = await apiClient.delete<MessageResponse>(
      `/api/admin/nodes/${nodeId}/options/${optionId}`
    )
    return response.data
  },

  // PUT /api/admin/nodes/{nodeId}/options/reorder
  reorderOptions: async (
    nodeId: string,
    data: ReorderOptionsRequest
  ): Promise<MessageResponse> => {
    const response = await apiClient.put<MessageResponse>(
      `/api/admin/nodes/${nodeId}/options/reorder`,
      data
    )
    return response.data
  },
}
