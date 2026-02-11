import { NavLink, useLocation, Outlet } from 'react-router-dom'

export default function Layout() {
  const location = useLocation()
  const currentPath = location.pathname

  const isActive = (path) => {
    if (path === '/') return currentPath === '/'
    return currentPath.startsWith(path)
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* 顶部导航 */}
      <header className="border-b border-slate-200 bg-white sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-between h-14">
          <div className="flex items-center gap-8">
            <NavLink to="/" className="font-bold text-xl text-slate-800">
              Asgard
            </NavLink>
            <nav className="flex gap-6">
              <NavLink
                to="/"
                className={() =>
                  `text-sm font-medium ${currentPath === '/' ? 'text-indigo-600' : 'text-slate-600 hover:text-slate-900'}`
                }
              >
                Agent 市场
              </NavLink>
              <NavLink
                to="/chat"
                className={() =>
                  `text-sm font-medium ${currentPath.startsWith('/chat') ? 'text-indigo-600' : 'text-slate-600 hover:text-slate-900'}`
                }
              >
                聊天
              </NavLink>
              <NavLink
                to="/console"
                className={() =>
                  `text-sm font-medium ${currentPath.startsWith('/console') ? 'text-indigo-600' : 'text-slate-600 hover:text-slate-900'}`
                }
              >
                控制台
              </NavLink>
              <a href="#" className="text-sm font-medium text-slate-600 hover:text-slate-900">
                文档
              </a>
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <NavLink to="/console/keys">
              <wired-button elevation={3}>
                获取 API Key
              </wired-button>
            </NavLink>
            <div className="flex items-center gap-3 pl-4 border-l border-slate-200">
              <span className="text-sm text-slate-500">余额:</span>
              <span className="text-sm font-medium text-slate-700">1,280 Credits</span>
              <div className="w-8 h-8 rounded-full bg-slate-300 flex items-center justify-center text-xs font-medium text-slate-600">
                用户
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        <Outlet />
      </main>
    </div>
  )
}
