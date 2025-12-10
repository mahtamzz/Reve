import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import './index.css'
import React from 'react'

const container = document.getElementById('root')

if (!container) {
  throw new Error('Root container missing in index.html')
}

const root = createRoot(container)

root.render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
)
