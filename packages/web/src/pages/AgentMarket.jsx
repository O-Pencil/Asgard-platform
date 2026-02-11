import { useState, useMemo } from 'react'
import { useAgents, useEnableAgent, useDisableAgent } from '../hooks/useAgents'
import { useMarketStore } from '../store'
import { toast } from 'react-hot-toast'

const CATEGORIES = {
  dev: '开发',
  writing: '写作',
  creative: '创意',
  analysis: '分析',
}

const ALL_CAPABILITIES = [
  'Code Review',
  'Refactor',
  'Test',
  'Coverage',
  'Schema Design',
  'Architecture',
  '杂文',
  '随笔',
  '青年视角',
  '网文',
  '长篇叙事',
  '节奏把控',
  '商业文案',
  '营销',
  '转化',
  '剧本',
  '对白',
  '数据分析',
  '报告',
  '可视化',
]

const MOCK_AGENTS = [
  { id: 'asgard-code-refactor', name: '代码重构 Agent', desc: '自动化代码重构与风格统一', category: 'dev', capabilities: ['Code Review', 'Refactor'], context_window: 128000, pricing: 0.02, enabled: true },
  { id: 'asgard-unit-test', name: '单元测试 Agent', desc: '生成高质量单元测试用例', category: 'dev', capabilities: ['Test', 'Coverage'], context_window: 64000, pricing: 0.015, enabled: false },
  { id: 'asgard-hanhan-style', name: '韩寒风格 Agent', desc: '犀利、幽默、带点叛逆的杂文与随笔风格', category: 'writing', capabilities: ['杂文', '随笔', '青年视角'], context_window: 128000, pricing: 0.025, enabled: true },
  { id: 'asgard-maoni-style', name: '猫腻叙事 Agent', desc: '网文大神级叙事节奏，伏笔与爽点把控', category: 'writing', capabilities: ['网文', '长篇叙事', '节奏把控'], context_window: 256000, pricing: 0.035, enabled: false },
  { id: 'asgard-business-copywriting', name: '商业文案 Agent', desc: '品牌文案、营销软文、电商详情页', category: 'creative', capabilities: ['商业文案', '营销', '转化'], context_window: 64000, pricing: 0.018, enabled: false },
  { id: 'asgard-scriptwriting', name: '剧本创作 Agent', desc: '影视剧本、分镜脚本、对白润色', category: 'creative', capabilities: ['剧本', '对白', '节奏'], context_window: 128000, pricing: 0.028, enabled: false },
  { id: 'asgard-architect', name: '架构设计 Agent', desc: '系统架构与 Schema 设计建议', category: 'dev', capabilities: ['Schema Design', 'Architecture'], context_window: 256000, pricing: 0.03, enabled: false },
  { id: 'asgard-data-insight', name: '数据洞察 Agent', desc: '商业数据分析与洞察报告生成', category: 'analysis', capabilities: ['数据分析', '报告', '可视化'], context_window: 128000, pricing: 0.022, enabled: false },
]

export default function AgentMarket() {
  const { data: agents, isLoading } = useAgents()
  const enableAgent = useEnableAgent()
  const disableAgent = useDisableAgent()

  const {
    searchQuery,
    category,
    capabilities,
    sortBy,
    setSearchQuery,
    setCategory,
    toggleCapability,
    setSortBy,
    resetFilters,
  } = useMarketStore()

  // Use mock data if API not available
  const agentList = agents || MOCK_AGENTS

  const filteredAgents = useMemo(() => {
    let result = [...agentList]

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      result = result.filter(
        (a) =>
          a.name.toLowerCase().includes(query) ||
          a.desc.toLowerCase().includes(query) ||
          a.capabilities.some((c) => c.toLowerCase().includes(query))
      )
    }

    // Category filter
    if (category !== 'all') {
      result = result.filter((a) => a.category === category)
    }

    // Capabilities filter
    if (capabilities.length > 0) {
      result = result.filter((a) =>
        capabilities.some((cap) => a.capabilities.includes(cap))
      )
    }

    // Sort
    switch (sortBy) {
      case 'newest':
        result.sort((a, b) => (b.created_at || '').localeCompare(a.created_at || ''))
        break
      case 'hot':
        result.sort((a, b) => (b.usage_count || 0) - (a.usage_count || 0))
        break
      case 'price-low':
        result.sort((a, b) => a.pricing - b.pricing)
        break
      default:
        break
    }

    return result
  }, [agentList, searchQuery, category, capabilities, sortBy])

  const handleToggleAgent = (agentId, currentEnabled) => {
    const agent = agents?.find(a => a.id === agentId)
    const agentName = agent?.name || agentId

    if (currentEnabled) {
      disableAgent.mutate(agentId, {
        onSuccess: () => {
          toast.success(`已停用 ${agentName}`)
        },
        onError: () => {
          toast.error(`停用 ${agentName} 失败`)
        }
      })
    } else {
      enableAgent.mutate(agentId, {
        onSuccess: () => {
          toast.success(`已启用 ${agentName}`)
        },
        onError: () => {
          toast.error(`启用 ${agentName} 失败`)
        }
      })
    }
  }

  const formatContextWindow = (ctx) => {
    if (!ctx) return 'N/A'
    if (ctx >= 1000000) return `${(ctx / 1000000).toFixed(0)}M`
    if (ctx >= 1000) return `${(ctx / 1000).toFixed(0)}K`
    return ctx.toString()
  }

  return (
    <div className="flex gap-6">
      {/* 左侧筛选区 */}
      <aside className="w-52 shrink-0">
        <wired-card elevation={3} className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-slate-800">筛选</h3>
            <button
              onClick={resetFilters}
              className="text-xs text-indigo-600 hover:text-indigo-700"
            >
              重置
            </button>
          </div>
          <div className="space-y-4">
            {/* 领域分类 */}
            <div>
              <p className="text-xs text-slate-500 mb-2">领域分类</p>
              <div className="flex flex-col gap-1">
                {['all', 'dev', 'writing', 'creative', 'analysis'].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setCategory(cat)}
                    className={`text-left text-sm px-2 py-1 rounded transition-colors ${
                      category === cat
                        ? 'bg-indigo-100 text-indigo-700'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {cat === 'all' ? '全部' : CATEGORIES[cat]}
                  </button>
                ))}
              </div>
            </div>

            {/* 能力标签 */}
            <div>
              <p className="text-xs text-slate-500 mb-2">能力标签</p>
              <div className="flex flex-col gap-2 max-h-40 overflow-y-auto">
                {ALL_CAPABILITIES.slice(0, 10).map((cap) => (
                  <label
                    key={cap}
                    className="flex items-center gap-2 cursor-pointer text-sm text-slate-700"
                  >
                    <input
                      type="checkbox"
                      checked={capabilities.includes(cap)}
                      onChange={() => toggleCapability(cap)}
                      className="rounded border-slate-300"
                    />
                    {cap}
                  </label>
                ))}
              </div>
            </div>

            {/* Context Window */}
            <div>
              <p className="text-xs text-slate-500 mb-2">Context Window</p>
              <div className="flex flex-col gap-2">
                {[64, 128, 256].map((ctx) => (
                  <label
                    key={ctx}
                    className="flex items-center gap-2 cursor-pointer text-sm text-slate-700"
                  >
                    <input
                      type="checkbox"
                      className="rounded border-slate-300"
                    />
                    {ctx}K+
                  </label>
                ))}
              </div>
            </div>

            {/* 价格区间 */}
            <div>
              <p className="text-xs text-slate-500 mb-2">价格区间</p>
              <div className="flex flex-col gap-2">
                <label className="flex items-center gap-2 cursor-pointer text-sm text-slate-700">
                  <input type="checkbox" className="rounded border-slate-300" />
                  ≤ 0.02/1K Tokens
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-sm text-slate-700">
                  <input type="checkbox" className="rounded border-slate-300" />
                  0.02 - 0.05/1K Tokens
                </label>
              </div>
            </div>
          </div>
        </wired-card>
      </aside>

      {/* 主列表区 */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-4">
          <wired-input
            placeholder="搜索 Agent 名称或能力..."
            className="w-80"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-500">排序:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="text-sm border border-slate-300 rounded px-2 py-1 bg-white cursor-pointer"
            >
              <option value="default">默认</option>
              <option value="newest">最新</option>
              <option value="hot">热度</option>
              <option value="price-low">价格从低到高</option>
            </select>
          </div>
        </div>

        {/* Agent 数量 */}
        <p className="text-sm text-slate-500 mb-4">
          共 {filteredAgents.length} 个 Agent
        </p>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <p className="text-slate-500">加载中...</p>
          </div>
        ) : filteredAgents.length === 0 ? (
          <div className="flex items-center justify-center py-12">
            <p className="text-slate-500">没有找到符合条件的 Agent</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {filteredAgents.map((agent) => (
              <wired-card
                key={agent.id}
                elevation={3}
                className="p-4 hover:opacity-90 transition-opacity cursor-pointer"
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-slate-800">{agent.name}</h3>
                    <span className="text-xs px-1.5 py-0.5 bg-slate-200 text-slate-600 rounded">
                      {CATEGORIES[agent.category]}
                    </span>
                  </div>
                  {agent.enabled && (
                    <span className="text-xs px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded">
                      已启用
                    </span>
                  )}
                </div>
                <p className="text-sm text-slate-600 mb-3">{agent.desc}</p>
                <div className="flex flex-wrap gap-1 mb-3">
                  {agent.capabilities.slice(0, 4).map((c) => (
                    <span
                      key={c}
                      className="text-xs px-2 py-0.5 bg-slate-100 text-slate-600 rounded"
                    >
                      {c}
                    </span>
                  ))}
                  {agent.capabilities.length > 4 && (
                    <span className="text-xs px-2 py-0.5 bg-slate-100 text-slate-500 rounded">
                      +{agent.capabilities.length - 4}
                    </span>
                  )}
                </div>
                <div className="flex justify-between text-xs text-slate-500 mb-3">
                  <span>Context: {formatContextWindow(agent.context_window)}</span>
                  <span>{agent.pricing} Credit/1K</span>
                </div>
                <wired-button
                  elevation={2}
                  onClick={(e) => {
                    e.stopPropagation()
                    handleToggleAgent(agent.id, agent.enabled)
                  }}
                  disabled={enableAgent.isPending || disableAgent.isPending}
                >
                  {agent.enabled ? '停用' : '启用'}
                </wired-button>
              </wired-card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
