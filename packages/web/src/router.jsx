import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Suspense, lazy } from 'react'
import { useAuthStore } from './store'

import Layout from './components/Layout'
import AgentMarket from './pages/AgentMarket'
import ConsoleDashboard from './pages/console/Dashboard'
import ConsoleKeys from './pages/console/Keys'
import ConsoleUsage from './pages/console/Usage'
import ConsoleIntegrations from './pages/console/Integrations'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})

const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      {
        index: true,
        element: <AgentMarket />,
      },
      {
        path: 'market',
        element: <AgentMarket />,
      },
      {
        path: 'console',
        children: [
          {
            index: true,
            element: <ConsoleDashboard />,
          },
          {
            path: 'keys',
            element: <ConsoleKeys />,
          },
          {
            path: 'usage',
            element: <ConsoleUsage />,
          },
          {
            path: 'integrations',
            element: <ConsoleIntegrations />,
          },
        ],
      },
    ],
  },
])

function Loading() {
  return (
    <div className="flex items-center justify-center py-12">
      <p className="text-slate-500">加载中...</p>
    </div>
  )
}

export default function Router() {
  // Initialize auth state on mount
  useAuthStore.getState().init()

  return (
    <QueryClientProvider client={queryClient}>
      <Suspense fallback={<Loading />}>
        <RouterProvider router={router} />
      </Suspense>
    </QueryClientProvider>
  )
}
