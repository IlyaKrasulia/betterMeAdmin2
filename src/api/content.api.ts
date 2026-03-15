import { apiClient } from './axios'
import type { PublishedFlowDto } from '@shared/types/api.types'

export const contentApi = {
  // GET /api/content/flow
  getPublishedFlow: async (): Promise<PublishedFlowDto> => {
    const response = await apiClient.get<PublishedFlowDto>('/api/content/flow')
    return response.data
  },

  // GET /api/content/flow/{flowId}
  getFlowById: async (flowId: string): Promise<PublishedFlowDto> => {
    const response = await apiClient.get<PublishedFlowDto>(`/api/content/flow/${flowId}`)
    return response.data
  },
}
