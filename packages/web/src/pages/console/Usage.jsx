import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { consoleAPI } from '../../api'

export default function Usage() {
  const [period, setPeriod] = useState('week')

  const { data: stats, isLoading } = useQuery({
    queryKey: ['usage-stats', period],
    queryFn: () => consoleAPI.getUsageStats(period).then(r => r.data),
  })

  const { data: logs } = useQuery({
    queryKey: ['usage-logs'],
    queryFn: () => consoleAPI.getUsageLogs({ limit: 50 }).then(r => r.data),
  })

  const handleExport = () => {
    const csv = [
      ['时间', 'Agent', 'Prompt Tokens', 'Completion Tokens', 'Cost'],
      ...(logs || []).map(log => [
        new Date(log.created_at).toLocaleString(),
        log.model,
        log.prompt_tokens,
        log.completion_tokens,
        log.cost,
      ]),
    ].map(row => row.join(',')).join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'usage-logs.csv'
    a.click()
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <span className="text-sm text-slate-500">时间维度:</span>
        <div className="flex gap-2">
          {['day', 'week', 'month'].map((p) => (
            <wired-button key={p} elevation={period === p ? 3 : 1} onClick={() => setPeriod(p)}>
              {p === 'day' ? '日' : p === 'week' ? '周' : '月'}
            </wired-button>
          ))}
        </div>
        <wired-button elevation={2} onClick={handleExport}>导出 CSV</wired-button>
      </div>

      <wired-card elevation={3} className="p-5">
        <h3 className="font-semibold text-slate-800 mb-4">按 Agent 维度</h3>
        {isLoading ? (
          <div className="h-48 flex items-center justify-center text-slate-500">加载中...</div>
        ) : (
          <>
            <div className="h-48 flex items-end gap-4">
              {Object.entries(stats?.by_agent || {}).map(([name, data]) => (
                <div key={name} className="flex-1 flex flex-col items-center">
                  <div className="w-full bg-indigo-200 rounded-t min-h-[20px]" style={{ height: `${Math.min(100, (data.cost / (stats?.total_cost || 1)) * 100)}%` }} />
                  <span className="text-xs text-slate-500 mt-2 truncate w-full text-center">{name.split('/')[1]}</span>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t border-slate-200 grid grid-cols-4 gap-4 text-sm text-slate-600 text-center">
              <div>调用 {stats?.total_requests || 0} 次</div>
              <div>Input {stats?.total_prompt_tokens?.toLocaleString() || 0}</div>
              <div>Output {stats?.total_completion_tokens?.toLocaleString() || 0}</div>
              <div>Cost ${stats?.total_cost?.toFixed(4) || 0}</div>
            </div>
          </>
        )}
      </wired-card>

      <wired-card elevation={3} className="p-5">
        <h3 className="font-semibold text-slate-800 mb-4">使用日志</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="text-left py-2 px-3">时间</th>
                <th className="text-left py-2 px-3">Agent</th>
                <th className="text-right py-2 px-3">Prompt</th>
                <th className="text-right py-2 px-3">Completion</th>
                <th className="text-right py-2 px-3">Cost</th>
              </tr>
            </thead>
            <tbody>
              {logs?.slice(0, 20).map((log) => (
                <tr key={log.id} className="border-b border-slate-100">
                  <td className="py-2 px-3 text-slate-600">{new Date(log.created_at).toLocaleString()}</td>
                  <td className="py-2 px-3 font-mono text-sm">{log.model}</td>
                  <td className="py-2 px-3 text-right">{log.prompt_tokens}</td>
                  <td className="py-2 px-3 text-right">{log.completion_tokens}</td>
                  <td className="py-2 px-3 text-right">${log.cost.toFixed(4)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </wired-card>
    </div>
  )
}
