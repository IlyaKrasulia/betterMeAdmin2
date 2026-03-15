import { useMutation, useQueryClient } from '@tanstack/react-query'
import { nodesApi } from '@api/nodes.api'
import type { CreateNodeRequest, UpdateNodeRequest, UpdateNodePositionRequest } from '@shared/types/api.types'

export function useCreateNode() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ flowId, data }: { flowId: string; data: CreateNodeRequest }) =>
      nodesApi.createNode(flowId, data),
    onSuccess: (_, { flowId }) => {
      queryClient.invalidateQueries({ queryKey: ['flows', flowId] })
    },
  })
}

export function useUpdateNode() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      flowId,
      nodeId,
      data,
    }: {
      flowId: string
      nodeId: string
      data: UpdateNodeRequest
    }) => nodesApi.updateNode(flowId, nodeId, data),
    onSuccess: (_, { flowId }) => {
      queryClient.invalidateQueries({ queryKey: ['flows', flowId] })
    },
  })
}

export function useUpdateNodePosition() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      flowId,
      nodeId,
      data,
    }: {
      flowId: string
      nodeId: string
      data: UpdateNodePositionRequest
    }) => nodesApi.updateNodePosition(flowId, nodeId, data),
    onSuccess: (_, { flowId }) => {
      queryClient.invalidateQueries({ queryKey: ['flows', flowId] })
    },
  })
}

export function useDeleteNode() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ flowId, nodeId }: { flowId: string; nodeId: string }) =>
      nodesApi.deleteNode(flowId, nodeId),
    onSuccess: (_, { flowId }) => {
      queryClient.invalidateQueries({ queryKey: ['flows', flowId] })
    },
  })
}
