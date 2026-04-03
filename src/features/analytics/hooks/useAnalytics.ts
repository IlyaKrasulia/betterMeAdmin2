import { useQuery } from '@tanstack/react-query'
import { analyticsApi } from '@api/analytics.api'
import type { AnalyticsQueryParams } from '@shared/types/api.types'

export function useGlobalSessionStats() {
  return useQuery({
    queryKey: ['analytics', 'sessions', 'global'],
    queryFn: () => analyticsApi.getGlobalSessionStats(),
  })
}

export function useGlobalOfferStats() {
  return useQuery({
    queryKey: ['analytics', 'offers', 'global'],
    queryFn: () => analyticsApi.getGlobalOfferStats(),
  })
}

export function useGlobalDropOffs() {
  return useQuery({
    queryKey: ['analytics', 'drop-offs', 'global'],
    queryFn: () => analyticsApi.getGlobalDropOffs(),
  })
}

export function useSessionStats(params: AnalyticsQueryParams) {
  return useQuery({
    queryKey: ['analytics', 'sessions', params],
    queryFn: () => analyticsApi.getSessionStats(params),
    enabled: !!params.flowId,
  })
}

export function useOfferStats(params: AnalyticsQueryParams) {
  return useQuery({
    queryKey: ['analytics', 'offers', params],
    queryFn: () => analyticsApi.getOfferStats(params),
    enabled: !!params.flowId,
  })
}

export function useDropOffs(params: AnalyticsQueryParams) {
  return useQuery({
    queryKey: ['analytics', 'drop-offs', params],
    queryFn: () => analyticsApi.getDropOffs(params),
    enabled: !!params.flowId,
  })
}
