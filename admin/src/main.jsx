import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, HashRouter } from 'react-router-dom'
import App from './App'
import './styles.css'

const Router = window.location.protocol === 'file:' ? HashRouter : BrowserRouter
const desktopReporter = window.desktop?.reportError

if (desktopReporter) {
  window.addEventListener('error', (event) => {
    desktopReporter({
      type: 'error',
      message: event.message,
      source: event.filename,
      line: event.lineno,
      column: event.colno,
    })
  })

  window.addEventListener('unhandledrejection', (event) => {
    desktopReporter({
      type: 'unhandledrejection',
      reason: String(event.reason),
    })
  })
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Router>
      <App />
    </Router>
  </React.StrictMode>,
)
