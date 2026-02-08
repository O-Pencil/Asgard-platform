import { useState } from 'react'

const CATEGORIES = { dev: '开发', writing: '写作', creative: '创意', analysis: '分析' }

const MOCK_AGENTS = [
  { id: 1, name: '代码重构 Agent', desc: '自动化代码重构与风格统一', category: 'dev', capability: ['Code Review', 'Refactor'], context: '128K', pricing: '0.02', enabled: true },
  { id: 2, name: '单元测试 Agent', desc: '生成高质量单元测试用例', category: 'dev', capability: ['Test', 'Coverage'], context: '64K', pricing: '0.015', enabled: false },
  { id: 3, name: '韩寒风格 Agent', desc: '犀利、幽默、带点叛逆的杂文与随笔风格', category: 'writing', capability: ['杂文', '随笔', '青年视角'], context: '128K', pricing: '0.025', enabled: true },
  { id: 4, name: '猫腻叙事 Agent', desc: '网文大神级叙事节奏，伏笔与爽点把控', category: 'writing', capability: ['网文', '长篇叙事', '节奏把控'], context: '256K', pricing: '0.035', enabled: false },
  { id: 5, name: '商业文案 Agent', desc: '品牌文案、营销软文、电商详情页', category: 'creative', capability: ['商业文案', '营销', '转化'], context: '64K', pricing: '0.018', enabled: false },
  { id: 6, name: '剧本创作 Agent', desc: '影视剧本、分镜脚本、对白润色', category: 'creative', capability: ['剧本', '对白', '节奏'], context: '128K', pricing: '0.028', enabled: false },
  { id: 7, name: '架构设计 Agent', desc: '系统架构与 Schema 设计建议', category: 'dev', capability: ['Schema Design', 'Architecture'], context: '256K', pricing: '0.03', enabled: false },
  { id: 8, name: '数据洞察 Agent', desc: '商业数据分析与洞察报告生成', category: 'analysis', capability: ['数据分析', '报告', '可视化'], context: '128K', pricing: '0.022', enabled: false },
]

export default function AgentMarket() {
  const [sort, setSort] = useState('default')
  const [categoryFilter, setCategoryFilter] = useState('all')

  const filteredAgents = categoryFilter === 'all'
    ? MOCK_AGENTS
    : MOCK_AGENTS.filter((a) => a.category === categoryFilter)

  return (
    <div className="flex gap-6">
      {/* 左侧筛选区 */}
      <aside className="w-52 shrink-0">
        <wired-card elevation={3} className="p-4">
          <h3 className="font-semibold text-slate-800 mb-3">筛选</h3>
          <div className="space-y-3">
            <div>
              <p className="text-xs text-slate-500 mb-2">领域分类</p>
              <div className="flex flex-col gap-1">
                {['all', 'dev', 'writing', 'creative', 'analysis'].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setCategoryFilter(cat)}
                    className={`text-left text-sm px-2 py-1 rounded ${
                      categoryFilter === cat ? 'bg-indigo-100 text-indigo-700' : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {cat === 'all' ? '全部' : CATEGORIES[cat]}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-2">能力标签</p>
              <div className="flex flex-col gap-2">
                <wired-checkbox>Code Review</wired-checkbox>
                <wired-checkbox>韩寒风格</wired-checkbox>
                <wired-checkbox>网文叙事</wired-checkbox>
                <wired-checkbox>商业文案</wired-checkbox>
                <wired-checkbox>剧本创作</wired-checkbox>
              </div>
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-2">Context Window</p>
              <div className="flex flex-col gap-2">
                <wired-checkbox>64K</wired-checkbox>
                <wired-checkbox>128K</wired-checkbox>
                <wired-checkbox>256K</wired-checkbox>
              </div>
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-2">价格区间</p>
              <div className="flex flex-col gap-2">
                <wired-checkbox>≤ 0.02/1K</wired-checkbox>
                <wired-checkbox>0.02 - 0.05</wired-checkbox>
              </div>
            </div>
          </div>
        </wired-card>
      </aside>

      {/* 主列表区 */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-4">
          <wired-input placeholder="搜索 Agent 名称或能力..." className="w-80" />
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-500">排序:</span>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="text-sm border border-slate-300 rounded px-2 py-1 bg-white"
            >
              <option value="default">默认</option>
              <option value="newest">最新</option>
              <option value="hot">热度</option>
              <option value="price-low">价格从低到高</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {filteredAgents.map((agent) => (
            <wired-card key={agent.id} elevation={3} className="p-4 hover:opacity-90 transition-opacity cursor-pointer">
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-slate-800">{agent.name}</h3>
                  <span className="text-xs px-1.5 py-0.5 bg-slate-200 text-slate-600 rounded">{CATEGORIES[agent.category]}</span>
                </div>
                {agent.enabled && (
                  <span className="text-xs px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded">已启用</span>
                )}
              </div>
              <p className="text-sm text-slate-600 mb-3">{agent.desc}</p>
              <div className="flex flex-wrap gap-1 mb-3">
                {agent.capability.map((c) => (
                  <span key={c} className="text-xs px-2 py-0.5 bg-slate-100 text-slate-600 rounded">
                    {c}
                  </span>
                ))}
              </div>
              <div className="flex justify-between text-xs text-slate-500 mb-3">
                <span>Context: {agent.context}</span>
                <span>Pricing: {agent.pricing} Credit/1K</span>
              </div>
              <wired-button elevation={2} className={agent.enabled ? '' : ''}>
                {agent.enabled ? '停用' : '启用'}
              </wired-button>
            </wired-card>
          ))}
        </div>
      </div>
    </div>
  )
}
