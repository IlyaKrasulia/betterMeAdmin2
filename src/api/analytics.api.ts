import { apiClient } from './axios'
import type {
  SessionStatsDto,
  OfferStatsDto,
  DropOffDto,
  AnalyticsQueryParams,
  GlobalSessionStatsResponse,
  GlobalOfferStatsResponse,
  GlobalDropOffResponse,
} from '@shared/types/api.types'

export const analyticsApi = {
  // GET /api/admin/analytics/sessions (no params — global stats)
  getGlobalSessionStats: async (): Promise<GlobalSessionStatsResponse> => {
    const response = await apiClient.get<GlobalSessionStatsResponse>(
      '/api/admin/analytics/sessions'
    )
    return response.data
  },

  // GET /api/admin/analytics/offers (no params — global stats)
  getGlobalOfferStats: async (): Promise<GlobalOfferStatsResponse> => {
    const response = await apiClient.get<GlobalOfferStatsResponse>(
      '/api/admin/analytics/offers'
    )
    return response.data
  },

  // GET /api/admin/analytics/drop-offs (no params — global stats)
  getGlobalDropOffs: async (): Promise<GlobalDropOffResponse> => {
    const response = await apiClient.get<GlobalDropOffResponse>(
      '/api/admin/analytics/drop-offs'
    )
    return response.data
  },

  // GET /api/admin/analytics/sessions (with params — per-flow)
  getSessionStats: async (params: AnalyticsQueryParams): Promise<SessionStatsDto> => {
    const response = await apiClient.get<SessionStatsDto>('/api/admin/analytics/sessions', {
      params,
    })
    return response.data
  },

  // GET /api/admin/analytics/offers (with params — per-flow)
  getOfferStats: async (params: AnalyticsQueryParams): Promise<OfferStatsDto[]> => {
    const response = await apiClient.get<OfferStatsDto[]>('/api/admin/analytics/offers', {
      params,
    })
    return response.data
  },

  // GET /api/admin/analytics/drop-offs (with params — per-flow)
  getDropOffs: async (params: AnalyticsQueryParams): Promise<DropOffDto[]> => {
    const response = await apiClient.get<DropOffDto[]>('/api/admin/analytics/drop-offs', {
      params,
    })
    return response.data
  },
}
