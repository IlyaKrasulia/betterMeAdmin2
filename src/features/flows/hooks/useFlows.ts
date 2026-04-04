import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { flowsApi } from '@api/flows.api'
import type { CreateFlowRequest, GenerateFlowRequest, UpdateFlowRequest, SetEntryNodeRequest } from '@shared/types/api.types'

export function useFlows() {
  return useQuery({
    queryKey: ['flows'],
    queryFn: () => flowsApi.listFlows(),
  })
}

export function useFlow(flowId: string) {
  return useQuery({
    queryKey: ['flows', flowId],
    queryFn: () => flowsApi.getFlow(flowId),
    enabled: !!flowId,
  })
}

export function useCreateFlow() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateFlowRequest) => flowsApi.createFlow(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['flows'] })
    },
  })
}

export function useStartGenerateFlow() {
  return useMutation({
    mutationFn: (data: GenerateFlowRequest) => flowsApi.generateFlow(data),
  })
}

export function useUpdateFlow() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ flowId, data }: { flowId: string; data: UpdateFlowRequest }) =>
      flowsApi.updateFlow(flowId, data),
    onSuccess: (_, { flowId }) => {
      queryClient.invalidateQueries({ queryKey: ['flows'] })
      queryClient.invalidateQueries({ queryKey: ['flows', flowId] })
    },
  })
}

export function useSetEntryNode() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ flowId, data }: { flowId: string; data: SetEntryNodeRequest }) =>
      flowsApi.setEntryNode(flowId, data),
    onSuccess: (_, { flowId }) => {
      queryClient.invalidateQueries({ queryKey: ['flows'] })
      queryClient.invalidateQueries({ queryKey: ['flows', flowId] })
    },
  })
}

export function usePublishFlow() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (flowId: string) => flowsApi.publishFlow(flowId),
    onSuccess: (_, flowId) => {
      queryClient.invalidateQueries({ queryKey: ['flows'] })
      queryClient.invalidateQueries({ queryKey: ['flows', flowId] })
    },
  })
}

export function useUnpublishFlow() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (flowId: string) => flowsApi.unpublishFlow(flowId),
    onSuccess: (_, flowId) => {
      queryClient.invalidateQueries({ queryKey: ['flows'] })
      queryClient.invalidateQueries({ queryKey: ['flows', flowId] })
    },
  })
}

export function useDeleteFlow() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (flowId: string) => flowsApi.deleteFlow(flowId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['flows'] })
    },
  })
}
