import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './config/sentry.js'
import './index.css'
import Root from './Root.jsx'
import ErrorBoundary from './components/ErrorBoundary.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <Root />
    </ErrorBoundary>
  </StrictMode>,
)
