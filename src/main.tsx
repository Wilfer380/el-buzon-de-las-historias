import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { App } from './App'
import { environmentIssues } from './env'
import './styles.css'

if (import.meta.env.DEV && environmentIssues.length > 0) {
  console.info(`Optional backend configuration pending: ${environmentIssues.join(', ')}`)
}

createRoot(document.getElementById('root')!).render(
  <StrictMode><BrowserRouter basename={import.meta.env.BASE_URL}><App /></BrowserRouter></StrictMode>,
)
