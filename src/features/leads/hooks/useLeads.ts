import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { leadsApi } from '@api/leads.api'
import type { ListLeadsParams, PatchLeadRequest } from '@shared/types/api.types'

export function useLeads(flowId: string, params: ListLeadsParams) {
  return useQuery({
    queryKey: ['leads', flowId, params],
    queryFn: () => leadsApi.listLeads(flowId, params),
    enabled: !!flowId,
    placeholderData: (prev) => prev,
  })
}

export function usePatchLead(flowId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ leadId, data }: { leadId: string; data: PatchLeadRequest }) =>
      leadsApi.patchLead(flowId, leadId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads', flowId] })
    },
  })
}
