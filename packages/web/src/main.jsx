import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Toaster } from 'react-hot-toast'
import 'wired-elements'
import './index.css'
import Router from './router.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Router />
    <Toaster position="top-right" />
  </StrictMode>,
)
