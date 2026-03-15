import { useMutation, useQueryClient } from '@tanstack/react-query'
import { edgesApi } from '@api/edges.api'
import type { CreateEdgeRequest, UpdateEdgeRequest } from '@shared/types/api.types'

export function useCreateEdge() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ flowId, data }: { flowId: string; data: CreateEdgeRequest }) =>
      edgesApi.createEdge(flowId, data),
    onSuccess: (_, { flowId }) => {
      queryClient.invalidateQueries({ queryKey: ['flows', flowId] })
    },
  })
}

export function useUpdateEdge() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      flowId,
      edgeId,
      data,
    }: {
      flowId: string
      edgeId: string
      data: UpdateEdgeRequest
    }) => edgesApi.updateEdge(flowId, edgeId, data),
    onSuccess: (_, { flowId }) => {
      queryClient.invalidateQueries({ queryKey: ['flows', flowId] })
    },
  })
}

export function useDeleteEdge() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ flowId, edgeId }: { flowId: string; edgeId: string }) =>
      edgesApi.deleteEdge(flowId, edgeId),
    onSuccess: (_, { flowId }) => {
      queryClient.invalidateQueries({ queryKey: ['flows', flowId] })
    },
  })
}
