import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './mobile_utils.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
