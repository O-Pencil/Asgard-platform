import { useState } from 'react'

const TOOLS = [
  { id: 'cursor', name: 'Cursor' },
  { id: 'vscode', name: 'VS Code' },
  { id: 'notion', name: 'Notion' },
  { id: 'feishu', name: '飞书' },
  { id: 'raycast', name: 'Raycast' },
  { id: 'github', name: 'Github Actions' },
]

export default function Integrations() {
  const [activeTool, setActiveTool] = useState('cursor')

  const guides = {
    cursor: {
      title: 'Cursor 集成',
      steps: [
        '打开 Cursor 设置 (Ctrl+,)',
        '选择 Features → Chat',
        '配置 Base URL: https://api.asgard.ai/v1',
        '设置 Model: asgard/code-refactor',
      ],
      config: `{\n  "cursor.chat.baseUrl": "https://api.asgard.ai/v1",\n  "cursor.chat.model": "asgard/code-refactor"\n}`,
    },
    vscode: {
      title: 'VS Code (Continue) 集成',
      steps: ['安装 Continue 扩展', '点击侧边栏 Continue 图标', '添加配置: Base URL 和 API Key'],
      config: `{\n  "models": [{\n    "title": "Asgard Code Refactor",\n    "provider": "OpenAI",\n    "model": "asgard/code-refactor",\n    "apiKey": "YOUR_API_KEY",\n    "baseUrl": "https://api.asgard.ai/v1"\n  }]\n}`,
    },
    notion: {
      title: 'Notion 集成',
      steps: ['安装 Asgard Chrome/Firefox 扩展', '在扩展设置中填入 API Key'],
      config: `API Key: asgard_xxxxxxxxxxxxx\nBase URL: https://api.asgard.ai/v1`,
    },
    feishu: {
      title: '飞书集成',
      steps: ['创建飞书应用', '配置机器人 Webhook', '添加 Asgard 认证信息'],
      config: `{\n  "飞书机器人 URL": "https://open.feishu.cn/open-apis/bot/v2/hook/xxx",\n  "Asgard API Key": "asgard_xxxxxxxxxxxxx"\n}`,
    },
    raycast: {
      title: 'Raycast 集成',
      steps: ['安装 Asgard 扩展', '运行: Asgard: Configure', '填入 API Key'],
      config: `API Key: asgard_xxxxxxxxxxxxx`,
    },
    github: {
      title: 'Github Actions 集成',
      steps: ['在仓库中添加 Secrets: ASGARD_API_KEY', '在工作流中使用 Asgard API'],
      config: `- name: Use Asgard Agent\n  uses: asgard/agent-action@v1\n  with:\n    agent: asgard/code-refactor\n    apiKey: \${{ secrets.ASGARD_API_KEY }}`,
    },
  }

  const guide = guides[activeTool]

  return (
    <div className="space-y-6">
      <div className="flex gap-2 border-b border-slate-200 pb-2">
        {TOOLS.map((tool) => (
          <button key={tool.id} onClick={() => setActiveTool(tool.id)}
            className={`px-3 py-1.5 text-sm rounded transition-colors ${activeTool === tool.id ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'}`}>
            {tool.name}
          </button>
        ))}
      </div>

      <wired-card elevation={3} className="p-5">
        <h3 className="font-semibold text-slate-800 mb-4">{guide.title}</h3>
        <div className="grid grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium text-slate-700 mb-2">配置步骤</h4>
            <ol className="space-y-2 text-sm text-slate-600 list-decimal list-inside">
              {guide.steps.map((step, i) => <li key={i}>{step}</li>)}
            </ol>
          </div>
          <div>
            <h4 className="font-medium text-slate-700 mb-2">配置模板</h4>
            <pre className="text-sm bg-slate-100 p-3 rounded font-mono text-slate-700 overflow-x-auto">{guide.config}</pre>
          </div>
        </div>
      </wired-card>

      <wired-card elevation={3} className="p-5">
        <h3 className="font-semibold text-slate-800 mb-4">可用 Agent 模型</h3>
        <div className="grid grid-cols-2 gap-3">
          {[
            { id: 'asgard/code-refactor', name: '代码重构', desc: 'Code Review & Refactor' },
            { id: 'asgard/hanhan-style', name: '韩寒风格', desc: '创意写作' },
            { id: 'asgard/business-copy', name: '商业文案', desc: '营销软文' },
            { id: 'asgard/unit-test', name: '单元测试', desc: '测试用例生成' },
          ].map((agent) => (
            <div key={agent.id} className="p-3 bg-slate-50 rounded">
              <code className="text-sm text-indigo-600">{agent.id}</code>
              <p className="text-sm text-slate-700 mt-1">{agent.name}</p>
              <p className="text-xs text-slate-500">{agent.desc}</p>
            </div>
          ))}
        </div>
      </wired-card>
    </div>
  )
}
