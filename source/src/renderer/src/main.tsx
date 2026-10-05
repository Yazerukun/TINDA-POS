import React from 'react'
import ReactDOM from 'react-dom/client'
import './assets/main.css'
import App from './App'

// Immediate synchronous theme hydration to prevent any first-frame flash
try {
  const saved = localStorage.getItem('tinda_theme') || 'dark'
  document.documentElement.setAttribute('data-theme', saved)
} catch {
  document.documentElement.setAttribute('data-theme', 'dark')
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)