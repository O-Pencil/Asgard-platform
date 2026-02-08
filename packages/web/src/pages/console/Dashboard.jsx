import { useQuery } from '@tanstack/react-query'
import { consoleAPI } from '../../api'

export default function Dashboard() {
  const { data: balance } = useQuery({
    queryKey: ['balance'],
    queryFn: () => consoleAPI.getBalance().then(r => r.data),
  })

  const { data: stats } = useQuery({
    queryKey: ['usage-stats', 'week'],
    queryFn: () => consoleAPI.getUsageStats('week').then(r => r.data),
  })

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-4">
        <wired-card elevation={3} className="p-5">
          <p className="text-sm text-slate-500 mb-1">当前余额</p>
          <p className="text-2xl font-bold text-slate-800">
            {balance?.balance?.toLocaleString() ?? '1,280'} Credits
          </p>
        </wired-card>
        <wired-card elevation={3} className="p-5">
          <p className="text-sm text-slate-500 mb-1">本周 Token 消耗</p>
          <p className="text-2xl font-bold text-slate-800">
            {stats?.total_prompt_tokens
              ? `${Math.round((stats.total_prompt_tokens + stats.total_completion_tokens) / 1000)}K`
              : '45.2K'}
          </p>
        </wired-card>
        <wired-card elevation={3} className="p-5">
          <p className="text-sm text-slate-500 mb-1">活跃 Agent 数量</p>
          <p className="text-2xl font-bold text-slate-800">2</p>
        </wired-card>
      </div>
      <wired-card elevation={3} className="p-5">
        <h3 className="font-semibold text-slate-800 mb-4">快捷操作</h3>
        <div className="flex gap-4">
          <wired-button elevation={2} onClick={() => window.location.href = '/console/keys'}>
            创建 Key
          </wired-button>
          <wired-button elevation={2} onClick={() => window.location.href = '/console/integrations'}>
            查看集成指南
          </wired-button>
          <wired-button elevation={2} onClick={() => window.location.href = '/console/usage'}>
            用量明细
          </wired-button>
        </div>
      </wired-card>
    </div>
  )
}
