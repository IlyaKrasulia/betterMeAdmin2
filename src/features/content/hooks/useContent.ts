import { useQuery } from '@tanstack/react-query'
import { contentApi } from '@api/content.api'

export function usePublishedFlow() {
  return useQuery({
    queryKey: ['content', 'flow'],
    queryFn: () => contentApi.getPublishedFlow(),
  })
}

export function useContentFlow(flowId: string) {
  return useQuery({
    queryKey: ['content', 'flow', flowId],
    queryFn: () => contentApi.getFlowById(flowId),
    enabled: !!flowId,
  })
}
