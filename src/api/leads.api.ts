import { apiClient } from './axios'
import type { ListLeadsParams, ListLeadsResponse, LeadDto, PatchLeadRequest } from '@shared/types/api.types'

export const leadsApi = {
  listLeads: async (flowId: string, params?: ListLeadsParams): Promise<ListLeadsResponse> => {
    const response = await apiClient.get(`/api/admin/flows/${flowId}/leads`, { params })
    const raw = response.data
    if (Array.isArray(raw)) {
      return { items: raw as LeadDto[], total: raw.length, page: 1, pageSize: raw.length }
    }
    return raw as ListLeadsResponse
  },

  getLead: async (flowId: string, leadId: string): Promise<LeadDto> => {
    const response = await apiClient.get<LeadDto>(`/api/admin/flows/${flowId}/leads/${leadId}`)
    return response.data
  },

  patchLead: async (flowId: string, leadId: string, data: PatchLeadRequest): Promise<LeadDto> => {
    const response = await apiClient.patch<LeadDto>(`/api/admin/flows/${flowId}/leads/${leadId}`, data)
    return response.data
  },
}
