import { apiClient } from './axios'
import type {
  SessionStatsDto,
  OfferStatsDto,
  DropOffDto,
  AnalyticsQueryParams,
} from '@shared/types/api.types'

export const analyticsApi = {
  // GET /api/admin/analytics/sessions
  getSessionStats: async (params: AnalyticsQueryParams): Promise<SessionStatsDto> => {
    const response = await apiClient.get<SessionStatsDto>('/api/admin/analytics/sessions', {
      params,
    })
    return response.data
  },

  // GET /api/admin/analytics/offers
  getOfferStats: async (params: AnalyticsQueryParams): Promise<OfferStatsDto[]> => {
    const response = await apiClient.get<OfferStatsDto[]>('/api/admin/analytics/offers', {
      params,
    })
    return response.data
  },

  // GET /api/admin/analytics/drop-offs
  getDropOffs: async (params: AnalyticsQueryParams): Promise<DropOffDto[]> => {
    const response = await apiClient.get<DropOffDto[]>('/api/admin/analytics/drop-offs', {
      params,
    })
    return response.data
  },
}
