import { useState, useRef, useEffect } from 'react'
import { useAgents } from '../hooks/useAgents'
import { chatAPI } from '../api'
import { toast } from 'react-hot-toast'

const ROLE_COLORS = {
  user: 'bg-indigo-100 text-indigo-800',
  assistant: 'bg-slate-100 text-slate-800',
  system: 'bg-yellow-50 text-yellow-800',
}

export default function AgentChat() {
  const { data: agents, isLoading: agentsLoading } = useAgents()
  const [selectedAgent, setSelectedAgent] = useState(null)
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSend = async () => {
    if (!input.trim() || !selectedAgent || isLoading) return

    const userMessage = { role: 'user', content: input.trim() }
    setMessages((prev) => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    try {
      const response = await chatAPI.completions({
        model: selectedAgent.agent_id,
        messages: [...messages, userMessage].map((m) => ({
          role: m.role,
          content: m.content,
        })),
        stream: false,
      })

      const assistantMessage = {
        role: 'assistant',
        content: response.data.choices[0].message.content,
      }
      setMessages((prev) => [...prev, assistantMessage])
    } catch (error) {
      console.error('Chat error:', error)
      toast.error(error.response?.data?.detail || '发送失败')
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleSelectAgent = (agent) => {
    setSelectedAgent(agent)
    setMessages([
      {
        role: 'system',
        content: `已选择 Agent: ${agent.name} - ${agent.description}`,
      },
    ])
    toast.success(`已切换到 ${agent.name}`)
  }

  if (agentsLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-slate-500">加载中...</p>
      </div>
    )
  }

  return (
    <div className="flex h-[calc(100vh-4rem)]">
      {/* 左侧 Agent 列表 */}
      <aside className="w-64 shrink-0 border-r border-slate-200 bg-white overflow-y-auto">
        <div className="p-4 border-b border-slate-200">
          <h2 className="font-semibold text-slate-800">选择 Agent</h2>
          <p className="text-xs text-slate-500 mt-1">点击选择一个 Agent 开始对话</p>
        </div>
        <div className="p-2">
          {agents?.map((agent) => (
            <button
              key={agent.id}
              onClick={() => handleSelectAgent(agent)}
              className={`w-full text-left p-3 rounded-lg mb-2 transition-colors ${
                selectedAgent?.id === agent.id
                  ? 'bg-indigo-100 border border-indigo-200'
                  : 'hover:bg-slate-100'
              }`}
            >
              <div className="font-medium text-sm text-slate-800">{agent.name}</div>
              <div className="text-xs text-slate-500 mt-1 truncate">{agent.description}</div>
              <div className="flex flex-wrap gap-1 mt-2">
                {agent.capabilities?.slice(0, 2).map((cap) => (
                  <span
                    key={cap}
                    className="text-xs px-1.5 py-0.5 bg-slate-200 text-slate-600 rounded"
                  >
                    {cap}
                  </span>
                ))}
              </div>
            </button>
          ))}
        </div>
      </aside>

      {/* 右侧聊天区域 */}
      <div className="flex-1 flex flex-col">
        {/* 聊天消息 */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 ? (
            <div className="h-full flex items-center justify-center">
              <div className="text-center">
                <div className="text-4xl mb-4">🤖</div>
                <p className="text-slate-500">
                  {selectedAgent
                    ? `与 ${selectedAgent.name} 开始对话吧`
                    : '请先选择一个 Agent'}
                </p>
              </div>
            </div>
          ) : (
            messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-lg p-3 ${
                    message.role === 'user'
                      ? 'bg-indigo-600 text-white'
                      : message.role === 'system'
                      ? 'bg-yellow-50 text-yellow-800 border border-yellow-200'
                      : 'bg-white border border-slate-200 text-slate-800'
                  }`}
                >
                  {message.role !== 'user' && (
                    <div className="text-xs font-medium mb-1 opacity-70">
                      {message.role === 'assistant' ? selectedAgent?.name || 'Agent' : 'System'}
                    </div>
                  )}
                  <div className="whitespace-pre-wrap text-sm">
                    {message.content}
                  </div>
                </div>
              </div>
            ))
          )}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-slate-100 rounded-lg p-3">
                <div className="flex gap-1">
                  <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" />
                  <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-75" />
                  <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-150" />
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* 输入区域 */}
        <div className="border-t border-slate-200 p-4 bg-white">
          <div className="flex gap-2">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={
                selectedAgent
                  ? `与 ${selectedAgent.name} 对话... (Enter 发送，Shift+Enter 换行)`
                  : '请先选择一个 Agent'
              }
              disabled={!selectedAgent || isLoading}
              className="flex-1 border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none disabled:bg-slate-100"
              rows={2}
            />
            <button
              onClick={handleSend}
              disabled={!selectedAgent || isLoading || !input.trim()}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors"
            >
              发送
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
