import { apiClient } from './axios'
import type {
  RedirectLinkDetail,
  CreateRedirectLinkRequest,
  UpdateRedirectLinkRequest,
  ReorderRedirectLinksRequest,
} from '@shared/types/api.types'

export const redirectLinksApi = {
  create: async (nodeId: string, data: CreateRedirectLinkRequest): Promise<RedirectLinkDetail> => {
    const response = await apiClient.post<RedirectLinkDetail>(
      `/api/admin/nodes/${nodeId}/redirect-links`,
      data,
    )
    return response.data
  },

  update: async (
    nodeId: string,
    linkId: string,
    data: UpdateRedirectLinkRequest,
  ): Promise<RedirectLinkDetail> => {
    const response = await apiClient.put<RedirectLinkDetail>(
      `/api/admin/nodes/${nodeId}/redirect-links/${linkId}`,
      data,
    )
    return response.data
  },

  delete: async (nodeId: string, linkId: string): Promise<void> => {
    await apiClient.delete(`/api/admin/nodes/${nodeId}/redirect-links/${linkId}`)
  },

  reorder: async (
    nodeId: string,
    data: ReorderRedirectLinksRequest,
  ): Promise<RedirectLinkDetail[]> => {
    const response = await apiClient.put<RedirectLinkDetail[]>(
      `/api/admin/nodes/${nodeId}/redirect-links/reorder`,
      data,
    )
    return response.data
  },
}
