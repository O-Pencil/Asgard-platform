import { useState } from 'react'

const TABS = ['概览', '凭证管理', '集成指南', '用量统计']

export default function Console() {
  const [activeTab, setActiveTab] = useState(0)

  return (
    <div>
      {/* 控制台子导航 */}
      <div className="flex gap-1 mb-6 border-b border-slate-200">
        {TABS.map((tab, i) => (
          <button
            key={tab}
            onClick={() => setActiveTab(i)}
            className={`px-4 py-2 text-sm font-medium -mb-px border-b-2 transition-colors ${
              activeTab === i
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-600 hover:text-slate-800'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* 概览 */}
      {activeTab === 0 && (
        <div className="space-y-6">
          <div className="grid grid-cols-3 gap-4">
            <wired-card elevation={3} className="p-5">
              <p className="text-sm text-slate-500 mb-1">当前余额</p>
              <p className="text-2xl font-bold text-slate-800">1,280 Credits</p>
            </wired-card>
            <wired-card elevation={3} className="p-5">
              <p className="text-sm text-slate-500 mb-1">今日 Token 消耗</p>
              <p className="text-2xl font-bold text-slate-800">45.2K</p>
            </wired-card>
            <wired-card elevation={3} className="p-5">
              <p className="text-sm text-slate-500 mb-1">活跃 Agent 数量</p>
              <p className="text-2xl font-bold text-slate-800">2</p>
            </wired-card>
          </div>
          <wired-card elevation={3} className="p-5">
            <h3 className="font-semibold text-slate-800 mb-4">快捷操作</h3>
            <div className="flex gap-4">
              <wired-button elevation={2}>创建 Key</wired-button>
              <wired-button elevation={2}>查看集成指南</wired-button>
              <wired-button elevation={2}>用量明细</wired-button>
            </div>
          </wired-card>
        </div>
      )}

      {/* 凭证管理 */}
      {activeTab === 1 && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <wired-button elevation={3}>新建 Key</wired-button>
          </div>
          <wired-card elevation={3} className=" overflow-x-auto">
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
                <tr className="border-b border-slate-100">
                  <td className="py-3 px-4">Main Key</td>
                  <td className="py-3 px-4 font-mono text-slate-500">ask-••••••••3f2a</td>
                  <td className="py-3 px-4 text-slate-600">2025-02-01 10:30</td>
                  <td className="py-3 px-4"><span className="text-green-600">启用</span></td>
                  <td className="py-3 px-4">
                    <div className="flex gap-2">
                      <wired-button elevation={1}>复制</wired-button>
                      <wired-button elevation={1}>轮换</wired-button>
                      <wired-button elevation={1}>禁用</wired-button>
                    </div>
                  </td>
                </tr>
                <tr>
                  <td className="py-3 px-4">Dev Key</td>
                  <td className="py-3 px-4 font-mono text-slate-500">ask-••••••••7b1c</td>
                  <td className="py-3 px-4 text-slate-600">2025-02-05 14:20</td>
                  <td className="py-3 px-4"><span className="text-slate-400">禁用</span></td>
                  <td className="py-3 px-4">
                    <div className="flex gap-2">
                      <wired-button elevation={1}>复制</wired-button>
                      <wired-button elevation={1}>启用</wired-button>
                      <wired-button elevation={1}>删除</wired-button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </wired-card>
        </div>
      )}

      {/* 集成指南 */}
      {activeTab === 2 && (
        <wired-card elevation={3} className="p-5">
          <div className="flex gap-2 mb-4 border-b border-slate-200 pb-2">
            {['Cursor', 'VS Code', 'Notion', '飞书', 'Figma', 'Raycast', 'Github Actions'].map((tool) => (
              <button key={tool} className="px-3 py-1 text-sm rounded bg-slate-100 hover:bg-slate-200 text-slate-700">
                {tool}
              </button>
            ))}
          </div>
          <div className="space-y-4">
            <div>
              <h4 className="font-medium text-slate-800 mb-2">步骤 1: 获取 API Key</h4>
              <p className="text-sm text-slate-600 mb-2">在控制台 → 凭证管理 中创建 Key</p>
            </div>
            <div>
              <h4 className="font-medium text-slate-800 mb-2">步骤 2: 配置 Base URL</h4>
              <pre className="text-sm bg-slate-100 p-3 rounded font-mono text-slate-700">https://api.asgard.ai/v1</pre>
            </div>
            <div>
              <h4 className="font-medium text-slate-800 mb-2">步骤 3: 设置 Model 字段</h4>
              <pre className="text-sm bg-slate-100 p-3 rounded font-mono text-slate-700">model: "asgard/architect-agent"  // 或 asgard/hanhan-writing 等</pre>
            </div>
          </div>
        </wired-card>
      )}

      {/* 用量统计 */}
      {activeTab === 3 && (
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <span className="text-sm text-slate-500">时间维度:</span>
            <div className="flex gap-2">
              {['日', '周', '月'].map((d) => (
                <wired-button key={d} elevation={2}>{d}</wired-button>
              ))}
            </div>
            <wired-button elevation={2}>导出 CSV</wired-button>
          </div>
          <wired-card elevation={3} className="p-5">
            <h3 className="font-semibold text-slate-800 mb-4">按 Agent 维度</h3>
            <div className="h-48 flex items-end gap-4">
              {['代码重构', '韩寒风格', '架构设计', '商业文案'].map((name, i) => (
                <div key={name} className="flex-1 flex flex-col items-center">
                  <div
                    className="w-full bg-indigo-200 rounded-t min-h-[20px]"
                    style={{ height: `${40 + i * 30}%` }}
                  />
                  <span className="text-xs text-slate-500 mt-2">{name}</span>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t border-slate-200 text-sm text-slate-600">
              调用次数 | Input Token | Output Token | 错误率
            </div>
          </wired-card>
        </div>
      )}
    </div>
  )
}
