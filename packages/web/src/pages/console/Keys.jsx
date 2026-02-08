import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { consoleAPI } from '../../api'

export default function Keys() {
  const [showCreate, setShowCreate] = useState(false)
  const [newKeyName, setNewKeyName] = useState('')
  const [createdKey, setCreatedKey] = useState(null)
  const queryClient = useQueryClient()

  const { data: keys, isLoading } = useQuery({
    queryKey: ['api-keys'],
    queryFn: () => consoleAPI.listKeys().then(r => r.data),
  })

  const createMutation = useMutation({
    mutationFn: (name) => consoleAPI.createKey({ name }),
    onSuccess: (response) => {
      setCreatedKey(response.data)
      queryClient.invalidateQueries(['api-keys'])
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (uuid) => consoleAPI.deleteKey(uuid),
    onSuccess: () => queryClient.invalidateQueries(['api-keys']),
  })

  const rotateMutation = useMutation({
    mutationFn: (uuid) => consoleAPI.rotateKey(uuid),
    onSuccess: () => queryClient.invalidateQueries(['api-keys']),
  })

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text)
    alert('已复制到剪贴板')
  }

  return (
    <div className="space-y-4">
      {createdKey && (
        <wired-card elevation={3} className="p-4 bg-green-50 border border-green-200">
          <p className="text-green-800 font-medium mb-2">API Key 已创建！请立即复制保存：</p>
          <div className="flex gap-2">
            <code className="flex-1 bg-white px-3 py-2 rounded font-mono text-sm">
              {createdKey.api_key}
            </code>
            <wired-button onClick={() => handleCopy(createdKey.api_key)}>复制</wired-button>
            <wired-button onClick={() => setCreatedKey(null)}>关闭</wired-button>
          </div>
        </wired-card>
      )}

      <div className="flex justify-end">
        <wired-button elevation={3} onClick={() => setShowCreate(true)}>
          新建 Key
        </wired-button>
      </div>

      {showCreate && (
        <wired-card elevation={3} className="p-4 mb-4">
          <h4 className="font-medium mb-3">创建新 API Key</h4>
          <div className="flex gap-2 mb-3">
            <wired-input
              placeholder="Key 名称（可选）"
              value={newKeyName}
              onChange={(e) => setNewKeyName(e.target.value)}
            />
            <wired-button
              onClick={() => createMutation.mutate(newKeyName || undefined)}
              disabled={createMutation.isPending}
            >
              {createMutation.isPending ? '创建中...' : '确认创建'}
            </wired-button>
            <wired-button onClick={() => setShowCreate(false)}>取消</wired-button>
          </div>
        </wired-card>
      )}

      <wired-card elevation={3} className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200">
              <th className="text-left py-3 px-4 font-medium text-slate-700">名称</th>
              <th className="text-left py-3 px-4 font-medium text-slate-700">标签</th>
              <th className="text-left py-3 px-4 font-medium text-slate-700">创建时间</th>
              <th className="text-left py-3 px-4 font-medium text-slate-700">状态</th>
              <th className="text-left py-3 px-4 font-medium text-slate-700">操作</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={5} className="py-8 text-center text-slate-500">加载中...</td>
              </tr>
            ) : keys?.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-8 text-center text-slate-500">暂无 API Key</td>
              </tr>
            ) : (
              keys?.map((key) => (
                <tr key={key.uuid} className="border-b border-slate-100">
                  <td className="py-3 px-4">{key.name || '-'}</td>
                  <td className="py-3 px-4 font-mono text-slate-500">{key.key_prefix}...</td>
                  <td className="py-3 px-4 text-slate-600">
                    {new Date(key.created_at).toLocaleDateString()}
                  </td>
                  <td className="py-3 px-4">
                    <span className={key.is_active ? 'text-green-600' : 'text-slate-400'}>
                      {key.is_active ? '启用' : '禁用'}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex gap-2">
                      <wired-button elevation={1} onClick={() => handleCopy(key.key_prefix)}>复制</wired-button>
                      <wired-button elevation={1} onClick={() => rotateMutation.mutate(key.uuid)} disabled={rotateMutation.isPending}>轮换</wired-button>
                      <wired-button elevation={1} onClick={() => { if (confirm('确定删除？')) deleteMutation.mutate(key.uuid) }}>删除</wired-button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </wired-card>
    </div>
  )
}
