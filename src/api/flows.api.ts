import { apiClient } from './axios'
import type {
  FlowSummary,
  FlowDetail,
  CreateFlowRequest,
  GenerateFlowRequest,
  GenerateFlowStartResponse,
  GenerateFlowStatusResponse,
  UpdateFlowRequest,
  SetEntryNodeRequest,
  MessageResponse,
} from '@shared/types/api.types'

export const flowsApi = {
  // GET /api/admin/flows
  listFlows: async (): Promise<FlowSummary[]> => {
    const response = await apiClient.get<FlowSummary[]>('/api/admin/flows')
    return response.data
  },

  // GET /api/admin/flows/{flowId}
  getFlow: async (flowId: string): Promise<FlowDetail> => {
    const response = await apiClient.get<FlowDetail>(`/api/admin/flows/${flowId}`)
    return response.data
  },

  // POST /api/admin/flows
  createFlow: async (data: CreateFlowRequest): Promise<FlowSummary> => {
    const response = await apiClient.post<FlowSummary>('/api/admin/flows', data)
    return response.data
  },

  // POST /api/admin/flows/generate — starts async job
  generateFlow: async (data: GenerateFlowRequest): Promise<GenerateFlowStartResponse> => {
    const response = await apiClient.post<GenerateFlowStartResponse>('/api/admin/flows/generate', data)
    return response.data
  },

  // GET /api/admin/flows/generate/status/{jobId} — poll job status
  getGenerateStatus: async (jobId: string): Promise<GenerateFlowStatusResponse> => {
    const response = await apiClient.get<GenerateFlowStatusResponse>(
      `/api/admin/flows/generate/status/${jobId}`
    )
    return response.data
  },

  // PUT /api/admin/flows/{flowId}
  updateFlow: async (flowId: string, data: UpdateFlowRequest): Promise<FlowSummary> => {
    const response = await apiClient.put<FlowSummary>(`/api/admin/flows/${flowId}`, data)
    return response.data
  },

  // PUT /api/admin/flows/{flowId}/entry-node
  setEntryNode: async (flowId: string, data: SetEntryNodeRequest): Promise<FlowSummary> => {
    const response = await apiClient.put<FlowSummary>(
      `/api/admin/flows/${flowId}/entry-node`,
      data
    )
    return response.data
  },

  // POST /api/admin/flows/{flowId}/publish
  publishFlow: async (flowId: string): Promise<FlowSummary> => {
    const response = await apiClient.post<FlowSummary>(`/api/admin/flows/${flowId}/publish`)
    return response.data
  },

  // POST /api/admin/flows/{flowId}/unpublish
  unpublishFlow: async (flowId: string): Promise<FlowSummary> => {
    const response = await apiClient.post<FlowSummary>(`/api/admin/flows/${flowId}/unpublish`)
    return response.data
  },

  // DELETE /api/admin/flows/{flowId}
  deleteFlow: async (flowId: string): Promise<MessageResponse> => {
    const response = await apiClient.delete<MessageResponse>(`/api/admin/flows/${flowId}`)
    return response.data
  },
}
