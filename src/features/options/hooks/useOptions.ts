import { useMutation, useQueryClient } from '@tanstack/react-query'
import { optionsApi } from '@api/options.api'
import type { CreateOptionRequest, UpdateOptionRequest, ReorderOptionsRequest } from '@shared/types/api.types'

export function useCreateOption() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ nodeId, data }: { nodeId: string; data: CreateOptionRequest }) =>
      optionsApi.createOption(nodeId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['flows'] })
    },
  })
}

export function useUpdateOption() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      nodeId,
      optionId,
      data,
    }: {
      nodeId: string
      optionId: string
      data: UpdateOptionRequest
    }) => optionsApi.updateOption(nodeId, optionId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['flows'] })
    },
  })
}

export function useDeleteOption() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ nodeId, optionId }: { nodeId: string; optionId: string }) =>
      optionsApi.deleteOption(nodeId, optionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['flows'] })
    },
  })
}

export function useReorderOptions() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ nodeId, data }: { nodeId: string; data: ReorderOptionsRequest }) =>
      optionsApi.reorderOptions(nodeId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['flows'] })
    },
  })
}
