import { apiClient } from './axios'
import type { LeadCaptureFieldDto } from '@shared/types/api.types'

export interface AddLeadCaptureFieldRequest {
  fieldType: string
  isRequired: boolean
  displayOrder: number
  placeholder?: string
}

export interface UpdateLeadCaptureFieldRequest {
  isRequired: boolean
  displayOrder: number
  placeholder?: string
}

export interface ReorderLeadCaptureFieldsRequest {
  items: Array<{ fieldType: string; displayOrder: number }>
}

export const leadCaptureFieldsApi = {
  add: async (nodeId: string, data: AddLeadCaptureFieldRequest): Promise<LeadCaptureFieldDto> => {
    const response = await apiClient.post<LeadCaptureFieldDto>(
      `/api/admin/nodes/${nodeId}/lead-capture-fields`,
      data,
    )
    return response.data
  },

  update: async (
    nodeId: string,
    fieldType: string,
    data: UpdateLeadCaptureFieldRequest,
  ): Promise<LeadCaptureFieldDto> => {
    const response = await apiClient.put<LeadCaptureFieldDto>(
      `/api/admin/nodes/${nodeId}/lead-capture-fields/${fieldType}`,
      data,
    )
    return response.data
  },

  remove: async (nodeId: string, fieldType: string): Promise<void> => {
    await apiClient.delete(`/api/admin/nodes/${nodeId}/lead-capture-fields/${fieldType}`)
  },

  reorder: async (
    nodeId: string,
    data: ReorderLeadCaptureFieldsRequest,
  ): Promise<LeadCaptureFieldDto[]> => {
    const response = await apiClient.put<LeadCaptureFieldDto[]>(
      `/api/admin/nodes/${nodeId}/lead-capture-fields/reorder`,
      data,
    )
    return response.data
  },
}
