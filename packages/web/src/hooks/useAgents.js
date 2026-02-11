import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { agentAPI, consoleAPI } from '../api'

// Query Keys
export const queryKeys = {
  agents: ['agents'],
  agent: (id) => ['agents', id],
  apiKeys: ['api-keys'],
  usageStats: (timeframe) => ['usage', 'stats', timeframe],
  usageLogs: (params) => ['usage', 'logs', params],
}

// Agent Hooks
export function useAgents(params) {
  return useQuery({
    queryKey: [...queryKeys.agents, params],
    queryFn: async () => {
      const res = await agentAPI.list(params)
      // 后端返回 {agents: [...], total: n}，添加前端需要的字段
      const agents = res.data.agents || []
      return agents.map(a => ({
        ...a,
        id: a.agent_id, // 使用 agent_id 作为 id
        enabled: a.is_active, // 映射 is_active 到 enabled 供前端使用
      }))
    },
    staleTime: 0, // 允许快速刷新
  })
}

export function useAgent(agentId) {
  return useQuery({
    queryKey: queryKeys.agent(agentId),
    queryFn: () => agentAPI.get(agentId).then((res) => res.data),
    enabled: !!agentId,
  })
}

export function useEnableAgent() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (agentId) => agentAPI.enable(agentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.agents })
    },
  })
}

export function useDisableAgent() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (agentId) => agentAPI.disable(agentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.agents })
    },
  })
}

// API Key Hooks
export function useApiKeys() {
  return useQuery({
    queryKey: queryKeys.apiKeys,
    queryFn: () => consoleAPI.listKeys().then((res) => res.data),
  })
}

export function useCreateApiKey() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data) => consoleAPI.createKey(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.apiKeys })
    },
  })
}

export function useDeleteApiKey() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (keyId) => consoleAPI.deleteKey(keyId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.apiKeys })
    },
  })
}

// Usage Hooks
export function useUsageStats(timeframe = 'week') {
  return useQuery({
    queryKey: queryKeys.usageStats(timeframe),
    queryFn: () => consoleAPI.getUsageStats(timeframe).then((res) => res.data),
    refetchInterval: 60 * 1000,
  })
}

export function useUsageLogs(params) {
  return useQuery({
    queryKey: queryKeys.usageLogs(params),
    queryFn: () => consoleAPI.getUsageLogs(params).then((res) => res.data),
  })
}
