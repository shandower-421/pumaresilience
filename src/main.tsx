import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

async function init() {
  if (__DEMO_MODE__) {
    const { loadDemoData } = await import('./demo-data-loader')
    await loadDemoData()
  }

  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
}

init()
