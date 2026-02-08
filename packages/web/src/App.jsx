import { useState } from 'react'
import Layout from './components/Layout'
import AgentMarket from './pages/AgentMarket'
import Console from './pages/Console'

const PAGES = {
  market: 'market',
  console: 'console',
}

function App() {
  const [page, setPage] = useState(PAGES.market)

  return (
    <Layout page={page} onNavigate={setPage}>
      {page === PAGES.market && <AgentMarket />}
      {page === PAGES.console && <Console />}
    </Layout>
  )
}

export default App
