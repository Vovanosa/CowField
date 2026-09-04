import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './i18n'
import App from './App.tsx'
import { registerGlobalErrorHandlers } from './app/reportUnexpectedError'
import { ErrorBoundary } from './components/ErrorBoundary'

registerGlobalErrorHandlers()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary context="app root">
      <App />
    </ErrorBoundary>
  </StrictMode>,
)
